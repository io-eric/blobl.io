import Building from "../Building.js";
import { BuildingDetails, BuildingVariantTypes, BuildingTypes, getBuildingDetails } from '../../network/constants.js';
import Polygon from "../Polygon.js";
import Shapes from "../../components/Shapes.js";
import ThemeManager from "../../components/managers/ThemeManager.js";

export default class Generator extends Building {
    constructor (color, position = { x: 0, y: 0 }, variant = 0, id = -1) {
        const details = BuildingDetails.GENERATOR.BASIC;
        super(id, BuildingTypes.GENERATOR, color, details, position, variant);
        this.rotationOffset = Math.PI / 2;

        // Initialize animation properties
        this.animationPhase = 0;
        this.animationSpeed = 0.003; // Speed of animation
        this.animationOffset = Math.random() * Math.PI * 2; // Random offset

        this.points = [];

        this.setUpgrade(variant);
        this.initPolygon(); // Initialize the polygon points
    }

    initPolygon () {
        this.polygon = new Polygon(Shapes.getHexagonPoints(this.size), this.position);
        this.updatePolygonRotation();
    }

    setUpgrade (buildingVariant) {
        this.variant = buildingVariant;
        this.details = getBuildingDetails(this.type, buildingVariant);
        const variantMap = {
            [BuildingVariantTypes.GENERATOR.BASIC]: this._renderGenerator.bind(this),
            [BuildingVariantTypes.GENERATOR.POWER_PLANT]: this._renderPowerPlant.bind(this)
        };

        if (buildingVariant === BuildingVariantTypes.GENERATOR.POWER_PLANT) {
            this.points[0] = Shapes.getOctagonPoints(this.size * 0.95);
            this.points[1] = Shapes.getOctagonPoints(this.size * 0.95 * 0.65);
        } else {
            this.points[0] = Shapes.getHexagonPoints(this.size);
            this.points[1] = Shapes.getHexagonPoints(this.size * 0.65);
        }

        this.renderUpgrade = variantMap[buildingVariant] || this._renderGenerator.bind(this);

        if (!this.renderUpgrade) {
            console.error("UpgradeType not defined!");
        }
    }

    render (context, camera, deltaTime) {
        const worldPosition = this.getWorldPosition(camera);

        // Update animation state
        this.animationPhase = (this.animationPhase + this.animationSpeed * deltaTime) % (Math.PI * 2);
        const phaseWithOffset = (this.animationPhase + this.animationOffset) % (Math.PI * 2);

        context.save();
        context.translate(worldPosition.x, worldPosition.y);
        super.render(context);
        
        const rotationOffset = this.variant === BuildingVariantTypes.GENERATOR.POWER_PLANT ? Math.PI / 8 : 0;
        context.rotate(this.angleToTarget + rotationOffset);

        if (this.isSelected()) {
            this.renderSelection(context, this.details.range, ThemeManager.currentThemeProperties.selectionColor);
        }

        this.renderUpgrade(context, worldPosition, phaseWithOffset);
        context.restore();
    }

    _renderGenerator (context, worldPosition, phaseWithOffset) {
        // Draw the outer polygon (static)
        this._drawPolygon(context, this.points[0], this.color, "#666666", 4, worldPosition, this.angleToTarget);

        // Prepare inner polygon properties
        const scalingFactor = 1 + 0.065 * Math.sin(phaseWithOffset);

        context.scale(scalingFactor, scalingFactor);

        // Inner polygon points, scaled but not affecting outer polygon
        this._drawPolygon(context, this.points[1], "#a8a8a8", "#666666", 4);
    }

    _renderPowerPlant (context, worldPosition, phaseWithOffset) {
        // Draw the outer polygon (static)
        this._drawPolygon(context, this.points[0], this.color, "#666666", 4, worldPosition, this.angleToTarget);

        // Prepare inner polygon properties
        const scalingFactor = 1 + 0.065 * Math.sin(phaseWithOffset);


        context.scale(scalingFactor, scalingFactor);

        this._drawPolygon(context, this.points[1], "#a8a8a8", "#666666", 4);
    }

    _drawPolygon (context, points, fillColor, strokeColor, lineWidth) {
        context.beginPath();
        context.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            context.lineTo(points[i].x, points[i].y);
        }
        context.closePath();

        context.fillStyle = fillColor;
        context.fill();

        context.strokeStyle = strokeColor;
        context.lineWidth = lineWidth;
        context.stroke();
    }
}
