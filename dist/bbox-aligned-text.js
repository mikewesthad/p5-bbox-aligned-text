(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.BboxAlignedText = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = BboxAlignedText;

/**
 * Creates a new BboxAlignedText object - a text object that can be drawn with
 * anchor points based on a tight bounding box around the text.
 * @constructor
 * @param {object} font               p5.Font object
 * @param {string} text               String to display
 * @param {number} [fontSize=12]      Font size to use for string
 * @param {object} [pInstance=window] Reference to p5 instance, leave blank if
 *                                    sketch is global
 * @example
 * var font, bboxText;
 * function preload() {
 *     font = loadFont("./assets/Regular.ttf");
 * }
 * function setup() {
 *     createCanvas(400, 600);
 *     background(0);
 *     
 *     bboxText = new BboxAlignedText(font, "Hey!", 30);    
 *     bboxText.setRotation(PI / 4);
 *     bboxText.setAnchor(BboxAlignedText.ALIGN.CENTER, 
 *                        BboxAlignedText.BASELINE.CENTER);
 *     
 *     fill("#00A8EA");
 *     noStroke();
 *     bboxText.draw(width / 2, height / 2, true);
 * }
 */
function BboxAlignedText(font, text, fontSize, pInstance) {
    this._font = font;
    this._text = text;
    this._fontSize = (fontSize !== undefined) ? fontSize : 12;
    this.p = pInstance || window; // If instance is omitted, assume global scope
    this._rotation = 0;
    this._hAlign = BboxAlignedText.ALIGN.CENTER;
    this._vAlign = BboxAlignedText.BASELINE.CENTER;
    this._calculateMetrics(true);
}

/**
 * Vertical alignment values
 * @public
 * @static
 * @readonly
 * @enum {string}
 */
BboxAlignedText.ALIGN = {
    /** Draw from the left of the bbox */
    LEFT: "left",
    /** Draw from the center of the bbox */
    CENTER: "center",
    /** Draw from the right of the bbox */
    RIGHT: "right"
};

/**
 * Baseline alignment values
 * @public
 * @static
 * @readonly
 * @enum {string}
 */
BboxAlignedText.BASELINE = {
    /** Draw from the top of the bbox */
    BOX_TOP: "top",
    /** Draw from the center of the bbox */
    BOX_CENTER: "center",
    /** Draw from the bottom of the bbox */
    BOM_BOTTOM: "bottom",
    /** 
     * Draw from half the height of the font. Specifically the height is
     * calculated as: ascent + descent.
     */
    FONT_CENTER: "font_center",
    /** Draw from the the normal font baseline */
    ALPHABETIC: "alphabetic"
};

/**
 * Set current text
 * @public
 * @param {string} string Text string to display
 */
BboxAlignedText.prototype.setText = function(string) {
    this._text = string;
    this._calculateMetrics(false);
};

/**
 * Set current text size
 * @public
 * @param {number} fontSize Text size
 */
BboxAlignedText.prototype.setTextSize = function(fontSize) {
    this._fontSize = fontSize;
    this._calculateMetrics(true);
};

/**
 * Set rotation of text
 * @public
 * @param {number} angle Rotation in radians
 */
BboxAlignedText.prototype.setRotation = function(angle) {
    this._rotation = angle;
};

/**
 * Set anchor point for text (horizonal and vertical alignment) relative to
 * bounding box
 * @public
 * @param {string} [hAlign=CENTER] Horizonal alignment
 * @param {string} [vAlign=CENTER] Vertical baseline
 */
BboxAlignedText.prototype.setAnchor = function(hAlign, vAlign) {
    this._hAlign = hAlign || BboxAlignedText.ALIGN.CENTER;
    this._vAlign = vAlign || BboxAlignedText.BASELINE.CENTER;
};

/**
 * Get the bounding box when the text is placed at the specified coordinates.
 * Note: this is the unrotated bounding box!
 * @param  {number} x X coordinate
 * @param  {number} y Y coordinate
 * @return {object}   Returns an object with properties: x, y, w, h
 */
BboxAlignedText.prototype.getBbox = function(x, y) {
    var pos = this._calculateAlignedCoords(x, y);
    return {
        x: pos.x + this._boundsOffset.x,
        y: pos.y + this._boundsOffset.y,
        w: this.width,
        h: this.height
    };
};

/**
 * Draws the text particle with the specified style parameters
 * @public
 * @param  {number}  x                  X coordinate of text anchor
 * @param  {number}  y                  Y coordinate of text anchor
 * @param  {boolean} [drawBounds=false] Flag for drawing bounding box
 */
BboxAlignedText.prototype.draw = function(x, y, drawBounds) {
    drawBounds = drawBounds || false;
    var pos = {
        x: (x !== undefined) ? x : 0, 
        y: (y !== undefined) ? y : 0
    };

    this.p.push();

        if (this._rotation) {
            pos = this._calculateRotatedCoords(pos.x, pos.y, this._rotation);
            this.p.rotate(this._rotation);
        }

        pos = this._calculateAlignedCoords(pos.x, pos.y);

        this.p.textAlign(this.p.LEFT, this.p.BASELINE);
        this.p.textFont(this._font);
        this.p.textSize(this._fontSize);
        this.p.text(this._text, pos.x, pos.y);

        if (drawBounds) {
            this.p.stroke(200);
            var boundsX = pos.x + this._boundsOffset.x;
            var boundsY = pos.y + this._boundsOffset.y;
            this.p.noFill();
            this.p.rect(boundsX, boundsY, this.width, this.height);            
        }

    this.p.pop();
};

/**
 * Project the coordinates (x, y) into a rotated coordinate system
 * @private
 * @param  {number} x     X coordinate (in unrotated space)
 * @param  {number} y     Y coordinate (in unrotated space)
 * @param  {number} angle Radians of rotation to apply
 * @return {object}       Object with x & y properties
 */
BboxAlignedText.prototype._calculateRotatedCoords = function (x, y, angle) {  
    var rx = Math.cos(angle) * x + Math.cos(Math.PI / 2 - angle) * y;
    var ry = -Math.sin(angle) * x + Math.sin(Math.PI / 2 - angle) * y;
    return {x: rx, y: ry};
};

/**
 * Calculates draw coordinates for the text, aligning based on the bounding box.
 * The text is eventually drawn with canvas alignment set to left & baseline, so
 * this function takes a desired pos & alignment and returns the appropriate
 * coordinates for the left & baseline.
 * @private
 * @param  {number} x      X coordinate
 * @param  {number} y      Y coordinate
 * @return {object}        Object with x & y properties
 */
BboxAlignedText.prototype._calculateAlignedCoords = function(x, y) {
    var newX, newY;
    switch (this._hAlign) {
        case BboxAlignedText.ALIGN.LEFT:
            newX = x;
            break;
        case BboxAlignedText.ALIGN.CENTER:
            newX = x - this.halfWidth;
            break;
        case BboxAlignedText.ALIGN.RIGHT:
            newX = x - this.width;
            break;
        default:
            newX = x;
            console.log("Unrecognized horizonal align:", this._hAlign);
            break;
    }
    switch (this._vAlign) {
        case BboxAlignedText.BASELINE.TOP:
            newY = y - this._boundsOffset.y;
            break;
        case BboxAlignedText.BASELINE.CENTER:
            newY = y + this._distBaseToMid;
            break;
        case BboxAlignedText.BASELINE.BOTTOM:
            newY = y - this._distBaseToBottom;
            break;
        case BboxAlignedText.BASELINE.FONT_CENTER:
            // Height is approximated as ascent + descent
            newY = y - this._descent + (this._ascent + this._descent) / 2;
            break;
        case BboxAlignedText.BASELINE.ALPHABETIC:
            newY = y;
            break;
        default:
            newY = y;
            console.log("Unrecognized vertical align:", this._vAlign);
            break;
    }
    return {x: newX, y: newY};
};


/**
 * Calculates bounding box and various metrics for the current text and font
 * @private
 */
BboxAlignedText.prototype._calculateMetrics = function(shouldUpdateHeight) {  
    // p5 0.5.0 has a bug - text bounds are clipped by (0, 0)
    // Calculating bounds hack
    var bounds = this._font.textBounds(this._text, 1000, 1000, this._fontSize);
    bounds.x -= 1000;
    bounds.y -= 1000;

    if (shouldUpdateHeight) {
        this._ascent = this._font._textAscent(this._fontSize);
        this._descent = this._font._textDescent(this._fontSize);
    }

    // Use bounds to calculate font metrics
    this.width = bounds.w;
    this.height = bounds.h;
    this.halfWidth = this.width / 2;
    this.halfHeight = this.height / 2;
    this._boundsOffset = {x: bounds.x, y: bounds.y};
    this._distBaseToMid = Math.abs(bounds.y) - this.halfHeight;
    this._distBaseToBottom = this.height - Math.abs(bounds.y);
};
},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvYmJveC1hbGlnbmVkLXRleHQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIm1vZHVsZS5leHBvcnRzID0gQmJveEFsaWduZWRUZXh0O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSBuZXcgQmJveEFsaWduZWRUZXh0IG9iamVjdCAtIGEgdGV4dCBvYmplY3QgdGhhdCBjYW4gYmUgZHJhd24gd2l0aFxyXG4gKiBhbmNob3IgcG9pbnRzIGJhc2VkIG9uIGEgdGlnaHQgYm91bmRpbmcgYm94IGFyb3VuZCB0aGUgdGV4dC5cclxuICogQGNvbnN0cnVjdG9yXHJcbiAqIEBwYXJhbSB7b2JqZWN0fSBmb250ICAgICAgICAgICAgICAgcDUuRm9udCBvYmplY3RcclxuICogQHBhcmFtIHtzdHJpbmd9IHRleHQgICAgICAgICAgICAgICBTdHJpbmcgdG8gZGlzcGxheVxyXG4gKiBAcGFyYW0ge251bWJlcn0gW2ZvbnRTaXplPTEyXSAgICAgIEZvbnQgc2l6ZSB0byB1c2UgZm9yIHN0cmluZ1xyXG4gKiBAcGFyYW0ge29iamVjdH0gW3BJbnN0YW5jZT13aW5kb3ddIFJlZmVyZW5jZSB0byBwNSBpbnN0YW5jZSwgbGVhdmUgYmxhbmsgaWZcclxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBza2V0Y2ggaXMgZ2xvYmFsXHJcbiAqIEBleGFtcGxlXHJcbiAqIHZhciBmb250LCBiYm94VGV4dDtcclxuICogZnVuY3Rpb24gcHJlbG9hZCgpIHtcclxuICogICAgIGZvbnQgPSBsb2FkRm9udChcIi4vYXNzZXRzL1JlZ3VsYXIudHRmXCIpO1xyXG4gKiB9XHJcbiAqIGZ1bmN0aW9uIHNldHVwKCkge1xyXG4gKiAgICAgY3JlYXRlQ2FudmFzKDQwMCwgNjAwKTtcclxuICogICAgIGJhY2tncm91bmQoMCk7XHJcbiAqICAgICBcclxuICogICAgIGJib3hUZXh0ID0gbmV3IEJib3hBbGlnbmVkVGV4dChmb250LCBcIkhleSFcIiwgMzApOyAgICBcclxuICogICAgIGJib3hUZXh0LnNldFJvdGF0aW9uKFBJIC8gNCk7XHJcbiAqICAgICBiYm94VGV4dC5zZXRBbmNob3IoQmJveEFsaWduZWRUZXh0LkFMSUdOLkNFTlRFUiwgXHJcbiAqICAgICAgICAgICAgICAgICAgICAgICAgQmJveEFsaWduZWRUZXh0LkJBU0VMSU5FLkNFTlRFUik7XHJcbiAqICAgICBcclxuICogICAgIGZpbGwoXCIjMDBBOEVBXCIpO1xyXG4gKiAgICAgbm9TdHJva2UoKTtcclxuICogICAgIGJib3hUZXh0LmRyYXcod2lkdGggLyAyLCBoZWlnaHQgLyAyLCB0cnVlKTtcclxuICogfVxyXG4gKi9cclxuZnVuY3Rpb24gQmJveEFsaWduZWRUZXh0KGZvbnQsIHRleHQsIGZvbnRTaXplLCBwSW5zdGFuY2UpIHtcclxuICAgIHRoaXMuX2ZvbnQgPSBmb250O1xyXG4gICAgdGhpcy5fdGV4dCA9IHRleHQ7XHJcbiAgICB0aGlzLl9mb250U2l6ZSA9IChmb250U2l6ZSAhPT0gdW5kZWZpbmVkKSA/IGZvbnRTaXplIDogMTI7XHJcbiAgICB0aGlzLnAgPSBwSW5zdGFuY2UgfHwgd2luZG93OyAvLyBJZiBpbnN0YW5jZSBpcyBvbWl0dGVkLCBhc3N1bWUgZ2xvYmFsIHNjb3BlXHJcbiAgICB0aGlzLl9yb3RhdGlvbiA9IDA7XHJcbiAgICB0aGlzLl9oQWxpZ24gPSBCYm94QWxpZ25lZFRleHQuQUxJR04uQ0VOVEVSO1xyXG4gICAgdGhpcy5fdkFsaWduID0gQmJveEFsaWduZWRUZXh0LkJBU0VMSU5FLkNFTlRFUjtcclxuICAgIHRoaXMuX2NhbGN1bGF0ZU1ldHJpY3ModHJ1ZSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBWZXJ0aWNhbCBhbGlnbm1lbnQgdmFsdWVzXHJcbiAqIEBwdWJsaWNcclxuICogQHN0YXRpY1xyXG4gKiBAcmVhZG9ubHlcclxuICogQGVudW0ge3N0cmluZ31cclxuICovXHJcbkJib3hBbGlnbmVkVGV4dC5BTElHTiA9IHtcclxuICAgIC8qKiBEcmF3IGZyb20gdGhlIGxlZnQgb2YgdGhlIGJib3ggKi9cclxuICAgIExFRlQ6IFwibGVmdFwiLFxyXG4gICAgLyoqIERyYXcgZnJvbSB0aGUgY2VudGVyIG9mIHRoZSBiYm94ICovXHJcbiAgICBDRU5URVI6IFwiY2VudGVyXCIsXHJcbiAgICAvKiogRHJhdyBmcm9tIHRoZSByaWdodCBvZiB0aGUgYmJveCAqL1xyXG4gICAgUklHSFQ6IFwicmlnaHRcIlxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEJhc2VsaW5lIGFsaWdubWVudCB2YWx1ZXNcclxuICogQHB1YmxpY1xyXG4gKiBAc3RhdGljXHJcbiAqIEByZWFkb25seVxyXG4gKiBAZW51bSB7c3RyaW5nfVxyXG4gKi9cclxuQmJveEFsaWduZWRUZXh0LkJBU0VMSU5FID0ge1xyXG4gICAgLyoqIERyYXcgZnJvbSB0aGUgdG9wIG9mIHRoZSBiYm94ICovXHJcbiAgICBCT1hfVE9QOiBcInRvcFwiLFxyXG4gICAgLyoqIERyYXcgZnJvbSB0aGUgY2VudGVyIG9mIHRoZSBiYm94ICovXHJcbiAgICBCT1hfQ0VOVEVSOiBcImNlbnRlclwiLFxyXG4gICAgLyoqIERyYXcgZnJvbSB0aGUgYm90dG9tIG9mIHRoZSBiYm94ICovXHJcbiAgICBCT01fQk9UVE9NOiBcImJvdHRvbVwiLFxyXG4gICAgLyoqIFxyXG4gICAgICogRHJhdyBmcm9tIGhhbGYgdGhlIGhlaWdodCBvZiB0aGUgZm9udC4gU3BlY2lmaWNhbGx5IHRoZSBoZWlnaHQgaXNcclxuICAgICAqIGNhbGN1bGF0ZWQgYXM6IGFzY2VudCArIGRlc2NlbnQuXHJcbiAgICAgKi9cclxuICAgIEZPTlRfQ0VOVEVSOiBcImZvbnRfY2VudGVyXCIsXHJcbiAgICAvKiogRHJhdyBmcm9tIHRoZSB0aGUgbm9ybWFsIGZvbnQgYmFzZWxpbmUgKi9cclxuICAgIEFMUEhBQkVUSUM6IFwiYWxwaGFiZXRpY1wiXHJcbn07XHJcblxyXG4vKipcclxuICogU2V0IGN1cnJlbnQgdGV4dFxyXG4gKiBAcHVibGljXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgVGV4dCBzdHJpbmcgdG8gZGlzcGxheVxyXG4gKi9cclxuQmJveEFsaWduZWRUZXh0LnByb3RvdHlwZS5zZXRUZXh0ID0gZnVuY3Rpb24oc3RyaW5nKSB7XHJcbiAgICB0aGlzLl90ZXh0ID0gc3RyaW5nO1xyXG4gICAgdGhpcy5fY2FsY3VsYXRlTWV0cmljcyhmYWxzZSk7XHJcbn07XHJcblxyXG4vKipcclxuICogU2V0IGN1cnJlbnQgdGV4dCBzaXplXHJcbiAqIEBwdWJsaWNcclxuICogQHBhcmFtIHtudW1iZXJ9IGZvbnRTaXplIFRleHQgc2l6ZVxyXG4gKi9cclxuQmJveEFsaWduZWRUZXh0LnByb3RvdHlwZS5zZXRUZXh0U2l6ZSA9IGZ1bmN0aW9uKGZvbnRTaXplKSB7XHJcbiAgICB0aGlzLl9mb250U2l6ZSA9IGZvbnRTaXplO1xyXG4gICAgdGhpcy5fY2FsY3VsYXRlTWV0cmljcyh0cnVlKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTZXQgcm90YXRpb24gb2YgdGV4dFxyXG4gKiBAcHVibGljXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBhbmdsZSBSb3RhdGlvbiBpbiByYWRpYW5zXHJcbiAqL1xyXG5CYm94QWxpZ25lZFRleHQucHJvdG90eXBlLnNldFJvdGF0aW9uID0gZnVuY3Rpb24oYW5nbGUpIHtcclxuICAgIHRoaXMuX3JvdGF0aW9uID0gYW5nbGU7XHJcbn07XHJcblxyXG4vKipcclxuICogU2V0IGFuY2hvciBwb2ludCBmb3IgdGV4dCAoaG9yaXpvbmFsIGFuZCB2ZXJ0aWNhbCBhbGlnbm1lbnQpIHJlbGF0aXZlIHRvXHJcbiAqIGJvdW5kaW5nIGJveFxyXG4gKiBAcHVibGljXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBbaEFsaWduPUNFTlRFUl0gSG9yaXpvbmFsIGFsaWdubWVudFxyXG4gKiBAcGFyYW0ge3N0cmluZ30gW3ZBbGlnbj1DRU5URVJdIFZlcnRpY2FsIGJhc2VsaW5lXHJcbiAqL1xyXG5CYm94QWxpZ25lZFRleHQucHJvdG90eXBlLnNldEFuY2hvciA9IGZ1bmN0aW9uKGhBbGlnbiwgdkFsaWduKSB7XHJcbiAgICB0aGlzLl9oQWxpZ24gPSBoQWxpZ24gfHwgQmJveEFsaWduZWRUZXh0LkFMSUdOLkNFTlRFUjtcclxuICAgIHRoaXMuX3ZBbGlnbiA9IHZBbGlnbiB8fCBCYm94QWxpZ25lZFRleHQuQkFTRUxJTkUuQ0VOVEVSO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEdldCB0aGUgYm91bmRpbmcgYm94IHdoZW4gdGhlIHRleHQgaXMgcGxhY2VkIGF0IHRoZSBzcGVjaWZpZWQgY29vcmRpbmF0ZXMuXHJcbiAqIE5vdGU6IHRoaXMgaXMgdGhlIHVucm90YXRlZCBib3VuZGluZyBib3ghXHJcbiAqIEBwYXJhbSAge251bWJlcn0geCBYIGNvb3JkaW5hdGVcclxuICogQHBhcmFtICB7bnVtYmVyfSB5IFkgY29vcmRpbmF0ZVxyXG4gKiBAcmV0dXJuIHtvYmplY3R9ICAgUmV0dXJucyBhbiBvYmplY3Qgd2l0aCBwcm9wZXJ0aWVzOiB4LCB5LCB3LCBoXHJcbiAqL1xyXG5CYm94QWxpZ25lZFRleHQucHJvdG90eXBlLmdldEJib3ggPSBmdW5jdGlvbih4LCB5KSB7XHJcbiAgICB2YXIgcG9zID0gdGhpcy5fY2FsY3VsYXRlQWxpZ25lZENvb3Jkcyh4LCB5KTtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgeDogcG9zLnggKyB0aGlzLl9ib3VuZHNPZmZzZXQueCxcclxuICAgICAgICB5OiBwb3MueSArIHRoaXMuX2JvdW5kc09mZnNldC55LFxyXG4gICAgICAgIHc6IHRoaXMud2lkdGgsXHJcbiAgICAgICAgaDogdGhpcy5oZWlnaHRcclxuICAgIH07XHJcbn07XHJcblxyXG4vKipcclxuICogRHJhd3MgdGhlIHRleHQgcGFydGljbGUgd2l0aCB0aGUgc3BlY2lmaWVkIHN0eWxlIHBhcmFtZXRlcnNcclxuICogQHB1YmxpY1xyXG4gKiBAcGFyYW0gIHtudW1iZXJ9ICB4ICAgICAgICAgICAgICAgICAgWCBjb29yZGluYXRlIG9mIHRleHQgYW5jaG9yXHJcbiAqIEBwYXJhbSAge251bWJlcn0gIHkgICAgICAgICAgICAgICAgICBZIGNvb3JkaW5hdGUgb2YgdGV4dCBhbmNob3JcclxuICogQHBhcmFtICB7Ym9vbGVhbn0gW2RyYXdCb3VuZHM9ZmFsc2VdIEZsYWcgZm9yIGRyYXdpbmcgYm91bmRpbmcgYm94XHJcbiAqL1xyXG5CYm94QWxpZ25lZFRleHQucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbih4LCB5LCBkcmF3Qm91bmRzKSB7XHJcbiAgICBkcmF3Qm91bmRzID0gZHJhd0JvdW5kcyB8fCBmYWxzZTtcclxuICAgIHZhciBwb3MgPSB7XHJcbiAgICAgICAgeDogKHggIT09IHVuZGVmaW5lZCkgPyB4IDogMCwgXHJcbiAgICAgICAgeTogKHkgIT09IHVuZGVmaW5lZCkgPyB5IDogMFxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnAucHVzaCgpO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5fcm90YXRpb24pIHtcclxuICAgICAgICAgICAgcG9zID0gdGhpcy5fY2FsY3VsYXRlUm90YXRlZENvb3Jkcyhwb3MueCwgcG9zLnksIHRoaXMuX3JvdGF0aW9uKTtcclxuICAgICAgICAgICAgdGhpcy5wLnJvdGF0ZSh0aGlzLl9yb3RhdGlvbik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwb3MgPSB0aGlzLl9jYWxjdWxhdGVBbGlnbmVkQ29vcmRzKHBvcy54LCBwb3MueSk7XHJcblxyXG4gICAgICAgIHRoaXMucC50ZXh0QWxpZ24odGhpcy5wLkxFRlQsIHRoaXMucC5CQVNFTElORSk7XHJcbiAgICAgICAgdGhpcy5wLnRleHRGb250KHRoaXMuX2ZvbnQpO1xyXG4gICAgICAgIHRoaXMucC50ZXh0U2l6ZSh0aGlzLl9mb250U2l6ZSk7XHJcbiAgICAgICAgdGhpcy5wLnRleHQodGhpcy5fdGV4dCwgcG9zLngsIHBvcy55KTtcclxuXHJcbiAgICAgICAgaWYgKGRyYXdCb3VuZHMpIHtcclxuICAgICAgICAgICAgdGhpcy5wLnN0cm9rZSgyMDApO1xyXG4gICAgICAgICAgICB2YXIgYm91bmRzWCA9IHBvcy54ICsgdGhpcy5fYm91bmRzT2Zmc2V0Lng7XHJcbiAgICAgICAgICAgIHZhciBib3VuZHNZID0gcG9zLnkgKyB0aGlzLl9ib3VuZHNPZmZzZXQueTtcclxuICAgICAgICAgICAgdGhpcy5wLm5vRmlsbCgpO1xyXG4gICAgICAgICAgICB0aGlzLnAucmVjdChib3VuZHNYLCBib3VuZHNZLCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7ICAgICAgICAgICAgXHJcbiAgICAgICAgfVxyXG5cclxuICAgIHRoaXMucC5wb3AoKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBQcm9qZWN0IHRoZSBjb29yZGluYXRlcyAoeCwgeSkgaW50byBhIHJvdGF0ZWQgY29vcmRpbmF0ZSBzeXN0ZW1cclxuICogQHByaXZhdGVcclxuICogQHBhcmFtICB7bnVtYmVyfSB4ICAgICBYIGNvb3JkaW5hdGUgKGluIHVucm90YXRlZCBzcGFjZSlcclxuICogQHBhcmFtICB7bnVtYmVyfSB5ICAgICBZIGNvb3JkaW5hdGUgKGluIHVucm90YXRlZCBzcGFjZSlcclxuICogQHBhcmFtICB7bnVtYmVyfSBhbmdsZSBSYWRpYW5zIG9mIHJvdGF0aW9uIHRvIGFwcGx5XHJcbiAqIEByZXR1cm4ge29iamVjdH0gICAgICAgT2JqZWN0IHdpdGggeCAmIHkgcHJvcGVydGllc1xyXG4gKi9cclxuQmJveEFsaWduZWRUZXh0LnByb3RvdHlwZS5fY2FsY3VsYXRlUm90YXRlZENvb3JkcyA9IGZ1bmN0aW9uICh4LCB5LCBhbmdsZSkgeyAgXHJcbiAgICB2YXIgcnggPSBNYXRoLmNvcyhhbmdsZSkgKiB4ICsgTWF0aC5jb3MoTWF0aC5QSSAvIDIgLSBhbmdsZSkgKiB5O1xyXG4gICAgdmFyIHJ5ID0gLU1hdGguc2luKGFuZ2xlKSAqIHggKyBNYXRoLnNpbihNYXRoLlBJIC8gMiAtIGFuZ2xlKSAqIHk7XHJcbiAgICByZXR1cm4ge3g6IHJ4LCB5OiByeX07XHJcbn07XHJcblxyXG4vKipcclxuICogQ2FsY3VsYXRlcyBkcmF3IGNvb3JkaW5hdGVzIGZvciB0aGUgdGV4dCwgYWxpZ25pbmcgYmFzZWQgb24gdGhlIGJvdW5kaW5nIGJveC5cclxuICogVGhlIHRleHQgaXMgZXZlbnR1YWxseSBkcmF3biB3aXRoIGNhbnZhcyBhbGlnbm1lbnQgc2V0IHRvIGxlZnQgJiBiYXNlbGluZSwgc29cclxuICogdGhpcyBmdW5jdGlvbiB0YWtlcyBhIGRlc2lyZWQgcG9zICYgYWxpZ25tZW50IGFuZCByZXR1cm5zIHRoZSBhcHByb3ByaWF0ZVxyXG4gKiBjb29yZGluYXRlcyBmb3IgdGhlIGxlZnQgJiBiYXNlbGluZS5cclxuICogQHByaXZhdGVcclxuICogQHBhcmFtICB7bnVtYmVyfSB4ICAgICAgWCBjb29yZGluYXRlXHJcbiAqIEBwYXJhbSAge251bWJlcn0geSAgICAgIFkgY29vcmRpbmF0ZVxyXG4gKiBAcmV0dXJuIHtvYmplY3R9ICAgICAgICBPYmplY3Qgd2l0aCB4ICYgeSBwcm9wZXJ0aWVzXHJcbiAqL1xyXG5CYm94QWxpZ25lZFRleHQucHJvdG90eXBlLl9jYWxjdWxhdGVBbGlnbmVkQ29vcmRzID0gZnVuY3Rpb24oeCwgeSkge1xyXG4gICAgdmFyIG5ld1gsIG5ld1k7XHJcbiAgICBzd2l0Y2ggKHRoaXMuX2hBbGlnbikge1xyXG4gICAgICAgIGNhc2UgQmJveEFsaWduZWRUZXh0LkFMSUdOLkxFRlQ6XHJcbiAgICAgICAgICAgIG5ld1ggPSB4O1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIEJib3hBbGlnbmVkVGV4dC5BTElHTi5DRU5URVI6XHJcbiAgICAgICAgICAgIG5ld1ggPSB4IC0gdGhpcy5oYWxmV2lkdGg7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgQmJveEFsaWduZWRUZXh0LkFMSUdOLlJJR0hUOlxyXG4gICAgICAgICAgICBuZXdYID0geCAtIHRoaXMud2lkdGg7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIG5ld1ggPSB4O1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIlVucmVjb2duaXplZCBob3Jpem9uYWwgYWxpZ246XCIsIHRoaXMuX2hBbGlnbik7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG4gICAgc3dpdGNoICh0aGlzLl92QWxpZ24pIHtcclxuICAgICAgICBjYXNlIEJib3hBbGlnbmVkVGV4dC5CQVNFTElORS5UT1A6XHJcbiAgICAgICAgICAgIG5ld1kgPSB5IC0gdGhpcy5fYm91bmRzT2Zmc2V0Lnk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgQmJveEFsaWduZWRUZXh0LkJBU0VMSU5FLkNFTlRFUjpcclxuICAgICAgICAgICAgbmV3WSA9IHkgKyB0aGlzLl9kaXN0QmFzZVRvTWlkO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIEJib3hBbGlnbmVkVGV4dC5CQVNFTElORS5CT1RUT006XHJcbiAgICAgICAgICAgIG5ld1kgPSB5IC0gdGhpcy5fZGlzdEJhc2VUb0JvdHRvbTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBCYm94QWxpZ25lZFRleHQuQkFTRUxJTkUuRk9OVF9DRU5URVI6XHJcbiAgICAgICAgICAgIC8vIEhlaWdodCBpcyBhcHByb3hpbWF0ZWQgYXMgYXNjZW50ICsgZGVzY2VudFxyXG4gICAgICAgICAgICBuZXdZID0geSAtIHRoaXMuX2Rlc2NlbnQgKyAodGhpcy5fYXNjZW50ICsgdGhpcy5fZGVzY2VudCkgLyAyO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIEJib3hBbGlnbmVkVGV4dC5CQVNFTElORS5BTFBIQUJFVElDOlxyXG4gICAgICAgICAgICBuZXdZID0geTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgbmV3WSA9IHk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVW5yZWNvZ25pemVkIHZlcnRpY2FsIGFsaWduOlwiLCB0aGlzLl92QWxpZ24pO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgIH1cclxuICAgIHJldHVybiB7eDogbmV3WCwgeTogbmV3WX07XHJcbn07XHJcblxyXG5cclxuLyoqXHJcbiAqIENhbGN1bGF0ZXMgYm91bmRpbmcgYm94IGFuZCB2YXJpb3VzIG1ldHJpY3MgZm9yIHRoZSBjdXJyZW50IHRleHQgYW5kIGZvbnRcclxuICogQHByaXZhdGVcclxuICovXHJcbkJib3hBbGlnbmVkVGV4dC5wcm90b3R5cGUuX2NhbGN1bGF0ZU1ldHJpY3MgPSBmdW5jdGlvbihzaG91bGRVcGRhdGVIZWlnaHQpIHsgIFxyXG4gICAgLy8gcDUgMC41LjAgaGFzIGEgYnVnIC0gdGV4dCBib3VuZHMgYXJlIGNsaXBwZWQgYnkgKDAsIDApXHJcbiAgICAvLyBDYWxjdWxhdGluZyBib3VuZHMgaGFja1xyXG4gICAgdmFyIGJvdW5kcyA9IHRoaXMuX2ZvbnQudGV4dEJvdW5kcyh0aGlzLl90ZXh0LCAxMDAwLCAxMDAwLCB0aGlzLl9mb250U2l6ZSk7XHJcbiAgICBib3VuZHMueCAtPSAxMDAwO1xyXG4gICAgYm91bmRzLnkgLT0gMTAwMDtcclxuXHJcbiAgICBpZiAoc2hvdWxkVXBkYXRlSGVpZ2h0KSB7XHJcbiAgICAgICAgdGhpcy5fYXNjZW50ID0gdGhpcy5fZm9udC5fdGV4dEFzY2VudCh0aGlzLl9mb250U2l6ZSk7XHJcbiAgICAgICAgdGhpcy5fZGVzY2VudCA9IHRoaXMuX2ZvbnQuX3RleHREZXNjZW50KHRoaXMuX2ZvbnRTaXplKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBVc2UgYm91bmRzIHRvIGNhbGN1bGF0ZSBmb250IG1ldHJpY3NcclxuICAgIHRoaXMud2lkdGggPSBib3VuZHMudztcclxuICAgIHRoaXMuaGVpZ2h0ID0gYm91bmRzLmg7XHJcbiAgICB0aGlzLmhhbGZXaWR0aCA9IHRoaXMud2lkdGggLyAyO1xyXG4gICAgdGhpcy5oYWxmSGVpZ2h0ID0gdGhpcy5oZWlnaHQgLyAyO1xyXG4gICAgdGhpcy5fYm91bmRzT2Zmc2V0ID0ge3g6IGJvdW5kcy54LCB5OiBib3VuZHMueX07XHJcbiAgICB0aGlzLl9kaXN0QmFzZVRvTWlkID0gTWF0aC5hYnMoYm91bmRzLnkpIC0gdGhpcy5oYWxmSGVpZ2h0O1xyXG4gICAgdGhpcy5fZGlzdEJhc2VUb0JvdHRvbSA9IHRoaXMuaGVpZ2h0IC0gTWF0aC5hYnMoYm91bmRzLnkpO1xyXG59OyJdfQ==
