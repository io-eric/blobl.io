import Building from "../Building.js";
import { BuildingDetails, BuildingVariantTypes, BuildingTypes, getBuildingDetails, getBulletDetails } from "../../network/constants.js";
import Polygon from "../Polygon.js";
import Shapes from "../../components/Shapes.js";
import ThemeManager from "../../components/managers/ThemeManager.js";

export default class SimpleTurret extends Building {
    constructor (color, position = { x: 0, y: 0 }, variant = 0, id = -1) {
        const details = BuildingDetails.SIMPLE_TURRET.BASIC;
        super(id, BuildingTypes.SIMPLE_TURRET, color, details, position, variant);

        this.rotationOffset = Math.PI / 2;
        this.cannonLength = 25; // Length of the cannon
        this.cannonWidth = this.size * 0.65; // Width of the cannon
        this.setUpgrade(variant);

        this.recoil = 0; // Initial recoil state
        this.maxRecoil = 6; // Maximum recoil distance
        this.recoilDecay = 0.05; // Speed of recoil decay

        this._updateAngleToTarget();
        this._updateBulletDetails();

        this.points = [];
        this.points[0] = Shapes.getCirclePoints(this.size, 16);
    }

    _updateBulletDetails () {
        this.bulletDetails = getBulletDetails(BuildingTypes.SIMPLE_TURRET, this.variant);
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
        context.translate(worldPosition.x, worldPosition.y);
        super.render(context);
        context.rotate(this.angleToTarget);

        if (this.isSelected()){
            this.renderSelection(context, this.details.range, ThemeManager.currentThemeProperties.selectionColor);
        }
        this.renderUpgrade(context, worldPosition);

        context.restore();
    }

    _getRenderMethod (buildingVariant) {
        const variantMap = {
            [BuildingVariantTypes.SIMPLE_TURRET.BASIC]: this._renderSimpleTurret,
            [BuildingVariantTypes.SIMPLE_TURRET.RAPID_TURRET]: this._renderRapidTurret,
            [BuildingVariantTypes.SIMPLE_TURRET.GATLING_TURRET]: this._renderGatlingTurret,
            [BuildingVariantTypes.SIMPLE_TURRET.HEAVY_TURRET]: this._renderHeavyTurret,
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

    _renderSimpleTurret (context, worldPosition) {
        this._renderTurretBase(context);

        const recoilOffset = this.recoil;
        this._drawCannon(context, recoilOffset, this.cannonWidth, this.cannonLength);

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

    _renderRapidTurret (context, worldPosition) {
        // Render the turret base (unchanged)
        this._renderTurretBase(context);

        const recoilOffset = this.recoil;
        const cannonWidth = this.cannonWidth;
        const cannonLength = cannonWidth * 0.85;

        // Draw both cannons
        this._drawCannon(context, recoilOffset, cannonWidth, this.cannonLength);
        this._drawCannon(context, recoilOffset, cannonWidth, cannonLength);

        // Draw the smaller circle in the middle
        const circleRadius = this.size * 0.5;
        context.beginPath();
        context.arc(0, 0, circleRadius, 0, Math.PI * 2);
        context.closePath();
        context.fillStyle = "#a8a8a8"; // Color of the smaller circle
        context.fill();
        context.strokeStyle = "#666666";
        context.lineWidth = 4;
        context.stroke();
    }


    _renderGatlingTurret (context, worldPosition) {
        // Render the turret base (unchanged)
        this._renderTurretBase(context);

        const recoilOffset = this.recoil;
        const cannonWidthHalf = this.cannonWidth / 2;
        const cannonSpacing = 2; // Spacing between cannons
        const cannonHeight = this.cannonLength;
        const cannonYPos = recoilOffset - cannonHeight - this.size * 0.25;

        // Reusable position for both cannons
        const leftCannonX = -this.cannonWidth + cannonWidthHalf - cannonSpacing / 2;
        const rightCannonX = cannonSpacing / 2;

        // Draw both cannons
        context.fillStyle = "#a8a8a8";
        context.strokeStyle = "#666666";
        context.lineWidth = 4;

        // Left Cannon
        context.fillRect(leftCannonX, cannonYPos, cannonWidthHalf, cannonHeight);
        context.strokeRect(leftCannonX, cannonYPos, cannonWidthHalf, cannonHeight);

        // Right Cannon
        context.fillRect(rightCannonX, cannonYPos, cannonWidthHalf, cannonHeight);
        context.strokeRect(rightCannonX, cannonYPos, cannonWidthHalf, cannonHeight);

        // Draw the smaller circle in the middle
        const circleRadius = this.size * 0.5;
        context.beginPath();
        context.arc(0, 0, circleRadius, 0, Math.PI * 2);
        context.closePath();
        context.fillStyle = "#a8a8a8"; // Color of the smaller circle
        context.fill();
        context.stroke();
    }

    _renderHeavyTurret (context, worldPosition) {
        this._renderTurretBase(context);

        const recoilOffset = this.recoil * 2;
        const cannonWidth = this.cannonWidth * 1.7;

        this._drawCannon(context, recoilOffset, cannonWidth, this.cannonLength); // Draw heavy cannon

        // Draw the smaller circle in the middle
        context.beginPath();
        context.arc(0, 0, this.size * 0.6, 0, Math.PI * 2);
        context.closePath();
        context.fillStyle = "#a8a8a8"; // Color of the smaller circle
        context.fill();
        context.strokeStyle = "#666666";
        context.lineWidth = 4;
        context.stroke();
    }
}
