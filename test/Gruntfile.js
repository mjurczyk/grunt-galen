module.exports = function (grunt) {
  /*
   * Developer test suite. Uses the current (../tasks/galen.js) version
   * of the framework to launch the dynamic test example.
   * 
   */
  var package = grunt.file.readJSON('../package.json');
  var testPipeline = ['galen:local'];
  var BUILD_ID = package.version + '_' + String((new Date()).getTime());
  
  /*
   * Unless environment variable DISABLE_SAUCELABS is set to TRUE add remote testing.
   */
  if (process.env.DISABLE_SAUCELABS != true) {
    testPipeline.push('galen:sl');
  }
  
  grunt.initConfig({
    galen: {
      options: {
        url: 'http://example.com/',
        output: true,
        concat: true
      },
      local: {
        src: ['test/**/example.test.js'],
        options: {
          devices: {
            desktop: {
              deviceName: 'desktop',
              browser: 'firefox',
              size: '1280x800'
            },
            tablet: {
              deviceName: 'tablet',
              browser: 'firefox',
              size: '768x576'
            }
          }
        }
      },
      sl: {
        src: ['test/**/example.test.js'],
        options: {
          seleniumGrid: {
            login: 'gruntgalen-sl',
            username: 'gruntgalen-sl',
            accessKey: '5fa3a9f6-a912-4294-b254-6041410702f5'
          },
          devices: {
            desktop: {
              deviceName: 'desktop',
              browser: 'chrome',
              size: '1280x1024',
              desiredCapabilities: {
                name: 'example.com for desktop',
                platform: 'Windows 7',
                version: '43.0',
                passed: 'true',
                tags: [
                  'grunt galen',
                  'example.com',
                  'remote testing',
                  'desktop browser'
                ].join(','),
                build: BUILD_ID
              }
            },
            tablet: {
              deviceName: 'ipad',
              browser: 'ipad',
              desiredCapabilities: {
                name: 'example.com for tablet',
                'device-orientation': 'portrait',
                platform: 'OS X 10.10',
                version: '8.0',
                passed: 'true',
                tags: [
                  'grunt galen',
                  'example.com',
                  'remote testing',
                  'ipad browser'
                ].join(','),
                build: BUILD_ID
              }
            },
            mobile: {
              deviceName: 'android',
              browser: 'android',
              desiredCapabilities: {
                name: 'example.com for mobile',
                'device-orientation': 'portrait',
                platform: 'Linux',
                version: '4.4',
                passed: 'true',
                tags: [
                  'grunt galen',
                  'example.com',
                  'remote testing',
                  'android browser'
                ].join(','),
                build: BUILD_ID
              }
            }
          }
        }
      }
    }
  });
  
  grunt.loadTasks('../tasks');
  
  grunt.registerTask('default', testPipeline);
};
