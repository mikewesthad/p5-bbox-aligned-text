// Including dest/bbox-aligned-text.js in a script tag in the HTML gives us
// access to a global constructor function: BboxAlignedText

// Globals
var bboxText, bboxInstructions, bboxLabel, bbox, points;
var string = "Lights!";
var fontSize = 200;
var fontPath = "fonts/leaguegothic-regular-webfont.ttf";

// Pull out the possible alignment values, so that they can be looped through
// inside of draw
var vAligns = [BboxAlignedText.BASELINE.BOX_TOP,
               BboxAlignedText.BASELINE.FONT_CENTER,
               BboxAlignedText.BASELINE.BOX_CENTER,
               BboxAlignedText.BASELINE.ALPHABETIC,
               BboxAlignedText.BASELINE.BOX_BOTTOM];
var hAligns = [BboxAlignedText.ALIGN.BOX_LEFT,
               BboxAlignedText.ALIGN.BOX_CENTER,
               BboxAlignedText.ALIGN.BOX_RIGHT];
var vAlignIndex = 0;
var hAlignIndex = 1;

function preload() {
    font = loadFont(fontPath);
}

function setup() {
    createCanvas(800, 600);

    // Create the bbox text & calculate its current bbox and text points
    bboxText = new BboxAlignedText(font, string, fontSize);
    bboxText.setAnchor(BboxAlignedText.ALIGN.BOX_CENTER,
                       BboxAlignedText.BASELINE.BOX_TOP);
    points = bboxText.getTextPoints(width / 2, height / 2);
    bbox = bboxText.getBbox(width / 2, height / 2);

    // Create a bbox text for instructions
    var instructionText = "(Click to change the alignment)";
    bboxInstructions = new BboxAlignedText(font, instructionText, 30);
    bboxInstructions.setAnchor(BboxAlignedText.ALIGN.BOX_CENTER,
                               BboxAlignedText.BASELINE.BOX_TOP);

    // Create a bbox label that displays the current alignment
    var labelText = hAligns[hAlignIndex] + " - " + vAligns[vAlignIndex];
    bboxLabel = new BboxAlignedText(font, labelText, 30);
    bboxLabel.setAnchor(BboxAlignedText.ALIGN.BOX_CENTER,
                        BboxAlignedText.BASELINE.BOX_BOTTOM);
}

function drawPointsArray(points, color) {
    noStroke();
    fill(color);
    for (var i = 0; i < points.length; i += 1) {
        var point = points[i];
        ellipse(point.x, point.y, 8, 8);
    }
}

function draw() {
    background(0);
    colorMode(RGB, 255);

    // Draw instructions & label
    fill(255);
    noStroke();
    bboxInstructions.draw(width / 2, 20);
    bboxLabel.draw(width / 2, height - 20);
    
    // Draw bbox
    noFill();
    stroke(25);
    strokeWeight(5);
    rect(bbox.x, bbox.y, bbox.w, bbox.h); 

    // Draw points
    // It is easier to manipulate color in HSL for this part
    colorMode(HSL, 360, 100, 100); 
    // Use the current frame number to calculate a value along a sin wave
    var sinValue = sin(frameCount / 8);
    // Map the sinwave to a lightness value - this gives us something that goes
    // from purple to white and back again
    var lightness = map(sinValue, -1, 1, 50, 100);
    var c = color(298, 100, lightness);
    drawPointsArray(points, c);

    // Draw anchor
    fill("hsl(31, 100%, 61%)");
    stroke(0);
    strokeWeight(2);
    ellipse(width / 2, height / 2, 10, 10);
}

function mousePressed() {
    // Change the alignment
    vAlignIndex += 1;
    if (vAlignIndex >= vAligns.length) {
        vAlignIndex = 0;
        hAlignIndex += 1;
        if (hAlignIndex >= hAligns.length) {
            hAlignIndex = 0;
        }
    }

    // Update the bboxText's alignment and recalculate the points & bbox
    var vAlign = vAligns[vAlignIndex];
    var hAlign = hAligns[hAlignIndex];
    bboxText.setAnchor(hAlign, vAlign);
    points = bboxText.getTextPoints(width / 2, height / 2);
    bbox = bboxText.getBbox(width / 2, height / 2);

    // Update the alignment label
    var labelText = hAligns[hAlignIndex] + " - " + vAligns[vAlignIndex];
    bboxLabel = new BboxAlignedText(font, labelText, 30);
}