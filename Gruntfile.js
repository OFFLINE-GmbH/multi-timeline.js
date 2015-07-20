module.exports = function (grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            js: {
                options: {
                    sourceMap: true
                },
                files: {
                    'dist/multi-timeline.min.js': 'src/js/multi-timeline.js',
                }
            }
        },
        watch: {
            options: {
                livereload: true
            },
            scripts: {
                files: ['src/js/*.js'],
                tasks: ['uglify'],
                options: {
                    spawn: false
                }
            },
            css: {
                files: ['src/scss/*.scss'],
                tasks: ['sass'],
                options: {
                    spawn: false
                }
            }
        },
        sass: {
            dest: {
                options: {
                    'sourcemap=none': true,
                    style: 'compressed'
                },
                files: {
                    'dist/multi-timeline.min.css': 'src/scss/multi-timeline.scss'
                }
            }
        }
    });

    // 3. Where we tell Grunt we plan to use this plug-in.
    require('load-grunt-tasks')(grunt);

    // 4. Where we tell Grunt what to do when we type "grunt" into the terminal.
    grunt.registerTask('default', ['uglify', 'sass']);
    grunt.registerTask('dev', ['watch']);

};
