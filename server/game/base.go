package game

import (
	"log"
	"math"
	"sync"
)

type Owner interface {
	GetID() ID
	GetObjectPointer() interface{}
	GetBase() *Base
}

type Base struct {
	Owner                Owner
	Color                []byte
	Position             PositionInt
	Health               Health
	Buildings            map[ID]*Building
	BuildingLimits       map[BuildingType]BuildingLimit
	Bullets              map[ID]*Bullet
	BulletSpawning       []*BulletSpawning
	AvailableBuildingIDs *AvailableIDs
	AvailableBulletIDs   *AvailableIDs
	sync.RWMutex
}

func (b *Base) Repair() {
	b.Health.Reset()

	for _, building := range b.Buildings {
		building.Health.Reset()
	}
}

var unitBulletPolygon = GeneratePolygon(ShapeCircle, 10, 0)

func (b *Base) AddBullet(spawning *BulletSpawning, targetPosition PositionFloat, horizontalOffset float32) (*Bullet, bool) {
	bulletID, ok := b.AvailableBulletIDs.getNextAvailableID()
	if !ok {
		log.Println("No available bullet IDs")
		return nil, false
	}

	// Default to turret data
	var bulletStats BulletStats
	var bulletPosition PositionFloat
	firedByUnit := false

	// Check if the Shooter is a Building or Unit
	switch shooter := spawning.Shooter.(type) {
	case *Building:
		// If Shooter is a Building, gather data for the specific turret
		bulletStats, ok = GetBulletStats(shooter.Type, shooter.Variant)
		if !ok {
			log.Println("Bullet stats not found for building:", shooter.Type, shooter.Variant)
			return nil, false
		}

		bulletPosition = CalculateBulletSpawnPosition(shooter, targetPosition, 40, horizontalOffset)
	case *Unit:
		bulletStats, ok = GetBulletStats(shooter.Type, shooter.Variant)
		if !ok {
			log.Println("Bullet stats not found for building:", shooter.Type, shooter.Variant)
			return nil, false
		}

		// For units, calculate the bullet position based on the unit's position
		bulletPosition = CalculateBulletSpawnPosition(shooter, targetPosition, 40, horizontalOffset)

		firedByUnit = true

	default:
		log.Println("Unknown shooter type")
		return nil, false
	}

	// Calculate the direction vector
	dx := float64(targetPosition.X - bulletPosition.X)
	dy := float64(targetPosition.Y - bulletPosition.Y)
	distance := math.Sqrt(dx*dx + dy*dy)

	if distance == 0 {
		log.Println("Bullet and target positions are the same")
		return nil, false
	}

	// Normalize the direction vector
	directionX := float32(dx / distance)
	directionY := float32(dy / distance)

	bulletRange := spawning.Range
	if bulletStats.Behavior == TrapperBullet {
		bulletRange /= 2
	}

	// Set the normalized direction vector as the target position
	targetVector := PositionFloat{
		X: bulletPosition.X + directionX*float32(bulletRange),
		Y: bulletPosition.Y + directionY*float32(bulletRange),
	}

	polygon := bulletStats.Polygon

	// Create the bullet object
	bullet := &Bullet{
		Owner:            b.Owner,
		ID:               bulletID,
		Speed:            bulletStats.Speed,
		Size:             bulletStats.Size,
		Position:         bulletPosition,
		TargetPosition:   targetVector,
		Polygon:          polygon,
		Health:           bulletStats.Health,
		FiredByUnit:      firedByUnit,
		StayDuration:     bulletStats.StayDuration,
		DamageMultiplier: bulletStats.DamageMultiplier,
		Behavior:         bulletStats.Behavior,
	}

	// Lock the base and add the bullet to the list
	b.Lock()
	b.Bullets[bulletID] = bullet
	b.Unlock()

	return bullet, true
}

func (b *Base) RemoveBullet(bulletID ID) bool {
	b.RLock()
	// Retrieve the bullet
	_, ok := b.Bullets[bulletID]
	b.RUnlock()
	if !ok {
		return false // Bullet not found
	}

	b.Lock()
	// Remove the bullet
	delete(b.Bullets, bulletID)
	b.Unlock()

	b.AvailableBulletIDs.returnID(bulletID)

	return true // Bullet was successfully removed
}

