const d3 = require('./d3');


var options = {
  library: 'd3'
};

function charts(opts) {
  opts = opts || options;

  return this;
}

module.exports = {
  charts
};