/*
 * grunt-galen
 */
var childprocess = require('child_process');

module.exports = function (grunt) {
  grunt.registerMultiTask('galen', 'Run Galen tests.', function () {
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
    var spawns = [];

    /**
     * Final callback function
     */
    var finishGalandTests = function () {
      var testLog = reports.join('\n\r');
      var status = {
        passed: (testLog.match(/pass(ed|ing?)?/gmi) || []).length,
        failed: (testLog.match(/fail(ed|ing?)?/gmi) || []).length,
        total: 0,
        percentage: 0
      };
      status.total = status.passed + status.failed;
      status.percentage = status.passed / status.total * 100;

      if (options.output === true) {
        log(testLog);
      }

      log('passed ' + status.passed + ' test(s) [' + status.percentage + '%]' );
      if (status.failed > 0) {
        log('failed ' + status.failed, ' test(s) [' + 100 - status.percentage, '%]');
      }

      done();
    };

    /**
     * Test if file exists.
     * @param   {String}  file path
     * @returns {Boolean} file existentional feelings
     */
    function fileExists (file) {
      return grunt.file.exists(file);
    };

    /**
     * Spawn a testing child process. Each process tests
     * a single case for a single screen size.
     * @param {String} testPath testing suite path
     * @param {String} device   a key/name in the devices table
     */
    function spawnTestProcess (testPath, device) {
      var childProc;
      var deviceSize = options.devices[device];

      try {
        childProc = childprocess.exec(
          [
            'galen test',
            testPath,
            '-DwebsiteUrl="' + options.url + '"',
            '-Ddevice="' + device + '"',
            '-Dsize="' + deviceSize + '"',
            options.htmlReport === true ? '--htmlreport' : '',
            options.htmlReportDest || ''
          ].join(' '),
          function onTestFinished (error, output, stderr) {
            if (error) {
              throw error;
            }

            log('   • ' + device + ' done');
            reports.push(output);

            spawns.splice(spawns.indexOf(childProc), 1);
            if (spawns.length === 0) {
              finishGalandTests();
            }
          }
        );
        spawns.push(childProc);
      } catch (err) {
        throw err;
      }
    };

    /*
     * Testing process
     */
    log('Testing Galen...');

    files.forEach(function (file) {
      file.src.filter(fileExists)
      .forEach(function (filePath) {

        /*
         * Print out a label and start a testing suite
         * for every test file and device size.
         */
        log('⦿ ' + filePath);

        Object.keys(options.devices).forEach(function (device) {
          spawnTestProcess(filePath, device);
        });
      });
    });
  });
};