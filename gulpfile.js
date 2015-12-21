/* globals require, __dirname  */
/** @namespace gulp.task */
/** @namespace gulp.dest */

var del = require('del');
var path = require('path');
var gulp = require('gulp');
var debug = require('gulp-debug');
var tsc = require("gulp-typescript");
var Server = require('karma').Server;

var lib = {
	main: 'src/main/typescript',
	dist: 'dist/',
	tmp: '.tmp/'
};

gulp.task('ts', function () {
	gulp.src(lib.main + '/**/*.ts')
		.pipe(tsc({
			target: "ES5",
			removeComments: true,
			noImplicitAny: true,
			noEmitOnError: true
		}))
		.pipe(gulp.dest(lib.dist))
});

gulp.task('ts', function () {
	gulp.src(lib.main + '/**/*.ts')
		.pipe(tsc({
			target: "ES5",
			removeComments: false,
			noImplicitAny: true,
			noEmitOnError: true
		}))
		.pipe(gulp.dest(lib.dist))
});

gulp.task('copy', function () {
	gulp.src(lib.main + '/**/EventBus.ts')
		.pipe(gulp.dest(lib.dist))
});

gulp.task('ts:dev', function () {
	var stream = gulp.src(lib.main + '/**/*.ts');
	stream.pipe(tsc({
			target: "ES5",
			removeComments: true,
			noImplicitAny: true,
			noEmitOnError: false
		}))
		.pipe(gulp.dest(lib.tmp));
	return stream;
});

gulp.task('clean', function (done) {
	del([lib.dist + '/**']);
	del([lib.tmp + '/**']);
	done();
});

gulp.task('default', ['clean', 'ts', 'copy']);

gulp.task('watch', function () {
	gulp.watch(lib.main + '/**/*.ts', ['ts:dev']);
});

gulp.task('test', ['ts:dev'], function () {
	new Server({
		configFile: __dirname + '/src/test/typescript/karma.conf.js',
		singleRun: true
	}).start();
});

gulp.task('tdd', ['watch'], function () {
	new Server({
		configFile: __dirname + '/src/test/typescript/karma.conf.js',
		browsers: ['PhantomJS'],
		//browsers: ['Chrome'],
		singleRun: false,
		autoWatch: true
	}).start();
});
