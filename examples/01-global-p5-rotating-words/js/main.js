// Including dest/bbox-aligned-text.js in a script tag in the HTML gives us
// access to a global constructor function: BboxAlignedText

// Globals
var bboxText;
var string = "Hey!";
var logoText = "String";
var fontSize = 70;
var fontPath = "fonts/leaguegothic-regular-webfont.ttf";

// Pull out the possible alignment values, so that they can be looped through
// inside of draw
var hAligns = [BboxAlignedText.ALIGN.LEFT, BboxAlignedText.ALIGN.CENTER, 
               BboxAlignedText.ALIGN.RIGHT];
var vAligns = [BboxAlignedText.BASELINE.TOP, BboxAlignedText.BASELINE.CENTER, 
               BboxAlignedText.BASELINE.ALPHABETIC, 
               BboxAlignedText.BASELINE.BOTTOM];

function preload() {
    font = loadFont(fontPath);
}

function setup() {
    createCanvas(800, 800);    
    bboxText = new BboxAlignedText(font, string, fontSize);
}

function draw() {
    background(255);

    var elapsedSeconds = millis() / 1000;
    var rotationSpeed = TWO_PI / 6; // Rotations per second
    var rotation = elapsedSeconds * rotationSpeed;

    for (var h = 0; h < 3; h += 1) {
        for (var v = 0; v < 4; v += 1) {
            var hAlign = hAligns[h];
            var vAlign = vAligns[v];

            // Get an (x, y) coordinate that is evenly spaced 
            var x = map(h, 0, hAligns.length - 1, 125, width - 125);
            var y = map(v, 0, vAligns.length - 1, 100, height - 100);

            fill("#00A8EA");
            noStroke();
            bboxText.setRotation(rotation);
            bboxText.setAnchor(hAlign, vAlign);
            bboxText.draw(x, y, true);

            stroke(0);
            fill("#FF8132");
            ellipse(x, y, 8, 8);
        }
    }
}