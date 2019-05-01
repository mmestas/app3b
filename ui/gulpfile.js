var gulp = require("gulp");
var gulpif = require('gulp-if');
var htmlmin = require('gulp-htmlmin');
var ngAnnotate = require('gulp-ng-annotate');
var cleanCss = require('gulp-clean-css');
var rev = require('gulp-rev');
var del = require('del');
var useref = require('gulp-useref');
var revReplace = require('gulp-rev-replace');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps')
var lazypipe = require('lazypipe');
const sass = require("gulp-sass");
const watchSass = require("gulp-watch-sass");

gulp.task('build', ['clean-build'], function () {
	return gulp.src('./index.html')
		.pipe(useref({}, lazypipe().pipe(sourcemaps.init, { loadMaps: true })))
		.pipe(gulpif('*.js',ngAnnotate()))
		.pipe(gulpif('*.js',uglify({
			mangle: false,
		})))
		.pipe(gulpif('*.css', cleanCss()))
		.pipe(gulpif('**/*.{js,css}', rev()))
		.pipe(revReplace())
		//.pipe(sourcemaps.write('maps'))
		.pipe(gulp.dest('build'))
});

gulp.task('clean-build', function () {
	return del([
		'build/*'
	]);
});


gulp.task('copy-app', ['clean-build'], function () {
	return gulp.src('app/**/*.html')
		//.pipe(htmlmin({ collapseWhitespace: true }))
		.pipe(gulp.dest('build/app'));
});

gulp.task('copy', ['clean-build'], function () {
	return gulp.src([
		'./img/**',
		'./favicon.ico',
		'./web.config'
	], { base: "." })
		.pipe(gulp.dest('./build'));
});

gulp.task('copy-fonts', ['build'], function () {
	return gulp.src('css/libraries/fonts/**')
		.pipe(gulp.dest('build/css/fonts'));
});

gulp.task('copy-env', ['build'], function () {
	return gulp.src('app/env-prod.js')
		.pipe(rename('env.js'))
		.pipe(gulp.dest('build/app'));
});

gulp.task('copy-env-uat', ['build'], function () {
	return gulp.src('app/env-uat.js')
		.pipe(rename('env.js'))
		.pipe(gulp.dest('build/app'));
});

gulp.task('copy-charts', ['build'], function () {
	return gulp.src(['js/Chart.min.js', 'js/chartjs-plugin-datalabels.min.js'])
		.pipe(gulp.dest('build/js'));
});

gulp.task('default', ['clean-build', 'copy-app', 'copy-charts', 'copy', 'build', 'copy-fonts', 'copy-env']);
gulp.task('build-uat', ['clean-build', 'copy-app', 'copy-charts', 'copy', 'build', 'copy-fonts', 'copy-env-uat']);

gulp.task('sass', function(){
  return gulp.src('./sass/appName.scss')
    .pipe(sass())
    .pipe(gulp.dest('./css'))
});

gulp.task("sass:watch", () => watchSass([
  "./sass/**/*.{scss,css}"
])
  .pipe(sass())
  .pipe(gulp.dest("./css")));
