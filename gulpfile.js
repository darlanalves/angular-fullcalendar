var gulp = require('gulp'),
	util = require('gulp-util'),
	concat = require('gulp-concat'),
	sass = require('gulp-sass'),
	uglify = require('gulp-uglify'),
	rename = require('gulp-rename'),
	templateCache = require('gulp-templatecache'),
	wrap = require('gulp-wrap'),
	pipeline = require('multipipe'),
	colors = util.colors,
	log = util.log,
	spawn = require('child_process').spawn,

	// NOTE: don't join the template strings, it will break Slush!
	wrapper = '(function(undefined){\n\n<' + '%= contents %>\n}());';

gulp.task('min-web', function() {
	var pipe = pipeline(
		gulp.src(['web/module.js', 'web/routes.js', 'web/**/*.js']),
		concat('app.js'),
		wrap(wrapper),
		uglify(),
		gulp.dest('public')
	);

	pipe.on('error', createLogger('min-web'));
	return pipe;
});

gulp.task('min-lib', function() {
	var pipe = pipeline(
		gulp.src(['src/fullcalendar/module.js', 'src/fullcalendar/*.js']),
		concat('fullcalendar.js'),
		wrap(wrapper),
		gulp.dest('dist'),
		uglify(),
		rename({
			suffix: '.min'
		}),
		gulp.dest('dist')
	);

	pipe.on('error', createLogger('min-lib'));
	return pipe;
});

gulp.task('min', ['min-lib', 'min-web']);

gulp.task('sass', function() {
	var pipe = pipeline(
		gulp.src('scss/**/*.scss'),
		sass({
			outputStyle: 'nested',
			errLogToConsole: true
		}),
		concat('app.css'),
		gulp.dest('public')
	);

	pipe.on('error', createLogger('sass'));
	return pipe;
});

gulp.task('mocks', function() {
	var pipe = pipeline(
		gulp.src(['mocks/module.js', 'mocks/**/*.js']),
		concat('mocks.js'),
		wrap(wrapper),
		gulp.dest('public')
	);

	pipe.on('error', createLogger('mocks'));
	return pipe;
})


gulp.task('views', function() {
	var pipe = pipeline(
		gulp.src('views/**/*.html'),
		templateCache({
			output: 'views.js',
			strip: 'views',
			moduleName: 'app',
			minify: {
				collapseBooleanAttributes: true,
				collapseWhitespace: true
			}
		}),
		gulp.dest('public')
	);

	pipe.on('error', createLogger('views'));
	return pipe;
});

gulp.task('serve', function() {
	require('./server');
});

function startTests(confFile) {
	var karma = spawn('./node_modules/karma/bin/karma', ['start', 'test/' + confFile]);

	karma.stderr.on('data', function(data) {
		console.log('' + data);
	});

	karma.stdout.on('data', function(data) {
		console.log('' + data);
	});

	karma.on('close', function(code) {
		if (code !== 0) {
			console.log('Karma exited with code ' + code);
		}
	});

	return karma;
}

gulp.task('test', function() {
	return startTests('lib.conf.js')
});

gulp.task('test-web', function() {
	return startTests('web.conf.js')
});

gulp.task('watch', function() {
	gulp.watch('src/fullcalendar/*.js', ['min-lib']);
	gulp.watch('web/**/*.js', ['min-web']);
	gulp.watch('scss/**/*.scss', ['sass']);
	gulp.watch('views/**/*.html', ['views']);
	gulp.watch('mocks/**/*.js', ['mocks']);
});

gulp.task('build', ['min', 'sass', 'mocks', 'views'])

gulp.task('default', ['min', 'sass', 'mocks', 'views', 'watch']);

function createLogger(name) {
	return function() {
		var i = arguments.length,
			args = new Array(i);

		while (i--) args[i] = arguments[i];

		args.unshift(colors.red('>>' + name) + ': ');
		log.apply(null, args);
	};
}