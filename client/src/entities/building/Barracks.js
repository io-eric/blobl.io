import Building from "../Building.js";
import { BuildingDetails, BuildingVariantTypes, BuildingTypes, getBuildingDetails } from '../../network/constants.js';
import Polygon from "../Polygon.js";
import Shapes from "../../components/Shapes.js";
import ThemeManager from "../../components/managers/ThemeManager.js";

export default class Barracks extends Building {
    constructor (color, position = { x: 0, y: 0 }, variant = 0, id = -1) {
        const details = BuildingDetails.BARRACKS.BASIC;
        super(id, BuildingTypes.BARRACKS, color, details, position, variant);
        this.rotationOffset = Math.PI;
        this.setUpgrade(variant);
        this._updateAngleToTarget();

        this.points = [];
        this.points[0] = Shapes.getRectanglePoints(this.size, this.size);

        this.activated = true; // Tracks if the barracks are active for troop production
    }

    activateProduction (isActive) {
        this.activated = isActive; // Set activated state based on the input boolean
    }

    initPolygon () {
        this.polygon = new Polygon(this.points[0], this.position);
        this.updatePolygonRotation();
    }

    setUpgrade (buildingVariant) {
        this.variant = buildingVariant;
        this.details = getBuildingDetails(this.type, buildingVariant);
        const variantMap = {
            [BuildingVariantTypes.BARRACKS.BASIC]: this.renderBarracks,
            [BuildingVariantTypes.BARRACKS.GREATER_BARRACKS]: this.renderGreaterBarracks,
            [BuildingVariantTypes.BARRACKS.TANK_FACTORY]: this.renderTankFactory,
            [BuildingVariantTypes.BARRACKS.HEAVY_TANK_FACTORY]: this.renderHeavyTankFactory,
            [BuildingVariantTypes.BARRACKS.BOOSTER_TANK_FACTORY]: this.renderBoosterTankFactory,
            [BuildingVariantTypes.BARRACKS.BOOSTER_CANNON_TANK_FACTORY]: this.renderBoosterCannonTankFactory,
            [BuildingVariantTypes.BARRACKS.CANNON_TANK_FACTORY]: this.renderCannonTankFactory,
            [BuildingVariantTypes.BARRACKS.SIEGE_TANK_FACTORY]: this.renderSiegeFactory,
            [BuildingVariantTypes.BARRACKS.HEAVY_BOOSTER_TANK_FACTORY]: this.renderHeavyBoosterTankFactory,
            [BuildingVariantTypes.BARRACKS.HEAVY_SIEGE_TANK_FACTORY]: this.renderHeavySiegeFactory,
            [BuildingVariantTypes.BARRACKS.BOOSTER_SIEGE_TANK_FACTORY]: this.renderBoosterSiegeFactory,
            [BuildingVariantTypes.BARRACKS.CANNON_SIEGE_TANK_FACTORY]: this.renderCannonSiegeTankFactory,
            [BuildingVariantTypes.BARRACKS.HEAVY_BOOSTER_SIEGE_TANK_FACTORY]: this.renderHeavyBoosterSiegeFactory,
            [BuildingVariantTypes.BARRACKS.BOOSTER_CANNON_SIEGE_TANK_FACTORY]: this.renderBoosterCannonSiegeFactory,
        };

        this.renderUpgrade = variantMap[buildingVariant] || this.renderBarracks;

        if (!this.renderUpgrade) {
            console.error("UpgradeType not defined!");
        }
    }

    setRallypoint (point) {
        this.rallypoint = point;
    }

    render (context, camera, deltaTime) {
        const worldPosition = this.getWorldPosition(camera);
        context.save();
        context.translate(worldPosition.x, worldPosition.y);
        super.render(context)
        context.rotate(this.angleToTarget);

        if (this.isSelected()) {
            this.renderSelection(context, this.details.range, ThemeManager.currentThemeProperties.selectionColor);
        }

        this.renderUpgrade(context, worldPosition);
        context.restore();
    }

    renderBasic (context) {
        // Draw unit cannon
        context.fillStyle = "#a8a8a8";
        context.beginPath();
        context.moveTo(-this.size / 1.5, -this.size / 2.5); // Top left corner
        context.lineTo(-this.size + this.size / 2, -this.size / 3);  // Top right corner
        context.lineTo(-this.size + this.size / 2, this.size / 3);       // Bottom right corner
        context.lineTo(-this.size / 1.5, this.size / 2.5);      // Bottom left corner
        context.closePath();
        context.fill();
        context.strokeStyle = "#666666";
        context.lineWidth = 4;
        context.stroke();

        // Draw square
        context.fillStyle = this.activated ? this.color : "#a8a8a8";
        context.fillRect(-this.size / 2, -this.size / 2, this.size, this.size); // Draw square centered at (0, 0)
        context.strokeStyle = "#666666";
        context.strokeRect(-this.size / 2, -this.size / 2, this.size, this.size); // Stroke square
    }

    renderBarracks (context) {
        this.renderBasic(context);

        context.rotate(this.rotationOffset); // Align with the barracks' rotation
        context.translate(-1, 0);

        context.beginPath();
        const unitSize = 15;
        const outerPoints = [];
        for (let i = 0; i < 3; i++) {
            const angle = (Math.PI * 2 / 3) * i;
            const x = unitSize * Math.cos(angle);
            const y = unitSize * Math.sin(angle);
            outerPoints.push({ x, y });
        }

        context.moveTo(outerPoints[0].x, outerPoints[0].y);
        for (let i = 1; i < outerPoints.length; i++) {
            context.lineTo(outerPoints[i].x, outerPoints[i].y);
        }
        context.closePath();

        context.fillStyle = "#a8a8a8"; // Gray color
        context.fill();
        context.strokeStyle = "#666666"; // Darker outline
        context.lineWidth = 4;
        context.stroke();
    }
    renderGreaterBarracks(context) {
        this.renderBasic(context);
    
        context.rotate(this.rotationOffset); // Align with the barracks' rotation
        
        const unitSize = 15;

        // First triangle
        context.translate(-1, -unitSize + 4);
    
        context.beginPath();
        const outerPoints = [];
        for (let i = 0; i < 3; i++) {
            const angle = (Math.PI * 2 / 3) * i;
            const x = unitSize * Math.cos(angle);
            const y = unitSize * Math.sin(angle);
            outerPoints.push({ x, y });
        }
    
        context.moveTo(outerPoints[0].x, outerPoints[0].y);
        for (let i = 1; i < outerPoints.length; i++) {
            context.lineTo(outerPoints[i].x, outerPoints[i].y);
        }
        context.closePath();
    
        context.fillStyle = "#a4a4a4"; // Gray color
        context.fill();
        context.strokeStyle = "#666666"; // Darker outline
        context.lineWidth = 4;
        context.stroke();
    
        // Second triangle
        context.translate(0, unitSize*1.5); // Move to the right for the second triangle
    
        context.beginPath();
        for (let i = 0; i < 3; i++) {
            const angle = (Math.PI * 2 / 3) * i;
            const x = unitSize * Math.cos(angle);
            const y = unitSize * Math.sin(angle);
            outerPoints[i] = { x, y }; // Reusing the points array for the second triangle
        }
    
        context.moveTo(outerPoints[0].x, outerPoints[0].y);
        for (let i = 1; i < outerPoints.length; i++) {
            context.lineTo(outerPoints[i].x, outerPoints[i].y);
        }
        context.closePath();
    
        context.fill();
        context.stroke();
    }
    
    renderTankFactory (context) {
        this.renderBasic(context);

        context.rotate(this.rotationOffset); // Align with the barracks' rotation
        context.translate(-3, 0);

        context.beginPath();
        const unitSize = 20;
        const outerPoints = [];
        for (let i = 0; i < 3; i++) {
            const angle = (Math.PI * 2 / 3) * i;
            const x = unitSize * Math.cos(angle);
            const y = unitSize * Math.sin(angle);
            outerPoints.push({ x, y });
        }

        context.moveTo(outerPoints[0].x, outerPoints[0].y);
        for (let i = 1; i < outerPoints.length; i++) {
            context.lineTo(outerPoints[i].x, outerPoints[i].y);
        }
        context.closePath();

        context.fillStyle = "#a8a8a8"; // Gray color
        context.fill();
        context.strokeStyle = "#666666"; // Darker outline
        context.lineWidth = 4;
        context.stroke();
    }

