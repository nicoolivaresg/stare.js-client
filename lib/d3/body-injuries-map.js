'use strict';

const debug = require('debug')('stare.js:client/charts/d3/body-injuries-map');

const d3 = require(`d3`);
const _ = require('lodash');
const natural = require('natural'); //natural: Copyright (c) 2011, 2012 Chris Umbel, Rob Ellis, Russell Mull
require('es6-promise').polyfill();

//imagemapster: Copyright © 2011-21 James Treworgy. Licensed under the MIT License.
var script = document.createElement('script');
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/imagemapster/1.5.4/jquery.imagemapster.min.js';
script.type = 'text/javascript';
document.getElementsByTagName('head')[0].appendChild(script);

var $ = require('jquery');
const { xml, style, rgb } = require('d3');
const map = require('./map');
window.jQuery = $;
window.$ = $;

var selected = null;

const defaultOptions = {
    sequelField: 'metrics.injuries.sequel',
    injuriesField: 'metrics.injuries',
    amountFirstField: 'metrics.lawsuit-ammount.otorgado.primera',
    amountFullField: 'metrics.lawsuit-ammount.demandado',
    metricsField: 'metrics',
    categoryField: 'metrics.category',
    filterCategory: 'Accidente del Trabajo', // Puede ser "Accidente del Trabajo" o "Enfermedad Profesional"
    unit: 'uf',
    uf: 29355.01,
    fillWith: 'primera',
    colorInterpolation: 'interpolateBrBG',
    affectedBodyPartsField: 'metrics.injuries.affectedBodyParts',
    imgUnsegmented: 'https://nicoolivaresg.github.io/json-files/img/front.png',
    threshold: 0.95,
    width: window.innerWidth,
    height: window.innerHeight,
    fillColor: 'lightblue',
    legendBarHeight: 50,
    margin: { top: 20, right: 40, bottom: 30, left: 40 }
};

// const groups = ['Accidente del Trabajo', 'Enfermedad profesional'];

const mainOptions = {
    stroke: true,
    isDeselectable: false,
    singleSelect: true,
    staticState: true,
    selected: true,
    scaleMap: true,
    mapKey: 'data-key'
};


let tooltip = null;
function createTooltip() {
    tooltip = d3.select('body')
        .append('div')
        .attr('class', 'stare__tooltip')
        .style('opacity', 0)
}

