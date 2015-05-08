load('../gl.js');

forAll(config.getDevices(), function (device) {
  gl.useDevice(device);
  
  test('Containers position on ' + device.deviceName, function () {
    gl.openPage(config.getProjectSubpage('/static/sample.html'));
    
    gl.runSpecFile('./test/sample.spec');
  });
});
