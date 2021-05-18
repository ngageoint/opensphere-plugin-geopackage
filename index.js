/* eslint-env es6 */

'use strict';

const fs = require('fs');
const path = require('path');
const resolver = require('opensphere-build-resolver/utils');

/**
 * Directory containing build artifacts generated by `opensphere-build-resolver`.
 * @type {string}
 */
const buildDir = '.build';

/**
 * Path to the build directory.
 * @type {string}
 */
const buildPath = path.join(process.cwd(), buildDir);

/**
 * Path to the version file.
 * @type {string}
 */
const versionFile = path.join(buildPath, 'version');

/**
 * Relative path of the version directory.
 * @type {string}
 */
const version = fs.readFileSync(versionFile, 'utf8').trim().replace(/.*\//, '');

// if opensphere isn't linked in node_modules, assume it's a sibling directory
const appPath = resolver.resolveModulePath('opensphere') || path.join(__dirname, '..', 'opensphere');

module.exports = {
  appVersion: version,
  basePath: __dirname,
  appPath: appPath,
  distPath: path.join(appPath, 'dist', 'opensphere'),
  templates: [{
    // add geopackage to main index page
    id: 'index',
    skip: true,
    resources: [{
      source: path.join(__dirname, 'src', 'worker'),
      target: 'src/worker',
      files: ['gpkg.worker.js']
    }, {
      source: resolver.resolveModulePath('@ngageoint/geopackage/dist'),
      target: 'vendor/geopackage',
      files: [
        'geopackage.min.js',
        'sql-wasm.wasm',
        'canvaskit/canvaskit.wasm'
      ]
    }]
  }],
  debugCss: path.relative(__dirname, path.join(buildPath, 'combined.css')),
  compiledCss: path.join(version, 'styles', 'opensphere.min.css'),
  compiledJs: path.join(version, 'opensphere.min.js')
};
