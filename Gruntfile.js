module.exports = function(grunt) {

  grunt.initConfig({
    jshint: {
      files: ['Gruntfile.js', 'js/*.js', 'js/views/*.js', 'js/collections/*.js', 'js/models/*.js', 'js/bookmarklets/*.js' ],
      options: {
        // options here to override JSHint defaults
        globals: {
          jQuery: true,
          console: true,
          module: true,
          document: true
        },
        asi: true,      
        boss: true,     
        funcscope: true,
        loopfunc: true,
        eqnull: true,
        evil: true,
        debug: true,
        smarttabs: true,
        "-W099": true,
        "-W092": true,
        "-W032": true,
        "-W041": true,
        expr: true,
        shadow: true,
        supernew: true,
        sub: true,
        laxcomma: true,
        laxbreak: true
      }
    },
    uglify: {
      compress: {
        expand: true,
        src: ['js/*.js', '!js/**/*.min.js', 'js/views/*.js', 'js/models/*.js', 'js/collections/*.js', 'js/bookmarklets/*.js'],
        dest: 'test/',
        ext: '.min.js',
        flatten: false
      }
    },
  });
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');
 
  grunt.task.registerTask('default', ['jshint', 'uglify']);
};
/*
    bower: {
      dev: {
        dest: 'js/lib'
      }
    },

    bowerInstall: {
      install: {
        options: {
          targetDir: './js/lib',
        }
         //just run 'grunt bower:install' and you'll see files from your Bower packages in lib directory
      }
    },
  grunt.loadNpmTasks('grunt-bower-task');
  
  grunt.renameTask("bower", "bowerInstall");
  
  grunt.loadNpmTasks('grunt-bower');
*/