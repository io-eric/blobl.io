import {UnitTypes, UnitVariantTypes, darkenColor, getUnitBulletDetails, getUnitDetails } from "../../network/constants.js";
import Unit from "../Unit.js";

export default class SiegeTank extends Unit {
    constructor (color, position = { x: 0, y: 0 }, variant = 0, id = -1) {
        const details = getUnitDetails(UnitTypes.SIEGE_TANK, variant);
        // Darken the color if the variant requires it
        const variantColorMap = {
            [UnitVariantTypes.SIEGE_TANK.BASIC]: color,
            [UnitVariantTypes.SIEGE_TANK.HEAVY_ARMOR]: darkenColor(color, 25),
            [UnitVariantTypes.SIEGE_TANK.BOOSTER_ENGINE]: color,
            [UnitVariantTypes.SIEGE_TANK.CANNON]: darkenColor(color, 25),
            [UnitVariantTypes.SIEGE_TANK.HEAVY_ARMOR_BOOSTER_ENGINE]: darkenColor(color, 15),
            [UnitVariantTypes.SIEGE_TANK.BOOSTER_ENGINE_CANNON_SIEGE_TANK]: color
        };

        const adjustedColor = variantColorMap[variant] || color;

        super(id, UnitTypes.SIEGE_TANK, adjustedColor, details, position, variant, details);

        this.flameAnimationTime = 0; // Time tracker for flame animation

        this.recoil = 0; // Initial recoil state
        this.maxRecoil = 6; // Maximum recoil distance
        this.recoilDecay = 0.05; // Speed of recoil decay
        this.cannonRotationOffset = Math.PI / 2;
        this.cannonAngleToTarget = this.cannonRotationOffset;

        // Timestamp for last cannon target update
        this.targetUpdateThreshold = 1600; // Time threshold in milliseconds
        this.lastCannonTargetUpdate = this.targetUpdateThreshold;


        // Set the upgrade method based on the variant during initialization
        this.renderUpgrade = this.getUpgradeRenderMethod(variant);

        this._updateBulletDetails();
    }

    _updateBulletDetails () {
        this.bulletDetails = getUnitBulletDetails(UnitTypes.SIEGE_TANK, this.variant);
    }

    getUpgradeRenderMethod (variant) {
        const variantMap = {
            [UnitVariantTypes.SIEGE_TANK.BASIC]: this.renderBasic,
            [UnitVariantTypes.SIEGE_TANK.CANNON]: this.renderCannon,
            [UnitVariantTypes.SIEGE_TANK.HEAVY_ARMOR]: this.renderHeavyArmor,
            [UnitVariantTypes.SIEGE_TANK.BOOSTER_ENGINE]: this.renderBoosterEngine,
            [UnitVariantTypes.SIEGE_TANK.HEAVY_ARMOR_BOOSTER_ENGINE]: this.renderBoosterEngine,
            [UnitVariantTypes.SIEGE_TANK.BOOSTER_ENGINE_CANNON]: this.renderBoosterEngineCannon,
        };

        const renderMethod = variantMap[variant];
        if (!renderMethod) {
            console.error("UpgradeType not defined!");
            return this.renderBasic; // Fallback to basic render
        }
        return renderMethod.bind(this); // Bind to ensure correct context
    }


    triggerRecoil () {
        this.recoil = this.maxRecoil;
    }

    setCannonTargetPoint (targetPoint) {
        // Calculate the vector from the targetPosition to the targetPoint
        const dx = targetPoint.x - this.targetPosition.x;
        const dy = targetPoint.y - this.targetPosition.y;

        // Scale the vector to make the target point further away
        const scaleFactor = 2;
        const extendedTargetPoint = {
            x: this.targetPosition.x + dx * scaleFactor,
            y: this.targetPosition.y + dy * scaleFactor
        };

        // Update cannon rotation to point to the extended target point
        this.cannonAngleToTarget = Math.atan2(
            extendedTargetPoint.y - this.targetPosition.y,
            extendedTargetPoint.x - this.targetPosition.x
        ) + this.cannonRotationOffset;

        // Reset the cannon target update timer
        this.lastCannonTargetUpdate = 0;
    }


    update (deltaTime) {
        if (this.lastCannonTargetUpdate < this.targetUpdateThreshold) {
            // Increment the elapsed time for the cannon target update
            this.lastCannonTargetUpdate += deltaTime
        }

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

        // Save the context state
        context.save();

        super.render(context, camera, worldPosition);

        // Translate and rotate context for the tank
        context.translate(worldPosition.x, worldPosition.y);
        context.rotate(this.rotation);

        // Render the tank using the current upgrade method
        this.renderUpgrade(context, deltaTime);

        // Restore the context state
        context.restore();
    }

    renderBasic (context, deltaTime) {
        this.renderSiegeTank(context, deltaTime);
    }

