var config = require('./config.js'),
    fs = require('fs'),
    gulp = require('gulp'),
    replace = require('gulp-replace'),
    file = require('gulp-file'),
    gp_concat = require('gulp-concat'),
    gp_rename = require('gulp-rename'),
    gp_uglify = require('gulp-uglify'),
    gp_concatcss = require('gulp-concat-css'),
    gp_cleancss = require('gulp-clean-css'),
    gp_sourcemaps = require('gulp-sourcemaps');

var jsAssets = [
    'assets/js/spin.js',
    'assets/js/bluebird.js',
    'assets/js/no-conflict.js',
    'assets/js/please-wait.js',
    'assets/js/alertify.js',
    'assets/js/moment.js',
    'assets/js/lz-string.js',
    'assets/js/jquery.js',
    'assets/js/jquery.spin.js',
    'assets/js/selectize.js',
    'assets/js/fullcalendar.js',
    'assets/js/canvas-toBlob.js',
    'assets/js/FileSaver.js',
    'assets/js/dom-to-image.js',
    'assets/js/ics.js',
    'assets/js/plotly-basic.js'
];

var cssAssets = 'assets/css/*.css';

gulp.task('js', function() {
    return gulp.src(jsAssets)
        .pipe(gp_concat('assets.js'))
        .pipe(gulp.dest('public'))
        .pipe(gp_rename('assets.min.js'))
        .pipe(gp_uglify())
        .pipe(gulp.dest('public'));
});

gulp.task('css', function() {
    return gulp.src(cssAssets)
        .pipe(replace('/public/', '/'))
        .pipe(gp_concatcss('style.css'))
        .pipe(gulp.dest('public'))
        .pipe(gp_rename('style.min.css'))
        .pipe(gp_cleancss({compatibility: 'ie8'}))
        .pipe(gulp.dest('public'));
});

gulp.task('fonts', function() {
    return gulp.src('assets/fonts/**/*')
        .pipe(replace('/public/', '/'))
        .pipe(gulp.dest('public/fonts'))
})

gulp.task('static', function() {
    var analytics = '', drift = '';
    if (config.analytics && config.analytics.piwik && config.analytics.piwik.enabled) {
        analytics = fs.readFileSync(__dirname + '/src/static/piwik.tmpl').toString('utf-8');
        analytics = analytics.replace(new RegExp('__ENDPOINT__', 'g'), config.analytics.piwik.endpoint);
        analytics = analytics.replace(new RegExp('__DOMAIN__', 'g'), config.analytics.piwik.domain);
        analytics = analytics.replace(new RegExp('__SITEID__', 'g'), config.analytics.piwik.siteId);
    }    
    if (config.analytics && config.analytics.drift) {
        drift = fs.readFileSync(__dirname + '/src/static/drift.tmpl').toString('utf-8');
        drift = drift.replace('__DRIFT_VERSION__', config.analytics.drift.version);
        drift = drift.replace('__DRIFT_ID__', config.analytics.drift.id);
    }

    return gulp.src(['src/static/index.html'])
	.pipe(replace('__ANALYTICS__', analytics))
	.pipe(replace('__DRIFT__', drift))
	.pipe(replace('__JS__', 'prod.js'))
	.pipe(replace('/public/', '/'))
        .pipe(file('version.json', JSON.stringify(require('./version.json'))))
	.pipe(gulp.dest('public/'));
})

gulp.task('default', gulp.series(gulp.parallel('js', 'css', 'fonts', 'static')), function() {})
