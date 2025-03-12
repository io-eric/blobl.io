package game

import (
	"math"
	"math/rand"
	"sync"
	"time"
)

type Bullet struct {
	Owner            Owner // This can be either Player or NeutralBase
	ID               ID
	Position         PositionFloat
	TargetPosition   PositionFloat
	Polygon          Polygon
	Health           Health
	Speed            float64
	Size             int
	FiredByUnit      bool
	RemoveFlag       bool // Flag to mark bullet for removal
	DamageMultiplier float32
	Behavior         BulletBehavior

	// Trapper Bullet
	ReachedTargetPosition bool
	StayDuration          time.Duration

	sync.RWMutex
}

type BulletBehavior int

const (
	NormalBullet   BulletBehavior = iota
	AntiTankBullet                // Damage Multiplier against tanks
	TrapperBullet
	UnitBullet // Damage Multiplier against units
)

func (b *Bullet) IsFiredByUnit() bool {
	return b.FiredByUnit
}

func (b *Bullet) IsWithinRadius(position PositionFloat, radius float32) bool {
	dx := b.Position.X - float32(position.X)
	dy := b.Position.Y - float32(position.Y)
	distanceSquared := dx*dx + dy*dy
	radiusSquared := float32(radius * radius)
	return distanceSquared <= radiusSquared
}

func (b *Bullet) isMarkedForRemoval() bool {
	return b.RemoveFlag
}

func (b *Bullet) MarkForRemoval() {
	b.RemoveFlag = true
}

func (b *Bullet) GetPosition() PositionFloat {
	b.RLock()
	defer b.RUnlock()
	return b.Position
}

func (b *Bullet) TakeDamage(amount uint16) bool {
	b.Health.Decrement(amount)
	return b.Health.IsAlive()
}

func (b *Bullet) GetCurrentHealth() uint16 {
	return b.Health.Get()
}

func (b *Bullet) SetTargetPosition(pos PositionFloat) {
	b.Lock()
	defer b.Unlock()
	// Set the target position
	b.TargetPosition = PositionFloat{
		X: float32(pos.X),
		Y: float32(pos.Y),
	}
}

func (b *Bullet) UpdatePosition(deltaTime time.Duration) bool {
	b.Lock()
	defer b.Unlock()

	// Calculate distance to target position
	dx := float64(b.TargetPosition.X - b.Position.X)
	dy := float64(b.TargetPosition.Y - b.Position.Y)
	distanceSquared := dx*dx + dy*dy

	// Normalize dx and dy to get unit direction vector
	distance := math.Sqrt(distanceSquared)
	bulletVectorX := dx / distance
	bulletVectorY := dy / distance

	// Calculate base distance to move in this frame
	distanceToMove := b.Speed * float64(deltaTime) / float64(time.Second)

	// Apply ease-out only when within a threshold distance to the target
	easeThreshold := 100.0
	minMovementThreshold := 0.05 // Minimum movement threshold to consider easing

	// If the distance is within easeThreshold, apply easing
	if distance < easeThreshold {
		// Calculate easing progress based on distance to target
		progress := distance / easeThreshold
		easedProgress := easeOut(progress)

		// Scale the distanceToMove by eased progress, while ensuring a minimum movement threshold
		if easedProgress*distanceToMove < minMovementThreshold {
			easedProgress = 1.0 // Disable easing if the progress is too small
		}

		// We want the speed to drop to 30% of the normal speed as it approaches the target
		easedProgress = 0.3 + (0.7 * easedProgress) // Scale to 30% speed when close to the target
		distanceToMove *= easedProgress
	}

	// Limit distanceToMove to the remaining distance to avoid overshoot
	if distanceToMove > distance {
		// Set the position to the target and mark it as reached
		b.Position = b.TargetPosition
		b.ReachedTargetPosition = true
		return false // Stop updating the position as the target is reached
	}

	// Update the position based on the movement
	newX := float64(b.Position.X) + bulletVectorX*distanceToMove
	newY := float64(b.Position.Y) + bulletVectorY*distanceToMove

	b.Position.X = float32(newX)
	b.Position.Y = float32(newY)

	return true
}

