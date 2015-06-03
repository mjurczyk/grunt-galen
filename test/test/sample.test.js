load('../gl.js');

forAll(config.getDevices(), function (device) {
  test('Hidden popup on ' + device.deviceName, function () {
    gl.openPage(device, config.getProjectPage());
    
    gl.runSpecFile(device, './test/popup-off.spec');
  });
  
  test('Trigger popup on ' + device.deviceName, function () {
    gl.openPage(device, config.getProjectPage(), {
      triggerBtn: '.trigger' 
    });
    
    elements.triggerBtn.click();
    
    gl.runSpecFile(device, './test/popup-on.spec');
  });
});
