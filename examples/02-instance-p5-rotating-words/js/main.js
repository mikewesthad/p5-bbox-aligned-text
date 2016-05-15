// Including dest/bbox-aligned-text.js in a script tag in the HTML gives us
// access to a global constructor function: BboxAlignedText

(function () {
    
    // Globals
    var bboxText, p;
    var string = "Hey!";
    var logoText = "String";
    var fontSize = 70;
    var fontPath = "fonts/leaguegothic-regular-webfont.ttf";

    // Pull out the possible alignment values, so that they can be looped
    // through inside of draw
    var hAligns = [BboxAlignedText.ALIGN.LEFT, BboxAlignedText.ALIGN.CENTER, 
                   BboxAlignedText.ALIGN.RIGHT];
    var vAligns = [BboxAlignedText.BASELINE.TOP, 
                   BboxAlignedText.BASELINE.CENTER, 
                   BboxAlignedText.BASELINE.ALPHABETIC, 
                   BboxAlignedText.BASELINE.BOTTOM];

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
        bboxText = new BboxAlignedText(font, string, fontSize, p);
    }

    function draw() {
        p.background(255);

        var elapsedSeconds = p.millis() / 1000;
        var rotationSpeed = p.TWO_PI / 6; // Rotations per second
        var rotation = elapsedSeconds * rotationSpeed;

        for (var h = 0; h < 3; h += 1) {
            for (var v = 0; v < 4; v += 1) {
                var hAlign = hAligns[h];
                var vAlign = vAligns[v];

                // Get an (x, y) coordinate that is evenly spaced 
                var x = p.map(h, 0, hAligns.length - 1, 125, p.width - 125);
                var y = p.map(v, 0, vAligns.length - 1, 100, p.height - 100);

                p.fill("#00A8EA");
                p.noStroke();
                bboxText.setRotation(rotation);
                bboxText.setAnchor(hAlign, vAlign);
                bboxText.draw(x, y, true);

                p.stroke(0);
                p.fill("#FF8132");
                p.ellipse(x, y, 8, 8);
            }
        }
    }

})();