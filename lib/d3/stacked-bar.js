'use strict';

const d3 = require(`d3`);
const _ = require('lodash');

const defaultOptions = {
  labelField: 'metrics.ranking',
  valueField: 'metrics.multimedia',
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

  createTooltip(querySelector);

  const formatValue = x => isNaN(x) ? "N/A" : x.toLocaleString('en');

  const yAxis = g => g
    .attr("transform", `translate(${finalOptions.margin.left},0)`)
    .call(d3.axisLeft(y).ticks(null, 's'))
    .call(g => g.selectAll(".domain").remove());

  const xAxis = g => g
    .attr("transform", `translate(0,${finalOptions.height - finalOptions.margin.bottom})`)
    .call(d3.axisBottom(x).tickSizeOuter(0))
    .call(g => g.selectAll(".domain").remove());
    // .call(d3.axisBottom(x).tickFormat(i => _.get(data[i], finalOptions.labelField)).tickSizeOuter(0));

  const stack = d3.stack()
    .keys(_.keys(_.get(data[0], finalOptions.valueField)));

  let stackData = data.map(d => _.get(d, finalOptions.valueField));

  const series = stack(stackData)
    .map(d => (d.forEach(v => v.key = d.key), d));

  const color = d3.scaleOrdinal()
    .domain(series.map(d => d.key))
    .range(d3.schemeSpectral[series.length])
    .unknown('#ccc');
  
  const y = d3.scaleLinear()
    .domain([0, d3.max(series, d => d3.max(d, d => d[1]))])
    .rangeRound([finalOptions.height - finalOptions.margin.bottom, finalOptions.margin.top]);

  const x = d3.scaleBand()
    .domain(data.map(d => _.get(d, finalOptions.labelField)))
    .range([finalOptions.margin.left, finalOptions.width - finalOptions.margin.right])
    .padding(0.1);
  
  const svg = d3.select(querySelector)
    .attr('viewBox', [0, 0, finalOptions.width, finalOptions.height]);

  svg.append('g')
    .selectAll('g')
    .data(series)
    .join('g')
      .attr('fill', d => color(d.key))
    .selectAll('rect')
    .data(d => d)
    .join('rect')
      .attr('x', (d, i) => x(_.get(data[i], finalOptions.labelField)))
      .attr('y', d => y(d[1]))
      .attr('height', d => y(d[0]) - y(d[1]))
      .attr('width', x.bandwidth())
      .on('mouseover', (d, i) => showTooltip(data[i]))
      .on('mouseout', (d, i) => hideTooltip(data[i]))
      .on('click', (d, i) => openDocument(data[i]))
    .append('title')
      .text((d, i) => `${_.get(data[i], finalOptions.labelField)} ${d.key} ${formatValue(d.data[d.key])}`);
  
  svg.append('g')
    .call(xAxis);

  svg.append('g')
    .call(yAxis);
}

module.exports = exports = chart;