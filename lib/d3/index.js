'use strict';

const debug = require('debug')('stare.js:client/d3');
require.resolve(`${process.cwd()}/node_modules/d3`);

try {
  require.resolve(`${process.cwd()}/node_modules/d3`);
} catch(e) {
  debug("Package 'd3' is not installed");
  process.exit(e.code);
}

const bar = require('./bar');
// const bubble = require('./bubble');

module.exports = exports = {
  bar
  // bubble
};