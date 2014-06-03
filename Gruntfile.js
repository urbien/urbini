module.exports = function(grunt) {

  var jsFiles = ['Gruntfile.js'];
  (function buildJSFileList(jsFiles) {    
    var bundles = grunt.file.readJSON('bundles.json');
    for (var name in bundles) {
      var bundle = bundles[name],
          i = bundle.length,
          fileInfo,
          filePath;
      
      while (i--) {
        fileInfo = bundle[i];
        filePath = typeof fileInfo == 'object' ? fileInfo.path : fileInfo;
        if (/\.js$/.test(filePath))
          jsFiles.push('js/' + filePath);
      }
    }
  })(jsFiles);
  
  grunt.initConfig({
    jshint: {
      files: jsFiles,
      options: {
        // options here to override JSHint defaults
        globals: {
          jQuery: true,
          console: true,
          module: true,
          document: true,
          '_': true
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
        src: jsFiles, 
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