func (b *Base) GetPosition() PositionInt {
	b.RLock()
	defer b.RUnlock()
	return b.Position
}

func (b *Base) TakeDamage(amount uint16) bool {
	b.Health.Decrement(amount)
	return b.Health.IsAlive()
}

func (b *Base) canAddBuilding(buildingType BuildingType) bool {
	b.RLock()
	defer b.RUnlock()
	limit := b.BuildingLimits[buildingType]
	return limit.Current < limit.Max
}

func (b *Base) incrementBuildingLimit(buildingType BuildingType) bool {
	limit := b.BuildingLimits[buildingType]
	if limit.Current < limit.Max {
		limit.Current++                        // Increment the current count
		b.BuildingLimits[buildingType] = limit // Update the original value in the map
		return true
	}
	return false
}

func (b *Base) decrementBuildingLimit(buildingType BuildingType) bool {
	limit := b.BuildingLimits[buildingType]
	if limit.Current > 0 { // Ensure we don't go below zero
		limit.Current--                        // Decrement the current count
		b.BuildingLimits[buildingType] = limit // Update the original value in the map
		return true
	}
	return false
}

func (b *Base) AddBuilding(buildingType BuildingType, position PositionFloat) (*Building, bool) {

	var player *Player
	var owner Owner
	if p, ok := b.Owner.(*Player); ok {
		player = p
		owner = p
	} else if neutral, ok := b.Owner.(*NeutralBase); ok {
		player = neutral.CapturedBy
		owner = neutral
	}

	// Ensure player is not nil before proceeding
	if player == nil {
		return nil, false // No valid player associated, can't proceed with building placement
	}

	if !player.Base.canAddBuilding(buildingType) {
		//log.Println("Building limit reached for ", buildingType)
		return nil, false
	}

	buildingID, ok := b.AvailableBuildingIDs.getNextAvailableID()
	if !ok {
		log.Println("No available building IDs")
		return nil, false
	}

	polygon, ok := GetBuildingPolygon(buildingType)
	if !ok {
		log.Println("Polygon type not found for building:", buildingType)
		return nil, false
	}
	polygon.SetCenter(position)

	dx := float64(position.X - float32(b.Position.X))
	dy := float64(position.Y - float32(b.Position.Y))
	rotationAngle := math.Atan2(dy, dx)

	// Apply the rotation to the polygon
	polygon.SetRotation(rotationAngle)

	// Create the building
	building := &Building{
		Owner:    owner,
		ID:       buildingID,
		Type:     buildingType,
		Variant:  BASIC_BUILDING, // Default variant value
		Position: position,
		Polygon:  polygon,
		Health:   GetInitialHealth(buildingType, BASIC_BUILDING),
	}

	b.Lock()
	// Add the building to the player's list of buildings
	b.Buildings[buildingID] = building

	// Increment the building limit safely while holding the lock
	if !player.Base.incrementBuildingLimit(buildingType) {
		// If we cannot increment, we might want to remove the building just added
		delete(b.Buildings, buildingID)
		b.Unlock()
		log.Println("Failed to increment building limit, removing building:", buildingID)
		return nil, false
	}

	b.Unlock()

	switch buildingType {
	case BARRACKS:
		player.AddUnitSpawning(building, true)
	case SIMPLE_TURRET, SNIPER_TURRET:
		b.AddBulletSpawning(building)
	}

	return building, true
}

func (b *Base) UpgradeBuilding(buildingID ID, variant BuildingVariant) bool {

	var player *Player

	// Type assertion to determine the owner
	if p, ok := b.Owner.(*Player); ok {
		player = p
	} else if n, ok := b.Owner.(*NeutralBase); ok {
		player = n.CapturedBy 
	}

	// Ensure player is not nil before proceeding
	if player == nil {
		return false // No valid player associated, can't proceed with building upgrade
	}

	b.Lock()
	defer b.Unlock()
	// Retrieve the building from the player's list of buildings
	building, ok := b.Buildings[buildingID]
	if !ok {
		return false // Building not found
	}

	building.Variant = variant
	//? Upgraded building => New health
	building.Health = GetInitialHealth(building.Type, variant)

	return true // Building was successfully upgraded
}

