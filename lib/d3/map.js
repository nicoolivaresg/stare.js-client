'use strict';

const debug = require('debug')('stare.js:client/charts/d3/map');

const d3 = require(`d3`);
const topojson  = require("topojson-client");
const _ = require('lodash');
const natural = require('natural');

let tooltip = null;

function createTooltip() {
  tooltip = d3.select('body')
    .append('div')
    .attr('class', 'stare__tooltip')
    .style('opacity', 0)
}

function showTooltip(d) {
  let html = `<div><b>${d.Corte}</b></div><div>`;

  if(d.data){
    d.data.forEach(e=>{
      html = html + `<div><b>${e.courts.court.name}</b></div><div>`
    });
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



//#region Options
const defaultOptions = {
    width: window.innerWidth,
    height: window.innerHeight,
    threshold: 0.95,
    appelateCourtField: 'metrics.courts.appelateCourt.name',
    jurisDataField: 'metrics',
    fillColor: 'steelblue',
    topoJurisdicciones: 'https://nicoolivaresg.github.io/json-files/topojson/jurisdicciones-1.json',
    topoCortes: 'https://nicoolivaresg.github.io/json-files/topojson/cortes.json',
    scaleFactor: 1.25,
    margin: { top: 30, right: 0, bottom: 30, left: 0 }
};
//#endregion



//#region Chart function definition
function chart(querySelector, data, opts) {
    let finalOptions = {};
    _.assign(finalOptions, defaultOptions, opts);

    console.log(finalOptions);
    
    data = _.get(data, 'documents');
    
    console.log('jurisprudenceBar', data);
    createTooltip(querySelector);
    
    const zoom = d3.zoom()
    .scaleExtent([1, 18])
    .on('zoom', zoomed);

    const svg = d3.select(querySelector)
    .attr("width", finalOptions.width)
    .attr("height", finalOptions.height)
    .style("margin", "-15px auto")
    

    const g = svg.append('g');
    const g2 = svg.append('g');

    var radius = 6,
        fill = "rgba(255, 49, 255, 0.388)",
        stroke = "rgba(0, 0, 0, 0.5)",
        strokeWidth = 0.1;

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

    
    function ready(topojsonFilesLoaded){
        var jurisdicciones = topojsonFilesLoaded[0]
        var cortes = topojsonFilesLoaded[1]

        var dataJurisdicciones = topojson.feature(jurisdicciones,jurisdicciones.objects.jurisdicciones)
        var dataCortes = topojson.feature(cortes, cortes.objects.cortes)

        console.log('Jurisdicciones ',dataJurisdicciones);
        console.log('Cortes ',dataCortes);

        data.forEach(d => {
            let juris = dataJurisdicciones.features.find(j => {
              // console.log(_.get(d, finalOptions.appelateCourtField));
              j.properties.Corte = j.properties.Corte.trim()
              j.properties.Corte = j.properties.Corte.replace(/\s+/g,' ');
              j.properties.Corte = j.properties.Corte.replace('Corte de Apelaciones de','C.A. de');
              // console.log(j.properties.Corte);
              let distance = natural.JaroWinklerDistance(j.properties.Corte, _.get(d, finalOptions.appelateCourtField),undefined, true);
              // console.log(distance);
              return distance > finalOptions.threshold
            })
            if(juris){
              juris.properties ?
                _.assign(juris.properties, { data: [_.get(d, finalOptions.jurisDataField)]}) :
                juris.properties.data = juris.properties.data.push(_.get(d, finalOptions.jurisDataField));
            } 
        })
        
        
        
        dataCortes.features.forEach(c => {
          dataJurisdicciones.features.push(c)
        });

        console.log('Jurisdicciones features', dataJurisdicciones.features);
        
        let color = d3.scaleOrdinal(dataJurisdicciones.features.map(d => d.properties.cod_jurisd), d3.schemeSet3);
        const colorCortes= d3.scaleOrdinal(dataCortes.features.map(d => d.properties.Cód_Juris), d3.schemeSet3);
        
        var projection = d3.geoIdentity()
          .reflectY(true)
          .fitSize([finalOptions.width,finalOptions.height], dataJurisdicciones)
        
        var path = d3.geoPath().projection(projection);

        
        g.selectAll("path")
          .data(dataJurisdicciones.features)
          .enter()
          .append("path")
          .attr("d", path)
          .style("fill", d => { if(d.properties.cod_jurisd) return  color(d.properties.cod_jurisd)})
          .style("opacity",0.70)
          .on("mouseover",function(d) {
            d3.select(this).transition()
              .style("opacity",1)
            //   .attr("transform", (d)=>{
            //     var centroid = path.centroid(d),
            //           x = centroid[0],
            //           y = centroid[1];
            //     var scale_factor = finalOptions.scaleFactor;
            //     return "translate(" + x + "," + y + ")"
            //           + "scale(" + scale_factor + ")"
            //           + "translate(" + -x + "," + -y + ")";
            //   });
              showTooltip(d.properties);
            
          })
          .on("mouseout", function(){
            d3.select(this).transition()
              .style("opacity",0.70)
            //   .attr("transform", (d)=>{
            //     var centroid = path.centroid(d),
            //           x = centroid[0],
            //           y = centroid[1];
            //     return "translate(" + x + "," + y + ")"
            //         + "scale(" + 1 + ")"
            //         + "translate(" + -x + "," + -y + ")";
            //   });
              hideTooltip();
          })

          svg.call(zoom);

          // g2.selectAll("path")
          // .data(dataCortes.features)
          // .enter()
          // .append("path")
          // .attr("d", path)
          // .attr("class", "centroid")
          // .style("fill", d => { if(d.properties.cod_jurisd) return  color(d.properties.cod_jurisd)})

          // g.selectAll(".centroid").data(dataCortes.features)
          //   .enter().append("circle")
          //     .attr("class", "centroid")
          //     .style("fill", d => colorCortes(d.properties.Cód_Juris))
          //     .attr("stroke", stroke)
          //     .attr("stroke-width", strokeWidth)
          //     .attr("r", radius)
          //     .attr("cx", function (d){ return d[0]; })
          //     .attr("cy", function (d){ return d[1]; });
    }

    function zoomed() {
      g
        .selectAll('path') // To prevent stroke width from scaling
        .attr('transform', d3.event.transform);
    }
}

//#endregion


module.exports = exports = chart;
