import Shapes from "../../components/Shapes.js";
import { UnitDetails, UnitTypes, UnitVariantTypes, darkenColor, getUnitBulletDetails, getUnitDetails } from "../../network/constants.js";
import Unit from "../Unit.js";


export default class TriCommander extends Unit {
    constructor (color, position = { x: 0, y: 0 }, variant = 0, id = -1) {
        const details = getUnitDetails(UnitTypes.TRI_COMMANDER, variant);

        super(id, UnitTypes.TRI_COMMANDER, color, details, position, variant, details);

        this.flameAnimationTime = 0; // Time tracker for flame animation

        this.recoil = 0; // Initial recoil state
        this.maxRecoil = 6; // Maximum recoil distance
        this.recoilDecay = 0.05; // Speed of recoil decay
        this.cannonRotationOffset = 0;
        this.cannonAngleToTarget = this.cannonRotationOffset;
        // Timestamp for last cannon target update
        this.targetUpdateThreshold = 2100; // Time threshold in milliseconds
        this.lastCannonTargetUpdate = this.targetUpdateThreshold;

        this.points = Shapes.generateSpikePoints(this.size, 12);

        this._updateBulletDetails();
    }

    _updateBulletDetails () {
        this.bulletDetails = getUnitBulletDetails(UnitTypes.ANTI_TANK_COMMANDER, this.variant);
    }

    triggerRecoil () {
        this.recoil = this.maxRecoil;
    }

    setCannonTargetPoint (targetPoint) {
        // Update cannon rotation
        this.cannonAngleToTarget = Math.atan2(targetPoint.y - this.position.y, targetPoint.x - this.position.x) + this.cannonRotationOffset;

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

    renderCannonBarrel (context, deltaTime, angleOffset) {
        // Apply rotation for the cannon angle with the specified offset
        if (this.lastCannonTargetUpdate < this.targetUpdateThreshold) {
            context.rotate(this.cannonAngleToTarget + angleOffset - this.rotation);
        } else {
            context.rotate(this.cannonRotationOffset + angleOffset);
        }

        const recoilOffset = this.recoil;
        const cannonWidth = this.size * 0.5;
        const cannonLength = this.size * 0.65;

        // Draw the rectangle (cannon) with recoil effect
        context.fillStyle = "#a8a8a8"; // Color of the cannon
        context.fillRect(-cannonWidth / 2, recoilOffset - cannonLength * 2 - this.size * 0.2, cannonWidth, cannonLength);

        // Draw a border around the cannon
        context.strokeStyle = "#666666";
        context.lineWidth = 4;
        context.strokeRect(-cannonWidth / 2, recoilOffset - cannonLength * 2 - this.size * 0.2, cannonWidth, cannonLength);

        // Draw the smaller circle in the middle
        context.beginPath();
        context.arc(-cannonWidth / 2 + 10, -cannonLength * 2 + 20, this.size * 0.35, 0, Math.PI * 2);
        context.closePath();
        context.fillStyle = "#a8a8a8"; // Color of the smaller circle
        context.fill();
        context.strokeStyle = "#666666";
        context.lineWidth = 4;
        context.stroke();
    }


    render (context, camera, deltaTime) {
        const worldPosition = this.getWorldPosition(camera);

        // Save the context state
        context.save();

        super.render(context, camera, worldPosition);

        // Translate and rotate context for the tank
        context.translate(worldPosition.x, worldPosition.y);
        context.rotate(this.rotation + this.rotationOffset);

        // Draw three cannons around the tank
        const cannonOffsets = [0, Math.PI * 2 / 3, Math.PI * 4 / 3]; // Spread 3 cannons evenly

        cannonOffsets.forEach(offset => {
            context.save();  // Save state for each cannon rotation
            this.renderCannonBarrel(context, deltaTime, offset);
            context.restore();  // Restore state to draw the next cannon at the correct position
        });

        // Draw body
        context.beginPath();
        context.moveTo(this.points.x, this.points.y);
        this.points.forEach(point => context.lineTo(point.x, point.y));
        context.closePath();

        context.fillStyle = this.color;
        context.fill();

        context.strokeStyle = "#666666";
        context.lineWidth = 4;
        context.stroke();



        // Restore the context state
        context.restore();
    }

}
