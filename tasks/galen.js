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
var async = require('async');

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
    var files = this.filesSrc;

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
      
      if (typeof callback !== 'function') {
        callback = function () {};
      }
      
      if (options.nogl === true) {
        callback();
      } else {
        fs.stat(glPath, function (err, stats) {
          var copyStream;

          if (!stats || !stats.isFile()) {
            var copyStream = fs.createWriteStream(glPath);

            copyStream.on('close', function () {
              callback();
            });

            fs.createReadStream(__dirname + '/../lib/gl.js').pipe(copyStream);
          } else {
            callback();
          }
        });
      }
    }

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
    }

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
    function runGalenTests (cb) {

      log('Starting Galen.');

      var testFiles = [];

      files.filter(fileExists)
      .forEach(function (filePath) {
        testFiles.push(filePath);
      });

      var htmlReport = options.htmlReport === true ? '--htmlreport ' + (options.htmlReportDest || '') : '';

      var resultPadding = 0;
      testFiles.forEach(function (filePath) {
        resultPadding = Math.max(resultPadding, filePath.length);
      });

      var stack = testFiles.map(function (filePath) {

        return function (cb) {
          var command = ['galen test',
            filePath,
            htmlReport
          ].join(' ');

          // calculate number of spaces
          var left = Math.abs(resultPadding - filePath.length);
          left += 4;
          var spaces = [];
          spaces[left] = ' ';

          grunt.log.write('    • ' + filePath + (spaces.join(' ')));

          childprocess.exec(command, function (err, output, erroutput) {

            if (err) {
              return cb(err);
            } else if (erroutput.replace(/\s/g, '')) {

              log('   • ' + filePath + ' failed'.red);
              reports.push(erroutput);

              return cb();
            }

            if (isFailed(output)) {
              log('failed'.red);
            } else {
              log('done'.green);
            }

            reports.push(output);

            return cb(null);
          });
        };

      });

      async.waterfall(stack, cb);
    }

    /**
     * Tests log of the report for failed tests
     * @return {Boolean} - true if report is failed
     */
    function isFailed(testLog) {
      return (testLog.match(/fail(ed|ing?)?/gmi) || []).length != 0;
    }

    /**
     * Generate reports, print them if necessary, and finish
     * the async Grunt task with done().
     */
    function finishGalenTests (cb) {
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

      if (status.failed) {
        grunt.fail.warn('failed ' + status.failed + ' test(s) [' + (100 - status.percentage) + '%]');
      }

      return cb();
    }

    /**
     * Start the testing process.
     */
    async.waterfall([
      checkLibrary,
      buildConfigFile,
      runGalenTests,
      finishGalenTests
    ], function (err) {
      if (err) {
        throw err;
      }

      log('All done');

      done();
    });
    
    process.on('uncaughtException', function(err) {
      console.error(err.stack);
      grunt.fail.fatal(err);
    });
  });
};
