const _ = require('lodash');

const availableLibraries = {
  'd3': require('./d3')
};

function getChart(library, visualizationType) {
  if (_.has(availableLibraries, library) && _.has(availableLibraries[library], visualizationType)) {
    return availableLibraries[library][visualizationType];
  }

  return null;
}

module.exports = exports = getChart;