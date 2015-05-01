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
    var finishGalenTests = function () {
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
        log('failed ' + status.failed, ' test(s) [' + (100 - status.percentage), '%]');
      }

      done();
    };
    
    function validateGalen (callback) {
      childprocess.exec('galen -v', function (error, output) {
        if (error) {
          throw {
            message: 'Galen not available',
            error: error
          };
        } else {
          callback();
        }
      });
    };
    
    /*
     * Validate input date. Throw on error.
     */
    function validateInputs () {
      if (options.htmlReport) {
        if (typeof options.htmlReport !== 'boolean') {
          throw 'options.htmlReport must be a boolean'; 
        }
        if (!options.htmlReportDest) {
          throw 'options.htmlReportDest not specified, while options.htmlReport set to true';
        }
      } else {
        options.htmlReport = false; 
      }
      
      if (options.htmlReportDest) {
        if (typeof options.htmlReportDest !== 'string') {
          throw 'options.htmlReportDest must be a string'; 
        }
      } else {
        options.htmlReportDest = ''; 
      }
      
      if (options.output) {
        if (typeof options.htmlReport !== 'boolean') {
          throw 'options.output must be a boolean'; 
        }
      } else {
        options.output = false; 
      }
      
      if (options.devices) {
        if (typeof options.devices !== 'object') {
          throw 'options.output must be a object'; 
        }
      } else {
        throw 'options.devices not specified. Cannot test Galen without any target devices.'; 
      }
      
      if (options.url) {
        if (typeof options.url !== 'string') {
          throw 'options.url must be a string'; 
        }
      } else {
        throw 'options.url not specified. Cannot test Galen without a target application.'; 
      }
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
          function onTestFinished (error, output) {
            if (error) {
              throw error;
            }

            log('   • ' + device + ' done');
            reports.push(output);

            spawns.splice(spawns.indexOf(childProc), 1);
            if (spawns.length === 0) {
              finishGalenTests();
            }
          }
        );
        spawns.push(childProc);
      } catch (err) {
        throw err;
      }
    };
    
    /**
     * Launch the testing process.
     */
    function runTests () {
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
    };

    /*
     * Testing process
     */
    log('Testing Galen...');
    
    validateInputs();
    
    validateGalen(runTests);
  });
};
