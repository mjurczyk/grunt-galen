/*
 * Download and install Galen commandline tool, if necessary.
 */

var package = require('../package.json');
var cmd = require('child_process');
var download = require('download');
var fs = require('fs');

function detectGalenCli (callback) {
  var versionRegex = new RegExp(package.galen.version, 'gm');
  
  try {
    if (fs.fstatSync(__dirname + '/lib/galen').isFile() && 
        fs.fstatSync(__dirname + '/lib/galen.bat').isFile()) {

      return callback.present();
    }
  } catch (err) {
    cmd.exec('galen -v', function (err, stdout, stderr) {
      if (err) {
        callback.absent(); 
      } else {
        if (stdout.match(versionRegex)) {
          callback.present(); 
        } else {
          callback.absent();
        }
      }
    });  
  }
};

function installGalenCli () {
  var galenFrameworkUri = [
    'https://github.com/galenframework/galen/releases/download/galen-',
    package.galen.version,
    '/galen-bin-',
    package.galen.version,
    '.zip'
  ].join('');
  
  console.log('Galen framework not detected.');
  console.log('Downloading Galen framework, please wait...');
  console.log('Fetching from ', galenFrameworkUri);
  
  new download({
    extract: true,
    strip: 1
  })
  .get(galenFrameworkUri)
  .dest(__dirname + '/lib')
  .run(function (err, files) {
    if (err) {
      throw err;
    } else {
      console.log('Download completed!');

      done();
    }
  });
};

function done () {
  process.exit(0);
};

detectGalenCli({
  present: done,
  absent: installGalenCli
});
