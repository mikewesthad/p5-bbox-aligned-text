Bounding Box Aligned Text
=========================

A JavaScript module for positioning [p5.js](//p5js.org/) text based on its bounding box. If you are looking to go just straight to the API documentation, you'll want to start here: [BboxAlignedText](//mikewesthad.com/p5-bbox-aligned-text/docs/BboxAlignedText.html).

(Note: if you are viewing this on GitHub or NPM, you might want to check out the HTML documentation [here](//mikewesthad.com/p5-bbox-aligned-text/docs/).)

## Introduction

[p5.js](//p5js.org/) is a wonderful creative coding library for JavaScript. The methods that p5.js provides for text placement (i.e. text anchor points) are based on a font's ascent, descent & baseline (see "Typography Metrics"). This is exactly what you want when laying out words as legible text.

Still, there are times when you would want to position text based on its exact bounding box. For example, you might have a particle system where words are particles that you want to position based on the center of the word and/or you want to do collision detection between words. (Demo code coming soon.)

That's what this module provides - an easy way to position (and rotate) p5.js text based on its exact bounding box.

## Examples

Example 1 & 2 [(live demo)](//www.mikewesthad.com/p5-bbox-aligned-text/examples/02-instance-p5-rotating-words/):

[![Example 1 & 2](images/example-2.gif)](//www.mikewesthad.com/p5-bbox-aligned-text/examples/02-instance-p5-rotating-words/)

Example 3 [(live version)](//www.mikewesthad.com/p5-bbox-aligned-text/examples/03-global-p5-text-points/):

[![Example 3](images/example-3.gif)](//www.mikewesthad.com/p5-bbox-aligned-text/examples/03-global-p5-text-points/):

## Typography Metrics

<br>[![Typography metrics](images/typographic-line-terms.png)]](//en.wikipedia.org/wiki/Typeface)

## Installation

### Standalone Script

If you just want the standalone script to drop into a project:

- Unminified: [bbox-aligned-text.js](//mikewesthad.com/p5-bbox-aligned-text/dist/bbox-aligned-text.js)
- Minified: [bbox-aligned-text.min.js](//mikewesthad.com/p5-bbox-aligned-text/dist/bbox-aligned-text.min.js)

### NPM

If you have [Node.js](//nodejs.org/en/) & [NPM](//www.npmjs.com/) (packaged with Node) installed, open a terminal in your project and run:

```
npm install p5-bbox-aligned-text
```

This will install the module in `./node_modules/p5-bbox-aligned-text`. You can then include the code into your project like this:

```
<script src="./node_modules/p5-bbox-aligned-text/dist/p5-bbox-aligned-text/bbox-aligned-text.min.js"></script>
```

Or, if you are using browserify with your project, you can import the constructor function in your JS via:

```
var BboxText = require("p5-bbox-aligned-text");
```

## Full API Documentation

Documentation is online [here](//mikewesthad.com/p5-bbox-aligned-text/docs/BboxAlignedText.html).
