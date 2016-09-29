module.exports = (function () {
    'use strict';
    var gutil       = require('gulp-util'),
        vinylPaths  = require("vinyl-paths"),
        gulp        = require('gulp'),
        del         = require("del"),
        rev         = require('gulp-rev'),
        revReplace  = require('gulp-rev-replace'),
        useref      = require('gulp-useref'),
        symlink     = require('gulp-symlink'),
        rename      = require('gulp-rename'),
        angular_templatecache = require('gulp-angular-templatecache'),
        gulpif      = require('gulp-if'),
        filter      = require('gulp-filter'),
        uglify      = require('gulp-uglify'),
        urlAdjuster = require('gulp-modify-css-urls'),
        minifyCss   = require('gulp-minify-css'),
        _           = require('underscore'),
        execEnvs    = require('./apps.js'),

        self,
        builder = {

            appTasks: {},

            execEnvs: {},

            logError: function logError(e) {
                gutil.log(gutil.colors.magenta(e.message + " at " + e.fileName + ":" + e.lineNumber));
                gutil.log(JSON.stringify(e));
                try {
                    return this.end();
                } catch (notEvent) {
                    gutil.log(notEvent);
                }
            },

            doSymlink: function doSymlink(app, env) {
                return gulp
                    .src(
                        [
                            'build/shared/img',
                            'build/shared/fonts'
                        ]
                    ).pipe(
                        symlink(
                            function () {
                                // Here we return a path as string
                                return 'build/' + builder.execEnvs[app][env].target;  //file.path.replace('shared', execEnvs[app][env].target);
                            }
                        )
                    ).on(
                        'end',
                        function () {
                            gutil.log(app + '.' + env + " symlinks created");
                        }
                    );
            },

            copyImages: function copyImages() {
                return gulp
                        .src(
                        'src/img/*'
                    ).pipe(
                        gulp.dest('build/shared/img/')
                    ).on(
                        'end',
                        function () {
                            gutil.log("Images copied");
                        }
                    );
            },

            copyFonts: function copyFonts() {
                return gulp.src(
                    [
                        'src/js/**/*.woff',
                        'src/js/**/*.woff2',
                        'src/js/**/*.eot',
                        'src/js/**/*.svg',
                        'src/js/**/*.ttf'
                    ]
                ).pipe(
                    rename(
                        function (path) {
                            path.dirname = '';
                        }
                    )
                ).pipe(
                    gulp.dest('build/shared/fonts')
                ).on(
                    'end',
                    function () {
                        gutil.log("Fonts Combined");
                    }
                );
            },

            cleanShared: function cleanShared() {
                return self.cleanTarget(
                    [
                        'build/shared/fonts/*',
                        'build/shared/img/*'
                    ]
                );
            },

            cleanTarget: function cleanTarget(paths) {
                return gulp
                    .src(paths)
                    .pipe(vinylPaths(del))
                    .on(
                        'end',
                        function () {
                            gutil.log("Target clean " + paths.join(', '));
                        }
                    );
            },

            copyPartials: function copyPartials(targetAppName, targetBuildPath) {
                return gulp.src(
                    [
                        'src/js/app/*/partials/*.html',
                        'src/js/directives/*/*.html',
                    ]
                ).pipe(
                    angular_templatecache(
                        'templates.js',
                        {
                            module: targetAppName,
                            transformUrl: function (url) {

                                return (
                                    /partials/.test(url)
                                    ? 'js/app/' + url
                                    : 'js/directives/' + url
                                );
                            }
                        }
                    )
                ).pipe(
                    gulp.dest('build/' + targetBuildPath + '/js/')
                ).on(
                    'end',
                    function () {
                        gutil.log("HTML partials copied to " + targetAppName);
                    }
                );
            },

            init: function (env, app) {
                _.each(
                    execEnvs,
                    function (appEnvs, thisApp) {
                        if (new RegExp("(all|" + thisApp + ")").test(app)) {
                            _.each(
                                appEnvs,
                                function (appEnv, thisEnv) {
                                    builder.execEnvs = execEnvs;
                                    if (_.isUndefined(builder.appTasks[thisApp])) {
                                        builder.appTasks[thisApp] = [];
                                    }
                                    if (_.isUndefined(builder.appTasks['copy-partials'])) {
                                        builder.appTasks['copy-partials'] = [];
                                    }
                                    if (new RegExp("(all|" + thisEnv + ")").test(env)) {
                                        gulp.task(
                                            thisApp + '-' + thisEnv + '-copy-partials',
                                            // [thisApp + '-' + thisEnv + '-clean-js'],
                                            function () {
                                                builder.copyPartials(
                                                    thisApp + 'App',
                                                    builder.execEnvs[thisApp][thisEnv].target
                                                );
                                            }
                                        );

                                        builder.appTasks['copy-partials']
                                               .push(thisApp + '-' + thisEnv + '-copy-partials');

                                        gulp.task(
                                            thisApp + '-' + thisEnv + '-clean-js',
                                            function () {
                                                return builder.cleanTarget(
                                                    [
                                                        'build/' + builder.execEnvs[thisApp][thisEnv].target + "/js/app-*.js",
                                                        'build/' + builder.execEnvs[thisApp][thisEnv].target + "/js/templates.js"
                                                    ]
                                                );
                                            }
                                        );

                                        gulp.task(
                                            thisApp + '-' + thisEnv + '-clean-css',
                                            function () {
                                                return builder.cleanTarget(
                                                    [
                                                        'build/' + builder.execEnvs[thisApp][thisEnv].target + "/css/*.css"
                                                    ]
                                                );
                                            }
                                        );

                                        gulp.task(
                                            thisApp + '-' + thisEnv + '-combine-css-js',
                                            [
                                                thisApp + '-' + thisEnv + '-clean-js',
                                                thisApp + '-' + thisEnv + '-clean-css'
                                            ],
                                            function () {

                                                var jsFilter  = filter("**/*.js"),
                                                    cssFilter = filter("**/*.css"),
                                                    // assets    = useref.assets('src/' + builder.execEnvs[thisApp][thisEnv].index),
                                                    assets    = useref.assets();

                                                return gulp.src(
                                                    'src/' + execEnvs[thisApp][thisEnv].index
                                                ).pipe(
                                                    rename('index.html')
                                                ).on(
                                                    'error',
                                                    builder.logError
                                                ).pipe(
                                                    assets
                                                ).on(
                                                    'error',
                                                    builder.logError
                                                ).pipe(
                                                    jsFilter
                                                ).on(
                                                    'error',
                                                    builder.logError
                                                ).pipe(
                                                    gulpif(
                                                        builder.execEnvs[thisApp][thisEnv].uglify || false,
                                                        uglify({mangle: false})
                                                    )
                                                ).on(
                                                    'error',
                                                    builder.logError
                                                ).pipe(
                                                    jsFilter.restore()
                                                ).on(
                                                    'error',
                                                    builder.logError
                                                ).pipe(
                                                    cssFilter
                                                ).on(
                                                    'error',
                                                    builder.logError
                                                ).pipe(
                                                    urlAdjuster({
                                                        modify: function (url) {
                                                            console.log(url);
                                                            if (!(/\=\=$/).test(url)) {
                                                                var urlParts = url.split('/');
                                                                return '../fonts/' + urlParts[urlParts.length - 1];
                                                            } else {
                                                                return url;
                                                            }
                                                        }
                                                    })
                                                ).on(
                                                    'error',
                                                    builder.logError
                                                ).pipe(
                                                    gulpif(
                                                        builder.execEnvs[thisApp][thisEnv].minify || false,
                                                        minifyCss()
                                                    )
                                                ).on(
                                                    'error',
                                                    builder.logError
                                                ).pipe(
                                                    cssFilter.restore()
                                                ).on(
                                                    'error',
                                                    builder.logError
                                                ).pipe(
                                                    rev()
                                                ).on(
                                                    'error',
                                                    builder.logError
                                                ).pipe(
                                                    assets.restore()
                                                ).on(
                                                    'error',
                                                    builder.logError
                                                ).pipe(
                                                    useref()
                                                ).on(
                                                    'error',
                                                    builder.logError
                                                ).pipe(
                                                    revReplace()
                                                ).on(
                                                    'error',
                                                    builder.logError
                                                ).pipe(
                                                    gulp.dest('build/' + builder.execEnvs[thisApp][thisEnv].target)
                                                ).on(
                                                    'end',
                                                    function () {
                                                        gutil.log(thisApp + '.' + thisEnv + " CSS/JS Combined");
                                                    }
                                                );
                                            }
                                        );

                                        gulp.task(
                                            thisApp + '-' + thisEnv + '-symlink',
                                            [
                                                thisApp + '-' + thisEnv + '-combine-css-js',
                                                thisApp + '-' + thisEnv + '-copy-partials'
                                            ],
                                            function () {
                                                return builder.doSymlink(thisApp, thisEnv);
                                            }
                                        );

                                        gulp.task(
                                            thisApp + '-' + thisEnv,
                                            [
                                                thisApp + '-' + thisEnv + '-symlink'
                                            ]
                                        );

                                        builder.appTasks[thisApp].push(
                                            thisApp + '-' + thisEnv
                                        );
                                    }
                                }
                            );
                        }
                    }
                );

                gulp.task(
                    'shared-clean',
                    function () {
                        return builder.cleanShared();
                    }
                );

                gulp.task(
                    'shared-copy-fonts',
                    ['shared-clean'],
                    function () {
                        return builder.copyFonts();
                    }
                );

                gulp.task(
                    'shared-copy-images',
                    ['shared-clean'],
                    function () {
                        builder.copyImages();
                    }
                );

                gulp.task(
                    'shared-copy',
                    ['shared-copy-fonts', 'shared-copy-images']
                );

                return self;
            }
        };

    self = builder;

    return builder;
})();