    renderHeavyTankFactory (context) {
        this.renderBasic(context);

        context.rotate(this.rotationOffset); // Align with the barracks' rotation
        context.translate(-3, 0);

        context.beginPath();
        const unitSize = 20;
        const outerPoints = [];
        for (let i = 0; i < 3; i++) {
            const angle = (Math.PI * 2 / 3) * i;
            const x = unitSize * Math.cos(angle);
            const y = unitSize * Math.sin(angle);
            outerPoints.push({ x, y });
        }

        context.moveTo(outerPoints[0].x, outerPoints[0].y);
        for (let i = 1; i < outerPoints.length; i++) {
            context.lineTo(outerPoints[i].x, outerPoints[i].y);
        }
        context.closePath();

        context.fillStyle = "#8a8a8a"; // Gray color
        context.fill();
        context.strokeStyle = "#666666"; // Darker outline
        context.lineWidth = 4;
        context.stroke();
    }

    renderBoosterTankFactory (context) {
        this.renderBasic(context);
        context.rotate(this.rotationOffset); // Align with the barracks' rotation

        const unitSize = 20;

        context.save();
        // Translate to the position where the booster should be, behind the tank
        context.translate(-unitSize / 3.5, 0); // Move booster to the back of the tank

        // Draw the booster
        context.fillStyle = "#a4a4a4";
        context.beginPath();
        context.moveTo(-unitSize / 2, -unitSize / 1.6);  // Top left corner
        context.lineTo(unitSize / 10, -unitSize / 2.5);  // Top right corner
        context.lineTo(unitSize / 10, unitSize / 2.5);   // Bottom right corner
        context.lineTo(-unitSize / 2, unitSize / 1.6);   // Bottom left corner
        context.closePath();
        context.fill();

        context.strokeStyle = "#666666";
        context.lineWidth = 4;
        context.stroke();
        context.restore();

        context.beginPath();
        const outerPoints = [];
        for (let i = 0; i < 3; i++) {
            const angle = (Math.PI * 2 / 3) * i;
            const x = unitSize * Math.cos(angle);
            const y = unitSize * Math.sin(angle);
            outerPoints.push({ x, y });
        }

        context.moveTo(outerPoints[0].x, outerPoints[0].y);
        for (let i = 1; i < outerPoints.length; i++) {
            context.lineTo(outerPoints[i].x, outerPoints[i].y);
        }
        context.closePath();

        context.fillStyle = "#a8a8a8"; // Gray color
        context.fill();
        context.strokeStyle = "#666666"; // Darker outline
        context.lineWidth = 4;
        context.stroke();
    }

    renderBoosterCannonTankFactory (context) {
        this.renderBasic(context);
        context.rotate(this.rotationOffset); // Align with the barracks' rotation

        const unitSize = 20;

        context.save();
        // Translate to the position where the booster should be, behind the tank
        context.translate(-unitSize / 3.5, 0); // Move booster to the back of the tank

        // Draw the booster
        context.fillStyle = "#a4a4a4";
        context.beginPath();
        context.moveTo(-unitSize / 2, -unitSize / 1.6);  // Top left corner
        context.lineTo(unitSize / 10, -unitSize / 2.5);  // Top right corner
        context.lineTo(unitSize / 10, unitSize / 2.5);   // Bottom right corner
        context.lineTo(-unitSize / 2, unitSize / 1.6);   // Bottom left corner
        context.closePath();
        context.fill();

        context.strokeStyle = "#666666";
        context.lineWidth = 4;
        context.stroke();
        context.restore();

        context.beginPath();
        const outerPoints = [];
        for (let i = 0; i < 3; i++) {
            const angle = (Math.PI * 2 / 3) * i;
            const x = unitSize * Math.cos(angle);
            const y = unitSize * Math.sin(angle);
            outerPoints.push({ x, y });
        }

        context.moveTo(outerPoints[0].x, outerPoints[0].y);
        for (let i = 1; i < outerPoints.length; i++) {
            context.lineTo(outerPoints[i].x, outerPoints[i].y);
        }
        context.closePath();

        context.fillStyle = "#a8a8a8"; // Gray color
        context.fill();
        context.strokeStyle = "#666666"; // Darker outline
        context.lineWidth = 4;
        context.stroke();

        context.rotate(-Math.PI / 2);

        // Apply recoil effect
        const cannonWidth = 11;
        const cannonLength = 10;

        // Draw the rectangle (cannon) with recoil effect
        context.fillStyle = "#a8a8a8"; // Color of the cannon
        context.fillRect(-cannonWidth / 2, cannonLength - unitSize * 0.25, cannonWidth, cannonLength);

        // Draw a border around the cannon
        context.strokeStyle = "#666666";
        context.lineWidth = 4;
        context.strokeRect(-cannonWidth / 2, cannonLength - unitSize * 0.25, cannonWidth, cannonLength);


        // Draw the smaller circle in the middle
        context.beginPath();
        context.arc(0, 0, unitSize * 0.35, 0, Math.PI * 2);
        context.closePath();
        context.fillStyle = "#a8a8a8"; // Color of the smaller circle
        context.fill();
        context.strokeStyle = "#666666";
        context.lineWidth = 4;
        context.stroke();
    }

