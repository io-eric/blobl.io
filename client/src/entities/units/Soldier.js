import { UnitTypes, UnitVariantTypes, darkenColor, getUnitDetails } from "../../network/constants.js";
import Unit from "../Unit.js";

export default class Soldier extends Unit {
    constructor (color, position = { x: 0, y: 0 }, variant = 0, id = -1) {
        const details = getUnitDetails(UnitTypes.SOLDIER, variant);

        // Darken the color if the variant requires it
        const variantColorMap = {
            [UnitVariantTypes.SOLDIER.BASIC]: color,
            [UnitVariantTypes.SOLDIER.LIGHT_ARMOR]: darkenColor(color, 25),
        };

        const adjustedColor = variantColorMap[variant] || color;


        super(id, UnitTypes.SOLDIER, adjustedColor, details, position, variant, details);

        // Set the upgrade method based on the variant during initialization
        this.renderUpgrade = this.getUpgradeRenderMethod(variant);
    }

    getUpgradeRenderMethod (buildingVariant) {
        const variantMap = {
            [UnitVariantTypes.SOLDIER.BASIC]: this.renderBasic,
            [UnitVariantTypes.SOLDIER.LIGHT_ARMOR]: this.renderLightArmor,
        };

        const renderMethod = variantMap[buildingVariant];
        if (!renderMethod) {
            console.error("UpgradeType not defined!");
            return this.renderBasic; // Fallback to basic render
        }
        return renderMethod.bind(this); // Bind to ensure correct context
    }

    render (context, camera, deltaTime) {
        const worldPosition = this.getWorldPosition(camera);

        // Save the context state
        context.save();

        super.render(context, camera, worldPosition);

        // Translate and rotate context for the soldier
        context.translate(worldPosition.x, worldPosition.y);
        context.rotate(this.rotation);

        // Render the soldier using the current upgrade method
        this.renderUpgrade(context, deltaTime);

        // Restore the context state
        context.restore();
    }

    renderBasic(context, deltaTime) {
        this.renderSoldier(context, deltaTime);
    }

    renderLightArmor(context, deltaTime) {
        this.renderSoldier(context, deltaTime);
    }

    renderSoldier (context) {
        const outerPoints = this.calculateOuterPoints();

        // Draw outer triangle
        context.beginPath();
        context.moveTo(outerPoints[0].x, outerPoints[0].y);
        for (let i = 1; i < outerPoints.length; i++) {
            context.lineTo(outerPoints[i].x, outerPoints[i].y);
        }
        context.closePath();

        // Fill and stroke the soldier
        context.fillStyle = this.color;
        context.fill();

        context.strokeStyle = "#666666";
        context.lineWidth = 4;
        context.stroke();
    }


    calculateOuterPoints () {
        const points = [];
        for (let i = 0; i < 3; i++) {
            const angle = (Math.PI * 2 / 3) * i; // No need for rotation adjustment here
            const x = this.size * Math.cos(angle);
            const y = this.size * Math.sin(angle);
            points.push({ x, y });
        }
        return points;
    }
}