func CalculateBulletSpawnPosition(shooter Shooter, targetPosition PositionFloat, spawnDistance float32, horizontalOffset float32) PositionFloat {
	shooterPosition := shooter.GetPosition()

	// Calculate the direction vector from the shooter to the target
	directionX := targetPosition.X - shooterPosition.X
	directionY := targetPosition.Y - shooterPosition.Y

	// Normalize the direction vector
	length := float32(math.Sqrt(float64(directionX*directionX + directionY*directionY)))
	if length == 0 {
		// Avoid division by zero; return shooter position if length is zero
		return shooterPosition
	}

	directionX /= length
	directionY /= length

	// Calculate the perpendicular vector for the horizontal offset
	perpendicularX := -directionY
	perpendicularY := directionX

	// Calculate the spawn position using the direction and perpendicular vectors
	unitPosition := PositionFloat{
		X: shooterPosition.X + directionX*spawnDistance + perpendicularX*horizontalOffset,
		Y: shooterPosition.Y + directionY*spawnDistance + perpendicularY*horizontalOffset,
	}

	return unitPosition
}

func CalculateTrapperBulletTargetPosition(shooter Shooter, spawnRadius float32, horizontalOffset float32) PositionFloat {
	shooterPosition := shooter.GetPosition()
	shooterRotation := shooter.GetRotation()

	// Get a random angle within the range
	randomAngle := rand.Float64()*math.Pi/2.0 - math.Pi/4.0

	// Calculate spawn position based on random angle, shooter position, and spawn radius
	unitPosition := PositionFloat{
		X: float32(shooterPosition.X-spawnRadius*float32(math.Cos(shooterRotation+randomAngle))) + horizontalOffset,
		Y: float32(shooterPosition.Y - spawnRadius*float32(math.Sin(shooterRotation+randomAngle))),
	}

	return unitPosition
}

type BulletStats struct {
	Health           Health
	Speed            float64
	Size             int
	StayDuration     time.Duration //! Just for trapper turret
	Polygon          Polygon
	DamageMultiplier float32
	Behavior         BulletBehavior
}

type Shooter interface {
	GetPosition() PositionFloat
	IsMarkedForRemoval() bool
	GetRotation() float64
	GetObjectPointer() interface{}
}

type BulletSpawning struct {
	Shooter   Shooter
	Frequency SpawnFrequency
	Range     int
}

