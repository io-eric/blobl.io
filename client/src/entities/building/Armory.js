import Building, { SelectionState } from "../Building.js";
import { BuildingDetails, BuildingTypes } from '../../network/constants.js';
import Polygon from "../Polygon.js";
import Shapes from "../../components/Shapes.js";
import ThemeManager from "../../components/managers/ThemeManager.js";

export default class Armory extends Building {
    constructor (color, position = { x: 0, y: 0 }, variant = 0, id = -1) {
        const details = BuildingDetails.ARMORY.BASIC;
        super(id, BuildingTypes.ARMORY, color, details, position, variant);
    }

    initPolygon () {
        const offset = 2;
        this.polygon = new Polygon(Shapes.getCirclePoints(this.size + offset, 16), this.position);
        this.updatePolygonRotation();
    }

    render (context, camera, deltaTime) {
        const worldPosition = this.getWorldPosition(camera);
        context.save();
        context.translate(worldPosition.x, worldPosition.y);
        super.render(context);
        context.rotate(this.angleToTarget);

        if (this.isSelected()) {
            this.renderSelection(context, this.details.range, ThemeManager.currentThemeProperties.selectionColor);
        }

        this._renderArmory(context, worldPosition);
        context.restore();
    }

    _renderArmory (context, worldPosition) {
        const { color, size, angleToTarget } = this;
        const rectSize = 20;
        // Draw the turret body (large circle)
        this._drawCircle(context, 0, 0, size, color, "#666666", 4);


        // Draw the rectangles
        context.fillStyle = "#a8a8a8"; // Color of the cannon
        this._drawRectangles(context, rectSize, size * 0.25);

        // Draw the smaller circle in the middle
        this._drawCircle(context, 0, 0, size * 0.5, "#a8a8a8", "#666666", 4);
    }

    _drawCircle (context, x, y, radius, fillColor, strokeColor, lineWidth) {
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.closePath();

        context.fillStyle = fillColor;
        context.fill();
        context.strokeStyle = strokeColor;
        context.lineWidth = lineWidth;
        context.stroke();
    }

    _drawRectangles (context, rectSize, offset) {
        const positions = [
            { x: 0, y: -rectSize - offset },
            { x: 0, y: rectSize - offset },
            { x: rectSize, y: -rectSize + offset },
            { x: -rectSize, y: -rectSize + offset }
        ];

        positions.forEach(({ x, y }) => {
            context.fillRect(x - rectSize / 2, y, rectSize, rectSize);
            context.strokeRect(x - rectSize / 2, y, rectSize, rectSize);
        });
    }
}
