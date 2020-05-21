const semver = require('semver');
const fs = require('fs');

const package = require('./package.json');
const tsconfig = require('./tsconfig.json');

const dist_package = Object.assign({}, package, {
    devDependencies: {},
    scripts: {
        start: 'npx patch-package && node index.js',
        postinstall: 'patch-package'
    },
    engines: {
        node: `${semver.major(process.version)}.${semver.minor(process.version)}.x`
    }
});

fs.writeFileSync(`${__dirname}/${tsconfig.compilerOptions.outDir}/package.json`, JSON.stringify(dist_package, null, 2));