    renderCannon (context, deltaTime) {
        this.renderSiegeTank(context, deltaTime);
        // Additional rendering for cannon upgrade
        this.renderCannonBarrel(context, deltaTime);
    }

    renderHeavyArmor (context, deltaTime) {
        this.renderSiegeTank(context);
    }

    renderBoosterEngine (context, deltaTime) {
        // Additional rendering for booster engine upgrade
        this.renderBooster(context, deltaTime);
        this.renderSiegeTank(context, deltaTime);
    }

    renderBoosterEngineCannon(context, deltaTime) {
        // Additional rendering for booster engine upgrade
        this.renderBooster(context, deltaTime);
        this.renderSiegeTank(context, deltaTime);
        this.renderCannonBarrel(context, deltaTime);
    }

    renderSiegeTank (context, deltaTime) {
        // Draw the outer triangle
        this.drawTriangle(context, this.size, this.color, "#666666", 4);

        // Draw the inner triangle
        const innerSize = this.size * 0.5;  // Adjust size for inner triangle
        this.drawTriangle(context, innerSize, "#a8a8a8", "#666666", 4);
    }

    renderCannonBarrel (context, deltaTime) {
        // Calculate the rotation angle just once
        const angleToUse = (this.lastCannonTargetUpdate < this.targetUpdateThreshold)
            ? this.cannonAngleToTarget - this.rotation
            : this.cannonRotationOffset;

        // Rotate the context with the pre-calculated angle
        context.rotate(angleToUse);
        
        const recoilOffset = this.recoil;
        const cannonWidth = this.size * 0.5;
        const cannonLength = this.size * 0.45;

        // Draw the rectangle (cannon) with recoil effect
        context.fillStyle = "#a8a8a8"; // Color of the cannon
        context.fillRect(-cannonWidth / 2, recoilOffset - cannonLength - this.size * 0.2, cannonWidth, cannonLength);

        // Draw a border around the cannon
        context.strokeStyle = "#666666";
        context.lineWidth = 4;
        context.strokeRect(-cannonWidth / 2, recoilOffset - cannonLength - this.size * 0.2, cannonWidth, cannonLength);


        // Draw the smaller circle in the middle
        context.beginPath();
        context.arc(0, 0, this.size * 0.3, 0, Math.PI * 2);
        context.closePath();
        context.fillStyle = "#a8a8a8"; // Color of the smaller circle
        context.fill();
        context.strokeStyle = "#666666";
        context.lineWidth = 4;
        context.stroke();
    }

    renderBooster (context, deltaTime) {
        // Save context state for the booster
        context.save();

        // Translate to the position where the booster should be, behind the tank
        context.translate(-this.size / 5, 0); // Move booster to the back of the tank

        // Render the flame only if the tank has reached its target position
        if (!this.hasReachedTarget(5)) {
            this.renderFlame(context, deltaTime);
        }
        // Draw the booster
        context.fillStyle = "#a4a4a4";
        context.beginPath();
        context.moveTo(-this.size / 2, -this.size / 1.6);  // Top left corner
        context.lineTo(this.size / 10, -this.size / 2.5);  // Top right corner
        context.lineTo(this.size / 10, this.size / 2.5);   // Bottom right corner
        context.lineTo(-this.size / 2, this.size / 1.6);   // Bottom left corner
        context.closePath();
        context.fill();

        context.strokeStyle = "#666666";
        context.lineWidth = 4;
        context.stroke();

        // Restore context state after rendering the booster
        context.restore();
    }

    renderFlame (context, deltaTime) {
        // Increment the flame animation time
        this.flameAnimationTime += deltaTime * 100;

        // Calculate the flame size using a sine wave for smooth scaling
        const flameScale = 1 + Math.sin(this.flameAnimationTime) * 1.6;

        // Draw the animated red rectangle (flame)
        const flameWidth = (this.size / 5) * flameScale;
        const flameHeight = -this.size / 3;

        context.fillStyle = "red";
        context.beginPath();
        context.rect(-this.size, -flameHeight / 2, flameWidth, flameHeight); // Position flame behind the tank
        context.fill();
    }

    drawTriangle (context, size, fillColor, strokeColor, lineWidth) {
        const outerPoints = this.calculateOuterPoints(size);
        context.beginPath();
        context.moveTo(outerPoints[0].x, outerPoints[0].y);
        for (let i = 1; i < outerPoints.length; i++) {
            context.lineTo(outerPoints[i].x, outerPoints[i].y);
        }
        context.closePath();

        context.fillStyle = fillColor;
        context.fill();

        context.strokeStyle = strokeColor;
        context.lineWidth = lineWidth;
        context.stroke();
    }

    calculateOuterPoints (size) {
        const points = [];
        for (let i = 0; i < 3; i++) {
            const angle = (Math.PI * 2 / 3) * i;
            const x = size * Math.cos(angle);
            const y = size * Math.sin(angle);
            points.push({ x, y });
        }
        return points;
    }
}
