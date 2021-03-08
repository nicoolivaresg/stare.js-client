'use strict';

const debug = require('debug')('stare.js:client/charts/d3/map');

const d3 = require(`d3`);
const topojson = require("topojson-client");
const _ = require('lodash');
const natural = require('natural'); //Copyright (c) 2011, 2012 Chris Umbel, Rob Ellis, Russell Mull

let tooltip = null;
let modal = null;

function createTooltip() {
  tooltip = d3.select('body')
    .append('div')
    .attr('class', 'stare__tooltip')
    .style('opacity', 0)
}

function showTooltip(d) {
  let html = `<div><b>${d.Corte}</b></div><div>`;

  if (d.data) {
    d.data.forEach(e => {
      html = html + `<div><b>Rol: </b>${e.courts.court.rol}<b><br/>Tribunal primera instancia: </b>${e.courts.court.name}<br/><b>Resultado: </b>${e.courts.court.result}</div><div>`
    });
  }else{
    html = html + `<divNo hay sentencias en esta zona para esta búsqueda.</div><div>`
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


//#region Options
const defaultOptions = {
  width: 600,
  height: 900,
  threshold: 0.95,
  appelateCourtField: 'metrics.courts.appelateCourt.name',
  jurisDataField: 'metrics',
  fillColor: 'lightblue',
  topoJurisdicciones: 'https://nicoolivaresg.github.io/json-files/topojson/jurisdicciones-2.json',
  topoCortes: 'https://nicoolivaresg.github.io/json-files/topojson/cortes.json',
  scaleFactor: 1.25,
  margin: { top: 30, right: 0, bottom: 30, left: 0 }
};
//#endregion



//#region Chart function definition
function chart(querySelector, data, opts) {
  let finalOptions = {};
  _.assign(finalOptions, defaultOptions, opts);

  var width = finalOptions.width,
      height = finalOptions.height,
      centered;

  console.log(finalOptions);

  data = _.get(data, 'documents');

  console.log('jurisprudenceBar', data);
  createTooltip(querySelector);
  createInfoModal(querySelector);

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

    let color = d3.scaleOrdinal(dataJurisdicciones.features.map(d => d.properties.cod_jurisd), d3.schemeCategory10);


    console.log('Jurisdicciones ', dataJurisdicciones);
    console.log('Cortes ', dataCortes);

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
      .style("fill", d => { return fillJuris(d); })
      .style("opacity", d => { return setOpacity(d) })
      .on("mouseover", function (d) {
        d3.select(this).transition()
          .style("opacity", 1)
        showTooltip(d.properties);
      })
      .on("mouseout", function () {
        d3.select(this).transition()
          .style("opacity", d => { return setOpacity(d) })
        hideTooltip();
      })
      .on("click", (d)=> {
        clickedByTransform(d);
        // showInfoModal(d.properties);
      })

    // Grupo de puntos de cortes de apelaciones

    gCortes.selectAll("path")
      .data(dataCortes.features)
      .enter()
      .append("path")
      // .attr('cx', 0)
      // .attr('cy', 0)
      // .attr('r', 1)
      .attr("d", path)
      .attr("class", "centroid")
      .style("fill", d => { if (d.properties.cod_jurisd) return color(d.properties.cod_jurisd) })



    // Funciones para modificar la
    function fillJuris(d) {
      if (d.properties.cod_jurisd && d.properties.data) {
        return color(d.properties.cod_jurisd);
      }
      return finalOptions.fillColor;
    }

    function setOpacity(d) {
      if (d.properties.data) {
        return 0.80
      }
      return 0.2
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
