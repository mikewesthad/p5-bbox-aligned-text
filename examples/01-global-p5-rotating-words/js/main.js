// Including dest/bbox-aligned-text.js in a script tag in the HTML gives us
// access to a global constructor function: BboxAlignedText

// Globals
var bboxText, labelText;
var string = "Hey!";
var fontSize = 70;
var fontPath = "fonts/leaguegothic-regular-webfont.ttf";

// Pull out the possible alignment values, so that they can be looped through
// inside of draw
var hAligns = [BboxAlignedText.ALIGN.BOX_LEFT, BboxAlignedText.ALIGN.BOX_CENTER,
               BboxAlignedText.ALIGN.BOX_RIGHT];
var vAligns = [BboxAlignedText.BASELINE.BOX_TOP,
               BboxAlignedText.BASELINE.BOX_CENTER,
               BboxAlignedText.BASELINE.FONT_CENTER,
               BboxAlignedText.BASELINE.ALPHABETIC,
               BboxAlignedText.BASELINE.BOX_BOTTOM];

function preload() {
    font = loadFont(fontPath);
}

function setup() {
    createCanvas(800, 800);

    // Create the bbox text
    bboxText = new BboxAlignedText(font, string, fontSize);

    // Create a bboxLabel to be used to display alignment labels above text
    bboxLabel = new BboxAlignedText(font, "label", 16);
    bboxLabel.setAnchor(BboxAlignedText.ALIGN.BOX_CENTER,
                        BboxAlignedText.BASELINE.BOX_BOTTOM);
}

function draw() {
    background(255);

    var elapsedSeconds = millis() / 1000;
    var rotationSpeed = TWO_PI / 6; // Rotations per second
    var rotation = elapsedSeconds * rotationSpeed;

    for (var h = 0; h < hAligns.length; h += 1) {
        for (var v = 0; v < vAligns.length; v += 1) {
            // Pull out the alignment values
            var hAlign = hAligns[h];
            var vAlign = vAligns[v];

            // Get an (x, y) anchor coordinate, evenly spaced across screen 
            var x = map(h, 0, hAligns.length - 1, 125, width - 125);
            var y = map(v, 0, vAligns.length - 1, 100, height - 100);

            // Draw a label saying what the anchor point is
            fill(150);
            noStroke();
            bboxLabel.setText(hAlign + " - " + vAlign);
            bboxLabel.draw(x, y - 50);

            // Draw the text
            fill("#00A8EA");
            noStroke();
            bboxText.setRotation(rotation);
            bboxText.setAnchor(hAlign, vAlign);
            bboxText.draw(x, y, true);

            // Draw the anchor point
            stroke(0);
            fill("#FF8132");
            ellipse(x, y, 8, 8);
        }
    }
}