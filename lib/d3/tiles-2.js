'use strict';

const debug = require('debug')('stare.js:client/charts/d3/tiles');

const d3 = require(`d3`);
const _ = require('lodash');

const defaultOptions = {
  labelField: 'metrics.ranking',
  valueField: 'metrics.keywords-position',
  width: 2500,
  height: 800,
  fillColor: 'steelblue',
  margin: {top: 0, right: 0, bottom: 0, left: 0},
  numberOfLines: 50,
  messages: {
    'no_data': 'Data not available.'
  },
  boxSize: {
    width: 20,
    height: 20
  },
  breakLine: 100
};


function splitIntoEqualSegments(arr, documentLength, breakLine) {
  let finalArr = [];

  // array.fill() will create a reference to the same array variable for some reason.
  for (var i = 0; i < Math.ceil(documentLength / breakLine); i++) {
    finalArr.push([]);
  }

  let segment = 0;
  for (var i = 0; i < arr.length; i++) {
    segment = Math.floor(arr[i] / breakLine);
    finalArr[segment].push(arr[i]);
  }

  return finalArr;
}

function greyScale(grade) {
  return d3.interpolateGreys(grade/8);
}

function chart(querySelector, data, opts) {
  let finalOptions = {};
  _.assign(finalOptions, defaultOptions, opts);

  const svg = d3.select(querySelector);

  let documents = _.get(data, 'documents');

  let maxWidth = 0;
  let currentY = 1;
  let documentStartY;
  /* Create rows for each document */
  documents.map(d => {
    documentStartY = currentY - 1;

    let documentData = _.get(d, `${finalOptions.valueField}`);
    
    // Check for invalid data
    if (_.isEmpty(documentData) || documentData === -1 || _.get(documentData, 'documentLength') === 0) {
      let text = svg.append('text')
          .attr('x', 0)
          .text(`${_.get(d, finalOptions.labelField)}: ${finalOptions.messages.no_data}`);
      text.attr('y', currentY);
      currentY += finalOptions.boxSize.height + 1;
      return false;
    }

    let documentLength = _.get(documentData, 'documentLength');
    let documentWords = _.get(documentData, 'keywords');

    maxWidth = documentLength > maxWidth ? documentLength : maxWidth;
    
    // Each word/term will be a new line
    for (const [word, positions] of Object.entries(documentWords)) {
      positions = splitIntoEqualSegments(positions, documentLength, finalOptions.breakLine);
      let currentX = 1;

      // Print cubes representing the frequecy of a keyword/term.
      for(let index = 0; index < positions.length; index++) {
        // scale [0, 8]
        let frequency = positions[index].length > 8 ? 8 : positions[index].length;
        let fillColor = greyScale(frequency);

        svg.append('rect')
            .attr('fill', fillColor)
            .attr('x', currentX)
            .attr('y', currentY)
            .attr('width', finalOptions.boxSize.width)
            .attr('height', finalOptions.boxSize.height);

        currentX += finalOptions.boxSize.width;
      }

      // Move to the next keyword/term/row for the same document.
      currentY += finalOptions.boxSize.height + 1;
    };

    // Enclose the document on a rectangle
    svg.append('rect')
            .attr('x', 0)
            .attr('y', documentStartY)
            .attr('width', finalOptions.boxSize.width * (documentLength / finalOptions.breakLine))
            .attr('height', currentY - documentStartY)
            .style('fill-opacity', 0)
            .style('stroke', 'black')
            .style('stroke-width', 1);

    // Separate the document from the next one by 2 units.
    currentY += finalOptions.boxSize.height + 1;
  });

  maxWidth = finalOptions.boxSize.width * (maxWidth / finalOptions.breakLine);
  // Update viewBox size in case to be needed.
  let viewBoxWidth = finalOptions.width > maxWidth ? finalOptions.width : maxWidth;
  let viewBoxHeight = finalOptions.height > currentY ? finalOptions.height : currentY;
  svg.attr('viewBox', [0, 0, viewBoxWidth, viewBoxHeight]);   
}

module.exports = exports = chart;