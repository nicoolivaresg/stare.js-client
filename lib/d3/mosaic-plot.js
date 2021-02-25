'use strict';

const debug = require('debug')('stare.js:client/charts/d3/mosaic-plot');
const d3 = require('d3');
const _ = require('lodash');
const d3_comp = require('./d3-components');

const defaultOptions = {
  labelField: 'metrics.ranking',
  valueField: 'metrics.length',
  width: 500,
  height: 400,
  fillColor: 'steelblue',
  margin: {top: 30, right: 0, bottom: 30, left: 40}
};

let tooltip = null;
function createTooltip() {
  tooltip = d3.select('body')
    .append('div')
    .attr('class', 'stare__tooltip')
    .style('opacity', 0)
}

function showTooltip(d) {
  let html = `<div><b>${d.title}</b></div><div>${d.snippet}</div>`;

  tooltip
    .transition()
      .duration(200)
      .style('opacity', 1);
  tooltip
    .html(html)
    .style('left', `${d3.event.pageX}px`)
    .style('top', `${d3.event.pageY - 28}px`);
}

function hideTooltip() {
  tooltip
    .transition()
      .duration(500)
      .style('opacity', 0);
}

function chart(querySelector, data, opts) {
  let finalOptions = {};
  _.assign(finalOptions, defaultOptions, opts);

  data = _.get(data, 'documents');
  console.log('mosaic-plot', data);

  createTooltip(querySelector);

  var promises = [];
  var url = ['']


  try{
    const data = require('./titanic-passengers.json');
    console.log(d3_comp);
    d3_comp.mosaicPlot(data, {id: 'mosaic-plot-default'});

  }catch(err) {
    console.log(err);
  };
};

module.exports = exports = chart;