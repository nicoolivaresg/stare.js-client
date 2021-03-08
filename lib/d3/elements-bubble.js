'use strict';

const debug = require('debug')('stare.js:client/charts/d3/elements-bubble');

const d3 = require(`d3`);
const _ = require('lodash');
const natural = require('natural'); //Copyright (c) 2011, 2012 Chris Umbel, Rob Ellis, Russell Mull


function obj_array(object) {
  var results = [];
  for (var property in object)
    for (let index = 0; index < object[property]; index++) {
      results.push(property);
    }
  return results;
}


function count(array_elements, threshold) {
  // let array_elements = ["a", "b", "c", "d", "e", "a", "b", "c", "f", "g", "h", "h", "h", "e", "a"];

  array_elements.sort();

  var results = [];
  var current = "";
  var cnt = 0;
  for (var i = 0; i < array_elements.length; i++) {
      let distance = natural.JaroWinklerDistance(array_elements[i], current, undefined, true);
      if (distance < threshold) {
          if (cnt > 0) {
            results.push({
              key: current,
              value: cnt
            })
            // document.write(current + ' comes --> ' + cnt + ' times<br>');
          }
          current = array_elements[i];
          cnt = 1;
      } else {
          cnt++;
      }
  }
  if (cnt > 0) {
    results.push({
      key: current,
      value: cnt
    })
    // document.write(current + ' comes --> ' + cnt + ' times');
  }

  return results;

}



let tooltip = null;
function createTooltip() {
  tooltip = d3.select('body')
    .append('div')
    .attr('class', 'stare__tooltip')
    .style('opacity', 0)
}

function showTooltip(d) {
  let html = `<div><b>${d.title}</b></div><div><b>Elemento(s):</b> ${d.key}</div><div><b>Menciones:</b> ${d.value}</div>`;

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
  idField: 'metrics.identifier',
  labelField: 'metrics.profiles',
  valueField: 'metrics.keywords-position.documentLength',
  groupField: 'metrics.language',
  linkField: 'link',
  titleField: 'title',
  elementsField: 'metrics.needed-elements',
  threshold: 0.75,
  width: 500,
  height: 400,
  fillColor: 'steelblue',
  margin: {top: 30, right: 0, bottom: 30, left: 40}
};

function chart(querySelector, data, opts) {
  let finalOptions = {};
  _.assign(finalOptions, defaultOptions, opts);

  data = _.get(data, 'documents');
  console.log('elements-bubble', data);
  createTooltip(querySelector);

  let finalData = [];
  data.forEach(d => {
    let elements = _.get(d,finalOptions.elementsField);
    let array = obj_array(elements);
    let count_per_doc = count(array, finalOptions.threshold);
    
    count_per_doc = count_per_doc.map(el => {
      return _.extend(el,{
        title: _.get(d, finalOptions.titleField),
        link: _.get(d, finalOptions.linkField),
      })
    });

    finalData = finalData.concat(count_per_doc);
    count_per_doc=[];
    array=[];
    elements = {};
  });

  console.log(finalData);

  let color = d3.scaleOrdinal(finalData.map(d => d.title), d3.schemeCategory10);
  let format = d3.format(',d');
  let pack = data => d3.pack()
                        .size([finalOptions.width - 2, finalOptions.height - 2])
                        .padding(3)
                        (d3.hierarchy({children: data})
                        .sum(d => _.get(d, 'value')))
  const root = pack(finalData);
  console.log(root);
  
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
      .attr("fill", d => color(d.data.title));

  // node.append("text")
  //     .attr("clip-path", (d, i) => `url(#clip-${i})`)
  //     .append("tspan")
  //     .attr("x", 0)
  //     .attr("y", (d, i, nodes) => `0.1em`)
  //     // .attr("y", (d, i, nodes) => `${i - nodes.length / 2 + 0.8}em`)
  //     .text(d => _.get(d.data, 'title'));

  // node.append("title")
      // .text(d => `${_.get(d.data, 'key') === undefined ? "" : `${_.get(d.data, 'key')}`}${format(_.get(d.data, 'key'))}`);
}

module.exports = exports = chart;