/*
 * Galen CLI substitute
 */
var cmd = require('child_process');

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