var turretBulletStats = map[BuildingType]map[BuildingVariant]BulletStats{
	SIMPLE_TURRET: {
		BASIC_BUILDING: {
			Health:       Health{Current: 15, Max: 15},
			Speed:        500,
			Size:         10,
			Polygon:      GeneratePolygon(ShapeCircle, 10, 0),
			StayDuration: 0, // No stay duration for non-trapper bullets
			Behavior:     NormalBullet,
		},
		RAPID_TURRET: {
			Health:       Health{Current: 15, Max: 15},
			Speed:        500,
			Polygon:      GeneratePolygon(ShapeCircle, 10, 0),
			Size:         10,
			StayDuration: 0, // No stay duration for non-trapper bullets
			Behavior:     NormalBullet,
		},
		GATLING_TURRET: {
			Health:       Health{Current: 15, Max: 15},
			Speed:        600,
			Polygon:      GeneratePolygon(ShapeCircle, 8, 0),
			Size:         8,
			StayDuration: 0, // No stay duration for non-trapper bullets
			Behavior:     NormalBullet,
		},
		HEAVY_TURRET: {
			Health:       Health{Current: 400, Max: 400},
			Speed:        200,
			Size:         20,
			Polygon:      GeneratePolygon(ShapeCircle, 20, 0),
			StayDuration: 0, // No stay duration for non-trapper bullets
			Behavior:     NormalBullet,
		},
	},
	SNIPER_TURRET: {
		BASIC_BUILDING: {
			Health:       Health{Current: 50, Max: 50},
			Speed:        800,
			Size:         10,
			Polygon:      GeneratePolygon(ShapeCircle, 10, 0),
			StayDuration: 0, // No stay duration for non-trapper bullets
			Behavior:     NormalBullet,
		},
		SEMI_AUTOMATIC_SNIPER: {
			Health:       Health{Current: 50, Max: 50},
			Speed:        800,
			Size:         10,
			Polygon:      GeneratePolygon(ShapeCircle, 10, 0),
			StayDuration: 0, // No stay duration for non-trapper bullets
			Behavior:     NormalBullet,
		},
		HEAVY_SNIPER: {
			Health:       Health{Current: 60, Max: 60},
			Speed:        900,
			Size:         12,
			Polygon:      GeneratePolygon(ShapeCircle, 12, 0),
			StayDuration: 0, // No stay duration for non-trapper bullets
			Behavior:     NormalBullet,
		},
		ANTI_TANK_GUN: {
			Health:           Health{Current: 60, Max: 60},
			Speed:            1000,
			Size:             12,
			Polygon:          GeneratePolygon(ShapeCircle, 12, 0),
			StayDuration:     0,              // No stay duration for non-trapper bullets
			DamageMultiplier: 1.5,            // 150%
			Behavior:         AntiTankBullet, // 150% Damage to tanks
		},
		TRAPPER: {
			Health:       Health{Current: 300, Max: 300},
			Speed:        300,
			Size:         20,
			Polygon:      GeneratePolygon(ShapeCircle, 20, 0),
			StayDuration: 5 * time.Second,
			Behavior:     TrapperBullet,
		},
	},
}

var unitBulletStats = map[UnitType]map[UnitVariant]BulletStats{
	TANK: {
		CANNON_TANK: {
			Health:           Health{Current: 16, Max: 16},
			Speed:            500,
			Size:             6,
			Polygon:          unitBulletPolygon,
			DamageMultiplier: 2.0,
			Behavior:         UnitBullet,
		},
		BOOSTER_ENGINE_CANNON_TANK: {
			Health:           Health{Current: 16, Max: 16},
			Speed:            500,
			Size:             6,
			Polygon:          unitBulletPolygon,
			DamageMultiplier: 2.0,
			Behavior:         UnitBullet,
		},
	},
	SIEGE_TANK: {
		CANNON_SIEGE_TANK: {
			Health:           Health{Current: 16, Max: 16},
			Speed:            500,
			Size:             8,
			Polygon:          unitBulletPolygon,
			DamageMultiplier: 2.0,
			Behavior:         UnitBullet,
		},
		BOOSTER_ENGINE_CANNON_SIEGE_TANK: {
			Health:           Health{Current: 16, Max: 16},
			Speed:            500,
			Size:             8,
			Polygon:          unitBulletPolygon,
			DamageMultiplier: 2.0,
			Behavior:         UnitBullet,
		},
	},
	COMMANDER: {
		BASIC_UNIT: {
			Health:           Health{Current: 100, Max: 100},
			Speed:            700,
			Size:             12,
			Polygon:          unitBulletPolygon,
			DamageMultiplier: 2.0,
			Behavior:         UnitBullet,
		},
	},
}

