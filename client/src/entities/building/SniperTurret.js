import Building from "../Building.js";
import { BuildingDetails, BuildingVariantTypes, BuildingTypes, getBuildingDetails, getBulletDetails } from '../../network/constants.js';
import Polygon from "../Polygon.js";
import Shapes from "../../components/Shapes.js";
import ThemeManager from "../../components/managers/ThemeManager.js";

export default class SniperTurret extends Building {
    constructor (color, position = { x: 0, y: 0 }, variant = 0, id = -1) {
        const details = BuildingDetails.SNIPER_TURRET.BASIC;
        super(id, BuildingTypes.SNIPER_TURRET, color, details, position, variant);

        this.rotationOffset = Math.PI / 2;
        this.cannonLength = 35; // Length of the cannon
        this.cannonWidth = this.size * 0.65; // Width of the cannon
        this.setUpgrade(variant);

        this.recoil = 0; // Initial recoil state
        this.maxRecoil = 8; // Maximum recoil distance
        this.recoilDecay = 0.05; // Speed of recoil decay

        this._updateAngleToTarget();
        this._updateBulletDetails();
    }

    initPolygon () {
        const offset = 2;
        this.polygon = new Polygon(Shapes.getCirclePoints(this.size + offset, 16), this.position);
        this.updatePolygonRotation();
    }

    setUpgrade (buildingVariant) {
        this.variant = buildingVariant;
        this.details = getBuildingDetails(this.type, buildingVariant);
        this.renderUpgrade = this._getRenderMethod(buildingVariant);

        if (!this.renderUpgrade) {
            console.error("UpgradeType not defined!");
        }

        this._updateBulletDetails();
    }

    triggerRecoil () {
        this.recoil = this.maxRecoil;
    }

    update (deltaTime) {
        if (this.recoil > 0) {
            this.recoil -= this.recoilDecay * deltaTime;
            if (this.recoil < 0) {
                this.recoil = 0;
            }
        }
        return super.update(deltaTime);
    }

    render (context, camera, deltaTime) {
        const worldPosition = this.getWorldPosition(camera);
        context.save();
        // Translate and rotate context for drawing
        context.translate(worldPosition.x, worldPosition.y);
        super.render(context);
        context.rotate(this.angleToTarget);  // Rotate based on angleToTarget and rotationOffset

        if (this.isSelected()){
            this.renderSelection(context, this.details.range, ThemeManager.currentThemeProperties.selectionColor);
        }
        
        this.renderUpgrade(context, worldPosition);

        context.restore();
    }

    _updateBulletDetails () {
        this.bulletDetails = getBulletDetails(BuildingTypes.SNIPER_TURRET, this.variant);
    }

    _getRenderMethod (buildingVariant) {
        const variantMap = {
            [BuildingVariantTypes.SNIPER_TURRET.BASIC]: this._renderSniperTurret,
            [BuildingVariantTypes.SNIPER_TURRET.SEMI_AUTOMATIC_SNIPER]: this._renderSemiAutomaticSniper,
            [BuildingVariantTypes.SNIPER_TURRET.HEAVY_SNIPER]: this._renderHeavySniper,
            [BuildingVariantTypes.SNIPER_TURRET.TRAPPER]: this._renderTrapper,
            [BuildingVariantTypes.SNIPER_TURRET.ANTI_TANK_GUN]: this._renderAntiTankGun,
        };
        return variantMap[buildingVariant] || this._renderSimpleTurret;
    }

    _renderTurretBase (context) {
        // Draw the turret body (large circle)
        context.beginPath();
        context.arc(0, 0, this.size, 0, Math.PI * 2);
        context.closePath();
        context.fillStyle = this.color;
        context.fill();
        context.strokeStyle = "#666666";
        context.lineWidth = 4;
        context.stroke();
    }

    _drawCannon (context, recoilOffset, cannonWidth, cannonLength) {
        context.fillStyle = "#a8a8a8";
        context.fillRect(-cannonWidth / 2, recoilOffset - cannonLength - this.size * 0.25, cannonWidth, cannonLength);
        context.strokeStyle = "#666666";
        context.lineWidth = 4;
        context.strokeRect(-cannonWidth / 2, recoilOffset - cannonLength - this.size * 0.25, cannonWidth, cannonLength);
    }

    _renderSniperTurret (context, worldPosition) {
 
        this._renderTurretBase(context);

        const recoilOffset = this.recoil;

        // Draw the cannon (rectangle)
        this._drawCannon(context, recoilOffset, this.cannonWidth, this.cannonLength);

        context.beginPath();
        context.arc(0, 0, this.size * 0.5, 0, Math.PI * 2);
        context.closePath();
        context.fillStyle = "#a8a8a8"; // Color of the smaller circle
        context.fill();
        context.strokeStyle = "#666666";
        context.lineWidth = 4;
        context.stroke();
    }


