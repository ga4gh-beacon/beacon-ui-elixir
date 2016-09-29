var argv       = require('yargs').argv,
    gulp       = require('gulp'),
    builder    = require('./builder'),
    _          = require('underscore');


argv.env   = argv.env || 'all';
argv.app   = argv.app || 'all';

builder.init(argv.env, argv.app);

/**
 * First-time execution to build all the codebase, so that we're sure that the current contents
 * inside of build folder matches the last version of our source code.
 */

_.delay(
    function () {
        'use strict';
        var allTasks = [];
        if (new RegExp("^(all|submitter)").test(argv.app)) {
            allTasks = allTasks.concat(builder.appTasks.submitter);
        }
        if (new RegExp("^(all|requester)").test(argv.app)) {
            allTasks = allTasks.concat(builder.appTasks.requester);
        }
        if (new RegExp("^(all|beacon)").test(argv.app)) {
            allTasks = allTasks.concat(builder.appTasks.beacon);
        }
        if (new RegExp("^(all|manager)").test(argv.app)) {
            allTasks = allTasks.concat(builder.appTasks.manager);
        }

        gulp.task(
            'listen-and-build',
            function () {
                if (new RegExp("(all|submitter)").test(argv.app)) {
                    gulp.watch(
                        'src/index.sub.*',
                        builder.appTasks.submitter
                    );
                }

                if (new RegExp("(all|requester)").test(argv.app)) {
                    gulp.watch(
                        'src/index.req.*',
                        builder.appTasks.requester
                    );
                }

                if (new RegExp("(all|beacon)").test(argv.app)) {
                    gulp.watch(
                        'src/index.bea.*',
                        builder.appTasks.beacon
                    );
                }

                if (new RegExp("(all|manager)").test(argv.app)) {
                    gulp.watch(
                        'src/index.mng.*',
                        builder.appTasks.manager
                    );
                }

                gulp.watch(
                    [
                        'src/js/**/*.woff2',
                        'src/js/**/*.woff',
                        'src/js/**/*.eot',
                        'src/js/**/*.svg',
                        'src/js/**/*.ttf'
                    ],
                    ['shared-copy-fonts']
                );

                gulp.watch(
                    [
                        'src/js/node_modules/**/*',
                        'src/js/app/*.js',
                        'src/js/app/**/*.js',
                        'src/js/directives/*/*.js',
                        'src/css/*',
                        'src/css/**/*'
                    ],
                    allTasks.concat(['shared-copy'])
                );

                gulp.watch(
                    [
                        'src/img/*',
                        'src/img/**/*'
                    ],
                    ['shared-copy-images']
                );

                gulp.watch(
                    [
                        'src/js/app/*/partials/*.html',
                        'src/js/directives/*/*.html'
                    ],
                    builder.appTasks['copy-partials']
                );
            }
        );

        gulp.start(
            allTasks.concat(['shared-copy']),
            ['shared-clean']
        );

        /**
         * Trigger build process based on files' changes
         */
        gulp.start(
            'listen-and-build',
            ['shared-clean']
        );
    },
    1000
);
