import Building from "../Building.js";
import { BuildingDetails, BuildingTypes, BuildingVariantTypes, getBuildingDetails } from "../../network/constants.js";
import Polygon from "../Polygon.js";
import Shapes from "../../components/Shapes.js";
import ThemeManager from "../../components/managers/ThemeManager.js";

export default class House extends Building {
    constructor (color, position = { x: 0, y: 0 }, variant = 0, id = -1) {
        const details = BuildingDetails.HOUSE.BASIC;
        super(id, BuildingTypes.HOUSE, color, details, position, variant);
        this.rotationOffset = 0;

        this.points = [];

        this.setUpgrade(variant);
        this.initPolygon(); // Initialize the polygon points
    }

    initPolygon () {
        this.polygon = new Polygon(Shapes.getPentagonPoints(this.size), this.position);
        this.updatePolygonRotation();
    }


    setUpgrade (buildingVariant) {
        this.variant = buildingVariant;
        this.details = getBuildingDetails(this.type, buildingVariant);
        const variantMap = {
            [BuildingVariantTypes.HOUSE.BASIC]: this._renderHouse.bind(this),
            [BuildingVariantTypes.HOUSE.LARGE_HOUSE]: this._renderHouse.bind(this)
        };

        if (buildingVariant === BuildingVariantTypes.HOUSE.LARGE_HOUSE) {
            this.points[0] = Shapes.getPentagonPoints(this.size);
            this.points[1] = Shapes.getPentagonPoints(this.size * 0.45);
        } else {
            this.points[0] = Shapes.getPentagonPoints(this.size);
            this.points[1] = Shapes.getPentagonPoints(this.size * 0.3);
        }

        this.renderUpgrade = variantMap[buildingVariant] || this._renderGenerator.bind(this);

        if (!this.renderUpgrade) {
            console.error("UpgradeType not defined!");
        }
    }

    render (context, camera, deltaTime) {
        const worldPosition = this.getWorldPosition(camera);
        context.save();
        context.translate(worldPosition.x, worldPosition.y); // Translate to the world position
        super.render(context);
        context.rotate(this.angleToTarget);

        if (this.isSelected()) {
            this.renderSelection(context, this.details.range, ThemeManager.currentThemeProperties.selectionColor);
        }
        this._renderHouse(context, worldPosition);
        context.restore();
    }

    _renderHouse (context, worldPosition) {
        this._drawPentagon(context, this.points[0], this.color);
        this._drawPentagon(context, this.points[1], "#a8a8a8");
    }

    _drawPentagon (context, points, fillColor) {
        // Draw the pentagon using pre-calculated points
        this._drawPolygon(context, points, fillColor, "#666666", 4);
    }


    _drawPolygon (context, points, fillColor, strokeColor, lineWidth) {
        context.beginPath();
        context.moveTo(points[0].x, points[0].y);
        points.forEach(point => context.lineTo(point.x, point.y));
        context.closePath();

        context.fillStyle = fillColor;
        context.fill();

        context.strokeStyle = strokeColor;
        context.lineWidth = lineWidth;
        context.stroke();
    }
}
