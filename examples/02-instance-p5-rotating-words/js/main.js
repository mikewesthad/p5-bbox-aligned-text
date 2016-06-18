// Including dest/bbox-aligned-text.js in a script tag in the HTML gives us
// access to a global constructor function: BboxAlignedText

(function () {
    
    // Globals
    var p, bboxText, bboxLabel;
    var string = "Hey!";
    var fontSize = 70;
    var fontPath = "fonts/leaguegothic-regular-webfont.ttf";

    // Pull out the possible alignment values, so that they can be looped
    // through inside of draw
    var hAligns = [BboxAlignedText.ALIGN.BOX_LEFT,
                   BboxAlignedText.ALIGN.BOX_CENTER,
                   BboxAlignedText.ALIGN.BOX_RIGHT];
    var vAligns = [BboxAlignedText.BASELINE.BOX_TOP,
                   BboxAlignedText.BASELINE.BOX_CENTER,
                   BboxAlignedText.BASELINE.FONT_CENTER,
                   BboxAlignedText.BASELINE.ALPHABETIC,
                   BboxAlignedText.BASELINE.BOX_BOTTOM];

    startSketch();

    function startSketch() {
        new p5(function (pInstance) {
            p = pInstance;
            p.preload = preload;
            p.setup = setup;
            p.draw = draw;
        });
    }

    function preload() {
        font = p.loadFont(fontPath);
    }

    function setup() {
        p.createCanvas(800, 800);    

        // Create the bbox text
        bboxText = new BboxAlignedText(font, string, fontSize, 0, 0, p);

        // Create a bboxLabel to be used to display alignment labels above text
        bboxLabel = new BboxAlignedText(font, "label", 16, 0, 0, p)
            .setAnchor(BboxAlignedText.ALIGN.BOX_CENTER,
                BboxAlignedText.BASELINE.BOX_BOTTOM);
    }

    function draw() {
        p.background(255);

        var elapsedSeconds = p.millis() / 1000;
        var rotationSpeed = p.TWO_PI / 6; // Rotations per second
        var rotation = elapsedSeconds * rotationSpeed;

        for (var h = 0; h < hAligns.length; h += 1) {
            for (var v = 0; v < vAligns.length; v += 1) {
                // Pull out the alignment values
                var hAlign = hAligns[h];
                var vAlign = vAligns[v];

                // Get an (x, y) anchor coordinate, evenly spaced across screen 
                var x = p.map(h, 0, hAligns.length - 1, 125, p.width - 125);
                var y = p.map(v, 0, vAligns.length - 1, 100, p.height - 100);

                // Draw a label saying what the anchor point is
                p.fill(150);
                p.noStroke();
                bboxLabel.setText(hAlign + " - " + vAlign)
                    .draw(x, y - 50);

                // Draw the text
                p.fill("#00A8EA");
                p.noStroke();
                bboxText.setRotation(rotation)
                    .setAnchor(hAlign, vAlign)
                    .draw(x, y, true);

                // Draw the anchor point
                p.stroke(0);
                p.fill("#FF8132");
                p.ellipse(x, y, 8, 8);
            }
        }
    }

})();