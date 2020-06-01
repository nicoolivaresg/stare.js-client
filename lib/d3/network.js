'use strict';

const debug = require('debug')('stare.js:client/charts/d3/network');

const d3 = require(`d3`);
const _ = require('lodash');

const defaultOptions = {
  labelField: 'metrics.ranking',
  linksField: 'metrics.links',
  width: 1000,
  height: 1000,
  fontStyle: '12px sans-serif',
  mainNode: {
    fillColor: 'orange',
    radius: 20
  },
  targetNode: {
    fillColor: 'black',
    radius: 4
  }
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

const drag = simulation => {
  
  function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }
  
  function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }
  
  function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }
  
  return d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
}

function linkArc(d) {
  const r = Math.hypot(d.target.x - d.source.x, d.target.y - d.source.y);
  return `
    M${d.source.x},${d.source.y}
    A${r},${r} 0 0,1 ${d.target.x},${d.target.y}
  `;
}

function processData(data) {
  let formattedData = {
    links: [],
    nodes: []
  };

  for (var i = data.length - 1; i >= 0; i--) {
    if (_.isArray(data[i].metrics.links)) {
      // Creates nodes for original SERP results hostnames.
      formattedData.nodes.push({
        id: data[i].metrics.links[0],
        type: 'mainNode',
        data: data[i]
      });

      for (var j = data[i].metrics.links.length - 1; j > 0; j--) {
        let newDomain = data[i].metrics.links[j];
        if (formattedData.nodes.findIndex(n => n.id === newDomain) === -1) {
          formattedData.nodes.push({ id: newDomain });
        }

        formattedData.links.push({
          source: data[i].metrics.links[0],
          target: newDomain,
          type: 'sources'
        });
      }
    }
  }

  return formattedData;
}

const types = ['sources'];

function chart(querySelector, data, opts) {
  let finalOptions = {};
  _.assign(finalOptions, defaultOptions, opts);

  createTooltip(querySelector);

  const formattedData = processData(data);

  const links = formattedData.links.map(d => Object.create(d));
  const nodes = formattedData.nodes.map(d => Object.create(d));

  const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("x", d3.forceX())
      .force("y", d3.forceY());

  const svg = d3.select(querySelector)
    .attr("viewBox", [-finalOptions.width / 2, -finalOptions.height / 2, finalOptions.width, finalOptions.height])
    .style("font", finalOptions.fontStyle);

  const color = d3.scaleOrdinal(types, d3.schemeCategory10);

  // Per-type markers, as they don't inherit styles.
  svg.append("defs").selectAll("marker")
    .data(types)
    .join("marker")
      .attr("id", d => `arrow-${d}`)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 15)
      .attr("refY", -0.5)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
    .append("path")
      .attr("fill", color)
      .attr("d", "M0,-5L10,0L0,5");

  const link = svg.append("g")
      .attr("fill", "none")
      .attr("stroke-width", 1.5)
    .selectAll("path")
    .data(links)
    .join("path")
      .attr("stroke", d => color(d.type))
      .attr("marker-end", d => `url(${new URL(`#arrow-${d.type}`, location)})`);

  const node = svg.append("g")
      .attr("fill", "currentColor")
      .attr("stroke-linecap", "round")
      .attr("stroke-linejoin", "round")
    .selectAll("g")
    .data(nodes)
    .join("g")
      .call(drag(simulation))
    .on('mouseover', n => {
      if (_.get(formattedData.nodes[n.index], 'type') === 'mainNode') {
        showTooltip(n.data);
      }
    })
    .on('mouseout', n => {
      if (_.get(formattedData.nodes[n.index], 'type') === 'mainNode') {
        hideTooltip();
      }
    })
    .on('click', n => {
      if (_.get(formattedData.nodes[n.index], 'type') === 'mainNode') {
        openDocument(n.data);
      }
    });

  node.append("circle")
      .attr("stroke", "white")
      .attr("stroke-width", 1.5)
      .attr("class", "mainNode")
      .style("fill", (n) => {
        if (_.get(formattedData.nodes[n.index], 'type') === 'mainNode') {
          return finalOptions.mainNode.fillColor;
        }
        return finalOptions.targetNode.fillColor;
      })
      .attr("r", (n) => {
        if (_.get(formattedData.nodes[n.index], 'type') === 'mainNode') {
          return finalOptions.mainNode.radius;
        }
        return finalOptions.targetNode.radius;
      });

  node.append("text")
      .attr("x", 8)
      .attr("y", "0.31em")
      .text(d => d.id)
    .clone(true).lower()
      .attr("fill", "none")
      .attr("stroke", "white")
      .attr("stroke-width", 3);

  simulation.on("tick", () => {
    link.attr("d", linkArc);
    node.attr("transform", d => `translate(${d.x},${d.y})`);
  });

  // invalidation.then(() => simulation.stop());
}

module.exports = exports = chart;