    renderCannonTankFactory (context) {
        this.renderBasic(context);

        const offset = -3;

        context.rotate(this.rotationOffset); // Align with the barracks' rotation
        context.translate(offset, 0);

        context.beginPath();
        const unitSize = 20;
        const outerPoints = [];
        for (let i = 0; i < 3; i++) {
            const angle = (Math.PI * 2 / 3) * i;
            const x = unitSize * Math.cos(angle);
            const y = unitSize * Math.sin(angle);
            outerPoints.push({ x, y });
        }

        context.moveTo(outerPoints[0].x, outerPoints[0].y);
        for (let i = 1; i < outerPoints.length; i++) {
            context.lineTo(outerPoints[i].x, outerPoints[i].y);
        }
        context.closePath();

        context.fillStyle = "#8a8a8a"; // Gray color
        context.fill();
        context.strokeStyle = "#666666"; // Darker outline
        context.lineWidth = 4;
        context.stroke();


        context.rotate(-Math.PI / 2);

        // Apply recoil effect
        const cannonWidth = 11;
        const cannonLength = 10;

        // Draw the rectangle (cannon) with recoil effect
        context.fillStyle = "#a8a8a8"; // Color of the cannon
        context.fillRect(-cannonWidth / 2, cannonLength - unitSize * 0.25, cannonWidth, cannonLength);

        // Draw a border around the cannon
        context.strokeStyle = "#666666";
        context.lineWidth = 4;
        context.strokeRect(-cannonWidth / 2, cannonLength - unitSize * 0.25, cannonWidth, cannonLength);


        // Draw the smaller circle in the middle
        context.beginPath();
        context.arc(0, 0, unitSize * 0.35, 0, Math.PI * 2);
        context.closePath();
        context.fillStyle = "#a8a8a8"; // Color of the smaller circle
        context.fill();
        context.strokeStyle = "#666666";
        context.lineWidth = 4;
        context.stroke();
    }


    renderHeavyBoosterTankFactory (context) {
        this.renderBasic(context);
        context.rotate(this.rotationOffset); // Align with the barracks' rotation

        const unitSize = 20;

        context.save();
        // Translate to the position where the booster should be, behind the tank
        context.translate(-unitSize / 3.5, 0); // Move booster to the back of the tank

        // Draw the booster
        context.fillStyle = "#a4a4a4";
        context.beginPath();
        context.moveTo(-unitSize / 2, -unitSize / 1.6);  // Top left corner
        context.lineTo(unitSize / 10, -unitSize / 2.5);  // Top right corner
        context.lineTo(unitSize / 10, unitSize / 2.5);   // Bottom right corner
        context.lineTo(-unitSize / 2, unitSize / 1.6);   // Bottom left corner
        context.closePath();
        context.fill();

        context.strokeStyle = "#666666";
        context.lineWidth = 4;
        context.stroke();
        context.restore();

        context.beginPath();
        const outerPoints = [];
        for (let i = 0; i < 3; i++) {
            const angle = (Math.PI * 2 / 3) * i;
            const x = unitSize * Math.cos(angle);
            const y = unitSize * Math.sin(angle);
            outerPoints.push({ x, y });
        }

        context.moveTo(outerPoints[0].x, outerPoints[0].y);
        for (let i = 1; i < outerPoints.length; i++) {
            context.lineTo(outerPoints[i].x, outerPoints[i].y);
        }
        context.closePath();

        context.fillStyle = "#8a8a8a"; // Gray color
        context.fill();
        context.strokeStyle = "#666666"; // Darker outline
        context.lineWidth = 4;
        context.stroke();
    }