    _renderSemiAutomaticSniper (context, worldPosition) {
        this._renderTurretBase(context);

        const recoilOffset = this.recoil;
        const cannonLength = this.cannonLength * 0.75;
        const cannonWidth = this.cannonWidth * 0.8;

        // Draw the cannon (rectangle)
        this._drawCannon(context, recoilOffset, cannonWidth, this.cannonLength);
        this._drawCannon(context, recoilOffset * 1.2, this.cannonWidth, cannonLength);

        // Draw the smaller circle in the middle
        context.beginPath();
        context.arc(0, 0, this.size * 0.5, 0, Math.PI * 2);
        context.closePath();
        context.fillStyle = "#a8a8a8"; // Color of the smaller circle
        context.fill();
        context.strokeStyle = "#666666";
        context.lineWidth = 4;
        context.stroke();
    }

    _renderHeavySniper (context, worldPosition) {
        this._renderTurretBase(context);

        const recoilOffset = this.recoil;
        const cannonWidth = this.cannonWidth * 1.2;
        // Draw the cannon (rectangle)
        this._drawCannon(context, recoilOffset, cannonWidth, this.cannonLength);

        context.beginPath();
        context.arc(0, 0, this.size * 0.5, 0, Math.PI * 2);
        context.closePath();
        context.fillStyle = "#a8a8a8"; // Color of the smaller circle
        context.fill();
        context.strokeStyle = "#666666";
        context.lineWidth = 4;
        context.stroke();
    }

    _renderTrapper (context, worldPosition) {
        // Render the turret base
        this._renderTurretBase(context);

        // Recoil offset calculated once
        const recoilOffset = this.recoil;

        // Cannon dimensions are calculated once
        const cannonWidth = this.cannonWidth * 1.2;
        const cannonLength = this.cannonLength * 0.7;

        // Draw the cannon (rectangle)
        this._drawCannon(context, recoilOffset, cannonWidth, cannonLength);

        const trapezoidBaseWidth = cannonWidth * 0.8;
        const trapezoidTopWidth = cannonWidth * 0.5;
        const trapezoidHeight = cannonLength * 0.5;

        // Draw the trapezoid by calculating the base and top widths once
        const halfBaseWidth = trapezoidBaseWidth;
        const halfTopWidth = trapezoidTopWidth;

        context.beginPath();
        context.moveTo(-halfBaseWidth, recoilOffset - trapezoidHeight - cannonLength); // Bottom left
        context.lineTo(halfBaseWidth, recoilOffset - trapezoidHeight - cannonLength); // Bottom right
        context.lineTo(halfTopWidth, recoilOffset - cannonLength); // Top right
        context.lineTo(-halfTopWidth, recoilOffset - cannonLength); // Top left
        context.closePath();

        // Fill and stroke the trapezoid
        context.fillStyle = "#a8a8a8";  // Color of the trapezoid
        context.fill();
        context.strokeStyle = "#666666";  // Border color
        context.lineWidth = 4;  // Border width
        context.stroke();

        const circleRadius = this.size * 0.5;

        context.beginPath();
        context.arc(0, 0, circleRadius, 0, Math.PI * 2);
        context.closePath();
        context.fillStyle = "#a8a8a8";  // Color of the circle
        context.fill();
        context.strokeStyle = "#666666";
        context.lineWidth = 4;
        context.stroke();
    }

    _renderAntiTankGun (context, worldPosition) {
        this._renderTurretBase(context, worldPosition);

        const recoilOffset = this.recoil;

        // Draw the cannon (rectangle)
        this._drawCannon(context, recoilOffset, this.cannonWidth, this.cannonLength);

        // Define common parameters for the smaller rectangle
        const rectX = -this.cannonWidth * 1.2 / 2;
        const rectY = recoilOffset - this.cannonLength - this.size * 0.25;
        const rectWidth = this.cannonWidth * 1.2;
        const rectHeight = this.cannonLength * 0.5;

        context.fillStyle = "#a8a8a8";
        context.fillRect(rectX, rectY, rectWidth, rectHeight);

        context.strokeStyle = "#666666";
        context.lineWidth = 4;
        context.strokeRect(rectX, rectY, rectWidth, rectHeight);

        // Draw the smaller circle in the middle
        const circleRadius = this.size * 0.5;
        context.beginPath();
        context.arc(0, 0, circleRadius, 0, Math.PI * 2);
        context.closePath();
        context.fillStyle = "#a8a8a8";  // Color of the smaller circle
        context.fill();
        context.strokeStyle = "#666666";
        context.lineWidth = 4;
        context.stroke();
    }

}