func (b *Base) RemoveBuilding(buildingID ID) bool {
	var player *Player

	// Type assertion to determine the owner
	if p, ok := b.Owner.(*Player); ok {
		player = p
	} else if n, ok := b.Owner.(*NeutralBase); ok {
		player = n.CapturedBy // CapturedBy is a field of type *Player
	}

	b.RLock()
	// Retrieve the building
	building, ok := b.Buildings[buildingID]
	if !ok {
		b.RUnlock()
		return false // Building not found
	}
	b.RUnlock()

	building.MarkForRemoval()

	// Act based on building type
	switch building.Type {
	case BARRACKS:
		if player != nil {
			player.RemoveUnitSpawning(building)
		}
	case GENERATOR, WALL:
		if player != nil {
			// Handle power reduction for GENERATOR and WALL types
			if building.Type == GENERATOR || (building.Type == WALL && building.Variant == MICRO_GENERATOR) {
				generating, ok := GetResourceGeneration(building.Type, building.Variant)
				if ok {
					player.Lock()
					player.Generating.Power -= generating.Power
					player.Unlock()
				}
			}
		}
	case HOUSE:
		if player != nil {
			capacity, ok := GetPopulationCapacity(building.Type, building.Variant)
			if ok {
				player.Population.DecrementCapacity(capacity)
			}
		}
	case SIMPLE_TURRET, SNIPER_TURRET:
		b.RemoveBulletSpawning(building)
	}

	// Lock to modify buildings and limits
	b.Lock()
	// Remove the building from the base's list of buildings
	delete(b.Buildings, buildingID)
	b.Unlock()

	if player != nil {
		player.Base.Lock()
		// Decrement the building limit for the specific building type
		player.Base.decrementBuildingLimit(building.Type)
		player.Base.Unlock()
	}

	// Return the building ID to the bases's pool of available building IDs
	b.AvailableBuildingIDs.returnID(buildingID)

	return true // Building was successfully removed
}

func (b *Base) CheckBuildingCollision(buildingType BuildingType, position PositionFloat) bool {
	polygon, ok := GetBuildingPolygon(buildingType)
	if !ok {
		log.Println("Polygon type not found for building:", buildingType)
		return false
	}
	// Set the center of the polygon to the desired building position
	polygon.SetCenter(position)

	dx := float64(position.X - float32(b.Position.X))
	dy := float64(position.Y - float32(b.Position.Y))
	rotationAngle := math.Atan2(dy, dx)

	// Apply the rotation to the polygon
	polygon.SetRotation(rotationAngle)

	b.RLock()
	defer b.RUnlock()
	for _, building := range b.Buildings {
		if DoPolygonsIntersect(polygon, building.Polygon) {
			log.Printf("Collision detected.")
			return false
		}
	}
	return true
}

func (b *Base) AddBulletSpawning(turret *Building) bool {
	bulletSpawning, ok := GetBulletSpawning(turret.Type, turret.Variant)
	if !ok {
		log.Println("Could not add BulletSpawning to player")
		return false
	}

	// Create a new BulletSpawning instance
	spawning := &BulletSpawning{
		Shooter: turret,
		Frequency: SpawnFrequency{
			Current:  bulletSpawning.Frequency.Current,
			Original: bulletSpawning.Frequency.Original,
		},
		Range: bulletSpawning.Range,
	}

	// Add the BulletSpawning instance to the base's list
	b.Lock()
	b.BulletSpawning = append(b.BulletSpawning, spawning)
	b.Unlock()

	return true
}

func (b *Base) RemoveBulletSpawning(turret *Building) {
	b.Lock()
	defer b.Unlock()
	// Create a new slice to store updated BulletSpawning entries
	var updatedBulletSpawning []*BulletSpawning

	// Iterate through base's UnitSpawning list
	for _, s := range b.BulletSpawning {
		// Check if Turret pointer matches
		if shooterBuilding, ok := s.Shooter.GetObjectPointer().(*Building); ok {
			// If the Turret matches, skip this BulletSpawning entry (effectively removing it)
			if shooterBuilding == turret {
				continue
			}
		}
		// Add BulletSpawning entry to updated slice
		updatedBulletSpawning = append(updatedBulletSpawning, s)
	}

	// Update base's BulletSpawning list with the filtered slice
	b.BulletSpawning = updatedBulletSpawning
}
