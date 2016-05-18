p5-bbox-aligned-text
====================

A module for positioning p5.js text based on its bounding box.  [Live demo](https://www.mikewesthad.com/p5-bbox-aligned-text/examples/02-instance-p5-rotating-words/).

[![Example](readme-assets/rotate-demo.gif)](https://www.mikewesthad.com/p5-bbox-aligned-text/examples/02-instance-p5-rotating-words/)

[p5.js](http://p5js.org/) is a wonderful creative coding library for JavaScript. The methods that p5.js provides for text placement (i.e. text anchor points) are based on a font's ascent, descent & baseline (see image below). This is exactly what you want when laying out words as legible text.

Still, there are times when you would want to position text based on its exact bounding box. For example, you might have a particle system where words are particles that you want to position based on the center of the word and/or you want to do collision detection between words. (Demo code coming soon.)

That's what this module provides - an easy way to position (and rotate) p5.js text based on its exact bounding box.

[![Typography metrics](readme-assets/typographic-line-terms.png)](https://en.wikipedia.org/wiki/Typeface)

Installation
------------

**TODO**

Usage
-----

**TODO**

API
===

<a name="BboxAlignedText"></a>

## BboxAlignedText
**Kind**: global class  

* [BboxAlignedText](#BboxAlignedText)
    * [new BboxAlignedText(font, text, [fontSize], [pInstance])](#new_BboxAlignedText_new)
    * _instance_
        * [.setText(string)](#BboxAlignedText+setText)
        * [.setTextSize(fontSize)](#BboxAlignedText+setTextSize)
        * [.setRotation(angle)](#BboxAlignedText+setRotation)
        * [.setAnchor([hAlign], [vAlign])](#BboxAlignedText+setAnchor)
        * [.getBbox(x, y)](#BboxAlignedText+getBbox) ⇒ <code>object</code>
        * [.draw(x, y, [drawBounds])](#BboxAlignedText+draw)
    * _static_
        * [.ALIGN](#BboxAlignedText.ALIGN) : <code>enum</code>
        * [.BASELINE](#BboxAlignedText.BASELINE) : <code>enum</code>

<a name="new_BboxAlignedText_new"></a>

### new BboxAlignedText(font, text, [fontSize], [pInstance])
Creates a new BboxAlignedText object - a text object that can be drawn with
anchor points based on a tight bounding box around the text.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| font | <code>object</code> |  | p5.Font object |
| text | <code>string</code> |  | String to display |
| [fontSize] | <code>number</code> | <code>12</code> | Font size to use for string |
| [pInstance] | <code>object</code> | <code>window</code> | Reference to p5 instance, leave blank if                                    sketch is global |

**Example**  
```js
var font, bboxText;
function preload() {
    font = loadFont("./assets/Regular.ttf");
}
function setup() {
    createCanvas(400, 600);
    background(0);
    
    bboxText = new BboxAlignedText(font, "Hey!", 30);    
    bboxText.setRotation(PI / 4);
    bboxText.setAnchor(BboxAlignedText.ALIGN.CENTER, 
                       BboxAlignedText.BASELINE.CENTER);
    
    fill("#00A8EA");
    noStroke();
    bboxText.draw(width / 2, height / 2, true);
}
```
<a name="BboxAlignedText+setText"></a>

### bboxAlignedText.setText(string)
Set current text

**Kind**: instance method of <code>[BboxAlignedText](#BboxAlignedText)</code>  
**Access:** public  

| Param | Type | Description |
| --- | --- | --- |
| string | <code>string</code> | Text string to display |

<a name="BboxAlignedText+setTextSize"></a>

### bboxAlignedText.setTextSize(fontSize)
Set current text size

**Kind**: instance method of <code>[BboxAlignedText](#BboxAlignedText)</code>  
**Access:** public  

| Param | Type | Description |
| --- | --- | --- |
| fontSize | <code>number</code> | Text size |

<a name="BboxAlignedText+setRotation"></a>

### bboxAlignedText.setRotation(angle)
Set rotation of text

**Kind**: instance method of <code>[BboxAlignedText](#BboxAlignedText)</code>  
**Access:** public  

| Param | Type | Description |
| --- | --- | --- |
| angle | <code>number</code> | Rotation in radians |

<a name="BboxAlignedText+setAnchor"></a>

### bboxAlignedText.setAnchor([hAlign], [vAlign])
Set anchor point for text (horizonal and vertical alignment) relative to
bounding box

**Kind**: instance method of <code>[BboxAlignedText](#BboxAlignedText)</code>  
**Access:** public  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [hAlign] | <code>string</code> | <code>&quot;CENTER&quot;</code> | Horizonal alignment |
| [vAlign] | <code>string</code> | <code>&quot;CENTER&quot;</code> | Vertical baseline |

<a name="BboxAlignedText+getBbox"></a>

### bboxAlignedText.getBbox(x, y) ⇒ <code>object</code>
Get the bounding box when the text is placed at the specified coordinates.
Note: this is the unrotated bounding box!

**Kind**: instance method of <code>[BboxAlignedText](#BboxAlignedText)</code>  
**Returns**: <code>object</code> - Returns an object with properties: x, y, w, h  

| Param | Type | Description |
| --- | --- | --- |
| x | <code>number</code> | X coordinate |
| y | <code>number</code> | Y coordinate |

<a name="BboxAlignedText+draw"></a>

### bboxAlignedText.draw(x, y, [drawBounds])
Draws the text particle with the specified style parameters

**Kind**: instance method of <code>[BboxAlignedText](#BboxAlignedText)</code>  
**Access:** public  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| x | <code>number</code> |  | X coordinate of text anchor |
| y | <code>number</code> |  | Y coordinate of text anchor |
| [drawBounds] | <code>boolean</code> | <code>false</code> | Flag for drawing bounding box |

<a name="BboxAlignedText.ALIGN"></a>

### BboxAlignedText.ALIGN : <code>enum</code>
Vertical alignment values

**Kind**: static enum property of <code>[BboxAlignedText](#BboxAlignedText)</code>  
**Access:** public  
**Read only**: true  
**Properties**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| LEFT | <code>string</code> | <code>&quot;left&quot;</code> | Draw from the left of the bbox |
| CENTER | <code>string</code> | <code>&quot;center&quot;</code> | Draw from the center of the bbox |
| RIGHT | <code>string</code> | <code>&quot;right&quot;</code> | Draw from the right of the bbox |

<a name="BboxAlignedText.BASELINE"></a>

### BboxAlignedText.BASELINE : <code>enum</code>
Baseline alignment values

**Kind**: static enum property of <code>[BboxAlignedText](#BboxAlignedText)</code>  
**Access:** public  
**Read only**: true  
**Properties**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| BOX_TOP | <code>string</code> | <code>&quot;top&quot;</code> | Draw from the top of the bbox |
| BOX_CENTER | <code>string</code> | <code>&quot;center&quot;</code> | Draw from the center of the bbox |
| BOM_BOTTOM | <code>string</code> | <code>&quot;bottom&quot;</code> | Draw from the bottom of the bbox |
| FONT_CENTER | <code>string</code> | <code>&quot;font_center&quot;</code> | Draw from half the height of the font. Specifically the height is calculated as: ascent + descent. |
| ALPHABETIC | <code>string</code> | <code>&quot;alphabetic&quot;</code> | Draw from the the normal font baseline |

