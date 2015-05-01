# grunt-galen

> Grunt plugin for [Galen](http://galenframework.com/) testing framework

In order to use this plugin, we have to install `Galen` first. Plugin does not include
the framework, only runs it via `Galen cli`.

## Getting started
In the project directory run:

```bash
npm install --save-dev grunt-galen
```

Then add it to the Gruntfile:

```js
grunt.loadNpmTasks('grunt-galen');
```

## Testing variables

`grunt-galen` exposes 3 variables for each testing suite:


| name     |                  description                  |
|:----:----|:----------------------------------------------|
|websiteUrl|Url for which the test will be run             |
|device    |Device codename (ex. mobile, tablet ..)        |
|size      |Screen dimensions of the device (ex. 800x600)  |

## Configuration

In `Gruntfile.js` we can specify a Galen tests configuration via
options parameter for `galen` task.

```js
galen: {
  options: {
    htmlReport: true,
    htmlReportDest: 'html-reports/',
    
    output: false,
    
    devices: {
      mobile: '320x480',
      tablet: '768x1024',
      desktop: '1280x800'
    },
    
    url: 'http://127.0.0.1:8080'
  }
}
```

We can specify `options` for each task separately. Hence, we can run Galen tests on different endpoint urls for each task.

```js
galen: {
  options: {
    // global options
  },
  localTests: {
    src: [
      // Say we have our tests under ./PROJECT_DIR/tests/galen/
      // in different subdirectories.
      'tests/galen/**/*.test'
    ]
    options: {
      url: 'http://127.0.0.1:8080'
    }
  },
  productionTests: {
    src: ['tests/galen/**/*.test'],
    options: {
      url: 'http://best-site-evr.get-rekt.com'
    }
  }
}
```

## Options

### options.htmlReport [Boolean]
> If set to true, Galen will generate HTML reports for each test suite.

default: ***false***

### options.htmlReportDest [String]
> If options.htmlReport is set to true, specify a directory in which the reports will
> be saved.

default: ***''***

### options.output [Boolean]
> If set to true, Galen will print out outputs to the terminal for each test separately.
> If set to false, Galen will skip the default output for each test, but will still print
> out the final conclusion (#tests passed, #tests failed and percentage).

default: ***false***

### options.devices [Object/Collection]
> A map of devices for tests. Specify a codename and a dimensions regarding to the
> Galen documentation: *{ 'name' : 'widthxheight', ... }*

default: ***undefined***

required: ***true***

### options.url [String]
> A url of application to test.

default: ***''***

required: ***true***

# Licence 
No idea :octocat:
