load('../gl.js');

forAll(config.getDevices(), function (device) {
  gl.useDevice(device);
  
  test('Hidden popup on ' + device.deviceName, function () {
    gl.openPage(config.getProjectPage());
    
    gl.runSpecFile('./test/popup-off.spec');
  });
  
  test('Trigger popup on ' + device.deviceName, function () {
    gl.openPage(config.getProjectPage(), {
      triggerBtn: '.trigger' 
    });
    
    elements.triggerBtn.click();
    
    gl.runSpecFile('./test/popup-on.spec');
  });
});