var turretBulletSpawningConfig = map[BuildingType]map[BuildingVariant]BulletSpawning{
	SIMPLE_TURRET: {
		BASIC_BUILDING: BulletSpawning{
			Shooter:   nil,
			Frequency: SpawnFrequency{Current: 0, Original: 750},
			Range:     350,
		},
		RAPID_TURRET: BulletSpawning{
			Shooter:   nil,
			Frequency: SpawnFrequency{Current: 0, Original: 300},
			Range:     350,
		},
		GATLING_TURRET: BulletSpawning{
			Shooter:   nil,
			Frequency: SpawnFrequency{Current: 0, Original: 200},
			Range:     350,
		},
		HEAVY_TURRET: BulletSpawning{
			Shooter:   nil,
			Frequency: SpawnFrequency{Current: 0, Original: 8000},
			Range:     350,
		},
	},
	SNIPER_TURRET: {
		BASIC_BUILDING: BulletSpawning{
			Shooter:   nil,
			Frequency: SpawnFrequency{Current: 0, Original: 1500},
			Range:     400,
		},
		SEMI_AUTOMATIC_SNIPER: BulletSpawning{
			Shooter:   nil,
			Frequency: SpawnFrequency{Current: 0, Original: 1000},
			Range:     450,
		},
		HEAVY_SNIPER: BulletSpawning{
			Shooter:   nil,
			Frequency: SpawnFrequency{Current: 0, Original: 1500},
			Range:     450,
		},
		ANTI_TANK_GUN: BulletSpawning{
			Shooter:   nil,
			Frequency: SpawnFrequency{Current: 0, Original: 2500},
			Range:     450,
		},
		TRAPPER: BulletSpawning{
			Shooter:   nil,
			Frequency: SpawnFrequency{Current: 0, Original: 6000},
			Range:     450,
		},
	},
}

var unitBulletSpawningConfig = map[UnitType]map[UnitVariant]BulletSpawning{
	TANK: {
		CANNON_TANK: BulletSpawning{
			Shooter:   nil,
			Frequency: SpawnFrequency{Current: 0, Original: 1500},
			Range:     350,
		},
		BOOSTER_ENGINE_CANNON_TANK: BulletSpawning{
			Shooter:   nil,
			Frequency: SpawnFrequency{Current: 0, Original: 1500},
			Range:     350,
		},
	},
	SIEGE_TANK: {
		CANNON_SIEGE_TANK: BulletSpawning{
			Shooter:   nil,
			Frequency: SpawnFrequency{Current: 0, Original: 1600},
			Range:     400,
		},
		BOOSTER_ENGINE_CANNON_SIEGE_TANK: BulletSpawning{
			Shooter:   nil,
			Frequency: SpawnFrequency{Current: 0, Original: 1600},
			Range:     400,
		},
	},
	COMMANDER: {
		BASIC_UNIT: BulletSpawning{
			Shooter:   nil,
			Frequency: SpawnFrequency{Current: 0, Original: 2000},
			Range:     600,
		},
	},
}

func GetBulletStats(entityType interface{}, variant interface{}) (BulletStats, bool) {
	switch t := entityType.(type) {
	case UnitType:
		if v, ok := variant.(UnitVariant); ok {
			stats, found := unitBulletStats[t][v]
			return stats, found
		}
	case BuildingType:
		if v, ok := variant.(BuildingVariant); ok {
			stats, found := turretBulletStats[t][v]
			return stats, found
		}
	}
	return BulletStats{}, false // Return default stats if lookup fails
}

func GetBulletHealth(entityType interface{}, variant interface{}) (Health, bool) {
	stats, ok := GetBulletStats(entityType, variant)
	if ok {
		return stats.Health, true
	}
	return Health{}, false
}

func GetBulletSpeed(entityType interface{}, variant interface{}) (float64, bool) {
	stats, ok := GetBulletStats(entityType, variant)
	if ok {
		return stats.Speed, true
	}
	return 0, false
}

func GetBulletSpawning(entityType interface{}, variant interface{}) (BulletSpawning, bool) {
	switch t := entityType.(type) {
	case BuildingType:
		if v, ok := variant.(BuildingVariant); ok {
			// Check if the buildingType exists in the config
			if config, ok := turretBulletSpawningConfig[t]; ok {
				// Check if the buildingVariant exists within the config
				if spawning, ok := config[v]; ok {
					// Return BulletSpawning if both keys exist
					return spawning, true
				}
			}
		}
	case UnitType:
		if v, ok := variant.(UnitVariant); ok {
			// Check if the unitType exists in the config
			if config, ok := unitBulletSpawningConfig[t]; ok {
				// Check if the unitVariant exists within the config
				if spawning, ok := config[v]; ok {
					// Return BulletSpawning if both keys exist
					return spawning, true
				}
			}
		}
	}
	// Return default BulletSpawning and false if not found
	return BulletSpawning{}, false
}
