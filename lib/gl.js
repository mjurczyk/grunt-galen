/*
 * Galen JavaScript API
 */

/*
 * Global public API
 *
 * @global config
 * @global gl
 * @global elements
 */
var config;
var gl;
var elements;

/**
 * config module describes the configuration of the testing
 * suite. It includes information about:
 * - project name and url address
 * - testing devices
 * - selenium grid settings
 *
 * Useful public interface methods:
 * - getProjectName: returns the project codename
 * - getProjectPage: returns project url address
 * - getProjectSubpage: returns project url address with appended subdir
 *
 * @returns {Array|Object} public interface methods
 */
config = function () {
  /*
   * @private
   *
   * Default project configuration
   */
  var _project = {
    name: 'Project',
    protocol: 'http',
    host: '127.0.0.1',
    port: 80
  };

  /*
   * @private
   *
   * Default Selenium grid configuration
   */
  var _slGrid = {
    enabled: false,
    url: ''
  };

  /*
   * @private
   */
  var _devices = {};

  /**
   * Set configuration.
   * @param {Object} configuration
   */
  function set (data) {
    if (!data.project) {
      data.project = {
        name: null,
        url: null
      };
    }

    config.setProjectName(data.project.name || 'Project');
    config.setProjectUrl(data.project.url || data.url || 'http://127.0.0.1:80');
    config.setDevices(data.devices || {});

    if (data.seleniumGrid) {
      config.setSeleniumGrid(data.seleniumGrid.url);
    }
  };

  /**
   * Enable Selenium grid.
   * @param {String} url Selenium Grid HUB url
   */
  function setSeleniumGrid (url) {
    _slGrid.enabled = true;
    _slGrid.url = url;
  };

  /**
   * Selenium Grid getter.
   * @returns {Object} Selenium Grid configuration
   */
  function getSeleniumGrid () {
    return _slGrid;
  };

  /**
   * Set devices to be tested on, in form of an Object
   * container. Configurations depend on the target environment,
   * but two most useful docs for that are:
   * - http://galenframework.com/docs/reference-javascript-tests-guide/#CreatingdriverinSeleniumGrid
   * - https://docs.saucelabs.com/reference/test-configuration/
   *
   * @param {Object} devices devices container
   */
  function setDevices (devices) {
    _devices = devices || {};
  };

  /**
   * Devices getter.
   * @returns {Object} devices or empty object
   */
  function getDevices () {
    return _devices;
  };

  /**
   * Set project codename, available for tests via the public
   * methods interface.
   * @param {String} name project name
   */
  function setProjectName (name) {
    _project.name = name;
  };

  /**
   * Project name getter.
   * @returns {String} non-null project name
   */
  function getProjectName () {
    return _project.name;
  };

  /**
   * Set project url, available for tests via the public
   * methods interface.
   * Safest form would be:
   * {protocol}://{host}:{port}/
   * Other forms behaviour may vary.
   *
   * @param {String} url project url
   */
  function setProjectUrl (url) {
    var _url = (url.split(/(:\/{2})|(:)|(\/{1}.*)/gm) || []).filter(Boolean);

    if (_url.length < 3) {
      throw new Error('Invalid project url');
    }

    _project.protocol = _url[0];
    _project.host = _url[2];
    _project.port = _url.length >= 4 ? _url[4] : 80;
  };

  /**
   * Getter for project base url address, available for tests via the public
   * methods interface.
   * @returns {String} url
   */
  function getProjectPage () {
    return [
      _project.protocol,
      '://',
      _project.host,
      ':',
      _project.port
    ].join('');
  };

  /**
   * Getter for project subpage url. Transforms the base url
   * by appending a proper suffix, ex.:
   * getProjectSubpage('#login')  =>  http://myproj.com/#login
   *
   * Available via the public methods interface.
   * @param   {String} url subpage
   * @returns {String} url
   */
  function getProjectSubpage (url) {
    return [
      getProjectPage(),
      url.indexOf('/') !== 0 ? url : url.substr(1)
    ].join('/');
  };

  /*
   * @public
   *
   * Public API
   */
  return {
    set: set,
    setDevices: setDevices,
    setProjectName: setProjectName,
    setProjectUrl: setProjectUrl,
    setSeleniumGrid: setSeleniumGrid,

    getDevices: getDevices,
    getProjectName: getProjectName,
    getProjectPage: getProjectPage,
    getProjectSubpage: getProjectSubpage,
    getSeleniumGrid: getSeleniumGrid
  };
}();

