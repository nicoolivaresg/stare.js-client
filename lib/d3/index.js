'use strict';

const debug = require('debug')('stare.js:client/d3');

try {
  require.resolve(`${process.cwd()}/node_modules/d3`);
} catch(e) {
  debug("Package 'd3' is not installed");
  process.exit(e.code);
}

const bar = require('./bar');
const bubble = require('./bubble');
const network = require('./network');
const stackedBar = require('./stacked-bar');
const tiles = require('./tiles');
const tiles2 = require('./tiles-2');
const tiles3 = require('./tiles-3');

module.exports = exports = {
  bar,
  bubble,
  network,
  stackedBar,
  tiles,
  tiles2,
  tiles3
};