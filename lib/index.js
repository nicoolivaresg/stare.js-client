const _ = require('lodash');

const availableLibraries = {
  'd3': require('./d3')
};

function getChart(library, visualizationType) {
  if (! _.has(availableLibraries, library)) {
    throw new Error(`StArE.js doesn't have support for the library '${library}'`);
  }
  if (! _.has(availableLibraries[library], visualizationType)) {
    throw new Error(`There is no visualization '${visualizationType}' for library '${library}'`);
  }

  return availableLibraries[library][visualizationType];
}

module.exports = exports = getChart;