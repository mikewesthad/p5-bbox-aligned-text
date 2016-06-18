(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.BboxAlignedText = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var utils = require("./utils.js");

module.exports = BboxAlignedText;

/**
 * Creates a new BboxAlignedText object - a text object that can be drawn with
 * anchor points based on a tight bounding box around the text.
 * @constructor
 * @param {object} font - p5.Font object
 * @param {string} text - String to display
 * @param {number} [fontSize=12] - Font size to use for string
 * @param {number} [x=0] - Initial x location
 * @param {number} [y=0] - Initial y location
 * @param {object} [pInstance=window] - Reference to p5 instance, leave blank if
 *                                      sketch is global
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
 *     bboxText.setAnchor(BboxAlignedText.ALIGN.BOX_CENTER, 
 *                        BboxAlignedText.BASELINE.BOX_CENTER);
 *     
 *     fill("#00A8EA");
 *     noStroke();
 *     bboxText.draw(width / 2, height / 2);
 * }
 */
function BboxAlignedText(font, text, fontSize, x, y, pInstance) {
    this._font = font;
    this._text = text;
    this._x = utils.default(x, 0);
    this._y = utils.default(y, 0);
    this._fontSize = utils.default(fontSize, 12);
    this._p = utils.default(pInstance, window);
    this._rotation = 0;
    this._hAlign = BboxAlignedText.ALIGN.BOX_CENTER;
    this._vAlign = BboxAlignedText.BASELINE.BOX_CENTER;
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
    BOX_LEFT: "box_left",
    /** Draw from the center of the bbox */
    BOX_CENTER: "box_center",
    /** Draw from the right of the bbox */
    BOX_RIGHT: "box_right"
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
    BOX_TOP: "box_top",
    /** Draw from the center of the bbox */
    BOX_CENTER: "box_center",
    /** Draw from the bottom of the bbox */
    BOX_BOTTOM: "box_bottom",
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
 * @param {string} string - Text string to display
 * @returns {this} Useful for chaining
 */
BboxAlignedText.prototype.setText = function(string) {
    this._text = string;
    this._calculateMetrics(false);
    return this;
};

/**
 * Set the text position
 * @public
 * @param {number} x - X position
 * @param {number} x - Y position
 * @returns {this} Useful for chaining
 */
BboxAlignedText.prototype.setPosition = function(x, y) {
    this._x = utils.default(x, this._x);
    this._y = utils.default(y, this._y);
    return this;
};

/**
 * Get the text position
 * @public
 * @return {object} Returns an object with properties: x, y
 */
BboxAlignedText.prototype.getPosition = function() {
    return {
        x: this._x,
        y: this._y
    };
};

/**
 * Set current text size
 * @public
 * @param {number} fontSize Text size
 * @returns {this} Useful for chaining
 */
BboxAlignedText.prototype.setTextSize = function(fontSize) {
    this._fontSize = fontSize;
    this._calculateMetrics(true);
    return this;
};

/**
 * Set rotation of text
 * @public
 * @param {number} angle - Rotation in radians
 * @returns {this} Useful for chaining
 */
BboxAlignedText.prototype.setRotation = function(angle) {
    this._rotation = utils.default(angle, this._rotation);
    return this;
};

/**
 * Get rotation of text
 * @public
 * @returns {number} Rotation in radians
 */
BboxAlignedText.prototype.getRotation = function(angle) {
    return this._rotation;
};

/**
 * Set the p instance that is used for drawing
 * @public
 * @param {object} pInstance - Instance of p5 for drawing. This is only needed
 *                             when using an offscreen renderer or when using p5
 *                             in instance mode.
 * @returns {this} Useful for chaining
 */
BboxAlignedText.prototype.setPInstance = function(p) {
    this._p = utils.default(p, this._p);
    return this;
};

/**
 * Get rotation of text
 * @public
 * @returns {object} Instance of p5 that is being used for drawing
 */
BboxAlignedText.prototype.getPInstance = function() {
    return this._p;
};

/**
 * Set anchor point for text (horizonal and vertical alignment) relative to
 * bounding box
 * @public
 * @param {string} [hAlign=CENTER] - Horizonal alignment
 * @param {string} [vAlign=CENTER] - Vertical baseline
 * @param {boolean} [updatePosition=false] - If set to true, the position of the
 *                                           the text will be shifted so that
 *                                           the text will be drawn in the same
 *                                           place it was before calling 
 *                                           setAnchor.
 * @returns {this} Useful for chaining
 */
BboxAlignedText.prototype.setAnchor = function(hAlign, vAlign, updatePosition) {
    var oldPos = this._calculateAlignedCoords(this._x, this._y);
    this._hAlign = utils.default(hAlign, BboxAlignedText.ALIGN.CENTER);
    this._vAlign = utils.default(vAlign, BboxAlignedText.BASELINE.CENTER);
    if (updatePosition) {
        var newPos = this._calculateAlignedCoords(this._x, this._y);
        this._x += oldPos.x - newPos.x;
        this._y += oldPos.y - newPos.y;
    }
    return this;
};

/**
 * Get the bounding box when the text is placed at the specified coordinates.
 * Note: this is the unrotated bounding box! TODO: Fix this.
 * @param {number} [x=current x] - A new x coordinate of text anchor. This
 *                                 will change the text's x position 
 *                                 permanently. 
 * @param {number} [y=current y] - A new y coordinate of text anchor. This
 *                                 will change the text's x position 
 *                                 permanently.
 * @return {object} Returns an object with properties: x, y, w, h
 */
BboxAlignedText.prototype.getBbox = function(x, y) {
    this.setPosition(x, y);
    var pos = this._calculateAlignedCoords(this._x, this._y);
    return {
        x: pos.x + this._boundsOffset.x,
        y: pos.y + this._boundsOffset.y,
        w: this.width,
        h: this.height
    };
};

/**
 * Get an array of points that follow along the text path. This will take into
 * consideration the current alignment settings.
 * Note: this is a thin wrapper around a p5 method and doesn't handle unrotated
 * text! TODO: Fix this.
 * @param {number} [x=current x] - A new x coordinate of text anchor. This
 *                                 will change the text's x position 
 *                                 permanently. 
 * @param {number} [y=current y] - A new y coordinate of text anchor. This
 *                                 will change the text's x position 
 *                                 permanently.
 * @param {object} [options] - An object that can have:
 *                               - sampleFactor: ratio of path-length to number
 *                                 of samples (default=0.25). Higher values 
 *                                 yield morepoints and are therefore more 
 *                                 precise. 
 *                               - simplifyThreshold: if set to a non-zero 
 *                                 value, collinear points will be removed. The
 *                                 value represents the threshold angle to use
 *                                 when determining whether two edges are 
 *                                 collinear.
 * @return {array} An array of points, each with x, y & alpha (the path angle)
 */
BboxAlignedText.prototype.getTextPoints = function(x, y, options) {
    this.setPosition(x, y);
    var points = this._font.textToPoints(this._text, this._x, this._y, 
        this._fontSize, options);
    for (var i = 0; i < points.length; i += 1) {
        var pos = this._calculateAlignedCoords(points[i].x, points[i].y);
        points[i].x = pos.x;
        points[i].y = pos.y;
    }
    return points;
};

/**
 * Draws the text particle with the specified style parameters. Note: this is
 * going to set the textFont, textSize & rotation before drawing. You should set
 * the color/stroke/fill that you want before drawing. This function will clean
 * up after itself and reset styling back to what it was before it was called.
 * @public
 * @param {number} [x=current x] - A new x coordinate of text anchor. This will
 *                                change the text's x position permanently. 
 * @param {number} [y=current y] - A new y coordinate of text anchor. This will
 *                                 change the text's x position permanently.
 * @param {boolean} [drawBounds=false] - Flag for drawing bounding box
 */
BboxAlignedText.prototype.draw = function(x, y, drawBounds) {
    drawBounds = utils.default(drawBounds, false);
    this.setPosition(x, y);
    var pos = {
        x: this._x, 
        y: this._y
    };

    this._p.push();

        if (this._rotation) {
            pos = this._calculateRotatedCoords(pos.x, pos.y, this._rotation);
            this._p.rotate(this._rotation);
        }

        pos = this._calculateAlignedCoords(pos.x, pos.y);

        this._p.textAlign(this._p.LEFT, this._p.BASELINE);
        this._p.textFont(this._font);
        this._p.textSize(this._fontSize);
        this._p.text(this._text, pos.x, pos.y);

        if (drawBounds) {
            this._p.stroke(200);
            var boundsX = pos.x + this._boundsOffset.x;
            var boundsY = pos.y + this._boundsOffset.y;
            this._p.noFill();
            this._p.rect(boundsX, boundsY, this.width, this.height);            
        }

    this._p.pop();
};

/**
 * Project the coordinates (x, y) into a rotated coordinate system
 * @private
 * @param {number} x - X coordinate (in unrotated space)
 * @param {number} y - Y coordinate (in unrotated space)
 * @param {number} angle - Radians of rotation to apply
 * @return {object} Object with x & y properties
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
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @return {object} Object with x & y properties
 */
BboxAlignedText.prototype._calculateAlignedCoords = function(x, y) {
    var newX, newY;
    switch (this._hAlign) {
        case BboxAlignedText.ALIGN.BOX_LEFT:
            newX = x;
            break;
        case BboxAlignedText.ALIGN.BOX_CENTER:
            newX = x - this.halfWidth;
            break;
        case BboxAlignedText.ALIGN.BOX_RIGHT:
            newX = x - this.width;
            break;
        default:
            newX = x;
            console.log("Unrecognized horizonal align:", this._hAlign);
            break;
    }
    switch (this._vAlign) {
        case BboxAlignedText.BASELINE.BOX_TOP:
            newY = y - this._boundsOffset.y;
            break;
        case BboxAlignedText.BASELINE.BOX_CENTER:
            newY = y + this._distBaseToMid;
            break;
        case BboxAlignedText.BASELINE.BOX_BOTTOM:
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
    // Bounds is a reference - if we mess with it directly, we can mess up 
    // future values! (It changes the bbox cache in p5.)
    bounds = { 
        x: bounds.x - 1000, 
        y: bounds.y - 1000, 
        w: bounds.w, 
        h: bounds.h 
    }; 

    if (shouldUpdateHeight) {
        this._ascent = this._font._textAscent(this._fontSize);
        this._descent = this._font._textDescent(this._fontSize);
    }

    // Use bounds to calculate font metrics
    this.width = bounds.w;
    this.height = bounds.h;
    this.halfWidth = this.width / 2;
    this.halfHeight = this.height / 2;
    this._boundsOffset = { x: bounds.x, y: bounds.y };
    this._distBaseToMid = Math.abs(bounds.y) - this.halfHeight;
    this._distBaseToBottom = this.height - Math.abs(bounds.y);
};
},{"./utils.js":2}],2:[function(require,module,exports){
exports.default = function(value, defaultValue) {
    return (value !== undefined) ? value : defaultValue;
};
},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvYmJveC1hbGlnbmVkLXRleHQuanMiLCJsaWIvdXRpbHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDalpBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgdXRpbHMgPSByZXF1aXJlKFwiLi91dGlscy5qc1wiKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQmJveEFsaWduZWRUZXh0O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSBuZXcgQmJveEFsaWduZWRUZXh0IG9iamVjdCAtIGEgdGV4dCBvYmplY3QgdGhhdCBjYW4gYmUgZHJhd24gd2l0aFxyXG4gKiBhbmNob3IgcG9pbnRzIGJhc2VkIG9uIGEgdGlnaHQgYm91bmRpbmcgYm94IGFyb3VuZCB0aGUgdGV4dC5cclxuICogQGNvbnN0cnVjdG9yXHJcbiAqIEBwYXJhbSB7b2JqZWN0fSBmb250IC0gcDUuRm9udCBvYmplY3RcclxuICogQHBhcmFtIHtzdHJpbmd9IHRleHQgLSBTdHJpbmcgdG8gZGlzcGxheVxyXG4gKiBAcGFyYW0ge251bWJlcn0gW2ZvbnRTaXplPTEyXSAtIEZvbnQgc2l6ZSB0byB1c2UgZm9yIHN0cmluZ1xyXG4gKiBAcGFyYW0ge251bWJlcn0gW3g9MF0gLSBJbml0aWFsIHggbG9jYXRpb25cclxuICogQHBhcmFtIHtudW1iZXJ9IFt5PTBdIC0gSW5pdGlhbCB5IGxvY2F0aW9uXHJcbiAqIEBwYXJhbSB7b2JqZWN0fSBbcEluc3RhbmNlPXdpbmRvd10gLSBSZWZlcmVuY2UgdG8gcDUgaW5zdGFuY2UsIGxlYXZlIGJsYW5rIGlmXHJcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBza2V0Y2ggaXMgZ2xvYmFsXHJcbiAqIEBleGFtcGxlXHJcbiAqIHZhciBmb250LCBiYm94VGV4dDtcclxuICogZnVuY3Rpb24gcHJlbG9hZCgpIHtcclxuICogICAgIGZvbnQgPSBsb2FkRm9udChcIi4vYXNzZXRzL1JlZ3VsYXIudHRmXCIpO1xyXG4gKiB9XHJcbiAqIGZ1bmN0aW9uIHNldHVwKCkge1xyXG4gKiAgICAgY3JlYXRlQ2FudmFzKDQwMCwgNjAwKTtcclxuICogICAgIGJhY2tncm91bmQoMCk7XHJcbiAqICAgICBcclxuICogICAgIGJib3hUZXh0ID0gbmV3IEJib3hBbGlnbmVkVGV4dChmb250LCBcIkhleSFcIiwgMzApOyAgICBcclxuICogICAgIGJib3hUZXh0LnNldFJvdGF0aW9uKFBJIC8gNCk7XHJcbiAqICAgICBiYm94VGV4dC5zZXRBbmNob3IoQmJveEFsaWduZWRUZXh0LkFMSUdOLkJPWF9DRU5URVIsIFxyXG4gKiAgICAgICAgICAgICAgICAgICAgICAgIEJib3hBbGlnbmVkVGV4dC5CQVNFTElORS5CT1hfQ0VOVEVSKTtcclxuICogICAgIFxyXG4gKiAgICAgZmlsbChcIiMwMEE4RUFcIik7XHJcbiAqICAgICBub1N0cm9rZSgpO1xyXG4gKiAgICAgYmJveFRleHQuZHJhdyh3aWR0aCAvIDIsIGhlaWdodCAvIDIpO1xyXG4gKiB9XHJcbiAqL1xyXG5mdW5jdGlvbiBCYm94QWxpZ25lZFRleHQoZm9udCwgdGV4dCwgZm9udFNpemUsIHgsIHksIHBJbnN0YW5jZSkge1xyXG4gICAgdGhpcy5fZm9udCA9IGZvbnQ7XHJcbiAgICB0aGlzLl90ZXh0ID0gdGV4dDtcclxuICAgIHRoaXMuX3ggPSB1dGlscy5kZWZhdWx0KHgsIDApO1xyXG4gICAgdGhpcy5feSA9IHV0aWxzLmRlZmF1bHQoeSwgMCk7XHJcbiAgICB0aGlzLl9mb250U2l6ZSA9IHV0aWxzLmRlZmF1bHQoZm9udFNpemUsIDEyKTtcclxuICAgIHRoaXMuX3AgPSB1dGlscy5kZWZhdWx0KHBJbnN0YW5jZSwgd2luZG93KTtcclxuICAgIHRoaXMuX3JvdGF0aW9uID0gMDtcclxuICAgIHRoaXMuX2hBbGlnbiA9IEJib3hBbGlnbmVkVGV4dC5BTElHTi5CT1hfQ0VOVEVSO1xyXG4gICAgdGhpcy5fdkFsaWduID0gQmJveEFsaWduZWRUZXh0LkJBU0VMSU5FLkJPWF9DRU5URVI7XHJcbiAgICB0aGlzLl9jYWxjdWxhdGVNZXRyaWNzKHRydWUpO1xyXG59XHJcblxyXG4vKipcclxuICogVmVydGljYWwgYWxpZ25tZW50IHZhbHVlc1xyXG4gKiBAcHVibGljXHJcbiAqIEBzdGF0aWNcclxuICogQHJlYWRvbmx5XHJcbiAqIEBlbnVtIHtzdHJpbmd9XHJcbiAqL1xyXG5CYm94QWxpZ25lZFRleHQuQUxJR04gPSB7XHJcbiAgICAvKiogRHJhdyBmcm9tIHRoZSBsZWZ0IG9mIHRoZSBiYm94ICovXHJcbiAgICBCT1hfTEVGVDogXCJib3hfbGVmdFwiLFxyXG4gICAgLyoqIERyYXcgZnJvbSB0aGUgY2VudGVyIG9mIHRoZSBiYm94ICovXHJcbiAgICBCT1hfQ0VOVEVSOiBcImJveF9jZW50ZXJcIixcclxuICAgIC8qKiBEcmF3IGZyb20gdGhlIHJpZ2h0IG9mIHRoZSBiYm94ICovXHJcbiAgICBCT1hfUklHSFQ6IFwiYm94X3JpZ2h0XCJcclxufTtcclxuXHJcbi8qKlxyXG4gKiBCYXNlbGluZSBhbGlnbm1lbnQgdmFsdWVzXHJcbiAqIEBwdWJsaWNcclxuICogQHN0YXRpY1xyXG4gKiBAcmVhZG9ubHlcclxuICogQGVudW0ge3N0cmluZ31cclxuICovXHJcbkJib3hBbGlnbmVkVGV4dC5CQVNFTElORSA9IHtcclxuICAgIC8qKiBEcmF3IGZyb20gdGhlIHRvcCBvZiB0aGUgYmJveCAqL1xyXG4gICAgQk9YX1RPUDogXCJib3hfdG9wXCIsXHJcbiAgICAvKiogRHJhdyBmcm9tIHRoZSBjZW50ZXIgb2YgdGhlIGJib3ggKi9cclxuICAgIEJPWF9DRU5URVI6IFwiYm94X2NlbnRlclwiLFxyXG4gICAgLyoqIERyYXcgZnJvbSB0aGUgYm90dG9tIG9mIHRoZSBiYm94ICovXHJcbiAgICBCT1hfQk9UVE9NOiBcImJveF9ib3R0b21cIixcclxuICAgIC8qKiBcclxuICAgICAqIERyYXcgZnJvbSBoYWxmIHRoZSBoZWlnaHQgb2YgdGhlIGZvbnQuIFNwZWNpZmljYWxseSB0aGUgaGVpZ2h0IGlzXHJcbiAgICAgKiBjYWxjdWxhdGVkIGFzOiBhc2NlbnQgKyBkZXNjZW50LlxyXG4gICAgICovXHJcbiAgICBGT05UX0NFTlRFUjogXCJmb250X2NlbnRlclwiLFxyXG4gICAgLyoqIERyYXcgZnJvbSB0aGUgdGhlIG5vcm1hbCBmb250IGJhc2VsaW5lICovXHJcbiAgICBBTFBIQUJFVElDOiBcImFscGhhYmV0aWNcIlxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFNldCBjdXJyZW50IHRleHRcclxuICogQHB1YmxpY1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nIC0gVGV4dCBzdHJpbmcgdG8gZGlzcGxheVxyXG4gKiBAcmV0dXJucyB7dGhpc30gVXNlZnVsIGZvciBjaGFpbmluZ1xyXG4gKi9cclxuQmJveEFsaWduZWRUZXh0LnByb3RvdHlwZS5zZXRUZXh0ID0gZnVuY3Rpb24oc3RyaW5nKSB7XHJcbiAgICB0aGlzLl90ZXh0ID0gc3RyaW5nO1xyXG4gICAgdGhpcy5fY2FsY3VsYXRlTWV0cmljcyhmYWxzZSk7XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTZXQgdGhlIHRleHQgcG9zaXRpb25cclxuICogQHB1YmxpY1xyXG4gKiBAcGFyYW0ge251bWJlcn0geCAtIFggcG9zaXRpb25cclxuICogQHBhcmFtIHtudW1iZXJ9IHggLSBZIHBvc2l0aW9uXHJcbiAqIEByZXR1cm5zIHt0aGlzfSBVc2VmdWwgZm9yIGNoYWluaW5nXHJcbiAqL1xyXG5CYm94QWxpZ25lZFRleHQucHJvdG90eXBlLnNldFBvc2l0aW9uID0gZnVuY3Rpb24oeCwgeSkge1xyXG4gICAgdGhpcy5feCA9IHV0aWxzLmRlZmF1bHQoeCwgdGhpcy5feCk7XHJcbiAgICB0aGlzLl95ID0gdXRpbHMuZGVmYXVsdCh5LCB0aGlzLl95KTtcclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEdldCB0aGUgdGV4dCBwb3NpdGlvblxyXG4gKiBAcHVibGljXHJcbiAqIEByZXR1cm4ge29iamVjdH0gUmV0dXJucyBhbiBvYmplY3Qgd2l0aCBwcm9wZXJ0aWVzOiB4LCB5XHJcbiAqL1xyXG5CYm94QWxpZ25lZFRleHQucHJvdG90eXBlLmdldFBvc2l0aW9uID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHg6IHRoaXMuX3gsXHJcbiAgICAgICAgeTogdGhpcy5feVxyXG4gICAgfTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTZXQgY3VycmVudCB0ZXh0IHNpemVcclxuICogQHB1YmxpY1xyXG4gKiBAcGFyYW0ge251bWJlcn0gZm9udFNpemUgVGV4dCBzaXplXHJcbiAqIEByZXR1cm5zIHt0aGlzfSBVc2VmdWwgZm9yIGNoYWluaW5nXHJcbiAqL1xyXG5CYm94QWxpZ25lZFRleHQucHJvdG90eXBlLnNldFRleHRTaXplID0gZnVuY3Rpb24oZm9udFNpemUpIHtcclxuICAgIHRoaXMuX2ZvbnRTaXplID0gZm9udFNpemU7XHJcbiAgICB0aGlzLl9jYWxjdWxhdGVNZXRyaWNzKHRydWUpO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4vKipcclxuICogU2V0IHJvdGF0aW9uIG9mIHRleHRcclxuICogQHB1YmxpY1xyXG4gKiBAcGFyYW0ge251bWJlcn0gYW5nbGUgLSBSb3RhdGlvbiBpbiByYWRpYW5zXHJcbiAqIEByZXR1cm5zIHt0aGlzfSBVc2VmdWwgZm9yIGNoYWluaW5nXHJcbiAqL1xyXG5CYm94QWxpZ25lZFRleHQucHJvdG90eXBlLnNldFJvdGF0aW9uID0gZnVuY3Rpb24oYW5nbGUpIHtcclxuICAgIHRoaXMuX3JvdGF0aW9uID0gdXRpbHMuZGVmYXVsdChhbmdsZSwgdGhpcy5fcm90YXRpb24pO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4vKipcclxuICogR2V0IHJvdGF0aW9uIG9mIHRleHRcclxuICogQHB1YmxpY1xyXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBSb3RhdGlvbiBpbiByYWRpYW5zXHJcbiAqL1xyXG5CYm94QWxpZ25lZFRleHQucHJvdG90eXBlLmdldFJvdGF0aW9uID0gZnVuY3Rpb24oYW5nbGUpIHtcclxuICAgIHJldHVybiB0aGlzLl9yb3RhdGlvbjtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTZXQgdGhlIHAgaW5zdGFuY2UgdGhhdCBpcyB1c2VkIGZvciBkcmF3aW5nXHJcbiAqIEBwdWJsaWNcclxuICogQHBhcmFtIHtvYmplY3R9IHBJbnN0YW5jZSAtIEluc3RhbmNlIG9mIHA1IGZvciBkcmF3aW5nLiBUaGlzIGlzIG9ubHkgbmVlZGVkXHJcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGVuIHVzaW5nIGFuIG9mZnNjcmVlbiByZW5kZXJlciBvciB3aGVuIHVzaW5nIHA1XHJcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbiBpbnN0YW5jZSBtb2RlLlxyXG4gKiBAcmV0dXJucyB7dGhpc30gVXNlZnVsIGZvciBjaGFpbmluZ1xyXG4gKi9cclxuQmJveEFsaWduZWRUZXh0LnByb3RvdHlwZS5zZXRQSW5zdGFuY2UgPSBmdW5jdGlvbihwKSB7XHJcbiAgICB0aGlzLl9wID0gdXRpbHMuZGVmYXVsdChwLCB0aGlzLl9wKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEdldCByb3RhdGlvbiBvZiB0ZXh0XHJcbiAqIEBwdWJsaWNcclxuICogQHJldHVybnMge29iamVjdH0gSW5zdGFuY2Ugb2YgcDUgdGhhdCBpcyBiZWluZyB1c2VkIGZvciBkcmF3aW5nXHJcbiAqL1xyXG5CYm94QWxpZ25lZFRleHQucHJvdG90eXBlLmdldFBJbnN0YW5jZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuX3A7XHJcbn07XHJcblxyXG4vKipcclxuICogU2V0IGFuY2hvciBwb2ludCBmb3IgdGV4dCAoaG9yaXpvbmFsIGFuZCB2ZXJ0aWNhbCBhbGlnbm1lbnQpIHJlbGF0aXZlIHRvXHJcbiAqIGJvdW5kaW5nIGJveFxyXG4gKiBAcHVibGljXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBbaEFsaWduPUNFTlRFUl0gLSBIb3Jpem9uYWwgYWxpZ25tZW50XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBbdkFsaWduPUNFTlRFUl0gLSBWZXJ0aWNhbCBiYXNlbGluZVxyXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFt1cGRhdGVQb3NpdGlvbj1mYWxzZV0gLSBJZiBzZXQgdG8gdHJ1ZSwgdGhlIHBvc2l0aW9uIG9mIHRoZVxyXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGUgdGV4dCB3aWxsIGJlIHNoaWZ0ZWQgc28gdGhhdFxyXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGUgdGV4dCB3aWxsIGJlIGRyYXduIGluIHRoZSBzYW1lXHJcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBsYWNlIGl0IHdhcyBiZWZvcmUgY2FsbGluZyBcclxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0QW5jaG9yLlxyXG4gKiBAcmV0dXJucyB7dGhpc30gVXNlZnVsIGZvciBjaGFpbmluZ1xyXG4gKi9cclxuQmJveEFsaWduZWRUZXh0LnByb3RvdHlwZS5zZXRBbmNob3IgPSBmdW5jdGlvbihoQWxpZ24sIHZBbGlnbiwgdXBkYXRlUG9zaXRpb24pIHtcclxuICAgIHZhciBvbGRQb3MgPSB0aGlzLl9jYWxjdWxhdGVBbGlnbmVkQ29vcmRzKHRoaXMuX3gsIHRoaXMuX3kpO1xyXG4gICAgdGhpcy5faEFsaWduID0gdXRpbHMuZGVmYXVsdChoQWxpZ24sIEJib3hBbGlnbmVkVGV4dC5BTElHTi5DRU5URVIpO1xyXG4gICAgdGhpcy5fdkFsaWduID0gdXRpbHMuZGVmYXVsdCh2QWxpZ24sIEJib3hBbGlnbmVkVGV4dC5CQVNFTElORS5DRU5URVIpO1xyXG4gICAgaWYgKHVwZGF0ZVBvc2l0aW9uKSB7XHJcbiAgICAgICAgdmFyIG5ld1BvcyA9IHRoaXMuX2NhbGN1bGF0ZUFsaWduZWRDb29yZHModGhpcy5feCwgdGhpcy5feSk7XHJcbiAgICAgICAgdGhpcy5feCArPSBvbGRQb3MueCAtIG5ld1Bvcy54O1xyXG4gICAgICAgIHRoaXMuX3kgKz0gb2xkUG9zLnkgLSBuZXdQb3MueTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEdldCB0aGUgYm91bmRpbmcgYm94IHdoZW4gdGhlIHRleHQgaXMgcGxhY2VkIGF0IHRoZSBzcGVjaWZpZWQgY29vcmRpbmF0ZXMuXHJcbiAqIE5vdGU6IHRoaXMgaXMgdGhlIHVucm90YXRlZCBib3VuZGluZyBib3ghIFRPRE86IEZpeCB0aGlzLlxyXG4gKiBAcGFyYW0ge251bWJlcn0gW3g9Y3VycmVudCB4XSAtIEEgbmV3IHggY29vcmRpbmF0ZSBvZiB0ZXh0IGFuY2hvci4gVGhpc1xyXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbGwgY2hhbmdlIHRoZSB0ZXh0J3MgeCBwb3NpdGlvbiBcclxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZXJtYW5lbnRseS4gXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBbeT1jdXJyZW50IHldIC0gQSBuZXcgeSBjb29yZGluYXRlIG9mIHRleHQgYW5jaG9yLiBUaGlzXHJcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lsbCBjaGFuZ2UgdGhlIHRleHQncyB4IHBvc2l0aW9uIFxyXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlcm1hbmVudGx5LlxyXG4gKiBAcmV0dXJuIHtvYmplY3R9IFJldHVybnMgYW4gb2JqZWN0IHdpdGggcHJvcGVydGllczogeCwgeSwgdywgaFxyXG4gKi9cclxuQmJveEFsaWduZWRUZXh0LnByb3RvdHlwZS5nZXRCYm94ID0gZnVuY3Rpb24oeCwgeSkge1xyXG4gICAgdGhpcy5zZXRQb3NpdGlvbih4LCB5KTtcclxuICAgIHZhciBwb3MgPSB0aGlzLl9jYWxjdWxhdGVBbGlnbmVkQ29vcmRzKHRoaXMuX3gsIHRoaXMuX3kpO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICB4OiBwb3MueCArIHRoaXMuX2JvdW5kc09mZnNldC54LFxyXG4gICAgICAgIHk6IHBvcy55ICsgdGhpcy5fYm91bmRzT2Zmc2V0LnksXHJcbiAgICAgICAgdzogdGhpcy53aWR0aCxcclxuICAgICAgICBoOiB0aGlzLmhlaWdodFxyXG4gICAgfTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBHZXQgYW4gYXJyYXkgb2YgcG9pbnRzIHRoYXQgZm9sbG93IGFsb25nIHRoZSB0ZXh0IHBhdGguIFRoaXMgd2lsbCB0YWtlIGludG9cclxuICogY29uc2lkZXJhdGlvbiB0aGUgY3VycmVudCBhbGlnbm1lbnQgc2V0dGluZ3MuXHJcbiAqIE5vdGU6IHRoaXMgaXMgYSB0aGluIHdyYXBwZXIgYXJvdW5kIGEgcDUgbWV0aG9kIGFuZCBkb2Vzbid0IGhhbmRsZSB1bnJvdGF0ZWRcclxuICogdGV4dCEgVE9ETzogRml4IHRoaXMuXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBbeD1jdXJyZW50IHhdIC0gQSBuZXcgeCBjb29yZGluYXRlIG9mIHRleHQgYW5jaG9yLiBUaGlzXHJcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lsbCBjaGFuZ2UgdGhlIHRleHQncyB4IHBvc2l0aW9uIFxyXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlcm1hbmVudGx5LiBcclxuICogQHBhcmFtIHtudW1iZXJ9IFt5PWN1cnJlbnQgeV0gLSBBIG5ldyB5IGNvb3JkaW5hdGUgb2YgdGV4dCBhbmNob3IuIFRoaXNcclxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWxsIGNoYW5nZSB0aGUgdGV4dCdzIHggcG9zaXRpb24gXHJcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVybWFuZW50bHkuXHJcbiAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc10gLSBBbiBvYmplY3QgdGhhdCBjYW4gaGF2ZTpcclxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLSBzYW1wbGVGYWN0b3I6IHJhdGlvIG9mIHBhdGgtbGVuZ3RoIHRvIG51bWJlclxyXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9mIHNhbXBsZXMgKGRlZmF1bHQ9MC4yNSkuIEhpZ2hlciB2YWx1ZXMgXHJcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeWllbGQgbW9yZXBvaW50cyBhbmQgYXJlIHRoZXJlZm9yZSBtb3JlIFxyXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByZWNpc2UuIFxyXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtIHNpbXBsaWZ5VGhyZXNob2xkOiBpZiBzZXQgdG8gYSBub24temVybyBcclxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSwgY29sbGluZWFyIHBvaW50cyB3aWxsIGJlIHJlbW92ZWQuIFRoZVxyXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlIHJlcHJlc2VudHMgdGhlIHRocmVzaG9sZCBhbmdsZSB0byB1c2VcclxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGVuIGRldGVybWluaW5nIHdoZXRoZXIgdHdvIGVkZ2VzIGFyZSBcclxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xsaW5lYXIuXHJcbiAqIEByZXR1cm4ge2FycmF5fSBBbiBhcnJheSBvZiBwb2ludHMsIGVhY2ggd2l0aCB4LCB5ICYgYWxwaGEgKHRoZSBwYXRoIGFuZ2xlKVxyXG4gKi9cclxuQmJveEFsaWduZWRUZXh0LnByb3RvdHlwZS5nZXRUZXh0UG9pbnRzID0gZnVuY3Rpb24oeCwgeSwgb3B0aW9ucykge1xyXG4gICAgdGhpcy5zZXRQb3NpdGlvbih4LCB5KTtcclxuICAgIHZhciBwb2ludHMgPSB0aGlzLl9mb250LnRleHRUb1BvaW50cyh0aGlzLl90ZXh0LCB0aGlzLl94LCB0aGlzLl95LCBcclxuICAgICAgICB0aGlzLl9mb250U2l6ZSwgb3B0aW9ucyk7XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBvaW50cy5sZW5ndGg7IGkgKz0gMSkge1xyXG4gICAgICAgIHZhciBwb3MgPSB0aGlzLl9jYWxjdWxhdGVBbGlnbmVkQ29vcmRzKHBvaW50c1tpXS54LCBwb2ludHNbaV0ueSk7XHJcbiAgICAgICAgcG9pbnRzW2ldLnggPSBwb3MueDtcclxuICAgICAgICBwb2ludHNbaV0ueSA9IHBvcy55O1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHBvaW50cztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBEcmF3cyB0aGUgdGV4dCBwYXJ0aWNsZSB3aXRoIHRoZSBzcGVjaWZpZWQgc3R5bGUgcGFyYW1ldGVycy4gTm90ZTogdGhpcyBpc1xyXG4gKiBnb2luZyB0byBzZXQgdGhlIHRleHRGb250LCB0ZXh0U2l6ZSAmIHJvdGF0aW9uIGJlZm9yZSBkcmF3aW5nLiBZb3Ugc2hvdWxkIHNldFxyXG4gKiB0aGUgY29sb3Ivc3Ryb2tlL2ZpbGwgdGhhdCB5b3Ugd2FudCBiZWZvcmUgZHJhd2luZy4gVGhpcyBmdW5jdGlvbiB3aWxsIGNsZWFuXHJcbiAqIHVwIGFmdGVyIGl0c2VsZiBhbmQgcmVzZXQgc3R5bGluZyBiYWNrIHRvIHdoYXQgaXQgd2FzIGJlZm9yZSBpdCB3YXMgY2FsbGVkLlxyXG4gKiBAcHVibGljXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBbeD1jdXJyZW50IHhdIC0gQSBuZXcgeCBjb29yZGluYXRlIG9mIHRleHQgYW5jaG9yLiBUaGlzIHdpbGxcclxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoYW5nZSB0aGUgdGV4dCdzIHggcG9zaXRpb24gcGVybWFuZW50bHkuIFxyXG4gKiBAcGFyYW0ge251bWJlcn0gW3k9Y3VycmVudCB5XSAtIEEgbmV3IHkgY29vcmRpbmF0ZSBvZiB0ZXh0IGFuY2hvci4gVGhpcyB3aWxsXHJcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hhbmdlIHRoZSB0ZXh0J3MgeCBwb3NpdGlvbiBwZXJtYW5lbnRseS5cclxuICogQHBhcmFtIHtib29sZWFufSBbZHJhd0JvdW5kcz1mYWxzZV0gLSBGbGFnIGZvciBkcmF3aW5nIGJvdW5kaW5nIGJveFxyXG4gKi9cclxuQmJveEFsaWduZWRUZXh0LnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oeCwgeSwgZHJhd0JvdW5kcykge1xyXG4gICAgZHJhd0JvdW5kcyA9IHV0aWxzLmRlZmF1bHQoZHJhd0JvdW5kcywgZmFsc2UpO1xyXG4gICAgdGhpcy5zZXRQb3NpdGlvbih4LCB5KTtcclxuICAgIHZhciBwb3MgPSB7XHJcbiAgICAgICAgeDogdGhpcy5feCwgXHJcbiAgICAgICAgeTogdGhpcy5feVxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLl9wLnB1c2goKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX3JvdGF0aW9uKSB7XHJcbiAgICAgICAgICAgIHBvcyA9IHRoaXMuX2NhbGN1bGF0ZVJvdGF0ZWRDb29yZHMocG9zLngsIHBvcy55LCB0aGlzLl9yb3RhdGlvbik7XHJcbiAgICAgICAgICAgIHRoaXMuX3Aucm90YXRlKHRoaXMuX3JvdGF0aW9uKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHBvcyA9IHRoaXMuX2NhbGN1bGF0ZUFsaWduZWRDb29yZHMocG9zLngsIHBvcy55KTtcclxuXHJcbiAgICAgICAgdGhpcy5fcC50ZXh0QWxpZ24odGhpcy5fcC5MRUZULCB0aGlzLl9wLkJBU0VMSU5FKTtcclxuICAgICAgICB0aGlzLl9wLnRleHRGb250KHRoaXMuX2ZvbnQpO1xyXG4gICAgICAgIHRoaXMuX3AudGV4dFNpemUodGhpcy5fZm9udFNpemUpO1xyXG4gICAgICAgIHRoaXMuX3AudGV4dCh0aGlzLl90ZXh0LCBwb3MueCwgcG9zLnkpO1xyXG5cclxuICAgICAgICBpZiAoZHJhd0JvdW5kcykge1xyXG4gICAgICAgICAgICB0aGlzLl9wLnN0cm9rZSgyMDApO1xyXG4gICAgICAgICAgICB2YXIgYm91bmRzWCA9IHBvcy54ICsgdGhpcy5fYm91bmRzT2Zmc2V0Lng7XHJcbiAgICAgICAgICAgIHZhciBib3VuZHNZID0gcG9zLnkgKyB0aGlzLl9ib3VuZHNPZmZzZXQueTtcclxuICAgICAgICAgICAgdGhpcy5fcC5ub0ZpbGwoKTtcclxuICAgICAgICAgICAgdGhpcy5fcC5yZWN0KGJvdW5kc1gsIGJvdW5kc1ksIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KTsgICAgICAgICAgICBcclxuICAgICAgICB9XHJcblxyXG4gICAgdGhpcy5fcC5wb3AoKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBQcm9qZWN0IHRoZSBjb29yZGluYXRlcyAoeCwgeSkgaW50byBhIHJvdGF0ZWQgY29vcmRpbmF0ZSBzeXN0ZW1cclxuICogQHByaXZhdGVcclxuICogQHBhcmFtIHtudW1iZXJ9IHggLSBYIGNvb3JkaW5hdGUgKGluIHVucm90YXRlZCBzcGFjZSlcclxuICogQHBhcmFtIHtudW1iZXJ9IHkgLSBZIGNvb3JkaW5hdGUgKGluIHVucm90YXRlZCBzcGFjZSlcclxuICogQHBhcmFtIHtudW1iZXJ9IGFuZ2xlIC0gUmFkaWFucyBvZiByb3RhdGlvbiB0byBhcHBseVxyXG4gKiBAcmV0dXJuIHtvYmplY3R9IE9iamVjdCB3aXRoIHggJiB5IHByb3BlcnRpZXNcclxuICovXHJcbkJib3hBbGlnbmVkVGV4dC5wcm90b3R5cGUuX2NhbGN1bGF0ZVJvdGF0ZWRDb29yZHMgPSBmdW5jdGlvbiAoeCwgeSwgYW5nbGUpIHsgIFxyXG4gICAgdmFyIHJ4ID0gTWF0aC5jb3MoYW5nbGUpICogeCArIE1hdGguY29zKE1hdGguUEkgLyAyIC0gYW5nbGUpICogeTtcclxuICAgIHZhciByeSA9IC1NYXRoLnNpbihhbmdsZSkgKiB4ICsgTWF0aC5zaW4oTWF0aC5QSSAvIDIgLSBhbmdsZSkgKiB5O1xyXG4gICAgcmV0dXJuIHt4OiByeCwgeTogcnl9O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENhbGN1bGF0ZXMgZHJhdyBjb29yZGluYXRlcyBmb3IgdGhlIHRleHQsIGFsaWduaW5nIGJhc2VkIG9uIHRoZSBib3VuZGluZyBib3guXHJcbiAqIFRoZSB0ZXh0IGlzIGV2ZW50dWFsbHkgZHJhd24gd2l0aCBjYW52YXMgYWxpZ25tZW50IHNldCB0byBsZWZ0ICYgYmFzZWxpbmUsIHNvXHJcbiAqIHRoaXMgZnVuY3Rpb24gdGFrZXMgYSBkZXNpcmVkIHBvcyAmIGFsaWdubWVudCBhbmQgcmV0dXJucyB0aGUgYXBwcm9wcmlhdGVcclxuICogY29vcmRpbmF0ZXMgZm9yIHRoZSBsZWZ0ICYgYmFzZWxpbmUuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSB4IC0gWCBjb29yZGluYXRlXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSB5IC0gWSBjb29yZGluYXRlXHJcbiAqIEByZXR1cm4ge29iamVjdH0gT2JqZWN0IHdpdGggeCAmIHkgcHJvcGVydGllc1xyXG4gKi9cclxuQmJveEFsaWduZWRUZXh0LnByb3RvdHlwZS5fY2FsY3VsYXRlQWxpZ25lZENvb3JkcyA9IGZ1bmN0aW9uKHgsIHkpIHtcclxuICAgIHZhciBuZXdYLCBuZXdZO1xyXG4gICAgc3dpdGNoICh0aGlzLl9oQWxpZ24pIHtcclxuICAgICAgICBjYXNlIEJib3hBbGlnbmVkVGV4dC5BTElHTi5CT1hfTEVGVDpcclxuICAgICAgICAgICAgbmV3WCA9IHg7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgQmJveEFsaWduZWRUZXh0LkFMSUdOLkJPWF9DRU5URVI6XHJcbiAgICAgICAgICAgIG5ld1ggPSB4IC0gdGhpcy5oYWxmV2lkdGg7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgQmJveEFsaWduZWRUZXh0LkFMSUdOLkJPWF9SSUdIVDpcclxuICAgICAgICAgICAgbmV3WCA9IHggLSB0aGlzLndpZHRoO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICBuZXdYID0geDtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJVbnJlY29nbml6ZWQgaG9yaXpvbmFsIGFsaWduOlwiLCB0aGlzLl9oQWxpZ24pO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgIH1cclxuICAgIHN3aXRjaCAodGhpcy5fdkFsaWduKSB7XHJcbiAgICAgICAgY2FzZSBCYm94QWxpZ25lZFRleHQuQkFTRUxJTkUuQk9YX1RPUDpcclxuICAgICAgICAgICAgbmV3WSA9IHkgLSB0aGlzLl9ib3VuZHNPZmZzZXQueTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBCYm94QWxpZ25lZFRleHQuQkFTRUxJTkUuQk9YX0NFTlRFUjpcclxuICAgICAgICAgICAgbmV3WSA9IHkgKyB0aGlzLl9kaXN0QmFzZVRvTWlkO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIEJib3hBbGlnbmVkVGV4dC5CQVNFTElORS5CT1hfQk9UVE9NOlxyXG4gICAgICAgICAgICBuZXdZID0geSAtIHRoaXMuX2Rpc3RCYXNlVG9Cb3R0b207XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgQmJveEFsaWduZWRUZXh0LkJBU0VMSU5FLkZPTlRfQ0VOVEVSOlxyXG4gICAgICAgICAgICAvLyBIZWlnaHQgaXMgYXBwcm94aW1hdGVkIGFzIGFzY2VudCArIGRlc2NlbnRcclxuICAgICAgICAgICAgbmV3WSA9IHkgLSB0aGlzLl9kZXNjZW50ICsgKHRoaXMuX2FzY2VudCArIHRoaXMuX2Rlc2NlbnQpIC8gMjtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBCYm94QWxpZ25lZFRleHQuQkFTRUxJTkUuQUxQSEFCRVRJQzpcclxuICAgICAgICAgICAgbmV3WSA9IHk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIG5ld1kgPSB5O1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIlVucmVjb2duaXplZCB2ZXJ0aWNhbCBhbGlnbjpcIiwgdGhpcy5fdkFsaWduKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICB9XHJcbiAgICByZXR1cm4ge3g6IG5ld1gsIHk6IG5ld1l9O1xyXG59O1xyXG5cclxuXHJcbi8qKlxyXG4gKiBDYWxjdWxhdGVzIGJvdW5kaW5nIGJveCBhbmQgdmFyaW91cyBtZXRyaWNzIGZvciB0aGUgY3VycmVudCB0ZXh0IGFuZCBmb250XHJcbiAqIEBwcml2YXRlXHJcbiAqL1xyXG5CYm94QWxpZ25lZFRleHQucHJvdG90eXBlLl9jYWxjdWxhdGVNZXRyaWNzID0gZnVuY3Rpb24oc2hvdWxkVXBkYXRlSGVpZ2h0KSB7ICBcclxuICAgIC8vIHA1IDAuNS4wIGhhcyBhIGJ1ZyAtIHRleHQgYm91bmRzIGFyZSBjbGlwcGVkIGJ5ICgwLCAwKVxyXG4gICAgLy8gQ2FsY3VsYXRpbmcgYm91bmRzIGhhY2tcclxuICAgIHZhciBib3VuZHMgPSB0aGlzLl9mb250LnRleHRCb3VuZHModGhpcy5fdGV4dCwgMTAwMCwgMTAwMCwgdGhpcy5fZm9udFNpemUpO1xyXG4gICAgLy8gQm91bmRzIGlzIGEgcmVmZXJlbmNlIC0gaWYgd2UgbWVzcyB3aXRoIGl0IGRpcmVjdGx5LCB3ZSBjYW4gbWVzcyB1cCBcclxuICAgIC8vIGZ1dHVyZSB2YWx1ZXMhIChJdCBjaGFuZ2VzIHRoZSBiYm94IGNhY2hlIGluIHA1LilcclxuICAgIGJvdW5kcyA9IHsgXHJcbiAgICAgICAgeDogYm91bmRzLnggLSAxMDAwLCBcclxuICAgICAgICB5OiBib3VuZHMueSAtIDEwMDAsIFxyXG4gICAgICAgIHc6IGJvdW5kcy53LCBcclxuICAgICAgICBoOiBib3VuZHMuaCBcclxuICAgIH07IFxyXG5cclxuICAgIGlmIChzaG91bGRVcGRhdGVIZWlnaHQpIHtcclxuICAgICAgICB0aGlzLl9hc2NlbnQgPSB0aGlzLl9mb250Ll90ZXh0QXNjZW50KHRoaXMuX2ZvbnRTaXplKTtcclxuICAgICAgICB0aGlzLl9kZXNjZW50ID0gdGhpcy5fZm9udC5fdGV4dERlc2NlbnQodGhpcy5fZm9udFNpemUpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFVzZSBib3VuZHMgdG8gY2FsY3VsYXRlIGZvbnQgbWV0cmljc1xyXG4gICAgdGhpcy53aWR0aCA9IGJvdW5kcy53O1xyXG4gICAgdGhpcy5oZWlnaHQgPSBib3VuZHMuaDtcclxuICAgIHRoaXMuaGFsZldpZHRoID0gdGhpcy53aWR0aCAvIDI7XHJcbiAgICB0aGlzLmhhbGZIZWlnaHQgPSB0aGlzLmhlaWdodCAvIDI7XHJcbiAgICB0aGlzLl9ib3VuZHNPZmZzZXQgPSB7IHg6IGJvdW5kcy54LCB5OiBib3VuZHMueSB9O1xyXG4gICAgdGhpcy5fZGlzdEJhc2VUb01pZCA9IE1hdGguYWJzKGJvdW5kcy55KSAtIHRoaXMuaGFsZkhlaWdodDtcclxuICAgIHRoaXMuX2Rpc3RCYXNlVG9Cb3R0b20gPSB0aGlzLmhlaWdodCAtIE1hdGguYWJzKGJvdW5kcy55KTtcclxufTsiLCJleHBvcnRzLmRlZmF1bHQgPSBmdW5jdGlvbih2YWx1ZSwgZGVmYXVsdFZhbHVlKSB7XHJcbiAgICByZXR1cm4gKHZhbHVlICE9PSB1bmRlZmluZWQpID8gdmFsdWUgOiBkZWZhdWx0VmFsdWU7XHJcbn07Il19
