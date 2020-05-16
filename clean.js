const globby = require('globby');
const rimraf = require('rimraf');

globby(['build/**/*', '!build/caches']).then(paths => paths.forEach(path => rimraf.sync(path)));