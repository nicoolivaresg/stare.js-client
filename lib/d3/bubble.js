'use strict';

const debug = require('debug')('stare.js:client/charts/d3/bubble');

const d3 = require(`d3`);
const _ = require('lodash');

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

function openDocument(d) {
  window.open(d.link, '_blank');
}

const defaultOptions = {
  labelField: 'metrics.ranking',
  valueField: 'metrics.keywords-position.documentLength',
  groupField: 'metrics.language',
  width: 500,
  height: 400,
  fillColor: 'steelblue',
  margin: {top: 30, right: 0, bottom: 30, left: 40}
};

function chart(querySelector, data, opts) {
  let finalOptions = {};
  _.assign(finalOptions, defaultOptions, opts);

  data = _.get(data, 'documents');
  console.log('bubble', data);
  createTooltip(querySelector);

  let color = d3.scaleOrdinal(data.map(d => _.get(d, finalOptions.groupField)), d3.schemeCategory10);
  let format = d3.format(',d');
  let pack = data => d3.pack()
                        .size([finalOptions.width - 2, finalOptions.height - 2])
                        .padding(3)
                        (d3.hierarchy({children: data})
                        .sum(d => _.get(d, finalOptions.valueField)))
  const root = pack(data);
  
  const svg = d3.select(querySelector)
      .attr("viewBox", [0, 0, finalOptions.width, finalOptions.height])
      .attr("font-size", 10)
      .attr("font-family", "sans-serif")
      .attr("text-anchor", "middle");

  const node = svg.selectAll("g")
    .data(root.leaves())
    .join("g")
      .attr("transform", d => `translate(${d.x + 1},${d.y + 1})`)
    .on('mouseover', n => showTooltip(n.data))
    .on('mouseout', n => hideTooltip())
    .on('click', n => openDocument(n.data));

  node.append("circle")
      .attr("id", (d, i) => d.nodeUid = i)
      .attr("r", d => d.r)
      .attr("fill-opacity", 0.7)
      .attr("fill", d => color(d.data.group));

  node.append("text")
      .attr("clip-path", (d, i) => `url(#clip-${i})`)
      .append("tspan")
      .attr("x", 0)
      .attr("y", (d, i, nodes) => `0.3em`)
      // .attr("y", (d, i, nodes) => `${i - nodes.length / 2 + 0.8}em`)
      .text(d => _.get(d.data, finalOptions.labelField));

  node.append("title")
      .text(d => `${_.get(d.data, finalOptions.labelField) === undefined ? "" : `${_.get(d.data, finalOptions.labelField)}`}${format(_.get(d.data, finalOptions.valueField))}`);
}

module.exports = exports = chart;