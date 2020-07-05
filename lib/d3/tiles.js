'use strict';

const debug = require('debug')('stare.js:client/charts/d3/tiles');

const d3 = require(`d3`);
const _ = require('lodash');

const defaultOptions = {
  labelField: 'metrics.ranking',
  valueField: 'metrics.keywords-position',
  width: 100,
  height: 100,
  fillColor: 'steelblue',
  margin: {top: 0, right: 0, bottom: 0, left: 0},
  numberOfLines: 50,
  messages: {
    'no_data': 'Data not available.'
  }
};

function generateWordColors() {
  return ['#ff0000', '#0000ff', '#00ff00'];
}

function chart(querySelector, data, opts) {
  let finalOptions = {};
  _.assign(finalOptions, defaultOptions, opts);

  const svg = d3.select(querySelector)
    .attr('viewBox', [0, 0, finalOptions.width, finalOptions.height]);

  
  let documentData = _.get(data, finalOptions.valueField);

  // Invalid data
  if (_.isEmpty(documentData) || documentData === -1) {
    let text = svg.append('text')
        .attr('x', 0)
        .text(finalOptions.messages.no_data);
    text.attr('y', text.node().getBBox().height);
    return;
  }

  let documentLength = documentData.documentLength;
  let documentWords = documentData.keywords;

  /* Create background */
  svg.append('rect')
      .attr('fill', finalOptions.fillColor)
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', finalOptions.width)
      .attr('height', finalOptions.height);
  
   let character = {
    width: 1,
    height: 1
  };

  // each line will represent a tenth of the document size
  character.height = finalOptions.height / finalOptions.numberOfLines;
  character.width = (finalOptions.width * finalOptions.height) / (documentLength * character.height);

  /* Position keywords */
  const posX = (p, i) => {
    return (p % finalOptions.numberOfLines) * character.width;
  };

  const posY = (p, i) => {
    return Math.floor((p * finalOptions.numberOfLines)/ documentLength) * character.height;
  };

  let colors = generateWordColors();
  Object.keys(documentWords).forEach((v, i) => {
    let wordPositions = documentWords[v];
    console.log(v, wordPositions);
    svg.append('g')
        .attr('fill', colors[i])
      .selectAll('rect')
      .data(wordPositions)
      .join('rect')
        .attr('x', posX)
        .attr('y', posY)
        .attr('height', character.height)
        .attr('width', character.width * v.length);
    
    svg.append('g')
        .attr('fill', 'white')
      .selectAll('text')
      .data(wordPositions)
      .join('text')
        .attr('x', posX)
        .attr('y', (p, i) => posY(p, i) + character.height)
        .attr('height', character.height)
        .attr('width', character.width * v.length)
        .attr('font-family', 'monospace')
        .attr('font-size', character.height)
        .text(v);
  });
    
}

module.exports = exports = chart;