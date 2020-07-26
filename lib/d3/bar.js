'use strict';

const debug = require('debug')('stare.js:client/charts/d3/bar');

const d3 = require(`d3`);
const _ = require('lodash');

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

function openDocument(d) {
  window.open(d.link, '_blank');
}

function chart(querySelector, data, opts) {
  let finalOptions = {};
  _.assign(finalOptions, defaultOptions, opts);

  data = _.get(data, 'documents');
  console.log('bar', data);

  createTooltip(querySelector);

  const yAxis = g => g
    .attr("transform", `translate(${finalOptions.margin.left},0)`)
    .call(d3.axisLeft(y).ticks(null, data.format))
    .call(g => g.select(".domain").remove())
    .call(g => g.append("text")
      .attr("x", -finalOptions.margin.left)
      .attr("y", 10)
      .attr("fill", "currentColor")
      .attr("text-anchor", "start")
    .text(data.y));

  const xAxis = g => g
    .attr("transform", `translate(0,${finalOptions.height - finalOptions.margin.bottom})`)
    .call(d3.axisBottom(x).tickFormat(i => _.get(data[i], finalOptions.labelField)).tickSizeOuter(0));

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => _.get(d, finalOptions.valueField))]).nice()
    .range([finalOptions.height - finalOptions.margin.bottom, finalOptions.margin.top]);

  const x = d3.scaleBand()
    .domain(d3.range(data.length))
    .range([finalOptions.margin.left, finalOptions.width - finalOptions.margin.right])
    .padding(0.1);

  const svg = d3.select(querySelector)
    .attr('viewBox', [0, 0, finalOptions.width, finalOptions.height]);

  svg.append('g')
      .attr('fill', finalOptions.fillColor)
    .selectAll('rect')
    .data(data)
    .join('rect')
      .attr('x', (d, i) => x(i))
      .attr('y', d => y(_.get(d, finalOptions.valueField)))
      .attr('height', d => y(0) - y(_.get(d, finalOptions.valueField)))
      .attr('width', x.bandwidth())
    .on('mouseover', d => showTooltip(d))
    .on('mouseout', d => hideTooltip())
    .on('click', d => openDocument(d));
  
  svg.append('g')
    .call(xAxis);

  svg.append('g')
    .call(yAxis);
}

module.exports = exports = chart;