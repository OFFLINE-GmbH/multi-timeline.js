module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        // concat: {
        //     js: {
        //         src: [
        //               'src/js/html5shiv.min.js'
        //             , 'src/js/pushy.js'
        //             , 'src/js/app.js'
        //         ],
        //         dest: 'src/js/concatinated.js'
        //     }
        // },
        uglify: {
            js: {
                src: 'src/multi-timeline.js',
                dest: 'build/multi-timeline.min.js'
            }
        },
        watch: {
            scripts: {
                files: ['src/js/*.js'],
                tasks: ['uglify'],
                options: {
                    spawn: false
                }
            }
        }
    });

    // 3. Where we tell Grunt we plan to use this plug-in.
    require('load-grunt-tasks')(grunt);

    // 4. Where we tell Grunt what to do when we type "grunt" into the terminal.
    grunt.registerTask('default', ['uglify']);
    grunt.registerTask('dev', ['watch']);

};
