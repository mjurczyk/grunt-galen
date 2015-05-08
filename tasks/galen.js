/*
 * @name grunt-galen
 * @author mjurczyk
 * 
 * @exports task.galen
 */

/*
 * @requires fs
 * @requires childprocess
 */
var fs = require('fs');
var childprocess = require('child_process');

/**
 * Grunt task.
 * @param   {Object}   grunt Grunt
 */
module.exports = function (grunt) {
  grunt.registerMultiTask('galen', 'Run Galen tests.', function () {
    /*
     * log  logging shortcut
     */
    var log = grunt.log.writeln;

    /*
     * @input
     * options  grunt task options
     * done     async callback
     * files    grunt task target files
     */
    var options = this.options() || {};
    var done = this.async();
    var files = this.files;

    /*
     * @output
     * @private
     */
    var reports = [];
    
    /**
     * Determine whether gl.js should be used during the build.
     * Unless options.nogl is set to true, that is a case.
     * 
     * If necessary, duplicate `local` copy of gl.js from ./lib/gl.js
     * and put it in the cwd directory.
     * 
     * @param {Function} callback function callback
     */
    function checkLibrary (callback) {
      var glPath = (options.cwd || '.') + '/gl.js';
      
      if (options.nogl === true) {
        callback();
      } else {
        fs.stat(glPath, function (err, stats) {
          var copyStream;

          if (!stats || !stats.isFile()) {
            var copyStream = fs.createWriteStream(glPath);

            copyStream.on('close', function () {
              if (typeof callback === 'function') {
                callback();
              }
            });

            fs.createReadStream(__dirname + '/../lib/gl.js').pipe(copyStream);
          }
        });
      }
    };

    /**
     * Galen JavaScript API is a closed environment converted to
     * Java on runtime, hence it has a lot of flaws regarding String
     * to JSON conversion directly in Java. To avoid that, config file
     * is generated and imported in gl.js (it can also be directly
     * imported in test files, if proper config module is created).
     * 
     * Config file contains all necessary information from the task
     * config, and uses config#set method from gl.js to put it into
     * test suites.
     * 
     * @param {Function} callback function callback
     */
    function buildConfigFile (callback) {
      var data = {};

      if (options.project) {
        data.project = options.project;
      }

      data.url = options.url || '';
      data.devices = options.devices;

      if (options.seleniumGrid) {
        data.seleniumGrid = {};

        data.seleniumGrid.url = options.seleniumGrid.url || [
          'http://',
          options.seleniumGrid.username,
          ':',
          options.seleniumGrid.accessKey,
          '@ondemand.saucelabs.com:80/wd/hub'
        ].join('');
      }

      fs.writeFile((options.cwd || '.') + '/gl.config.js', [
        'config.set(',
        JSON.stringify(data),
        ');\n'
      ].join(''), function (err) {
        if (err) {
          throw err;
        } else {
          callback();
        }
      });
    };

    /**
     * Test if a file exists.
     * @param   {String}  file path
     * @returns {Boolean} file existentional feelings
     */
    function fileExists (file) {
      return grunt.file.exists(file);
    };

    /**
     * Start the testing process. Generate shell terminal commands
     * and spawn them as separate child processes.
     * 
     * When all processes finish, terminate the task.
     */
    function runGalenTests () {
      var spawns = [];

      log('Starting Galen.');

      files.forEach(function (file) {
        file.src.filter(fileExists)
        .forEach(function (filePath) {
          var spawn = childprocess.exec([
            'galen test ',
            filePath,
            options.htmlReport === true ? '--htmlreport ' + (options.htmlReportDest || '') : ''
          ].join(' '), function (err, output) {
            if (err) {
              throw err;
            }

            log('   • ' + filePath + ' done');
            reports.push(output);

            spawns.splice(spawns.indexOf(spawn), 1);
            if (spawns.length === 0) {
              finishGalenTests();
            }
          });

          spawns.push(spawn);
        })
      });
    };

    /**
     * Generate reports, print them if necessary, and finish
     * the async Grunt task with done().
     */
    function finishGalenTests () {
      var testLog = reports.join('\n\r');
      var status = {
        passed: (testLog.match(/pass(ed|ing?)?/gmi) || []).length,
        failed: (testLog.match(/fail(ed|ing?)?/gmi) || []).length,
        total: 0,
        percentage: 0
      };
      status.total = status.passed + status.failed;
      status.percentage = status.total !== 0 ? status.passed / status.total * 100 : 0;

      if (options.output === true) {
        log(testLog);
      }

      log('passed ' + status.passed + ' test(s) [' + status.percentage + '%]' );
      if (status.failed > 0) {
        log('failed ' + status.failed + ' test(s) [' + (100 - status.percentage) + '%]');
      }

      done();
    };

    /**
     * Start the testing process.
     */
    checkLibrary(function () {
      buildConfigFile(runGalenTests);
    });
  });
};
