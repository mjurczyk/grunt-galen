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
    if (fs.statSync(__dirname + '/lib/galen').isFile() && 
        fs.statSync(__dirname + '/lib/galen.bat').isFile()) {

      return callback.present();
    }
  } catch (err) {
    cmd.exec('galen -v', function (err, stdout, stderr) {
      if (err) {
        if (err.code === 127 || err.code === 1 || stderr.match(/command? not (found|recognized)/g)) {
          callback.absent(); 
        } else {
          throw err;
        }
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
  var galenCliPath;
  var galenCliExec;
  
  if (process.platform === 'win32') {
    galenCliPath = __dirname + '/lib/galen.bat';
  } else  {
    galenCliPath = __dirname + '/lib/galen';
  }
  
  galenCliExec = cmd.spawn(galenCliPath, process.argv.slice(2), { stdio: 'inherit' });

  galenCliExec.on('error', function (err) {
    console.error(err);

    process.exit(1);
  });

  galenCliExec.on('exit', function (data) {
    process.exit(data);
  });
};

detectGalenCli({
  present: done,
  absent: installGalenCli
});
