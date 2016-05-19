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
 *     bboxText.setAnchor(BboxAlignedText.ALIGN.BOX_CENTER, 
 *                        BboxAlignedText.BASELINE.BOX_CENTER);
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
 * Note: this is the unrotated bounding box! TODO: Fix this.
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
 * Get an array of points that follow along the text path. This will take into
 * consideration the current alignment settings.
 * Note: this is a thin wrapper around a p5 method and doesn't handle unrotated
 * text! TODO: Fix this.
 * @param  {number} x         X coordinate
 * @param  {number} y         Y coordinate
 * @param  {object} [options] An object that can have:
 *                            - sampleFactor: ratio of path-length to number of
 *                              samples (default=0.25). Higher values yield more
 *                              points and are therefore more precise. 
 *                            - simplifyThreshold: if set to a non-zero value,
 *                              collinear points will be removed. The value 
 *                              represents the threshold angle to use when
 *                              determining whether two edges are collinear.
 * @return {array} An array of points, each with x, y & alpha (the path angle)
 */
BboxAlignedText.prototype.getTextPoints = function(x, y, options) {
    var points = this._font.textToPoints(this._text, x, y, this._fontSize, 
                                         options);
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
 * @param  {number}  [x=0]              X coordinate of text anchor
 * @param  {number}  [y=0]              Y coordinate of text anchor
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
},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvYmJveC1hbGlnbmVkLXRleHQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwibW9kdWxlLmV4cG9ydHMgPSBCYm94QWxpZ25lZFRleHQ7XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhIG5ldyBCYm94QWxpZ25lZFRleHQgb2JqZWN0IC0gYSB0ZXh0IG9iamVjdCB0aGF0IGNhbiBiZSBkcmF3biB3aXRoXHJcbiAqIGFuY2hvciBwb2ludHMgYmFzZWQgb24gYSB0aWdodCBib3VuZGluZyBib3ggYXJvdW5kIHRoZSB0ZXh0LlxyXG4gKiBAY29uc3RydWN0b3JcclxuICogQHBhcmFtIHtvYmplY3R9IGZvbnQgICAgICAgICAgICAgICBwNS5Gb250IG9iamVjdFxyXG4gKiBAcGFyYW0ge3N0cmluZ30gdGV4dCAgICAgICAgICAgICAgIFN0cmluZyB0byBkaXNwbGF5XHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBbZm9udFNpemU9MTJdICAgICAgRm9udCBzaXplIHRvIHVzZSBmb3Igc3RyaW5nXHJcbiAqIEBwYXJhbSB7b2JqZWN0fSBbcEluc3RhbmNlPXdpbmRvd10gUmVmZXJlbmNlIHRvIHA1IGluc3RhbmNlLCBsZWF2ZSBibGFuayBpZlxyXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNrZXRjaCBpcyBnbG9iYWxcclxuICogQGV4YW1wbGVcclxuICogdmFyIGZvbnQsIGJib3hUZXh0O1xyXG4gKiBmdW5jdGlvbiBwcmVsb2FkKCkge1xyXG4gKiAgICAgZm9udCA9IGxvYWRGb250KFwiLi9hc3NldHMvUmVndWxhci50dGZcIik7XHJcbiAqIH1cclxuICogZnVuY3Rpb24gc2V0dXAoKSB7XHJcbiAqICAgICBjcmVhdGVDYW52YXMoNDAwLCA2MDApO1xyXG4gKiAgICAgYmFja2dyb3VuZCgwKTtcclxuICogICAgIFxyXG4gKiAgICAgYmJveFRleHQgPSBuZXcgQmJveEFsaWduZWRUZXh0KGZvbnQsIFwiSGV5IVwiLCAzMCk7ICAgIFxyXG4gKiAgICAgYmJveFRleHQuc2V0Um90YXRpb24oUEkgLyA0KTtcclxuICogICAgIGJib3hUZXh0LnNldEFuY2hvcihCYm94QWxpZ25lZFRleHQuQUxJR04uQk9YX0NFTlRFUiwgXHJcbiAqICAgICAgICAgICAgICAgICAgICAgICAgQmJveEFsaWduZWRUZXh0LkJBU0VMSU5FLkJPWF9DRU5URVIpO1xyXG4gKiAgICAgXHJcbiAqICAgICBmaWxsKFwiIzAwQThFQVwiKTtcclxuICogICAgIG5vU3Ryb2tlKCk7XHJcbiAqICAgICBiYm94VGV4dC5kcmF3KHdpZHRoIC8gMiwgaGVpZ2h0IC8gMiwgdHJ1ZSk7XHJcbiAqIH1cclxuICovXHJcbmZ1bmN0aW9uIEJib3hBbGlnbmVkVGV4dChmb250LCB0ZXh0LCBmb250U2l6ZSwgcEluc3RhbmNlKSB7XHJcbiAgICB0aGlzLl9mb250ID0gZm9udDtcclxuICAgIHRoaXMuX3RleHQgPSB0ZXh0O1xyXG4gICAgdGhpcy5fZm9udFNpemUgPSAoZm9udFNpemUgIT09IHVuZGVmaW5lZCkgPyBmb250U2l6ZSA6IDEyO1xyXG4gICAgdGhpcy5wID0gcEluc3RhbmNlIHx8IHdpbmRvdzsgLy8gSWYgaW5zdGFuY2UgaXMgb21pdHRlZCwgYXNzdW1lIGdsb2JhbCBzY29wZVxyXG4gICAgdGhpcy5fcm90YXRpb24gPSAwO1xyXG4gICAgdGhpcy5faEFsaWduID0gQmJveEFsaWduZWRUZXh0LkFMSUdOLkJPWF9DRU5URVI7XHJcbiAgICB0aGlzLl92QWxpZ24gPSBCYm94QWxpZ25lZFRleHQuQkFTRUxJTkUuQk9YX0NFTlRFUjtcclxuICAgIHRoaXMuX2NhbGN1bGF0ZU1ldHJpY3ModHJ1ZSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBWZXJ0aWNhbCBhbGlnbm1lbnQgdmFsdWVzXHJcbiAqIEBwdWJsaWNcclxuICogQHN0YXRpY1xyXG4gKiBAcmVhZG9ubHlcclxuICogQGVudW0ge3N0cmluZ31cclxuICovXHJcbkJib3hBbGlnbmVkVGV4dC5BTElHTiA9IHtcclxuICAgIC8qKiBEcmF3IGZyb20gdGhlIGxlZnQgb2YgdGhlIGJib3ggKi9cclxuICAgIEJPWF9MRUZUOiBcImJveF9sZWZ0XCIsXHJcbiAgICAvKiogRHJhdyBmcm9tIHRoZSBjZW50ZXIgb2YgdGhlIGJib3ggKi9cclxuICAgIEJPWF9DRU5URVI6IFwiYm94X2NlbnRlclwiLFxyXG4gICAgLyoqIERyYXcgZnJvbSB0aGUgcmlnaHQgb2YgdGhlIGJib3ggKi9cclxuICAgIEJPWF9SSUdIVDogXCJib3hfcmlnaHRcIlxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEJhc2VsaW5lIGFsaWdubWVudCB2YWx1ZXNcclxuICogQHB1YmxpY1xyXG4gKiBAc3RhdGljXHJcbiAqIEByZWFkb25seVxyXG4gKiBAZW51bSB7c3RyaW5nfVxyXG4gKi9cclxuQmJveEFsaWduZWRUZXh0LkJBU0VMSU5FID0ge1xyXG4gICAgLyoqIERyYXcgZnJvbSB0aGUgdG9wIG9mIHRoZSBiYm94ICovXHJcbiAgICBCT1hfVE9QOiBcImJveF90b3BcIixcclxuICAgIC8qKiBEcmF3IGZyb20gdGhlIGNlbnRlciBvZiB0aGUgYmJveCAqL1xyXG4gICAgQk9YX0NFTlRFUjogXCJib3hfY2VudGVyXCIsXHJcbiAgICAvKiogRHJhdyBmcm9tIHRoZSBib3R0b20gb2YgdGhlIGJib3ggKi9cclxuICAgIEJPWF9CT1RUT006IFwiYm94X2JvdHRvbVwiLFxyXG4gICAgLyoqIFxyXG4gICAgICogRHJhdyBmcm9tIGhhbGYgdGhlIGhlaWdodCBvZiB0aGUgZm9udC4gU3BlY2lmaWNhbGx5IHRoZSBoZWlnaHQgaXNcclxuICAgICAqIGNhbGN1bGF0ZWQgYXM6IGFzY2VudCArIGRlc2NlbnQuXHJcbiAgICAgKi9cclxuICAgIEZPTlRfQ0VOVEVSOiBcImZvbnRfY2VudGVyXCIsXHJcbiAgICAvKiogRHJhdyBmcm9tIHRoZSB0aGUgbm9ybWFsIGZvbnQgYmFzZWxpbmUgKi9cclxuICAgIEFMUEhBQkVUSUM6IFwiYWxwaGFiZXRpY1wiXHJcbn07XHJcblxyXG4vKipcclxuICogU2V0IGN1cnJlbnQgdGV4dFxyXG4gKiBAcHVibGljXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgVGV4dCBzdHJpbmcgdG8gZGlzcGxheVxyXG4gKi9cclxuQmJveEFsaWduZWRUZXh0LnByb3RvdHlwZS5zZXRUZXh0ID0gZnVuY3Rpb24oc3RyaW5nKSB7XHJcbiAgICB0aGlzLl90ZXh0ID0gc3RyaW5nO1xyXG4gICAgdGhpcy5fY2FsY3VsYXRlTWV0cmljcyhmYWxzZSk7XHJcbn07XHJcblxyXG4vKipcclxuICogU2V0IGN1cnJlbnQgdGV4dCBzaXplXHJcbiAqIEBwdWJsaWNcclxuICogQHBhcmFtIHtudW1iZXJ9IGZvbnRTaXplIFRleHQgc2l6ZVxyXG4gKi9cclxuQmJveEFsaWduZWRUZXh0LnByb3RvdHlwZS5zZXRUZXh0U2l6ZSA9IGZ1bmN0aW9uKGZvbnRTaXplKSB7XHJcbiAgICB0aGlzLl9mb250U2l6ZSA9IGZvbnRTaXplO1xyXG4gICAgdGhpcy5fY2FsY3VsYXRlTWV0cmljcyh0cnVlKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTZXQgcm90YXRpb24gb2YgdGV4dFxyXG4gKiBAcHVibGljXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBhbmdsZSBSb3RhdGlvbiBpbiByYWRpYW5zXHJcbiAqL1xyXG5CYm94QWxpZ25lZFRleHQucHJvdG90eXBlLnNldFJvdGF0aW9uID0gZnVuY3Rpb24oYW5nbGUpIHtcclxuICAgIHRoaXMuX3JvdGF0aW9uID0gYW5nbGU7XHJcbn07XHJcblxyXG4vKipcclxuICogU2V0IGFuY2hvciBwb2ludCBmb3IgdGV4dCAoaG9yaXpvbmFsIGFuZCB2ZXJ0aWNhbCBhbGlnbm1lbnQpIHJlbGF0aXZlIHRvXHJcbiAqIGJvdW5kaW5nIGJveFxyXG4gKiBAcHVibGljXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBbaEFsaWduPUNFTlRFUl0gSG9yaXpvbmFsIGFsaWdubWVudFxyXG4gKiBAcGFyYW0ge3N0cmluZ30gW3ZBbGlnbj1DRU5URVJdIFZlcnRpY2FsIGJhc2VsaW5lXHJcbiAqL1xyXG5CYm94QWxpZ25lZFRleHQucHJvdG90eXBlLnNldEFuY2hvciA9IGZ1bmN0aW9uKGhBbGlnbiwgdkFsaWduKSB7XHJcbiAgICB0aGlzLl9oQWxpZ24gPSBoQWxpZ24gfHwgQmJveEFsaWduZWRUZXh0LkFMSUdOLkNFTlRFUjtcclxuICAgIHRoaXMuX3ZBbGlnbiA9IHZBbGlnbiB8fCBCYm94QWxpZ25lZFRleHQuQkFTRUxJTkUuQ0VOVEVSO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEdldCB0aGUgYm91bmRpbmcgYm94IHdoZW4gdGhlIHRleHQgaXMgcGxhY2VkIGF0IHRoZSBzcGVjaWZpZWQgY29vcmRpbmF0ZXMuXHJcbiAqIE5vdGU6IHRoaXMgaXMgdGhlIHVucm90YXRlZCBib3VuZGluZyBib3ghIFRPRE86IEZpeCB0aGlzLlxyXG4gKiBAcGFyYW0gIHtudW1iZXJ9IHggWCBjb29yZGluYXRlXHJcbiAqIEBwYXJhbSAge251bWJlcn0geSBZIGNvb3JkaW5hdGVcclxuICogQHJldHVybiB7b2JqZWN0fSAgIFJldHVybnMgYW4gb2JqZWN0IHdpdGggcHJvcGVydGllczogeCwgeSwgdywgaFxyXG4gKi9cclxuQmJveEFsaWduZWRUZXh0LnByb3RvdHlwZS5nZXRCYm94ID0gZnVuY3Rpb24oeCwgeSkge1xyXG4gICAgdmFyIHBvcyA9IHRoaXMuX2NhbGN1bGF0ZUFsaWduZWRDb29yZHMoeCwgeSk7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHg6IHBvcy54ICsgdGhpcy5fYm91bmRzT2Zmc2V0LngsXHJcbiAgICAgICAgeTogcG9zLnkgKyB0aGlzLl9ib3VuZHNPZmZzZXQueSxcclxuICAgICAgICB3OiB0aGlzLndpZHRoLFxyXG4gICAgICAgIGg6IHRoaXMuaGVpZ2h0XHJcbiAgICB9O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEdldCBhbiBhcnJheSBvZiBwb2ludHMgdGhhdCBmb2xsb3cgYWxvbmcgdGhlIHRleHQgcGF0aC4gVGhpcyB3aWxsIHRha2UgaW50b1xyXG4gKiBjb25zaWRlcmF0aW9uIHRoZSBjdXJyZW50IGFsaWdubWVudCBzZXR0aW5ncy5cclxuICogTm90ZTogdGhpcyBpcyBhIHRoaW4gd3JhcHBlciBhcm91bmQgYSBwNSBtZXRob2QgYW5kIGRvZXNuJ3QgaGFuZGxlIHVucm90YXRlZFxyXG4gKiB0ZXh0ISBUT0RPOiBGaXggdGhpcy5cclxuICogQHBhcmFtICB7bnVtYmVyfSB4ICAgICAgICAgWCBjb29yZGluYXRlXHJcbiAqIEBwYXJhbSAge251bWJlcn0geSAgICAgICAgIFkgY29vcmRpbmF0ZVxyXG4gKiBAcGFyYW0gIHtvYmplY3R9IFtvcHRpb25zXSBBbiBvYmplY3QgdGhhdCBjYW4gaGF2ZTpcclxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgLSBzYW1wbGVGYWN0b3I6IHJhdGlvIG9mIHBhdGgtbGVuZ3RoIHRvIG51bWJlciBvZlxyXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNhbXBsZXMgKGRlZmF1bHQ9MC4yNSkuIEhpZ2hlciB2YWx1ZXMgeWllbGQgbW9yZVxyXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvaW50cyBhbmQgYXJlIHRoZXJlZm9yZSBtb3JlIHByZWNpc2UuIFxyXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAtIHNpbXBsaWZ5VGhyZXNob2xkOiBpZiBzZXQgdG8gYSBub24temVybyB2YWx1ZSxcclxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xsaW5lYXIgcG9pbnRzIHdpbGwgYmUgcmVtb3ZlZC4gVGhlIHZhbHVlIFxyXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcHJlc2VudHMgdGhlIHRocmVzaG9sZCBhbmdsZSB0byB1c2Ugd2hlblxyXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRldGVybWluaW5nIHdoZXRoZXIgdHdvIGVkZ2VzIGFyZSBjb2xsaW5lYXIuXHJcbiAqIEByZXR1cm4ge2FycmF5fSBBbiBhcnJheSBvZiBwb2ludHMsIGVhY2ggd2l0aCB4LCB5ICYgYWxwaGEgKHRoZSBwYXRoIGFuZ2xlKVxyXG4gKi9cclxuQmJveEFsaWduZWRUZXh0LnByb3RvdHlwZS5nZXRUZXh0UG9pbnRzID0gZnVuY3Rpb24oeCwgeSwgb3B0aW9ucykge1xyXG4gICAgdmFyIHBvaW50cyA9IHRoaXMuX2ZvbnQudGV4dFRvUG9pbnRzKHRoaXMuX3RleHQsIHgsIHksIHRoaXMuX2ZvbnRTaXplLCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25zKTtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcG9pbnRzLmxlbmd0aDsgaSArPSAxKSB7XHJcbiAgICAgICAgdmFyIHBvcyA9IHRoaXMuX2NhbGN1bGF0ZUFsaWduZWRDb29yZHMocG9pbnRzW2ldLngsIHBvaW50c1tpXS55KTtcclxuICAgICAgICBwb2ludHNbaV0ueCA9IHBvcy54O1xyXG4gICAgICAgIHBvaW50c1tpXS55ID0gcG9zLnk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcG9pbnRzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIERyYXdzIHRoZSB0ZXh0IHBhcnRpY2xlIHdpdGggdGhlIHNwZWNpZmllZCBzdHlsZSBwYXJhbWV0ZXJzLiBOb3RlOiB0aGlzIGlzXHJcbiAqIGdvaW5nIHRvIHNldCB0aGUgdGV4dEZvbnQsIHRleHRTaXplICYgcm90YXRpb24gYmVmb3JlIGRyYXdpbmcuIFlvdSBzaG91bGQgc2V0XHJcbiAqIHRoZSBjb2xvci9zdHJva2UvZmlsbCB0aGF0IHlvdSB3YW50IGJlZm9yZSBkcmF3aW5nLiBUaGlzIGZ1bmN0aW9uIHdpbGwgY2xlYW5cclxuICogdXAgYWZ0ZXIgaXRzZWxmIGFuZCByZXNldCBzdHlsaW5nIGJhY2sgdG8gd2hhdCBpdCB3YXMgYmVmb3JlIGl0IHdhcyBjYWxsZWQuXHJcbiAqIEBwdWJsaWNcclxuICogQHBhcmFtICB7bnVtYmVyfSAgW3g9MF0gICAgICAgICAgICAgIFggY29vcmRpbmF0ZSBvZiB0ZXh0IGFuY2hvclxyXG4gKiBAcGFyYW0gIHtudW1iZXJ9ICBbeT0wXSAgICAgICAgICAgICAgWSBjb29yZGluYXRlIG9mIHRleHQgYW5jaG9yXHJcbiAqIEBwYXJhbSAge2Jvb2xlYW59IFtkcmF3Qm91bmRzPWZhbHNlXSBGbGFnIGZvciBkcmF3aW5nIGJvdW5kaW5nIGJveFxyXG4gKi9cclxuQmJveEFsaWduZWRUZXh0LnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oeCwgeSwgZHJhd0JvdW5kcykge1xyXG4gICAgZHJhd0JvdW5kcyA9IGRyYXdCb3VuZHMgfHwgZmFsc2U7XHJcbiAgICB2YXIgcG9zID0ge1xyXG4gICAgICAgIHg6ICh4ICE9PSB1bmRlZmluZWQpID8geCA6IDAsIFxyXG4gICAgICAgIHk6ICh5ICE9PSB1bmRlZmluZWQpID8geSA6IDBcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5wLnB1c2goKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX3JvdGF0aW9uKSB7XHJcbiAgICAgICAgICAgIHBvcyA9IHRoaXMuX2NhbGN1bGF0ZVJvdGF0ZWRDb29yZHMocG9zLngsIHBvcy55LCB0aGlzLl9yb3RhdGlvbik7XHJcbiAgICAgICAgICAgIHRoaXMucC5yb3RhdGUodGhpcy5fcm90YXRpb24pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcG9zID0gdGhpcy5fY2FsY3VsYXRlQWxpZ25lZENvb3Jkcyhwb3MueCwgcG9zLnkpO1xyXG5cclxuICAgICAgICB0aGlzLnAudGV4dEFsaWduKHRoaXMucC5MRUZULCB0aGlzLnAuQkFTRUxJTkUpO1xyXG4gICAgICAgIHRoaXMucC50ZXh0Rm9udCh0aGlzLl9mb250KTtcclxuICAgICAgICB0aGlzLnAudGV4dFNpemUodGhpcy5fZm9udFNpemUpO1xyXG4gICAgICAgIHRoaXMucC50ZXh0KHRoaXMuX3RleHQsIHBvcy54LCBwb3MueSk7XHJcblxyXG4gICAgICAgIGlmIChkcmF3Qm91bmRzKSB7XHJcbiAgICAgICAgICAgIHRoaXMucC5zdHJva2UoMjAwKTtcclxuICAgICAgICAgICAgdmFyIGJvdW5kc1ggPSBwb3MueCArIHRoaXMuX2JvdW5kc09mZnNldC54O1xyXG4gICAgICAgICAgICB2YXIgYm91bmRzWSA9IHBvcy55ICsgdGhpcy5fYm91bmRzT2Zmc2V0Lnk7XHJcbiAgICAgICAgICAgIHRoaXMucC5ub0ZpbGwoKTtcclxuICAgICAgICAgICAgdGhpcy5wLnJlY3QoYm91bmRzWCwgYm91bmRzWSwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpOyAgICAgICAgICAgIFxyXG4gICAgICAgIH1cclxuXHJcbiAgICB0aGlzLnAucG9wKCk7XHJcbn07XHJcblxyXG4vKipcclxuICogUHJvamVjdCB0aGUgY29vcmRpbmF0ZXMgKHgsIHkpIGludG8gYSByb3RhdGVkIGNvb3JkaW5hdGUgc3lzdGVtXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAge251bWJlcn0geCAgICAgWCBjb29yZGluYXRlIChpbiB1bnJvdGF0ZWQgc3BhY2UpXHJcbiAqIEBwYXJhbSAge251bWJlcn0geSAgICAgWSBjb29yZGluYXRlIChpbiB1bnJvdGF0ZWQgc3BhY2UpXHJcbiAqIEBwYXJhbSAge251bWJlcn0gYW5nbGUgUmFkaWFucyBvZiByb3RhdGlvbiB0byBhcHBseVxyXG4gKiBAcmV0dXJuIHtvYmplY3R9ICAgICAgIE9iamVjdCB3aXRoIHggJiB5IHByb3BlcnRpZXNcclxuICovXHJcbkJib3hBbGlnbmVkVGV4dC5wcm90b3R5cGUuX2NhbGN1bGF0ZVJvdGF0ZWRDb29yZHMgPSBmdW5jdGlvbiAoeCwgeSwgYW5nbGUpIHsgIFxyXG4gICAgdmFyIHJ4ID0gTWF0aC5jb3MoYW5nbGUpICogeCArIE1hdGguY29zKE1hdGguUEkgLyAyIC0gYW5nbGUpICogeTtcclxuICAgIHZhciByeSA9IC1NYXRoLnNpbihhbmdsZSkgKiB4ICsgTWF0aC5zaW4oTWF0aC5QSSAvIDIgLSBhbmdsZSkgKiB5O1xyXG4gICAgcmV0dXJuIHt4OiByeCwgeTogcnl9O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENhbGN1bGF0ZXMgZHJhdyBjb29yZGluYXRlcyBmb3IgdGhlIHRleHQsIGFsaWduaW5nIGJhc2VkIG9uIHRoZSBib3VuZGluZyBib3guXHJcbiAqIFRoZSB0ZXh0IGlzIGV2ZW50dWFsbHkgZHJhd24gd2l0aCBjYW52YXMgYWxpZ25tZW50IHNldCB0byBsZWZ0ICYgYmFzZWxpbmUsIHNvXHJcbiAqIHRoaXMgZnVuY3Rpb24gdGFrZXMgYSBkZXNpcmVkIHBvcyAmIGFsaWdubWVudCBhbmQgcmV0dXJucyB0aGUgYXBwcm9wcmlhdGVcclxuICogY29vcmRpbmF0ZXMgZm9yIHRoZSBsZWZ0ICYgYmFzZWxpbmUuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAge251bWJlcn0geCAgICAgIFggY29vcmRpbmF0ZVxyXG4gKiBAcGFyYW0gIHtudW1iZXJ9IHkgICAgICBZIGNvb3JkaW5hdGVcclxuICogQHJldHVybiB7b2JqZWN0fSAgICAgICAgT2JqZWN0IHdpdGggeCAmIHkgcHJvcGVydGllc1xyXG4gKi9cclxuQmJveEFsaWduZWRUZXh0LnByb3RvdHlwZS5fY2FsY3VsYXRlQWxpZ25lZENvb3JkcyA9IGZ1bmN0aW9uKHgsIHkpIHtcclxuICAgIHZhciBuZXdYLCBuZXdZO1xyXG4gICAgc3dpdGNoICh0aGlzLl9oQWxpZ24pIHtcclxuICAgICAgICBjYXNlIEJib3hBbGlnbmVkVGV4dC5BTElHTi5CT1hfTEVGVDpcclxuICAgICAgICAgICAgbmV3WCA9IHg7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgQmJveEFsaWduZWRUZXh0LkFMSUdOLkJPWF9DRU5URVI6XHJcbiAgICAgICAgICAgIG5ld1ggPSB4IC0gdGhpcy5oYWxmV2lkdGg7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgQmJveEFsaWduZWRUZXh0LkFMSUdOLkJPWF9SSUdIVDpcclxuICAgICAgICAgICAgbmV3WCA9IHggLSB0aGlzLndpZHRoO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICBuZXdYID0geDtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJVbnJlY29nbml6ZWQgaG9yaXpvbmFsIGFsaWduOlwiLCB0aGlzLl9oQWxpZ24pO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgIH1cclxuICAgIHN3aXRjaCAodGhpcy5fdkFsaWduKSB7XHJcbiAgICAgICAgY2FzZSBCYm94QWxpZ25lZFRleHQuQkFTRUxJTkUuQk9YX1RPUDpcclxuICAgICAgICAgICAgbmV3WSA9IHkgLSB0aGlzLl9ib3VuZHNPZmZzZXQueTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBCYm94QWxpZ25lZFRleHQuQkFTRUxJTkUuQk9YX0NFTlRFUjpcclxuICAgICAgICAgICAgbmV3WSA9IHkgKyB0aGlzLl9kaXN0QmFzZVRvTWlkO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIEJib3hBbGlnbmVkVGV4dC5CQVNFTElORS5CT1hfQk9UVE9NOlxyXG4gICAgICAgICAgICBuZXdZID0geSAtIHRoaXMuX2Rpc3RCYXNlVG9Cb3R0b207XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgQmJveEFsaWduZWRUZXh0LkJBU0VMSU5FLkZPTlRfQ0VOVEVSOlxyXG4gICAgICAgICAgICAvLyBIZWlnaHQgaXMgYXBwcm94aW1hdGVkIGFzIGFzY2VudCArIGRlc2NlbnRcclxuICAgICAgICAgICAgbmV3WSA9IHkgLSB0aGlzLl9kZXNjZW50ICsgKHRoaXMuX2FzY2VudCArIHRoaXMuX2Rlc2NlbnQpIC8gMjtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBCYm94QWxpZ25lZFRleHQuQkFTRUxJTkUuQUxQSEFCRVRJQzpcclxuICAgICAgICAgICAgbmV3WSA9IHk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIG5ld1kgPSB5O1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIlVucmVjb2duaXplZCB2ZXJ0aWNhbCBhbGlnbjpcIiwgdGhpcy5fdkFsaWduKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICB9XHJcbiAgICByZXR1cm4ge3g6IG5ld1gsIHk6IG5ld1l9O1xyXG59O1xyXG5cclxuXHJcbi8qKlxyXG4gKiBDYWxjdWxhdGVzIGJvdW5kaW5nIGJveCBhbmQgdmFyaW91cyBtZXRyaWNzIGZvciB0aGUgY3VycmVudCB0ZXh0IGFuZCBmb250XHJcbiAqIEBwcml2YXRlXHJcbiAqL1xyXG5CYm94QWxpZ25lZFRleHQucHJvdG90eXBlLl9jYWxjdWxhdGVNZXRyaWNzID0gZnVuY3Rpb24oc2hvdWxkVXBkYXRlSGVpZ2h0KSB7ICBcclxuICAgIC8vIHA1IDAuNS4wIGhhcyBhIGJ1ZyAtIHRleHQgYm91bmRzIGFyZSBjbGlwcGVkIGJ5ICgwLCAwKVxyXG4gICAgLy8gQ2FsY3VsYXRpbmcgYm91bmRzIGhhY2tcclxuICAgIHZhciBib3VuZHMgPSB0aGlzLl9mb250LnRleHRCb3VuZHModGhpcy5fdGV4dCwgMTAwMCwgMTAwMCwgdGhpcy5fZm9udFNpemUpO1xyXG4gICAgLy8gQm91bmRzIGlzIGEgcmVmZXJlbmNlIC0gaWYgd2UgbWVzcyB3aXRoIGl0IGRpcmVjdGx5LCB3ZSBjYW4gbWVzcyB1cCBcclxuICAgIC8vIGZ1dHVyZSB2YWx1ZXMhIChJdCBjaGFuZ2VzIHRoZSBiYm94IGNhY2hlIGluIHA1LilcclxuICAgIGJvdW5kcyA9IHsgXHJcbiAgICAgICAgeDogYm91bmRzLnggLSAxMDAwLCBcclxuICAgICAgICB5OiBib3VuZHMueSAtIDEwMDAsIFxyXG4gICAgICAgIHc6IGJvdW5kcy53LCBcclxuICAgICAgICBoOiBib3VuZHMuaCBcclxuICAgIH07IFxyXG5cclxuICAgIGlmIChzaG91bGRVcGRhdGVIZWlnaHQpIHtcclxuICAgICAgICB0aGlzLl9hc2NlbnQgPSB0aGlzLl9mb250Ll90ZXh0QXNjZW50KHRoaXMuX2ZvbnRTaXplKTtcclxuICAgICAgICB0aGlzLl9kZXNjZW50ID0gdGhpcy5fZm9udC5fdGV4dERlc2NlbnQodGhpcy5fZm9udFNpemUpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFVzZSBib3VuZHMgdG8gY2FsY3VsYXRlIGZvbnQgbWV0cmljc1xyXG4gICAgdGhpcy53aWR0aCA9IGJvdW5kcy53O1xyXG4gICAgdGhpcy5oZWlnaHQgPSBib3VuZHMuaDtcclxuICAgIHRoaXMuaGFsZldpZHRoID0gdGhpcy53aWR0aCAvIDI7XHJcbiAgICB0aGlzLmhhbGZIZWlnaHQgPSB0aGlzLmhlaWdodCAvIDI7XHJcbiAgICB0aGlzLl9ib3VuZHNPZmZzZXQgPSB7IHg6IGJvdW5kcy54LCB5OiBib3VuZHMueSB9O1xyXG4gICAgdGhpcy5fZGlzdEJhc2VUb01pZCA9IE1hdGguYWJzKGJvdW5kcy55KSAtIHRoaXMuaGFsZkhlaWdodDtcclxuICAgIHRoaXMuX2Rpc3RCYXNlVG9Cb3R0b20gPSB0aGlzLmhlaWdodCAtIE1hdGguYWJzKGJvdW5kcy55KTtcclxufTsiXX0=
