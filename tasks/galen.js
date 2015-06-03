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
    
    var filesTmpDir = '.tmp_grunt-galen';
    
    var galenCliAvailable;

    /*
     * @output
     * @private
     */
    var reports = [];
    
    /**
     * Check if galen commandline tool is available. If not, substitute
     * command will be used.
     * 
     * Also, if commandline tool is not present, inform the user that
     * it might be necessary to download galen, which can take some time.
     * 
     * @param {Function} callback function callback
     */
    function checkGalenCli (callback) {
      childprocess.exec('galen -v', function (err, output, erroutput) {
        if (err) {
          galenCliAvailable = false;
          
          if(!grunt.file.exists(__dirname + '/../galen-cli/lib/galen') ||
             !grunt.file.exists(__dirname + '/../galen-cli/lib/galen.bat')) {
            log('Galen framework was not found. It will be downloaded during the first test.'.yellow);
            log('Please be patient as the download can take a moment.'.yellow);
          }
        } else {
          galenCliAvailable = true; 
        }
        
        callback();
      });
    }
    
    /**
     * Determine whether gl.js should be used during the build.
     * Unless options.nogl is set to true, that is a case.
     * 
     * If necessary, duplicate the `local` copy of gl.js from ./lib/gl.js
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
        // TODO: This can be simplified by grunt.file.copy
        fs.stat(glPath, function (err, stats) {
          var copyStream = fs.createWriteStream(glPath);

          copyStream.on('close', function () {
            callback();
          });

          fs.createReadStream(__dirname + '/../lib/gl.js').pipe(copyStream);
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
      data.devices = options.devices || {};
      
      Object.keys(data.devices).forEach(function (deviceName) {
        var device = data.devices[deviceName];
        
        Object.keys(device.desiredCapabilities || {}).forEach(function (param) {
          if (typeof device.desiredCapabilities[param] !== 'string') {
            grunt.fail.fatal('All desiredCapabilities have to be string variables. [failed on capability `' + param + '`]');      
          }
        });
      });

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

      grunt.file.write((options.cwd || '.') + '/gl.config.js', [
        'config.set(',
        JSON.stringify(data),
        ');\n'
      ].join(''));
      
      callback();
    }
    
    /**
     * Concatenate all test files into a single file to speed
     * up the testing process.
     * 
     * File is created in current working directory, under /.tmp_grunt-galen/ subdir.
     * 
     * @param {Function} callback function callback
     */
    function buildConcatFile (callback) {
      var testFiles = getTestingFiles();
      var concat = ['load(\'../gl.js\');'];
      var tmpFile = (options.cwd || '.') + '/' + filesTmpDir + '/galenTestConcated_' + (new Date()).getTime() + '.test.js';
      
      if (testFiles.length > 1 && options.concat === true) {
        testFiles.forEach(function (file) {
          var fileSrc = grunt.file.read(file);
          
          concat.push([
            '(function () {',
            fileSrc.replace(/^load\(('|"){1}.*\/?gl.js('|"){1}\);?$/gm, ''),
            '})();'
          ].join('\n\r'));
        });
        
        grunt.file.write(tmpFile, concat.join('\n\r'));
        
        files = [tmpFile];
      }
      
      callback();
    }
    
    /**
     * Remove temporary concat file.
     * 
     * @see buildConcatFile
     * @param {Function} callback function callback
     */
    function removeConcatFile (callback) {
      var tmpDir = (options.cwd || '.') + '/' + filesTmpDir;
      
      if (grunt.file.exists(tmpDir)) {
        grunt.file.delete(tmpDir);
      }
      
      callback();
    }

    /**
     * Test if a file exists.
     * @param   {String}  file path
     * @returns {Boolean} file existentional feelings
     */
    function fileExists (file) {
      return grunt.file.exists(file);
    }
    
    /**
     * Get all test files. Validate if file exists.
     * 
     * @returns {Array} array of files
     */
    function getTestingFiles () {
      var testFiles = [];

      files.filter(fileExists)
      .forEach(function (filePath) {
        testFiles.push(filePath);
      });
      
      return testFiles;
    }

    /**
     * Start the testing process. Generate shell terminal commands
     * and spawn them as separate child processes.
     * 
     * When all processes finish, terminate the task.
     * 
     * TODO: rename `cb` to `callback`s.
     */
    function runGalenTests (cb) {
      var testFiles = getTestingFiles();
      var htmlReport = options.htmlReport === true ? '--htmlreport ' + (options.htmlReportDest || '') : '';
      
      var resultPadding = 0;
      testFiles.forEach(function (filePath) {
        resultPadding = Math.max(resultPadding, filePath.length);
      });
      
      if (!options.seleniumGrid) {
        log('Starting', 'local'.green, 'Galen');
      } else {
        log('Starting', 'remote'.green, 'Galen');
        log('[Tests run on Selenium Grid/SauceLabs can take time, please be patient and monitor your grid status if tests take too long]'.yellow);
      }

      var stack = testFiles.map(function (filePath) {
        return function (cb) {
          var command = [
            galenCliAvailable ? 'galen' : 'node ' + __dirname + '/../galen-cli/galen.js',
            'test',
            filePath,
            htmlReport
          ].join(' ');

          var padding = 4;
          var spaces = Array(Math.abs(resultPadding - filePath.length) + padding).join(' ');

          grunt.log.write('    • ' + filePath + spaces);

          childprocess.exec(command, function (err, output, erroutput) {
            if (err) {
              return cb(err);
            } else if (erroutput.replace(/\s/g, '')) {

              if ((erroutput.match(/deprecat(ed)?/gm) || []).length > 0) {
                erroutput = erroutput.replace(/\n/gm, ' ');

                /*
                 * This line can be uncommented to show warnings in the console.
                 */
                log(' (! ' + erroutput.yellow  + ') ');
              } else {
                log('failed'.red);
                reports.push(erroutput);

                return cb();
              }

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

      log(status.passed + ' tests passed [' + parseInt(status.percentage) + '%]' );

      if (status.failed) {
        grunt.fail.warn(status.failed + ' test failed [' + parseInt(100 - status.percentage) + '%]');
      }

      return cb();
    }

    /**
     * Start the testing process.
     */
    async.waterfall([
      checkGalenCli,
      checkLibrary,
      buildConfigFile,
      buildConcatFile,
      runGalenTests,
      removeConcatFile,
      finishGalenTests
    ], function (err) {
      if (err) {
        throw err;
      }

      done();
    });
    
    process.on('uncaughtException', function(err) {
      console.error(err.stack);
      grunt.fail.fatal(err);
    });
  });
};
