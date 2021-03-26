'use strict';

const debug = require('debug')('stare.js:client/charts/d3/map');

const d3 = require(`d3`);
const topojson = require("topojson-client");
const _ = require('lodash');
const http = require('axios');
const natural = require('natural'); //Copyright (c) 2011, 2012 Chris Umbel, Rob Ellis, Russell Mull
const { resolve } = require('path');

let tooltip = null;
let modal = null;
let legend = null;
let uf = null;

function createTooltip() {
  tooltip = d3.select('body')
    .append('div')
    .attr('class', 'stare__tooltip')
    .style('opacity', 0)
}

function showTooltip(d, opts) {
  let html = `<div><b>${d.Corte}</b></div><div>`;

  if (d.data) {
    html = html + `<div><b>Ddo promedio 1a instancia: </b>${_.isEqual(opts.unit, 'uf') ? d.average.first + ' UF' : '$' + d.average.first}</div><div>`
    html = html + `<div><b>Ddo promedio otorgado: </b>${_.isEqual(opts.unit, 'uf') ? d.average.full + ' UF' : '$' + d.average.full}</div><div>`
    //   d.data.forEach(e => {
      // html = html + `<div><b>Rol: </b>${e.courts.court.rol}<b><br/>Tribunal primera instancia: </b>${e.courts.court.name}<br/><b>Resultado: </b>${e.courts.court.result}</div><div>`
  //   });
  }else{
  //   html = html + `<divNo hay sentencias en esta zona para esta búsqueda.</div><div>`
  }

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


function createInfoModal() {
  modal = d3.select('body')
    .append('div')
    .attr('class', 'stare__modal')
    .style('opacity', 0)
}

function showInfoModal(d) {
  let html = `<div><b>${d.Corte}</b></div><div>`;

  if (d.data) {
    d.data.forEach(e => {
      html = html + `<div><b>${e.courts.court.name}</b></div><div>`
    });
  }

  modal
    .transition()
    .duration(200)
    .style('opacity', 1);
  modal
    .html(html)
    .style('left', `${d3.event.pageX}px`)
    .style('top', `${d3.event.pageY - 28}px`);
}

function hideInfoModal() {
  modal
    .transition()
    .duration(500)
    .style('opacity', 0);
}

function resumeData(data,opts){
  data.features.forEach(e => {
    if(_.has(e.properties, 'data')){
      let amounts = e.properties.data.map(doc => { return _.isEqual(opts.unit, 'uf') ? parseInt(_.get(doc, opts.amountFullField), 10) / uf : parseInt(_.get(doc, opts.amountFullField), 10) });
      var sum = amounts.reduce((a, b) => a + b, 0);
      var averageFull = (sum / amounts.length) || 0;
      amounts = e.properties.data.map(doc => { return _.isEqual(opts.unit, 'uf') ? parseInt(_.get(doc, opts.amountFirstField), 10) / uf : parseInt(_.get(doc, opts.amountFirstField), 10) });
      sum = amounts.reduce((a, b) => a + b, 0);
      var averageFirst = (sum / amounts.length) || 0;
      e.properties.average = _.assign(e.properties.average,{
        first: averageFirst.toFixed(2),
        full: averageFull.toFixed(2)
      })
    }
  })
  return data;
}

//#region Options
const defaultOptions = {
  width: 600,
  height: 900,
  threshold: 0.95,
  unit: 'uf',
  uf: 29355.01,
  appelateCourtField: 'metrics.courts.appelateCourt.name',
  amountFirstField: 'lawsuit-ammount.first',
  amountFullField: 'lawsuit-ammount.full',
  jurisDataField: 'metrics',
  baseOpacity: 0.4,
  baseColor: 'steelblue',
  filledOpacity : 0.8,
  fillWith: 'first',
  colorInterpolation: 'interpolateBrBG',
  stroke: false,
  strokeColor: 'black',
  topoJurisdicciones: 'https://nicoolivaresg.github.io/json-files/topojson/jurisdicciones-2.json',
  topoCortes: 'https://nicoolivaresg.github.io/json-files/topojson/cortes.json',
  scaleFactor: 1.25,
  legendBarHeight: 50,
  margin: { top: 20, right: 40, bottom: 30, left: 40 }
};
//#endregion

//#region Chart function definition
function chart(querySelector, data, opts) {
  let finalOptions = {};
  _.assign(finalOptions, defaultOptions, opts);
  
  uf = _.isEqual(finalOptions.unit,'uf') ? _.get(finalOptions, 'uf'): 29300;

  var width = finalOptions.width,
  height = finalOptions.height,
  centered;
  
  var margin = finalOptions.margin,
  barHeight = finalOptions.legendBarHeight;
  
  console.log(finalOptions);
  
  data = _.get(data, 'documents');
  
  console.log('jurisprudenceBar', data);
  createTooltip(querySelector);
  // createInfoModal(querySelector);
  
  const zoom = d3.zoom()
  .scaleExtent([1, 12])
  .on('zoom', zoomed);
  
  const svg = d3.select(querySelector)
  .attr("width", width)
  .attr("height", height)
  .style("margin", "-15px auto")
  
  
  const gJuris = svg.append('g');
  const gCortes = svg.append('g');
  
  
  var topojsonFiles = [
    finalOptions.topoJurisdicciones,
    finalOptions.topoCortes
  ]
  
  var promises = []
  
  topojsonFiles.forEach(url => {
    promises.push(d3.json(url))
  })
  
  Promise.all(promises)
  .then(ready)
  
  
  function ready(topojsonFilesLoaded) {
    
    // Manejo de datos de entrada
    var jurisdicciones = topojsonFilesLoaded[0]
    var cortes = topojsonFilesLoaded[1]

    var dataJurisdicciones = topojson.feature(jurisdicciones, jurisdicciones.objects.jurisdicciones)
    var dataCortes = topojson.feature(cortes, cortes.objects.cortes)

    data.forEach(d => {
      let juris = dataJurisdicciones.features.find(j => {
        // console.log(_.get(d, finalOptions.appelateCourtField));
        j.properties.Corte = j.properties.Corte.trim()
        j.properties.Corte = j.properties.Corte.replace(/\s+/g, ' ');
        j.properties.Corte = j.properties.Corte.replace('Corte de Apelaciones de', 'C.A. de');
        // console.log(j.properties.Corte);
        let distance = natural.JaroWinklerDistance(j.properties.Corte, _.get(d, finalOptions.appelateCourtField), undefined, true);
        // console.log(distance);
        return distance > finalOptions.threshold
      })
      if (juris) {
        juris.properties ?
          _.assign(juris.properties, { data: [_.get(d, finalOptions.jurisDataField)] }) :
          juris.properties.data = juris.properties.data.push(_.get(d, finalOptions.jurisDataField));
      }
    })

    dataJurisdicciones = resumeData(dataJurisdicciones,finalOptions);
    
    console.log('Jurisdicciones ', dataJurisdicciones);
    console.log('Cortes ', dataCortes);
    
    svg.call(zoom);

    // Proyección
    var projection = d3.geoIdentity()
      .reflectY(true)
      .fitSize([width, height], dataJurisdicciones)

    var path = d3.geoPath().projection(projection);


    // Manejo del SVG
    gJuris.selectAll("path")
      .data(dataJurisdicciones.features)
      .enter()
      .append("path")
      .attr("d", path)
      .style("opacity", d => { return setOpacity(d) })
      .on("mouseover", function (d) {
        d3.select(this).transition()
          .style("opacity", 1)
        showTooltip(d.properties, finalOptions);
      })
      .on("mouseout", function () {
        d3.select(this).transition()
          .style("opacity", d => { return setOpacity(d) })
        hideTooltip();
      })
      .on("click", (d)=> {
        // clickedByTransform(d);
        // showInfoModal(d.properties);
      })

    // Grupo de puntos de cortes de apelaciones

    // gCortes.selectAll("path")
    //   .data(dataCortes.features)
    //   .enter()
    //   .append("path")
    //   // .attr('cx', 0)
    //   // .attr('cy', 0)
    //   // .attr('r', 1)
    //   .attr("d", path)
    //   .attr("class", "centroid")
    //   .style("fill", d => { if (d.properties.cod_jurisd) return color(d.properties.cod_jurisd) })

    
    // Colores y leyenda

    let amounts = data.map(d => {
      return _.isEqual(finalOptions.fillWith, 'full') ?
        _.get(d, finalOptions.jurisDataField +'.'+ finalOptions.amountFullField) / finalOptions.uf :
        _.get(d, finalOptions.jurisDataField +'.'+ finalOptions.amountFirstField) / finalOptions.uf 
    });
    amounts = amounts.sort((a, b) => a - b);
    console.log(Math.min.apply(Math, amounts), Math.max.apply(Math, amounts));
    let colorScale = d3.scaleSequential()
    .domain([Math.min.apply(Math, amounts), Math.max.apply(Math, amounts)])
    .interpolator(_.get(d3, finalOptions.colorInterpolation));
    
    /**
     * Leyenda
     */
    const defs = svg.append("defs");


    const linearGradient = defs.append("linearGradient")
    .attr("id", "linear-gradient");

    linearGradient.selectAll("stop")
      .data(colorScale.ticks().map((t, i, n) => {
        console.log(t);
        return ({ offset: `${100*i/n.length}%`, color: colorScale(t) })
      }))
      .enter().append("stop")
      .attr("offset", d => d.offset)
      .attr("stop-color", d => d.color);
    
    
    svg.append('g')
      .attr("transform", `translate(0,${height - margin.bottom - barHeight})`)
      .append("rect")
      .attr('transform', `translate(${margin.left}, 0)`)
      .attr("width", width - margin.right - margin.left)
      .attr("height", barHeight)
      .style("fill", "url(#linear-gradient)");

    
    const axisScale = d3.scaleLinear()
    .domain(colorScale.domain())
    .range([margin.left, width - margin.right]);
    
    const axisBottom = g => g
      .attr("class", `x-axis`)
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(axisScale)
        .ticks(width / 80)
        .tickSize(-barHeight));
    
    svg.append('g')
    .call(axisBottom);

    gJuris.selectAll('path')
        .style("fill", d => { return fillJuris(d); })
        .style("stroke", d => { return strokeJuris(d); })
        .style("stroke-width", '0.5px')


    function strokeJuris(d) {
      if(_.get(finalOptions, 'stroke') === true){
        return _.get(finalOptions, 'strokeColor');
      }else{
        return '';
      }
    }

    // Modifica color de Jurisdicción
    function fillJuris(d) {
      
      if (_.has(d.properties, 'average')) {
        let avg = _.get(d.properties, `average.${finalOptions.fillWith}`);
        return colorScale(avg);
      }
      return _.get(finalOptions, 'baseColor');
    }

    function setOpacity(d) {
      if (d.properties.data) {
        return _.get(finalOptions, 'filledOpacity');
      }
      return _.get(finalOptions, 'baseOpacity');
    }

    
    function clickedByProjection(d) {
      centered = centered !== d && d;
  
      var paths = gJuris.selectAll("path")
        .classed("active", d => d === centered);
  
      // Starting translate/scale
      var t0 = projection.translate(),
        s0 = projection.scale();
  
      // Re-fit to destination
      projection.fitSize([width, height], centered || dataJurisdicciones);
  

      
      // Create interpolators
      var interpolateTranslate = d3.interpolate(t0, projection.translate()),
          interpolateScale = d3.interpolate(s0, projection.scale());
  
      var interpolator = function(t) {
        projection.scale(interpolateScale(t))
          .translate(interpolateTranslate(t));
        paths.attr("d", path);
      };
  
      d3.transition()
        .duration(750)
        .tween("projection", function() {
          return interpolator;
        });
    }

    function clickedByTransform(d) {
      var x, y, k;
    
      if (d && centered !== d) {
        var centroid = path.centroid(d);
        x = centroid[0];
        y = centroid[1];
        k = 4;
        centered = d;
      } else {
        x = width / 2;
        y = height / 2;
        k = 1;
        centered = null;
        hideInfoModal();
      }
    
      gJuris.selectAll("path")
          .classed("active", centered && function(d) { return d === centered; });
    
      gJuris.transition()
          .duration(750)
          .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
          .style("stroke-width", 1.5 / k + "px");

      gCortes.selectAll("path")
          .classed("active", centered && function(d) { return d === centered; });
    
      gCortes.transition()
          .duration(750)
          .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
          .style("stroke-width", 1.5 / k + "px");
    }
    
  }

  function zoomed() {
    gJuris
      .selectAll('path') // To prevent stroke width from scaling
      .attr('transform', d3.event.transform);
    gCortes
      .selectAll('path') // To prevent stroke width from scaling
      .attr('transform', d3.event.transform);
  }


}

//#endregion


module.exports = exports = chart;