/*
 * @public
 *
 * Cached elements on the page.
 */
elements = {};

/**
 * gl module serves a bunch of useful and fast implementations
 * of original Galen JavaScript API.
 * @returns {Object} public interface methods
 */
gl = function () {
  /*
   * @private
   *
   * Available webdrivers (one for every view type).
   */
  var _drivers = {};
  /*
   * @private
   *
   * Currently used device params.
   */
  var _params = {};

  /**
   * @private
   * @class
   *
   * GalenPages forces us to create a page class.
   * It is created here as an uniformal scheme and
   * later used for every page initialized by tests.
   * @param {Object} driver   target webdriver
   * @param {Object} elements container of elements to select from page
   */
  function GalenPageCls (driver, elements) {
    GalenPages.extendPage(this, driver, elements || {});
  };

  /**
   * Specify which device settings ought to be used
   * in next tests.
   * @param {Object} params device settings
   */
  function useDevice (params) {
    _params = params || {};
  };

  /**
   * This method shortcuts both driver and page creation.
   * We open a page in a target driver and ask it to select
   * necessary elements before it proceeds to tests.
   * This method does not launch a new webdriver, nor does
   * it close any previous one.
   *
   * (*) Argument `params` is favored over cached _params, although
   * requires full arguments list (`requiredElements` becomes
   * unoptional in that case). Params cannot be put as a
   * second argument.
   *
   * @param {String} url              tested page url
   * @param {Object} requiredElements (optional) galen selector list
   * @param {Object} params           (optional*) params override
   */
  function openPage (url, requiredElements, params) {
    var page;

    params = params || _params;
    requiredElements = requiredElements || {};

    page = new GalenPageCls(params._driver, requiredElements);
    page.open(url);

    // #waitForIt is unnecessary and unwanted when no elements are defined.
    if (Object.keys(requiredElements).length > 0) {
      page.waitForIt();
    }

    elements = page;
  };

  /**
   * Run a Galen spec file on the current page on a
   * target driver.
   *
   * Argument `specFile` is relative to gl.js, not the test
   * file.
   *
   * @param {String} specFile Galen spec file path
   * @param {Array}  tags     (optional) Galen test tags
   * @param {Object} params   (optional) params override
   */
  function runSpecFile (specFile, tags, params) {
    params = params || _params;

    checkLayout(params._driver, specFile, tags);
  };

  /**
   * Remove all elements stored in cache.
   *
   * Unlikely to be used in tests.
   */
  function cleanCache () {
    elements = {};
  };

  /**
   * Terminate all webdrivers, cleanCache and finish
   * the testing.
   *
   * Unlikely to be used in tests, unless you disable
   * gl#defaultAfterTest method.
   */
  function quit () {
    if (_drivers) {
      forAll(_drivers, function (driver) {
        driver.quit();
      });
    }

    cleanCache();
  };

  /**
   * Generate webdrivers for all devices before tests
   * are run.
   *
   * If Selenium Grid is enabled, this method will create
   * GridDrivers instead.
   *
   * Drivers are assigned to devices as a _driver property.
   */
  function defaultBeforeTest () {
    beforeTestSuite(function () {
      var devices = config.getDevices();

      Object.keys(devices).forEach(function (dname) {
        var device = devices[dname];
        var driver;
        var slGrid = config.getSeleniumGrid();

        if (slGrid.enabled === false) {
          driver = createDriver(null, device.size, device.browser);
        } else {
          driver = createGridDriver(slGrid.url, device);
        }

        device._driver = driver;
        _drivers[dname] = driver;
      });
    });
  };

  /**
   * After a single test: clean elements cache.
   * After all tests: quit the testing process.
   */
  function defaultAfterTest () {
    afterTest(function () {
      gl.cleanCache();
    });

    afterTestSuite(function () {
      gl.quit();
    });
  };

  /*
   * @public
   *
   * Public API
   */
  return {
    useDevice: useDevice,
    openPage: openPage,
    runSpecFile: runSpecFile,

    quit: quit,
    cleanCache: cleanCache,

    defaultBeforeTest: defaultBeforeTest,
    defaultAfterTest: defaultAfterTest
  };
}();

/*
 * Initialize default pre- and post- test callbacks.
 */
gl.defaultBeforeTest();
gl.defaultAfterTest();

load('gl.config.js');