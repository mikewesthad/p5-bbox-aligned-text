// -- SETUP --------------------------------------------------------------------

var gulp = require("gulp");
var sourcemaps = require("gulp-sourcemaps");
var liveReload = require("gulp-livereload");
var uglify = require("gulp-uglify");
var newer = require("gulp-newer");
var ghPages = require("gulp-gh-pages");
var open = require("gulp-open");
var gutil = require("gulp-util");
var jshint = require("gulp-jshint"); // Requires npm jshint
var stylish = require("jshint-stylish");
var browserify = require("browserify");
var source = require("vinyl-source-stream");
var buffer = require("vinyl-buffer");
var del = require("del");
var express = require("express");
var path = require("path");
var fs = require("fs");
var runSequence = require("run-sequence");
var gulpif = require("gulp-if");
var rename = require("gulp-rename");
var exec = require('child_process').exec;

// Check the command line to see if this is a production build
var isProduction = (gutil.env.p || gutil.env.production);
console.log("Build environment: " + (isProduction ? "production" : "debug"));


// -- PATHS --------------------------------------------------------------------

var globalName = "BboxAlignedText";
var mainFilename = "bbox-aligned-text.js";
var paths = {
    examples: "examples/",
    jsLib: ["lib/**/*.js"],
    jsEntry: ["lib/" + mainFilename],
    dest: "dist",
    jsdoc: {
        config: "conf.json",
        entry: "lib/",
        dest: "docs/",
        staticFiles: "docs/static-files",
        template: "node_modules/ink-docstrap/template"
    }
};


// -- BUILD TASKS --------------------------------------------------------------
// These gulp tasks take everything that is in src/, process them and output
// them into lib/.

// Combine, sourcemap and uglify JS libraries into main.js. This uses browserify
// (CommonJS-style modules).
gulp.task("js-browserify", function() {
    var b = browserify({
        entries: paths.jsEntry,
        debug: true,
        // Build module in a universal way, so that it can be loaded with
        // CommonJS or can be loaded to a global variable
        standalone: globalName 
    })
    return b.bundle()
        .on("error", function (err) {
            gutil.log(err);
            this.emit("end");
        })
        .pipe(source(mainFilename))
        .pipe(buffer())
        .pipe(gulp.dest(paths.dest))
        .pipe(sourcemaps.init({ loadMaps: true }))
            .pipe(uglify())
            .on("error", gutil.log)
        .pipe(sourcemaps.write())
        .pipe(rename({ extname: ".min.js" }))
        .pipe(gulp.dest(paths.dest))
        .pipe(liveReload());
});

// Lint only our custom JS.
gulp.task("jslint", function() {
    return gulp.src(paths.jsLib)
        .pipe(jshint())
        .pipe(jshint.reporter(stylish));
});

// Run jsdoc from terminal
gulp.task("jsdoc", function (callback) {
    var commands = [
        "jsdoc",
        paths.jsdoc.entry,
        "--configure " + paths.jsdoc.config,
        "--destination " + paths.jsdoc.dest,
        "--template " + paths.jsdoc.template
    ];
    exec(commands.join(" "), function (err, stdout, stderr) {
        if (err) callback(err);
        callback();
    });
});

// Copy any static files needed for jsdoc (images/etc.). The static options that
// jsdoc provides don't give enough control over src->dest paths.
gulp.task("jsdoc-static", function (callback) {
    return gulp.src("images/**", { base: "." })
        .pipe(gulp.dest("docs/"));
});

// The build task will run all the individual build-related tasks above.
gulp.task("build", [
    "jslint",
    "js-browserify",
    "jsdoc",
    "jsdoc-static"
]);


// -- RUNNING TASKS ------------------------------------------------------------
// These gulp tasks handle everything related to running the lib.  Starting a
// local server, watching for changes to files, opening a browser, etc.

// Watch for changes and then trigger the appropraite build task.  This also
// starts a LiveReload server that can tell the browser to refresh the page.
gulp.task("watch", function () {
    liveReload.listen(); // Start the LiveReload server
    gulp.watch(paths.jsLib, ["jslint", "js-browserify", "jsdoc"]);
    gulp.watch([paths.jsdoc.config, "README.md"], ["jsdoc"]);
    gulp.watch("images/**", ["jsdoc-static"]);
});

// Start an express server that serves everything in examples/ & dist/ to
// localhost:8080/.
gulp.task("express-server", function () {
    var app = express();
    app.use("/" + paths.examples, express.static(path.join(__dirname, 
                                                           paths.examples)));
    // Serve up dist/ on the server, mounted at "dist/". This way the examples
    // appear to be looking in the right place for the script.
    app.use("/" + paths.dest, express.static(path.join(__dirname, paths.dest)));
    // Serve up the documentation
    app.use("/" + paths.jsdoc.dest, express.static(path.join(__dirname, 
                                                   paths.jsdoc.dest)));
    app.listen(8080);
});

// Automatically open localhost:8080/ in the browser using whatever the default
// browser.
gulp.task("open", function() {
    return gulp.src(__filename)
        .pipe(open({ uri: "http://127.0.0.1:8080/examples" }));
});

// The build task will run all the individual run-related tasks above.
gulp.task("run", [
    "watch",
    "express-server",
    "open"
]);


// -- DEPLOYING TASKS ----------------------------------------------------------
// These gulp tasks handle everything related to deploying the site to live
// server(s).

// Push files in build/ to a gh-pages branch
gulp.task("push:gh-pages", function () {
    return gulp.src(["./examples/**/*.*", "./dist/**/*.*", "./docs/**/*.*"], { base: "." })
        .pipe(ghPages({
            remoteUrl: "https://github.com/mikewesthad/p5-bbox-aligned-text.git"
        }));
});

// Build & deploy build/ folder to gh-pages and then clean up
gulp.task("deploy:gh-pages", function () {
    return runSequence("build", "push:gh-pages", "clean:publish");
});


// -- CLEANING TASKS ----------------------------------------------------------
// These gulp tasks handle deleting files.

// Clean up the dist folder
gulp.task("clean:dist", function () {
    return del(["./dist"]);
});

// Clean up after the gh-pages deploy
gulp.task("clean:publish", function () {
    return del(["./.publish"]);
});

// Clean up the doc's folder
gulp.task("clean:jsdoc", function () {
    return del(["docs/**", "!docs"]);
});


// -- DEFAULT TASK -------------------------------------------------------------
// This gulp task runs automatically when you don't specify task.

// Build and then run it.
gulp.task("default", function(callback) {
    runSequence("build", "run", callback);
});