    renderSiegeFactory (context) {
        this.renderBasic(context);

        context.rotate(this.rotationOffset); // Align with the barracks' rotation
        // Move to the center of the square
        context.translate(-4, 0);

        context.beginPath();
        const unitSize = 25;
        const outerPoints = [];
        for (let i = 0; i < 3; i++) {
            const angle = (Math.PI * 2 / 3) * i;
            const x = unitSize * Math.cos(angle);
            const y = unitSize * Math.sin(angle);
            outerPoints.push({ x, y });
        }

        context.moveTo(outerPoints[0].x, outerPoints[0].y);
        for (let i = 1; i < outerPoints.length; i++) {
            context.lineTo(outerPoints[i].x, outerPoints[i].y);
        }
        context.closePath();

        context.fillStyle = "#a8a8a8"; // Gray color
        context.fill();
        context.strokeStyle = "#666666"; // Darker outline
        context.lineWidth = 4;
        context.stroke();

        // Draw the smaller triangle
        context.beginPath();
        const smallerUnitSize = unitSize * 0.45;
        for (let i = 0; i < 3; i++) {
            const angle = (Math.PI * 2 / 3) * i;
            const x = smallerUnitSize * Math.cos(angle);
            const y = smallerUnitSize * Math.sin(angle);
            outerPoints[i] = { x, y };
        }

        context.moveTo(outerPoints[0].x, outerPoints[0].y);
        for (let i = 1; i < outerPoints.length; i++) {
            context.lineTo(outerPoints[i].x, outerPoints[i].y);
        }
        context.closePath();

        context.fill();
        context.stroke();
    }


    renderHeavySiegeFactory (context) {
        this.renderBasic(context);

        context.rotate(this.rotationOffset); // Align with the barracks' rotation
        // Move to the center of the square
        context.translate(-4, 0);

        context.beginPath();
        const unitSize = 25;
        const outerPoints = [];
        for (let i = 0; i < 3; i++) {
            const angle = (Math.PI * 2 / 3) * i;
            const x = unitSize * Math.cos(angle);
            const y = unitSize * Math.sin(angle);
            outerPoints.push({ x, y });
        }

        context.moveTo(outerPoints[0].x, outerPoints[0].y);
        for (let i = 1; i < outerPoints.length; i++) {
            context.lineTo(outerPoints[i].x, outerPoints[i].y);
        }
        context.closePath();

        context.fillStyle = "#8a8a8a"; // Gray color
        context.fill();
        context.strokeStyle = "#666666"; // Darker outline
        context.lineWidth = 4;
        context.stroke();

        // Draw the smaller triangle
        context.beginPath();
        const smallerUnitSize = unitSize * 0.45;
        for (let i = 0; i < 3; i++) {
            const angle = (Math.PI * 2 / 3) * i;
            const x = smallerUnitSize * Math.cos(angle);
            const y = smallerUnitSize * Math.sin(angle);
            outerPoints[i] = { x, y };
        }

        context.moveTo(outerPoints[0].x, outerPoints[0].y);
        for (let i = 1; i < outerPoints.length; i++) {
            context.lineTo(outerPoints[i].x, outerPoints[i].y);
        }
        context.closePath();

        context.fill();
        context.stroke();
    }


