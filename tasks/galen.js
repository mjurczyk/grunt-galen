// TODO: Add jsdoc
/*
 * grunt-galen
 */

var fs = require('fs');
var childprocess = require('child_process');

// TODO: Add jsdoc
module.exports = function (grunt) {
  grunt.registerMultiTask('galen', 'Run Galen tests.', function () {
    /*
     * Logging shortcut
     */
    var log = grunt.log.writeln;

    /*
     * Input
     */
    var options = this.options() || {};
    var done = this.async();
    var files = this.files;

    /*
     * Output
     */
    var reports = [];
    
    function checkLibrary (callback) {
      var glPath = (options.cwd || '.') + '/gl.js';
      
      if (options.nogl === true) {
        callback();
      }
      
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
    };

    // TODO: Add jsdoc
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
     * Test if file exists.
     * @param   {String}  file path
     * @returns {Boolean} file existentional feelings
     */
    function fileExists (file) {
      return grunt.file.exists(file);
    };

    // TODO: Add jsdoc
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

    // TODO: Add jsdoc
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

    checkLibrary(function () {
      buildConfigFile(runGalenTests);
    });
  });
};
