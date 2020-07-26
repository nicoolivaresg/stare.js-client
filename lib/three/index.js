'use strict';

const debug = require('debug')('stare.js:client/three');
require.resolve(`${process.cwd()}/node_modules/three`);

try {
  require.resolve(`${process.cwd()}/node_modules/three`);
} catch(e) {
  debug("Package 'three' is not installed");
  process.exit(e.code);
}

const grid = require('./grid');

module.exports = exports = {
  grid
};