    renderBoosterCannonSiegeTank (context) {
        this.renderBasic(context);

        context.rotate(this.rotationOffset); // Align with the barracks' rotation
        // Move to the center of the square
        context.translate(-4, 0);

        context.beginPath();
        const unitSize = 25;
        const outerPoints = [];
        for (let i = 0; i < 3; i++) {
            const angle = (Math.PI * 2 / 3) * i;
            const x = unitSize * Math.cos(angle);
            const y = unitSize * Math.sin(angle);
            outerPoints.push({ x, y });
        }

        context.moveTo(outerPoints[0].x, outerPoints[0].y);
        for (let i = 1; i < outerPoints.length; i++) {
            context.lineTo(outerPoints[i].x, outerPoints[i].y);
        }
        context.closePath();

        context.fillStyle = "#a8a8a8"; // Gray color
        context.fill();
        context.strokeStyle = "#666666"; // Darker outline
        context.lineWidth = 4;
        context.stroke();

        // Draw the smaller triangle
        context.beginPath();
        const smallerUnitSize = unitSize * 0.45;
        for (let i = 0; i < 3; i++) {
            const angle = (Math.PI * 2 / 3) * i;
            const x = smallerUnitSize * Math.cos(angle);
            const y = smallerUnitSize * Math.sin(angle);
            outerPoints[i] = { x, y };
        }

        context.moveTo(outerPoints[0].x, outerPoints[0].y);
        for (let i = 1; i < outerPoints.length; i++) {
            context.lineTo(outerPoints[i].x, outerPoints[i].y);
        }
        context.closePath();

        context.fill();
        context.stroke();


        context.rotate(-Math.PI / 2);

        const cannonWidth = 15;
        const cannonLength = 12.5;

        // Draw the rectangle (cannon) with recoil effect
        context.fillStyle = "#a8a8a8"; // Color of the cannon
        context.fillRect(-cannonWidth / 2, cannonLength - unitSize * 0.25, cannonWidth, cannonLength);

        // Draw a border around the cannon
        context.strokeStyle = "#666666";
        context.lineWidth = 4;
        context.strokeRect(-cannonWidth / 2, cannonLength - unitSize * 0.25, cannonWidth, cannonLength);


        // Draw the smaller circle in the middle
        context.beginPath();
        context.arc(0, 0, unitSize * 0.35, 0, Math.PI * 2);
        context.closePath();
        context.fillStyle = "#a8a8a8"; // Color of the smaller circle
        context.fill();
        context.strokeStyle = "#666666";
        context.lineWidth = 4;
        context.stroke();
    }

    renderCannonSiegeTankFactory (context) {
        this.renderBasic(context);

        context.rotate(this.rotationOffset); // Align with the barracks' rotation
        // Move to the center of the square
        context.translate(-4, 0);

        context.beginPath();
        const unitSize = 25;
        const outerPoints = [];
        for (let i = 0; i < 3; i++) {
            const angle = (Math.PI * 2 / 3) * i;
            const x = unitSize * Math.cos(angle);
            const y = unitSize * Math.sin(angle);
            outerPoints.push({ x, y });
        }

        context.moveTo(outerPoints[0].x, outerPoints[0].y);
        for (let i = 1; i < outerPoints.length; i++) {
            context.lineTo(outerPoints[i].x, outerPoints[i].y);
        }
        context.closePath();

        context.fillStyle = "#8a8a8a"; // Gray color
        context.fill();
        context.strokeStyle = "#666666"; // Darker outline
        context.lineWidth = 4;
        context.stroke();

        // Draw the smaller triangle
        context.beginPath();
        const smallerUnitSize = unitSize * 0.45;
        for (let i = 0; i < 3; i++) {
            const angle = (Math.PI * 2 / 3) * i;
            const x = smallerUnitSize * Math.cos(angle);
            const y = smallerUnitSize * Math.sin(angle);
            outerPoints[i] = { x, y };
        }

        context.moveTo(outerPoints[0].x, outerPoints[0].y);
        for (let i = 1; i < outerPoints.length; i++) {
            context.lineTo(outerPoints[i].x, outerPoints[i].y);
        }
        context.closePath();

        context.fill();
        context.stroke();


        context.rotate(-Math.PI / 2);

        const cannonWidth = 15;
        const cannonLength = 12.5;

        // Draw the rectangle (cannon) with recoil effect
        context.fillStyle = "#a8a8a8"; // Color of the cannon
        context.fillRect(-cannonWidth / 2, cannonLength - unitSize * 0.25, cannonWidth, cannonLength);

        // Draw a border around the cannon
        context.strokeStyle = "#666666";
        context.lineWidth = 4;
        context.strokeRect(-cannonWidth / 2, cannonLength - unitSize * 0.25, cannonWidth, cannonLength);


        // Draw the smaller circle in the middle
        context.beginPath();
        context.arc(0, 0, unitSize * 0.35, 0, Math.PI * 2);
        context.closePath();
        context.fillStyle = "#a8a8a8"; // Color of the smaller circle
        context.fill();
        context.strokeStyle = "#666666";
        context.lineWidth = 4;
        context.stroke();

    }

