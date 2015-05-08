var driver;
var url = 'http://127.0.0.1:3000/static/sample.html';
var specFile = './test/sample.spec';

afterTestSuite(function () {
  driver.quit();
});

forAll({
  desktop: {
    deviceName: 'desktop',
    browser: 'firefox',
    size: '800x600'
  }
 }, function (device) {
  
  test('Test sample without gl on ' + device.deviceName, function () {
    driver = createDriver(url, device.size, device.browser);
    
    checkLayout(driver, specFile, [device.deviceName, 'no-gl']);
  });
});
