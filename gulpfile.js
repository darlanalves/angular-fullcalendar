/* global require,module,__dirname*/
'use strict';

var events = require('events'),
	gulp = require('gulp'),
	buildEvents = new events.EventEmitter(),
	multipipe = require('multipipe'),
	uglify = require('gulp-uglify'),
	concat = require('gulp-concat'),
	rename = require('gulp-rename'),
	wrap = require('gulp-wrap'),
	filter = require('gulp-filter'),
	karma = require('karma').server,
	bowerFiles = require('main-bower-files'),
	fs = require('fs'),

	renameOptions = {
		suffix: '.min'
	},

	sourceFiles = ['src/module.js', 'src/**/*.js'],

	filterJsFiles = filter('**/*.js', '!**/*.min.js'),

	// NOTE: don't join the template strings, it will break Slush!
	moduleWrapper = '(function(undefined){\n\n<' + '%= contents %>\n}());',
	browserifyWrapper = fs.readFileSync('./browserify-wrapper.js', 'utf8'),
	bundleWrapper = '(function(window, undefined){\n\n<' + '%= contents %>\n}(this));';

browserifyWrapper = browserifyWrapper.replace('# content #', '<' + '%= contents %>');

module.exports = buildEvents;

function taskError(task, error) {
	buildEvents.emit('err', error);
}

function taskDone(task) {
	buildEvents.emit(task);
}

gulp.task('default', ['build', 'test', 'watch']);
gulp.task('test', runKarma);
gulp.task('build:all', ['build', 'build:browserify', 'build:bundle']);
gulp.task('build', buildModuleFile);
gulp.task('build:browserify', buildBrowserifyFile);
gulp.task('build:bundle', buildBundleFile);
gulp.task('minify', minifyModuleFiles);
gulp.task('minify:bundle', minifyBundleFiles);
gulp.task('watch', function() {
	gulp.watch(['src/module.js', 'src/**/*.js'], ['build']);
});

function runKarma(done) {
	karma.start({
		configFile: __dirname + '/test/karma.conf.js',
		singleRun: true
	}, function(exitCode) {
		if (0 === exitCode) {
			taskDone('test');
			done();
		} else {
			var error = new Error('Karma failed: ' + exitCode);
			taskError('test', error);
			done(error);
		}
	});
}

function buildModuleFile(done) {
	var pipe = multipipe(
		gulp.src(sourceFiles),
		concat('module.js'),
		wrap(moduleWrapper),
		gulp.dest('dist/')
	);

	return concatPipe(pipe, done);
}

function buildBrowserifyFile(done) {
	var pipe = multipipe(
		gulp.src(sourceFiles),
		concat('index.js'),
		wrap(browserifyWrapper),
		gulp.dest('dist/')
	);

	return concatPipe(pipe, done);
}

function buildBundleFile(done) {
	var pipe = multipipe(
		gulp.src(bowerFiles()),
		filterJsFiles,
		wrap(moduleWrapper),
		// concat('dependencies.js'),
		gulp.src(sourceFiles),
		concat('bundle.js'),
		wrap(bundleWrapper),
		gulp.dest('dist/')
	);

	pipe.on('error', function(err) {
		taskError('bundle', err);
		done(err);
	});
	pipe.on('end', function() {
		taskDone('bundle');
	});

	return pipe;
}

function concatPipe(pipe, done) {
	pipe.on('error', function(err) {
		taskError('concat', err);
		done(err);
	});

	pipe.on('end', function() {
		taskDone('change');
	});

	return pipe;
}


function minifyModuleFiles(done) {
	return minError(multipipe(
		gulp.src('dist/module.js'),
		uglify(),
		rename(renameOptions),
		gulp.dest('dist/')
	), done);
}


function minifyBundleFiles(done) {
	return minError(multipipe(
		gulp.src('dist/bundle.js'),
		uglify(),
		rename(renameOptions),
		gulp.dest('dist/')
	), done);
}

function minError(pipe, done) {
	pipe.on('error', function(err) {
		taskError('minify', err);
		done(err);
	});

	pipe.on('end', function() {
		taskDone('minify');
	});

	return pipe;
}