    renderBoosterSiegeFactory (context) {
        this.renderBasic(context);
        context.rotate(this.rotationOffset); // Align with the barracks' rotation
        context.translate(-2, 0);

        const unitSize = 25;

        context.save();
        // Translate to the position where the booster should be, behind the tank
        context.translate(-unitSize / 4, 0); // Move booster to the back of the tank

        // Draw the booster
        context.fillStyle = "#a4a4a4";
        context.beginPath();
        context.moveTo(-unitSize / 2, -unitSize / 1.6);  // Top left corner
        context.lineTo(unitSize / 10, -unitSize / 2.5);  // Top right corner
        context.lineTo(unitSize / 10, unitSize / 2.5);   // Bottom right corner
        context.lineTo(-unitSize / 2, unitSize / 1.6);   // Bottom left corner
        context.closePath();
        context.fill();

        context.strokeStyle = "#666666";
        context.lineWidth = 4;
        context.stroke();
        context.restore();

        context.beginPath();
        const outerPoints = [];
        for (let i = 0; i < 3; i++) {
            const angle = (Math.PI * 2 / 3) * i;
            const x = unitSize * Math.cos(angle);
            const y = unitSize * Math.sin(angle);
            outerPoints.push({ x, y });
        }

        context.moveTo(outerPoints[0].x, outerPoints[0].y);
        for (let i = 1; i < outerPoints.length; i++) {
            context.lineTo(outerPoints[i].x, outerPoints[i].y);
        }
        context.closePath();

        context.fillStyle = "#a8a8a8"; // Gray color
        context.fill();
        context.strokeStyle = "#666666"; // Darker outline
        context.lineWidth = 4;
        context.stroke();


        // Draw the smaller triangle
        context.beginPath();
        const smallerUnitSize = unitSize * 0.45;
        for (let i = 0; i < 3; i++) {
            const angle = (Math.PI * 2 / 3) * i;
            const x = smallerUnitSize * Math.cos(angle);
            const y = smallerUnitSize * Math.sin(angle);
            outerPoints[i] = { x, y };
        }

        context.moveTo(outerPoints[0].x, outerPoints[0].y);
        for (let i = 1; i < outerPoints.length; i++) {
            context.lineTo(outerPoints[i].x, outerPoints[i].y);
        }
        context.closePath();

        context.fill();
        context.stroke();
    }

    renderHeavyBoosterSiegeFactory (context) {
        this.renderBasic(context);
        context.rotate(this.rotationOffset); // Align with the barracks' rotation
        context.translate(-2, 0);

        const unitSize = 25;

        context.save();
        // Translate to the position where the booster should be, behind the tank
        context.translate(-unitSize / 4, 0); // Move booster to the back of the tank

        // Draw the booster
        context.fillStyle = "#a4a4a4";
        context.beginPath();
        context.moveTo(-unitSize / 2, -unitSize / 1.6);  // Top left corner
        context.lineTo(unitSize / 10, -unitSize / 2.5);  // Top right corner
        context.lineTo(unitSize / 10, unitSize / 2.5);   // Bottom right corner
        context.lineTo(-unitSize / 2, unitSize / 1.6);   // Bottom left corner
        context.closePath();
        context.fill();

        context.strokeStyle = "#666666";
        context.lineWidth = 4;
        context.stroke();
        context.restore();

        context.beginPath();
        const outerPoints = [];
        for (let i = 0; i < 3; i++) {
            const angle = (Math.PI * 2 / 3) * i;
            const x = unitSize * Math.cos(angle);
            const y = unitSize * Math.sin(angle);
            outerPoints.push({ x, y });
        }

        context.moveTo(outerPoints[0].x, outerPoints[0].y);
        for (let i = 1; i < outerPoints.length; i++) {
            context.lineTo(outerPoints[i].x, outerPoints[i].y);
        }
        context.closePath();

        context.fillStyle = "#8a8a8a"; // Gray color
        context.fill();
        context.strokeStyle = "#666666"; // Darker outline
        context.lineWidth = 4;
        context.stroke();


        // Draw the smaller triangle
        context.beginPath();
        const smallerUnitSize = unitSize * 0.45;
        for (let i = 0; i < 3; i++) {
            const angle = (Math.PI * 2 / 3) * i;
            const x = smallerUnitSize * Math.cos(angle);
            const y = smallerUnitSize * Math.sin(angle);
            outerPoints[i] = { x, y };
        }

        context.moveTo(outerPoints[0].x, outerPoints[0].y);
        for (let i = 1; i < outerPoints.length; i++) {
            context.lineTo(outerPoints[i].x, outerPoints[i].y);
        }
        context.closePath();

        context.fill();
        context.stroke();
    }

