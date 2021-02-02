'use strict';

const debug = require('debug')('stare.js:client/charts/d3/map');

const d3 = require(`d3`);
const topojson  = require("topojson-client");
const _ = require('lodash');


const defaultOptions = {
    width: 600,
    height: 900,
    fillColor: 'steelblue',
    scaleFactor: 1.25,
    margin: { top: 30, right: 0, bottom: 30, left: 0 }
};




function chart(querySelector, data, opts) {
    let finalOptions = {};
    _.assign(finalOptions, defaultOptions, opts);

    console.log(finalOptions);
    
    data = _.get(data, 'documents');

    console.log('jurisprudenceBar', data);
    
    const svg = d3.select(querySelector)
    .attr("width", finalOptions.width)
    .attr("height", finalOptions.height)
        .style("margin", "-15px auto")
    
    var topojsonFiles = [
        "https://nicoolivaresg.github.io/json-files/topojson/jurisdicciones.json",
        "https://nicoolivaresg.github.io/json-files/topojson/cortes.json"
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

        let data = topojson.feature(jurisdicciones,jurisdicciones.objects.jurisdicciones)
        let dataCortes = topojson.feature(cortes, cortes.objects.cortes)

        console.log(data);
        console.log(dataCortes);


        var projection = d3.geoIdentity()
          .reflectY(true)
          .fitSize([finalOptions.width,finalOptions.height], data)

        var path = d3.geoPath().projection(projection)
        
        svg.append("g")
          .selectAll("path")
          .data(data.features)
          .enter()
          .append("path")
          .attr("d", path)
          .style("fill", function(d) {
            var found = dataCortes.features.find( f => {
              return f.properties.Cód_Juris === d.properties.cod_jurisd
            })
            return found.properties.Color;
          })
          .style("opacity",0.3)
          .on("mouseover",function(d) {
            svg.select("h2").text(d.properties.Corte);
            d3.select(this).transition()
              .style("opacity",1)
              .attr("transform", (d)=>{
                var centroid = path.centroid(d),
                      x = centroid[0],
                      y = centroid[1];
                var scale_factor = finalOptions.scaleFactor;
                return "translate(" + x + "," + y + ")"
                      + "scale(" + scale_factor + ")"
                      + "translate(" + -x + "," + -y + ")";
              })
          })
          .on("mouseout", function(){
            svg.select("h2").text("");
            d3.select(this).transition()
              .style("opacity",0.3)
              .attr("transform", (d)=>{
                var centroid = path.centroid(d),
                      x = centroid[0],
                      y = centroid[1];
                return "translate(" + x + "," + y + ")"
                    + "scale(" + 1 + ")"
                    + "translate(" + -x + "," + -y + ")";
              })
          })
    }
}

module.exports = exports = chart;
