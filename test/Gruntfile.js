module.exports = function (grunt) {
  /*
   * Developer test suite. Uses the current (../tasks/galen.js) version
   * of the framework to launch the dynamic test example.
   * 
   */
  var package = grunt.file.readJSON('../package.json');
  
  grunt.initConfig({
    connect: {
      server: {
        options: {
          port: 3000,
          base: 'static'
        }
      }
    },
    galen: {
      local: {
        src: ['test/**/local.test.js'],
        options: {
          output: true,
          concat: true,
          url: 'http://127.0.0.1:3000',
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
        src: ['test/**/saucelabs.test.js'],
        options: {
          output: true,
          concat: true,
          url: 'http://example.com/',
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
                build: package.version + '_' + String((new Date()).getTime()).slice(-6)
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
                build: package.version + '_' + String((new Date()).getTime())
              }
            },
            mobile: {
              deviceName: 'mobile',
              browser: 'iphone',
              desiredCapabilities: {
                name: 'example.com for mobile',
                'device-orientation': 'portrait',
                platform: 'OS X 10.10',
                version: '8.0',
                passed: 'true',
                tags: [
                  'grunt galen',
                  'example.com',
                  'remote testing',
                  'iphone browser'
                ].join(','),
                build: package.version + '_' + String((new Date()).getTime()).slice(-6)
              }
            }
          }
        }
      }
    }
  });
  
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadTasks('../tasks');
  
  grunt.registerTask('default', ['connect:server', 'galen:local', 'galen:sl']);
};