    renderBoosterCannonSiegeFactory (context) {
        this.renderBasic(context);
        context.rotate(this.rotationOffset); // Align with the barracks' rotation
        context.translate(-2, 0);

        const unitSize = 25;

        context.save();
        // Translate to the position where the booster should be, behind the tank
        context.translate(-unitSize / 4, 0); // Move booster to the back of the tank

        // Draw the booster
        context.fillStyle = "#a4a4a4";
        context.beginPath();
        context.moveTo(-unitSize / 2, -unitSize / 1.6);  // Top left corner
        context.lineTo(unitSize / 10, -unitSize / 2.5);  // Top right corner
        context.lineTo(unitSize / 10, unitSize / 2.5);   // Bottom right corner
        context.lineTo(-unitSize / 2, unitSize / 1.6);   // Bottom left corner
        context.closePath();
        context.fill();

        context.strokeStyle = "#666666";
        context.lineWidth = 4;
        context.stroke();
        context.restore();

        context.beginPath();
        const outerPoints = [];
        for (let i = 0; i < 3; i++) {
            const angle = (Math.PI * 2 / 3) * i;
            const x = unitSize * Math.cos(angle);
            const y = unitSize * Math.sin(angle);
            outerPoints.push({ x, y });
        }

        context.moveTo(outerPoints[0].x, outerPoints[0].y);
        for (let i = 1; i < outerPoints.length; i++) {
            context.lineTo(outerPoints[i].x, outerPoints[i].y);
        }
        context.closePath();

        context.fillStyle = "#a8a8a8"; // Gray color
        context.fill();
        context.strokeStyle = "#666666"; // Darker outline
        context.lineWidth = 4;
        context.stroke();


        // Draw the smaller triangle
        context.beginPath();
        const smallerUnitSize = unitSize * 0.45;
        for (let i = 0; i < 3; i++) {
            const angle = (Math.PI * 2 / 3) * i;
            const x = smallerUnitSize * Math.cos(angle);
            const y = smallerUnitSize * Math.sin(angle);
            outerPoints[i] = { x, y };
        }

        context.moveTo(outerPoints[0].x, outerPoints[0].y);
        for (let i = 1; i < outerPoints.length; i++) {
            context.lineTo(outerPoints[i].x, outerPoints[i].y);
        }
        context.closePath();

        context.fill();
        context.stroke();


        context.rotate(-Math.PI / 2);

        const cannonWidth = 15;
        const cannonLength = 12.5;

        // Draw the rectangle (cannon) with recoil effect
        context.fillStyle = "#a8a8a8"; // Color of the cannon
        context.fillRect(-cannonWidth / 2, cannonLength - unitSize * 0.25, cannonWidth, cannonLength);

        // Draw a border around the cannon
        context.strokeStyle = "#666666";
        context.lineWidth = 4;
        context.strokeRect(-cannonWidth / 2, cannonLength - unitSize * 0.25, cannonWidth, cannonLength);


        // Draw the smaller circle in the middle
        context.beginPath();
        context.arc(0, 0, unitSize * 0.35, 0, Math.PI * 2);
        context.closePath();
        context.fillStyle = "#a8a8a8"; // Color of the smaller circle
        context.fill();
        context.strokeStyle = "#666666";
        context.lineWidth = 4;
        context.stroke();

    }
}