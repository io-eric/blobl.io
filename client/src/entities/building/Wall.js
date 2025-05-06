import Building from "../Building.js";
import { BuildingDetails, BuildingVariantTypes, BuildingTypes, getBuildingDetails } from '../../network/constants.js';
import Polygon from "../Polygon.js";
import Shapes from "../../components/Shapes.js";
import ThemeManager from "../../components/managers/ThemeManager.js";

export default class Wall extends Building {
    constructor (color, position = { x: 0, y: 0 }, variant = 0, id = -1) {
        const details = BuildingDetails.WALL.BASIC;
        super(id, BuildingTypes.WALL, color, details, position, variant);
        this.rotationOffset = Math.PI / 2;

        // For Micro Generator
        this.animationPhase = 0;
        this.animationSpeed = 0.003;
        this.animationOffset = Math.random() * Math.PI * 2; // Random value between 0 and 2π

        this.points = []; // Initialize points array

        this.initPolygon(); // Initialize the polygon points
        this._updateAngleToTarget();
        this.setUpgrade(variant);
    }

    initPolygon () {
        const offset = 2;
        this.polygon = new Polygon(Shapes.getCirclePoints(this.size + offset, 16), this.position);
        this.updatePolygonRotation();
    }

    setUpgrade (buildingVariant) {
        this.variant = buildingVariant;
        this.details = getBuildingDetails(this.type, buildingVariant);
        const variantMap = {
            [BuildingVariantTypes.WALL.BASIC]: this._renderWall,
            [BuildingVariantTypes.WALL.MICRO_GENERATOR]: this._renderMicroGenerator,
            [BuildingVariantTypes.WALL.BOULDER]: this._renderBoulder,
            [BuildingVariantTypes.WALL.SPIKE]: this._renderSpike,
        };

        // Update points based on variant
        switch (buildingVariant) {
            case BuildingVariantTypes.WALL.BOULDER:
                this.points[0] = Shapes.getPolygonPoints(this.size, 6);
                break;
            case BuildingVariantTypes.WALL.SPIKE:
                this.points[0] = Shapes.generateSpikePoints(this.size);
                break;
            case BuildingVariantTypes.WALL.MICRO_GENERATOR:
                this.points[0] = Shapes.getPolygonPoints(this.size * 0.5, 6);
                break;
        }

        this.renderUpgrade = variantMap[buildingVariant] || this.defaultRender;

        if (!this.renderUpgrade) {
            console.error("UpgradeType not defined!", buildingVariant);
        }
    }

    render (context, camera, deltaTime) {
        const worldPosition = this.getWorldPosition(camera);
        context.save(); // Save the current context state
        // Translate and rotate context for drawing
        context.translate(worldPosition.x, worldPosition.y);
        super.render(context, camera, deltaTime)
        context.rotate(this.angleToTarget); // Rotate based on angleToTarget and rotationOffset

        if (this.renderUpgrade === this._renderMicroGenerator) {
            this._updateMicroGeneratorAnimation(deltaTime);
        }

        if(this.isSelected()) {
            this.renderSelection(context, this.details.range, ThemeManager.currentThemeProperties.selectionColor);
        }

        this.renderUpgrade(context); // Render without passing worldPosition as it's now handled in context transformations
     
        context.restore(); // Restore the previous context state
    }

    _updateMicroGeneratorAnimation (deltaTime) {
        this.animationPhase = (this.animationPhase + this.animationSpeed * deltaTime) % (Math.PI * 2);
    }

    _renderWall (context) {
        this._drawCircle(context, 0, 0, this.size, this.color); // Use translated origin
    }

    _renderMicroGenerator (context) {
        const scalingFactor = 1 + 0.065 * Math.sin(this.animationPhase + this.animationOffset);

        // Draw the outer circle
        this._drawCircle(context, 0, 0, this.size, this.color); // Outer circle

        // Draw the animated polygon in the center
        context.save(); // Save the current state
        context.scale(scalingFactor, scalingFactor); // Scale the context for animation
        this._drawPolygon(context, this.points[0], "#a8a8a8"); // Draw the inner polygon
        context.restore(); // Restore the state
    }

    _renderSpike (context) {
        this._drawPolygon(context, this.points[0], this.color);
    }

    _renderBoulder (context) {
        this._drawPolygon(context, this.points[0], this.color);
    }

    _drawCircle (context, positionX, positionY, radius, fillColor) {
        context.beginPath();
        context.arc(positionX, positionY, radius, 0, Math.PI * 2);
        context.closePath();
        context.fillStyle = fillColor;
        context.fill();
        this._strokeShape(context, fillColor);
    }

    _drawPolygon (context, points, fillColor) {
        context.beginPath();
        context.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            context.lineTo(points[i].x, points[i].y);
        }
        context.closePath();
        context.fillStyle = fillColor;
        context.fill();
        this._strokeShape(context, fillColor);
    }

    _strokeShape (context, color) {
        context.strokeStyle = "#666666";
        context.lineWidth = 4;
        context.stroke();
    }
}
