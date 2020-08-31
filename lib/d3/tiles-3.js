'use strict';

const debug = require('debug')('stare.js:client/charts/d3/tiles-3');

const d3 = require(`d3`);
const _ = require('lodash');

const defaultOptions = {
  labelField: 'metrics.ranking',
  valueField: 'metrics.keywords-position',
  width: 200,
  height: 100,
  fillColor: 'steelblue',
  margin: {top: 0, right: 0, bottom: 0, left: 0},
  numberOfLines: 50,
  messages: {
    'no_data': 'Data not available.'
  },
  numberOfGroups: 10
};

function splitIntoEqualSegments(arr, documentLength, numberOfGroups) {
  let finalArr = [];

  // array.fill() will create a reference to the same array variable for some reason.
  for (var i = 0; i < numberOfGroups; i++) {
    finalArr.push([]);
  }

  let segment = 0;
  let breakLine = (documentLength / numberOfGroups);
  
  for (const [word, positions] of Object.entries(arr)) {
    for (var i = 0; i < positions.length; i++) {
      segment = Math.floor(positions[i] / breakLine);
      finalArr[segment].push(positions[i]);
    }
  }

  console.log(finalArr);
  return finalArr;
}

function formatData(data, valueField, numberOfGroups) {
  let finalData = [];
  let o;

  let documentData = splitIntoEqualSegments(_.get(data, `${valueField}.keywords`),
                                            _.get(data, `${valueField}.documentLength`),
                                            numberOfGroups);
  for (var i = 0; i < documentData.length; i++) {        
    o = {};
    o['metrics.ranking'] = i;
    o[valueField] = documentData[i].length;
    finalData.push(o);
  }

  return finalData;
}

function chart(querySelector, data, opts) {
  let finalOptions = {};
  _.assign(finalOptions, defaultOptions, opts);

  let finalData = formatData(data, finalOptions.valueField, finalOptions.numberOfGroups);

  const yAxis = g => g
    .attr("transform", `translate(${finalOptions.margin.left},0)`)
    .call(d3.axisLeft(y).ticks(null, finalData.format))
    .call(g => g.select(".domain").remove())
    .call(g => g.append("text")
      .attr("x", -finalOptions.margin.left)
      .attr("y", 10)
      .attr("fill", "currentColor")
      .attr("text-anchor", "start")
      .text(finalData.y)
    );

  const xAxis = g => g
    .attr("transform", `translate(0,${finalOptions.height - finalOptions.margin.bottom})`)
    .call(d3.axisBottom(x).tickFormat(i => _.get(finalData[i], finalOptions.labelField)).tickSizeOuter(0));

  const y = d3.scaleLinear()
    .domain([0, d3.max(finalData, d => _.get(d, finalOptions.valueField))]).nice()
    .range([finalOptions.height - finalOptions.margin.bottom, finalOptions.margin.top]);

  const x = d3.scaleBand()
    .domain(d3.range(finalData.length))
    .range([finalOptions.margin.left, finalOptions.width - finalOptions.margin.right])
    .padding(0.1);

  const svg = d3.select(querySelector)
    .attr('viewBox', [0, 0, finalOptions.width, finalOptions.height]);

  svg.append('g')
      .attr('fill', finalOptions.fillColor)
    .selectAll('rect')
    .data(finalData)
    .join('rect')
      .attr('x', (d, i) => x(i))
      .attr('y', d => y(_.get(d, finalOptions.valueField)))
      .attr('height', d => {
        return y(0) - y(_.get(d, finalOptions.valueField));
      })
      .attr('width', x.bandwidth());
  
  svg.append('g')
    .call(xAxis);

  svg.append('g')
    .call(yAxis);
}

module.exports = exports = chart;