'use strict';

module.exports = function (grunt) {
    // load all grunt tasks
    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

    // folder paths
    var config = {
        app: 'src',
        dist: 'ext'
    };

    var dependencies = {
        background: {
            js: [
                'bower_components/jquery/jquery.js',
                'bower_components/bootstrap/dist/js/bootstrap.min.js',
                'bower_components/underscore/underscore.js',
                'bower_components/underscore.string/lib/underscore.string.js',
                'bower_components/moment/moment.js',
                'bower_components/mousetrap/mousetrap.js',
                'bower_components/mousetrap/plugins/record/mousetrap-record.js',

                'bower_components/angular/angular.js',
                'bower_components/angular-route/angular-route.js',
                'bower_components/angular-resource/angular-resource.js',
                'bower_components/angular-animate/angular-animate.js',
                'bower_components/angular-md5/angular-md5.js',
                'bower_components/angular-moment/angular-moment.js',

                // Should be first
                'background/js/environment.js',
                'background/js/**/*.js',
                'bower_components/trackjs-tracker/tracker.js'
            ]
        },
        content: {
            js: [
                'bower_components/jquery/jquery.js',
                'bower_components/underscore/underscore.js',
                'bower_components/handlebars/handlebars.js',
                'bower_components/mousetrap/mousetrap.js',
                'bower_components/mousetrap/plugins/global-bind/mousetrap-global-bind.js',

                'content/js/patterns.js',
                'content/js/index.js',
                'content/js/parser.js',
                'content/js/autocomplete.js',
                'content/js/keyboard.js',
                'content/js/dialog.js',
                'content/js/events.js',
                'bower_components/trackjs-tracker/tracker.js'
            ]
        }
    };

    // Project configuration
    grunt.initConfig({
        config: config,
        pkg: grunt.file.readJSON('package.json'),
        manifestContents: grunt.file.readJSON(config.app + '/manifest.json'),
        // TODO ad watching all files and reloading extension in browser
        watch: {
            stylus: {
                files: [
                    '**/*.styl'
                ],
                tasks: ['stylus:development'],
                options: {
                    cwd: config.app,
                    spawn: false
                }
            },
            js: {
                files: dependencies.background.js.concat(dependencies.content.js)
                ,
                tasks: ['concat'],
                options: {
                    cwd: config.app,
                    spawn: false
                }
            },
            extensionReload: {
                files: [
                    '**/*.css',
                    '**/*.js'
                ],
                tasks: [],
                options: {
                    cwd: config.dist,
                    livereload: true
                }
            }
        },
        stylus: {
            development: {
                options: {
                    'include css': true,
                    compress: false,
                    linenos: true
                },
                files: {
                    '<%= config.dist %>/background/css/background.css': '<%= config.app %>/background/css/background.styl',

                    '<%= config.dist %>/content/css/content.css': '<%= config.app %>/content/css/content.styl'
                }
            },
            production: {
                options: {
                    'include css': true
                },
                files: {
                    '<%= config.dist %>/background/css/background.css': '<%= config.app %>/background/css/background.styl',
                    '<%= config.dist %>/content/css/content.css': '<%= config.app %>/content/css/content.styl'
                }
            }
        },
        jshint: {
            development: [
                '<%= config.app %>/content/js/*.js',
                '<%= config.app %>/background/js/*.js'
            ],
            options: {
                multistr: true
                //ignores: "src/content/js/gmailr.js"
            }
        },
        concat: {
            background: {
                expand: true,
                cwd: config.app,
                src: dependencies.background.js,
                dest: '<%= config.dist %>/background/js/background.js',
                // treat dest as a file, not as a folder
                rename: function(dest) { return dest }
            },
            content: {
                expand: true,
                cwd: config.app,
                src: dependencies.content.js,
                dest: '<%= config.dist %>/content/js/content.js',
                rename: function(dest) { return dest }
            }
        },
        compress: {
            all: {
                options: {
                    archive: 'build/<%= pkg.name %>-<%= manifestContents.version %>.zip'
                },
                files: [
                    {src: ['<%= config.dist %>/**']}
                ]
            }
        },
        // Put files not handled in other tasks here
        copy: {
            development: {
                files: [
                    {
                        expand: true,
                        flatten: true,
                        dot: true,
                        cwd: '<%= config.app %>/bower_components/font-awesome/fonts/',
                        dest: '<%= config.dist %>/background/fonts',
                        src: [
                            '*'
                        ]
                    },
                    {
                        expand: true,
                        flatten: true,
                        dot: true,
                        cwd: '<%= config.app %>/bower_components/bootstrap/dist/fonts/',
                        dest: '<%= config.dist %>/background/fonts',
                        src: [
                            '*'
                        ]
                    },
                    {
                        expand: true,
                        dot: true,
                        cwd: config.app,
                        dest: '<%= config.dist %>',
                        src: [
                            'icons/**',
                            '_locales/**',
                            'pages/**',
                            'LICENSE'
                        ]
                    }
                ]
            }
        },
        clean: {
            dist: {
                files: [{
                    expand: true,
                    dot: true,
                    cwd: '<%= config.dist %>',
                    src: [
                        '*'
                    ]
                }]
            },
        },
        protractor: {
            options: {
                keepAlive: false
            },
            background: {
                options: {
                    configFile: 'tests/protractor.background.conf.js'
                }
            },
            content: {
                options: {
                    configFile: 'tests/protractor.content.conf.js'
                }
            }
        }
    });

    grunt.registerTask('manifest:development', 'Build chrome manifest life.', function () {
        var manifest = grunt.file.readJSON(config.app + '/manifest.json')

        // Load content script on localhost
        manifest.content_scripts[0].matches.push('http://localhost/gmail/*')
        manifest.content_scripts[0].matches.push('https://localhost/gmail/*')

        grunt.file.write(config.dist + '/manifest.json', JSON.stringify(manifest))

        grunt.file.write(config.app + '/background/js/environment.js', 'var ENV = "development";')
    })

    grunt.registerTask('manifest:production', 'Build chrome manifest life.', function () {
        var manifest = grunt.file.readJSON(config.app + '/manifest.json')
        delete manifest.key;
        grunt.file.write(config.dist + '/manifest.json', JSON.stringify(manifest))

        grunt.file.write(config.app + '/background/js/environment.js', 'var ENV = "production";')
    })


    // Development mode
    grunt.registerTask('development', [
        'clean',
        'copy:development',
        'manifest:development',
        'stylus:development',
        'jshint',
        'concat',
        'watch'
    ]);
    // alias
    grunt.registerTask('d', ['development'])


    // Testing
    // TODO add unit tests
    grunt.registerTask('test', function (target) {
        grunt.task.run([
            'jshint',
            'production'
        ]);

        if (target === 'content') {
            return grunt.task.run([
                'protractor:content'
            ]);
        }

        if (target === 'background') {
            return grunt.task.run([
                'protractor:background'
            ]);
        }

        grunt.task.run([
            'protractor:content',
            'protractor:background'
        ]);
    });
    // alias
    grunt.registerTask('t', ['test'])


    // Optimize and compress
    grunt.registerTask('production', [
        'clean',
        'copy:development',
        'manifest:production',
        'stylus:production',
        'concat'
    ]);
    // alias
    grunt.registerTask('p', ['production'])


    // Creates extension zip archive
    grunt.registerTask('build', [
        'production',
        'compress'
    ]);
    // alias
    grunt.registerTask('b', ['build']);

    grunt.registerTask('default', ['development']);

};
