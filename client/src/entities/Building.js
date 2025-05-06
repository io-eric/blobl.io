import Renderable from "../components/Renderable.js";
import ThemeManager from "../components/managers/ThemeManager.js";

export const SelectionState = {
   NOT_SELECTED: 0,
   SELECTED: 1,
   HIGHLIGHT: 3
};

export default class Building extends Renderable {
    constructor (id, type, color, size, position, variant = 0) {
        super();
        this.id = id;
        this.type = type;
        this.color = color;
        this.position = position;
        this.size = size;
        this.targetPoint = { x: 1, y: 0 }; // Default target point
        this.angleToTarget = 0;
        this.rotationOffset = 0;
        this.variant = variant; // Store the current upgrade

        this.selectionState = SelectionState.NOT_SELECTED;

        // Fading properties
        this.isFadingOut = false;
        this.fadeDuration = 250; // Duration of fade-out in milliseconds
        this.fadeStartTime = 0;
        this.sizeIncrement = 20; // Size increment
        this.alpha = 1; // Full opacity
        this.directionX = 0; // Direction X for movement during fade-out
        this.directionY = 0; // Direction Y for movement during fade-out
    }
    
    // Initialization
    initPolygon () { }

    // Getters and Setters
    setColor (color) {
        this.color = color;
    }

    setPosition (position) {
        this.position = position;
    }

    setRotation (rotation) {
        this.angleToTarget = rotation + this.rotationOffset;
    }

    setTargetPoint (targetPoint) {
        this.targetPoint = targetPoint;
        this._updateAngleToTarget();
    }

    isSelected(){
        return this.selectionState > 0;
    }

    setSelectionState(state){
        this.selectionState = state;
    }

    _updateAngleToTarget () {
        this.angleToTarget = Math.atan2(this.targetPoint.y - this.position.y, this.targetPoint.x - this.position.x) + this.rotationOffset;
    }

    setUpgrade (buildingVariant) {
        this.variant = buildingVariant;
        this.details = getBuildingDetails(this.type, variant);
    }

    // Utility Methods
    getWorldPosition (camera) {
        return {
            x: this.position.x - camera.x,
            y: this.position.y - camera.y
        };
    }

    markForRemoval () {
        if (!this.isFadingOut) {
            this.isFadingOut = true;
            this.fadeStartTime = Date.now();
        }
    }

    // Update Methods
    updatePolygonTransform () {
        if (!this.polygon) return; // Only client buildings have polygons
        // With "this.position" its not relative to the camera... 
        // so its moving with the camera, but here its not a problem,
        // the positions of each polygon are still correctly relative to each other 
        // -> Use worldPosition when position should be fixed
        this.polygon.setCenter(this.position);
        const angleToTarget = Math.atan2(this.targetPoint.y - this.position.y, this.targetPoint.x - this.position.x) + this.rotationOffset;
        this.polygon.setRotation(angleToTarget);
    }

    updatePolygonRotation () {
        if (!this.polygon) return;
        const angleToTarget = Math.atan2(this.targetPoint.y - this.position.y, this.targetPoint.x - this.position.x) + this.rotationOffset;
        this.polygon.setRotation(angleToTarget);
    }

    update (deltaTime) {
        if (this.isFadingOut) {
            const elapsed = Date.now() - this.fadeStartTime;
            this.alpha = 1 - (elapsed / this.fadeDuration);
            this.scale = 1 - (elapsed / this.fadeDuration); // Gradually decrease scale

            if (elapsed >= this.fadeDuration) {
                this.alpha = 0;
                return true; // Remove
            }
        }

        return false; // Do not remove building yet
    }

    renderSelection (context, range = 0, color, forceHighlight = false) {
        const shadowSize = 50;
        context.fillStyle = color;

        // Draw circular shadow
        context.beginPath();
        context.arc(0, 0, shadowSize, 0, Math.PI * 2);
        context.fill();

        if (range > 0 && (this.selectionState === SelectionState.HIGHLIGHT || forceHighlight)) {
            const lineWidth = 2;
    
            context.strokeStyle = ThemeManager.currentThemeProperties.selectionColor;
            context.beginPath();
            context.arc(0, 0, range - lineWidth / 2, 0, 2 * Math.PI);
            context.lineWidth = lineWidth;
            context.stroke();
            context.closePath();
        }
    }

    render (context) {
        context.globalAlpha = this.alpha;
        context.scale(this.scale, this.scale);
    }
}