function showTooltip(d, opts) {
    let html = `<div><b>Resultados para el área: </b>${d.title}</div><br/>`;
    if (d.data.length > 0) {
        html = html + `<div><b>Mín otorgado:</b>${_.isEqual(opts.unit, 'uf') ? d.resume.primera.min + ' UF' : '$' + d.resume.primera.min} </div>`;
        html = html + `<div><b>Max otorgado:</b>${_.isEqual(opts.unit, 'uf') ? d.resume.primera.max + ' UF' : '$' + d.resume.primera.max}</div>`;
        html = html + `<div><b>Promedio otorgado:</b>${_.isEqual(opts.unit, 'uf') ? d.resume.primera.average + ' UF' : '$' + d.resume.primera.average}</div>`;
        html = html + `<br/>`;

        html = html + `<div><b>Mín demandado:</b>${_.isEqual(opts.unit, 'uf') ? d.resume.demandado.min + ' UF' : '$' + d.resume.demandado.min}</div>`;
        html = html + `<div><b>Max demandado:</b>${_.isEqual(opts.unit, 'uf') ? d.resume.demandado.min + ' UF' : '$' + d.resume.demandado.min}</div>`;
        html = html + `<div><b>Promedio demandado:</b>${_.isEqual(opts.unit, 'uf') ? d.resume.demandado.average + ' UF' : '$' + d.resume.demandado.average}</div>`;
        html = html + `<br/>`;

        // var sequels = d.data.map(doc => { return _.get(doc, opts.sequelField) })
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


function filterData(data, opts) {
    var segmented = data.filter(d => {
        var compromised = _.get(d, opts.affectedBodyPartsField);
        return (
            compromised.length > 0 &&
            natural.JaroWinklerDistance(compromised[0], "NO SEGMENTABLE", undefined, true) < opts.threshold
        )
    });
    var unsegmented = data.filter(d => {
        var compromised = _.get(d, opts.affectedBodyPartsField);
        return (
            compromised.length > 0 &&
            natural.JaroWinklerDistance(compromised[0], "NO SEGMENTABLE", undefined, true) >= opts.threshold
        )
    });
    return {
        segmented: segmented,
        unsegmented: unsegmented
    }
}


function assignDataToAreas(mapData, data, opts) {
    mapData.map(a => {
        var filter = data.filter(d => {
            var compromised = _.get(d, opts.affectedBodyPartsField);
            if (
                compromised.length > 0 &&
                natural.JaroWinklerDistance(compromised[0], "NO SEGMENTABLE", undefined, true) >= opts.threshold) {
                return true;
            }
            var found = [];
            compromised.forEach(bodyPart => {
                bodyPart = bodyPart.split('-').length === 2 ? bodyPart.split('-')[1] : bodyPart.split('-')[0];
                bodyPart = bodyPart.toUpperCase();
                a.title = a.title.toUpperCase();
                var distance = natural.DiceCoefficient(a.title, bodyPart);
                if (distance >= opts.threshold) {
                    found.push(d);
                }
            })
            return found.length > 0;
        })

        _.assign(a, {
            data: filter
        });
        // Calcular montos y resumen de métricas
        if (a.data.length > 0) {
            var amountsFirst = a.data.map(doc => {
                return _.isEqual(opts.unit, 'uf') ?
                    parseInt(_.get(doc, opts.amountFirstField), 10) / opts.uf :
                    parseInt(_.get(doc, opts.amountFirstField), 10)
            });
            var minFirst = Math.min.apply(Math, amountsFirst);
            var maxFirst = Math.max.apply(Math, amountsFirst);
            var sum = amountsFirst.reduce((a, b) => a + b, 0);
            var averageOtorgadoPrimera = (sum / amountsFirst.length) || 0;
            var amountsFull = a.data.map(doc => {
                return _.isEqual(opts.unit, 'uf') ?
                    parseInt(_.get(doc, opts.amountFullField), 10) / opts.uf :
                    parseInt(_.get(doc, opts.amountFullField), 10);
            });
            var minFull = Math.min.apply(Math, amountsFull);
            var maxFull = Math.max.apply(Math, amountsFull);
            sum = amountsFull.reduce((a, b) => a + b, 0);
            var averageDemandado = (sum / amountsFull.length) || 0;
            _.assign(a, {
                data: filter,
                resume: {
                    primera: {
                        min: minFirst.toFixed(2),
                        max: maxFirst.toFixed(2),
                        average: averageOtorgadoPrimera.toFixed(2)
                    },
                    demandado: {
                        min: minFull.toFixed(2),
                        max: maxFull.toFixed(2),
                        average: averageDemandado.toFixed(2)
                    }
                }
            });
        }

    })
    return mapData;
}


function mouseover(d, opts) {
    d3.event.preventDefault();
    // let w = d3.select(this);
    selected = d;
    $('img').mapster('highlight');;
    if (selected && _.has(selected, 'data') && selected.data.length > 0) {
        showTooltip(selected, opts);
    }
}

function mouseout() {
    selected = null;
    hideTooltip();
}

function RGBToHex(rgb) {
    // Choose correct separator
    let sep = rgb.indexOf(",") > -1 ? "," : " ";
    // Turn "rgb(r,g,b)" into [r,g,b]
    rgb = rgb.substr(4).split(")")[0].split(sep);

    let r = (+rgb[0]).toString(16),
        g = (+rgb[1]).toString(16),
        b = (+rgb[2]).toString(16);

    if (r.length == 1)
        r = "0" + r;
    if (g.length == 1)
        g = "0" + g;
    if (b.length == 1)
        b = "0" + b;

    return r + g + b;
}

function generateAreaStyle(data, colorScale, prefix, opts) {
    var options = {
        // isDeselectable: false,
        // singleSelect: true,
        // staticState: true,
        scaleMap: true,
        stroke: true,
        strokeColor: '000000',
        strokeWidth: 1,
        mapKey: 'data-key',
        areas: [],
    };
    data.forEach(d => {
        console.log(d);
        if (d.data.length > 0) {

            var color = rgb(0,0,0);
            color = colorScale(_.get(d, `resume.${opts.fillWith}.average`));

            var areaOptions = {
                key: `${prefix}${d.id}`,
                fill: true,
                selected: true,
                staticState: true,
                fillColor: RGBToHex(color),
                render_select: {
                    // fillColor: colorScale(_.get(d,`resume.${opts.fillWith}.average`)),
                    fillOpacity: .8
                },
                render_highlight: {
                    // fillColor: colorScale(_.get(d,`resume.${opts.fillWith}.average`)),
                    fillOpacity: .8
                }
            }
            options.areas.push(areaOptions);
        }
    })

    return options;

}

// Main function
function chart(querySelector, data, opts) {
    let finalOptions = {};
    _.assign(finalOptions, defaultOptions, opts);

    var margin = finalOptions.margin,
        barHeight = finalOptions.legendBarHeight;

    data = _.get(data, 'documents');

    data = data.filter(d => {
        return _.isEqual(_.get(d, finalOptions.categoryField), finalOptions.filterCategory);
    });
    console.log(data);
    let amounts = data.map(d => {
        var divisor = finalOptions.unit === 'uf' ? finalOptions.uf : 1;
        switch (finalOptions.fillWith) {
            case 'primera':
                console.log(_.get(d, finalOptions.amountFirstField));
                return _.get(d, finalOptions.amountFirstField) / divisor;
            case 'demandado':
                console.log(_.get(d, finalOptions.amountFullField));
                return _.get(d, finalOptions.amountFullField) / divisor;
            default:
                console.log(_.get(d, finalOptions.amountFirstField));
                return _.get(d, finalOptions.amountFirstField) / divisor;
        }
    });
    amounts = amounts.sort((a, b) => a - b);
    let colorScale = d3.scaleSequential()
        .domain([Math.min.apply(Math, amounts), Math.max.apply(Math, amounts)])
        .interpolator(_.get(d3, finalOptions.colorInterpolation));


    data = filterData(data, finalOptions);

    createTooltip(querySelector);
    const width = finalOptions.width;
    const height = finalOptions.height;

    var canvas = d3.select(querySelector)
        .attr("width", width)
        .attr("height", height)
        .style("margin", "-15px auto")
        .style("display", "flex")
        .style("justify-content", "space-evenly")
        .style("text-align", "center")


    var bodyMapData = [
        'https://nicoolivaresg.github.io/json-files/json/front-body-map.json',
        'https://nicoolivaresg.github.io/json-files/json/back-body-map.json',
    ]

    var promises = []

    bodyMapData.forEach(url => {
        promises.push(d3.json(url))
    })

    Promise.all(promises)
        .then(ready);

    function ready(values) {
        const front = values[0];
        const back = values[1];
        const unsegmented = {
            img: finalOptions.imgUnsegmented,
            areas: [
                {
                    id: 0,
                    shape: "rect",
                    title: "SIN SEGMENTAR",
                    coords: "37,460,201,46"
                }
            ]
        };



        front.areas = assignDataToAreas(front.areas, data.segmented, finalOptions);
        back.areas = assignDataToAreas(back.areas, data.segmented, finalOptions);
        unsegmented.areas = assignDataToAreas(unsegmented.areas, data.unsegmented, finalOptions);

        
        var titleDiv = canvas.append('div')
            .style("width", "100%")
            .style("height", "50px")
            .style("display", "flex")
            .style("justify-content", "space-evenly")
            
            
        
        var titles = titleDiv.selectAll('text')
            .data(['Regiones frontales','Regiones traseras','Causas sin segmentar'])
            .enter()
            .append('h5');

        titles.attr("x", function(d,i){ return 20 + i*230 })
            .attr("y", 0)       
            .style("margin", "20px")
            .style("height", "100px")
            .style("width", "242px")
            .text(function(d){ return d });


        /**
         * Mapas
         */

        
        // var imgDiv = canvas.append('div')
        //     .style("width", "100%")
        //     // .style("height", "600px")
        //     .style("display", "flex")
        //     .style("justify-content", "space-evenly")

        // var images = canvas.selectAll('img')
        //     .data([front.img,back.img, unsegmented.img])
        //     .enter()
        //     .append('img')

        // images.attr('id',  function(d,i){return 'myImg'+i})
        //     .attr('name', function(d,i){return 'myImg'+i})
        //     .attr('src',  function(d,i){ return d})
        //     .attr('alt', 'img')
        //     .style("margin", "20px")
        //     .attr('usemap', function(d,i){return '#myMap'+i});

        canvas.append('img')
            .attr('id', 'myImg0')
            .attr('name', 'myImg0')
            .attr('src', front.img)
            .attr('alt', 'front')
            .attr('usemap', '#myMap0');

        canvas.append('img')
            .attr('id', 'myImg1')
            .attr('name', 'myImg1')
            .attr('src', back.img)
            .attr('alt', 'back')
            .attr('usemap', '#myMap1')

        canvas.append('img')
            .attr('id', 'myImg2')
            .attr('name', 'myImg2')
            .attr('src', unsegmented.img)
            .attr('alt', 'Unseg')
            .attr('usemap', '#myMap2');

        var mapFront = canvas.append('map')
            .attr('id', 'myMap0')
            .attr('name', 'myMap0')
            .selectAll('area')
            .data(front.areas)
            .enter()
            .append('area')
            .attr('data-key', d => { return 'area-front-' + d.id })
            .attr('shape', d => { return d.shape })
            .attr('title', d => { return d.title })
            .attr('coords', d => { return d.coords })
            .attr('target', '_self')
            .attr('href', d => { return d.data.length > 0 ? '#' : null; })
            .on('mouseover', d => { mouseover(d, finalOptions) })
            .on('mouseout', () => { mouseout() })

        var mapBack = canvas.append('map')
            .attr('id', 'myMap1')
            .attr('name', 'myMap1')
            .selectAll('area')
            .data(back.areas)
            .enter()
            .append('area')
            .attr('data-key', d => { return 'area-back-' + d.id })
            .attr('shape', d => { return d.shape })
            .attr('title', d => { return d.title })
            .attr('coords', d => { return d.coords })
            .attr('href', d => { return d.data.length > 0 ? '#' : null; })
            .on('mouseover', d => { mouseover(d, finalOptions) })
            .on('mouseout', () => { mouseout() })

        var mapUnseg = canvas.append('map')
            .attr('id', 'myMap0')
            .attr('name', 'myMap0')
            .selectAll('area')
            .data(unsegmented.areas)
            .enter()
            .append('area')
            .attr('data-key', d => { return 'area-unseg-' + d.id })
            .attr('shape', d => { return d.shape })
            .attr('title', d => { return d.title })
            .attr('coords', d => { return d.coords })
            .attr('href', d => { return d.data.length > 0 ? '#' : null; })
            .on('mouseover', d => { mouseover(d, finalOptions) })
            .on('mouseout', () => { mouseout() })

        $(document).ready(function () {
            $('#myImg0').mapster(
                frontOptions
            );
            $('#myImg1').mapster(
                backOptions
            );
            $('#myImg2').mapster(
                unsegOptions
            );

        });

        


        var frontOptions = generateAreaStyle(front.areas, colorScale, 'area-front-', finalOptions);
        var backOptions = generateAreaStyle(back.areas, colorScale, 'area-back-', finalOptions);
        var unsegOptions = generateAreaStyle(unsegmented.areas, colorScale, 'area-unseg-', finalOptions);


        /**
         * Leyenda
         */
        var widthLegend = width - margin.left;
        var heightLegend = barHeight + margin.top;

        var svg = d3.select(querySelector)
            .style('display', 'flex')
            .style('flex-wrap', 'wrap')
            .append('div')
            .append('svg')
            .attr("width", widthLegend)
            .attr("height", heightLegend)
            .style("margin", "-15px auto")

        const defs = svg.append("defs");


        const linearGradient = defs.append("linearGradient")
            .attr("id", "linear-gradient");

        linearGradient.selectAll("stop")
            .data(colorScale.ticks().map((t, i, n) => {
                return ({ offset: `${100 * i / n.length}%`, color: colorScale(t) })
            }))
            .enter().append("stop")
            .attr("offset", d => d.offset)
            .attr("stop-color", d => d.color);


        svg.append('g')
            .attr("transform", `translate(0,${heightLegend - margin.bottom - barHeight})`)
            .append("rect")
            .attr('transform', `translate(${margin.left}, 0)`)
            .attr("width", widthLegend - margin.right - margin.left)
            .attr("height", barHeight)
            .style("fill", "url(#linear-gradient)");
        canvas.append('h5')
            .attr('x', widthLegend + 20 )
            .attr('y', barHeight / 2 )
            .attr("dy", ".35em")
            .text(`${
                _.isEqual(finalOptions.unit, 'uf') ? "Unidades de Fomento (UF)" :
                "Pesos chilenos (CLP)"
            }`);
        
            
        const axisScale = d3.scaleLinear()
            .domain(colorScale.domain())
            .range([margin.left, widthLegend - margin.right]);

        const axisBottom = g => g
            .attr("class", `x-axis`)
            .attr("transform", `translate(0,${heightLegend - margin.bottom})`)
            .call(d3.axisBottom(axisScale)
                .ticks(widthLegend / 80)
                .tickSize(-barHeight));

        svg.append('g')
            .call(axisBottom);

        





    }
}

module.exports = exports = chart;