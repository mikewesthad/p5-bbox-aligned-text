/**
 * p5.js Gulp Template
 * 
 * This is a "trimmed," JS-focused gulp recipe.  It's built for use with p5.js,
 * a creative coding library. It's a midway point between a teaching demo and a
 * full "kitchen sink" workflow (leaning closer to the latter than the former).
 */


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

// Check the command line to see if this is a production build
var isProduction = (gutil.env.p || gutil.env.production);
console.log("Build environment: " + (isProduction ? "production" : "debug"));


// -- PATHS --------------------------------------------------------------------

var paths = {
    html: ["src/**/*.html"],
    css: ["src/**/*.css"],
    jsLibs: ["src/js/libs/**/*.js"],
    js: ["src/js/**/*.js", "!src/js/libs/**/*.js"],
    jsEntry: ["src/js/main.js"],
    assets: ["src/assets/**/*.*"],
    dest: "lib"
}


// -- BUILD TASKS --------------------------------------------------------------
// These gulp tasks take everything that is in src/, process them and output
// them into build/.

// Copy HTML & pipe changes to LiveReload to trigger a reload.
gulp.task("copy-html", function () {
    return gulp.src(paths.html)
        .pipe(gulp.dest(paths.dest))
        .pipe(liveReload());
});

// Copy CSS & pipe changes to LiveReload to trigger a reload.
gulp.task("copy-css", function () {
    return gulp.src(paths.css)
        .pipe(gulp.dest(paths.dest))
        .pipe(liveReload());
});

// Copy js/libs & pipe changes to LiveReload to trigger a reload.
gulp.task("copy-js-libs", function () {
    return gulp.src(paths.jsLibs)
        .pipe(gulp.dest(paths.dest + "/js/libs"))
        .pipe(liveReload());
});

// Combine, sourcemap and uglify our JS libraries into main.js. This uses 
// browserify (CommonJS-style modules). 
gulp.task("js", function() {
    var b = browserify({
        entries: paths.jsEntry,
        debug: true
    })
    return b.bundle()
        .on("error", gutil.log)
        .pipe(source("main.js"))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
            // Uglify only if we are in a production build
            .pipe(gulpif(isProduction, uglify()))
            .on("error", gutil.log)
        .pipe(sourcemaps.write("main"))
        .pipe(gulp.dest(paths.dest + "/js"))
        .pipe(liveReload());
});

// Lint only our custom JS.
gulp.task("jslint", function() {
    return gulp.src(paths.js)
        .pipe(jshint())
        .pipe(jshint.reporter(stylish));
});

// Take any (new) assets from src/assets over to build/assets.
gulp.task("assets", function () {
    return gulp.src(paths.assets)
        .pipe(newer(paths.dest + "/assets"))
        .pipe(gulp.dest(paths.dest + "/assets"));
});

// The build task will run all the individual build-related tasks above.
gulp.task("build", [
    "copy-html",
    "copy-css",
    "copy-js-libs",
    "jslint",
    "js",
    "assets"
]);


// -- RUNNING TASKS ------------------------------------------------------------
// These gulp tasks handle everything related to running the site.  Starting a
// local server, watching for changes to files, opening a browser, etc.

// Watch for changes and then trigger the appropraite build task.  This also
// starts a LiveReload server that can tell the browser to refresh the page.
gulp.task("watch", function () {
    liveReload.listen(); // Start the LiveReload server
    gulp.watch(paths.html, ["copy-html"]);
    gulp.watch(paths.css, ["copy-css"]);
    gulp.watch(paths.jsLibs, ["copy-js-libs"]);
    gulp.watch(paths.js, ["jslint", "js"]);
    gulp.watch(paths.assets, ["assets"]);
});

// Start an express server that serves everything in build/ to localhost:8080/.
gulp.task("express-server", function () {
    var app = express();
    app.use(express.static(path.join(__dirname, paths.dest)));
    app.listen(8080);
});

// Automatically open localhost:8080/ in the browser using whatever the default
// browser.
gulp.task("open", function() {
    return gulp.src(__filename)
        .pipe(open({uri: "http://127.0.0.1:8080"}));
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
    return gulp.src("./" + paths.dest + "/**/*")
        .pipe(ghPages({
            // PLACE REAL URL HERE
            remoteUrl: "https://github.com/blahblah/blahblah.git"
        }));
});

// Build & deploy build/ folder to gh-pages and then clean up
gulp.task("deploy:gh-pages", function () {
    return runSequence("build", "push:gh-pages", "clean:publish");
});


// -- CLEANING TASKS ----------------------------------------------------------
// These gulp tasks handle deleting files.

// Delete all of the build folder contents.
gulp.task("clean:build", function () {
    return del(["./" + paths.dest + "/**/*"]);
});

// Clean up after the gh-pages deploy
gulp.task("clean:publish", function () {
    return del(["./.publish"]);
});


// -- DEFAULT TASK -------------------------------------------------------------
// This gulp task runs automatically when you don't specify task.

// Build and then run it.
gulp.task("default", function(callback) {
    runSequence("build", "run", callback);
});