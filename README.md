## Note: This module is considered deprecated for Galenframework v2.0.3+ and requires further development. Stale for now.

# grunt-galen [![npm version](https://badge.fury.io/js/grunt-galen.svg)](http://badge.fury.io/js/grunt-galen) [![Build Status](https://travis-ci.org/mjurczyk/grunt-galen.svg?branch=master)](https://travis-ci.org/mjurczyk/grunt-galen)

> Grunt plugin for [Galen](http://galenframework.com/) testing framework

This module includes Galen framework downloader since version ***0.5.0*** ([Galen is also downloadable here](http://galenframework.com/download/)).

*Warning* - Galen framework requires Java runtime environment to work. Java is ***not*** included in this module.

## Getting started
In the project directory run:

```bash
npm install --save-dev grunt-galen
```

Then add it to the Gruntfile:

```js
grunt.loadNpmTasks('grunt-galen');
```

# Preparing the environment
Galen testing requires three components to run through your tests:

1. Project URL address. (`http://127.0.0.1/` counts, of course)
2. Galen testing `.spec` files. ([read more](http://galenframework.com/docs/reference-galen-spec-language-guide/))
3. Target devices / display resolutions.

You might find these articles helpful during the preparations:

1. SauceLabs Device Configurator: [link](https://docs.saucelabs.com/reference/platforms-configurator/)
2. SauceLabs Screen Resolutions: [link](https://docs.saucelabs.com/reference/test-configuration/#specifying-the-screen-resolution)

# Writing Galen tests
`grunt-galen` exposes a useful `gl.js` module<sup>1</sup>, so you can spend more time improving your project, rather than writing the test files. 

Test files' main role is to assign  `.spec` files to their target pages of the project. For example `example-test.test.js` can look like this:

```js
load ('../gl.js');

forAll(config.getDevices(), function (device) {
  // Just like unit test's `it( ... )`
  test('Example on ' + device.deviceName, function () {
    gl.openPage(device, config.getProjectPage());
    
    gl.runSpecFile(device, './test/example-test.spec');
  });
});
```

This test suite runs the `example-test.spec` file against the main project page. 

Remember that you are not bound to the `gl.js` framework and, if you are familiar with vanilla Galen API, you are welcome to use it with `grunt-galen`. ([more on Galen javascript API](http://galenframework.com/docs/reference-javascript-tests-guide/))

<sup>1</sup> Full `gl.js` docs can be found along with task configuration reference at the bottom of this README.

# Configuring your task
Example configuration for a simple Galen task:

```js
galen: {
  local: {
  
    // Check all test.js files in the test directory
    src: ['test/**/*.test.js'],
    options: {
    
      // Run test on the localhost:3000
      url: 'http://127.0.0.1:3000',
      devices: {
        
        // Run tests in firefox browser, scaled to basic desktop resolution
        desktop: {
          deviceName: 'desktop',
          browser: 'firefox',
          size: '1280x800'
        },
        
        // Also run them in firefox, but scaled to iPad screen size
        tablet: {
          deviceName: 'tablet',
          browser: 'firefox',
          size: '768x576'
        }
      }
    }
  }
}
```

Now just run the command `grunt galen:local` and enjoy the show!

# Grunt task options

## options.concat
> Combine all galen test files into one to speed up the testing process.

~~> *Warning* - Do not enable this if you wish to know the number of passed/failed tests. If enabled, number of tests will always be *1*.~~
> With galen2 you still see the number of passed/failed tests

default: ***false***

## options.concatScripts
> Inject these global scripts to be loaded before the concatenated tests run.
> Reason: galen loads the specified files only once. The concatenated scripts are wrapped into closures - so the second script won't be able to load the requested library.

default: ***['../gl.js']***

example:  ***[ '../gl.js', '../bower_components/underscore/underscore.js' ],***


## options.project
> Object containing basic information about the project. 

default: ***undefined***

## options.project.url
> URL of the project. This URL is prioritized over options.url.

default: ***http://127.0.0.1:80***

## options.project.name
> Name of the project. Can be used in test files via getProjectName().

default: ***Project***

## options.url
> URL of the project. 

> Overriden by the options.project.url, if defined. 

> Project URL is not necessary, although it is passed to test files via configuration and can be easily read in every test suite via getProjectPage() and getProjectSubpage(subpage).

default: ***http://127.0.0.1:80***

## options.devices
> Object containing device definitions for tests. Each device has to have at least three parameters defined in Galen docs: `deviceName`, `browser` and `size`. ([read more](http://galenframework.com/docs/reference-galen-javascript-api/#createDriver))

> If you wish to use grunt-galen with Selenium Grid (especially SauceLabs), you may also want to define `desiredCapabilites` for each device. ([read more](https://docs.saucelabs.com/reference/test-configuration/)) ([drag-and-drop device configurator](https://docs.saucelabs.com/reference/platforms-configurator))

> *Warning* - All desired capabilities ought to be strings. Therefore tags' arrays, boolean values and numbers have to be cast to strings in the Gruntfile.

default: ***{}***

required: ***true***

## options.htmlReport
> Set to `true`, if you wish Galen to generate HTML report for every test suite.

default: ***false***

## options.htmlReportDest
> Set to desired HTML report directory.

default: ***''***

## options.testngReport
> Set to `true`, if you wish Galen to generate testNG report for every test suite.

default: ***false***

## options.testngReportDest
> Set to desired testNG report directory.

default: ***''***

example: ***'report/testng.xml'***

## options.seleniumGrid
> Configuration object for a remote Selenium Grid.

default: ***disabled***

## options.seleniumGrid.url
> URL address of your Selenium Grid.

> Overrides options.seleniumGrid.username and options.seleniumGrid.accessKey. (Either is assumed to be contained in the url or not necessary to access the Selenium Grid)

default: ***undefined***

## options.seleniumGrid.username
> ***(Only for SauceLabs)*** SauceLabs username.

default: ***undefined***

## options.seleniumGrid.login
> ***(Only for SauceLabs)*** SauceLabs login. This most of the time should have the very same value as `username`, unless you use separate accounts across your team.

default: ***undefined***

## options.seleniumGrid.accessKey
> ***(Only for SauceLabs*** SauceLabs access key.

default: ***undefined***

## options.nogl
> Set `true` to disable gl.js functionality for test suites.

default: ***false***

## options.cwd
> Working directory. (if enabled, gl.js will be created in that directory)

default: ***./***

# GL.js Reference

`gl.js` is a wrapper for some Galen JavaScript functionality, aimed on making testing easier, faster and more intuitive.

## Include
To use `gl.js` in your test file, you have to load `gl.js` library.  `gl.js` is created on runtime in your `options.cwd` directory, so, for example, if your tests are placed under `test/` and you haven't modified the `options.cwd`, you should load `../gl.js` in your test suite.

## Usage
When included, `gl.js` exposes its public interface to the test file in the global scope.

## Public gl.js API

### gl
> Main functional interface. Implements several useful functions to speed up your tests.

### gl.openPage ([Object] device, [String] url [, [String] url, [Object] primaryFields, [Object] secondaryFields])
> Open target page in the browser on a target device. If page times out, test will be failed.

> If pageElements is defined, Galen will attemp to fetch these elements from the webpage. 

**device*** - a device specification

***url*** - a target webpage url (see also config.getProjectPage() and config.getProjectSubpage())

***primaryFields*** - a collection of selectors for elements needed in tests ([galen docs](http://galenframework.com/docs/reference-galen-spec-language-guide/#Objectdefinition))

### gl.runSpecFile ([Object] device, [String] file [, [Array] tags])
> Run a test file on the target device, on the current webpage. This is what Galen is for, after all.

**device*** - a device specification

***file*** - a path to the `.test.js` file

***tags*** - a collection of optional Galen tags for the test

### gl.quit ()
> Terminate all devices and finish testing immediately.

### gl.cleanCache ()
> Remove all elements, fetched from the current webpage, from the cache storage.

### config.getDevices ()
> Retrieve devices list for tests. Compatible with Galen #forAll().

### config.getProjectName ()
> Retrieve project name. ('Project', if undefined)

### config.getProjectPage ()
> Return main project URL.

### config.getProjectSubpage ()
> Return main project URL with appended subpage suffix.

### config.getSeleniumGrid ()
> Get Selenium Grid configuration. Exposes two values:

> `enabled` - Selenium Grid enabled flag

> `url` - Selenium Grid url.

# Examples

Example projects are presented in the `example/` directory. It is sufficient you go into the directory and run `npm install && grunt` to test any of the examples there.

# Testing [![Sauce Test Status](https://saucelabs.com/buildstatus/gruntgalen-sl)](https://saucelabs.com/u/gruntgalen-sl)

Grunt galen has its testing script `npm test`, which launches an example on a current version of the script (does not load a script from NPM, uses `tasks/galen.js` instead).
Example includes both local and remote testing.

SauceLabs account for this project is [open for everyone](https://saucelabs.com/u/gruntgalen-sl) who wishes to test the module on a Selenium Grid. Account credentials are available both on SauceLabs page and here:

```js
login: 'gruntgalen-sl',
username: 'gruntgalen-sl',
accessKey: '5fa3a9f6-a912-4294-b254-6041410702f5'
```

# License 
MIT :octocat:
