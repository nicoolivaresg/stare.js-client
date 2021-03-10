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
window.jQuery = $;
window.$ = $;

var selected = null;
var uf = null;

const defaultOptions = {
    sequelField: 'metrics.injuries.sequel',
    amountFirstField: 'metrics.lawsuit-ammount.first',
    amountFullField: 'metrics.lawsuit-ammount.full',
    injuriesField: 'metrics.injuries',
    unit: 'uf',
    uf: 29355.01,
    affectedBodyPartsField: 'metrics.injuries.affectedBodyParts',
    imgUnsegmented: 'https://nicoolivaresg.github.io/json-files/img/front.png',
    threshold: 0.95,
    width: window.innerWidth,
    height: window.innerHeight,
    fillColor: 'lightblue',
    margin: { top: 30, right: 0, bottom: 30, left: 40 }
};

const mainOptions = {
    fillColor: 'add8e6',
    strokeColor: '4682b4',
    fillOpacity: 0.75,
    stroke: true,
    selected: true,
    isDeselectable: false,
    singleSelect: true,
    staticState: true,
    scaleMap: true,
    mapKey: 'id',
    render_highlight: {
        strokeWidth: 2
    }
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
    if(d.data.length > 0){
        html = html + `<div><b>Mín ddo 1ra instancia:</b>${_.isEqual(opts.unit, 'uf') ? d.resume.first.min + ' UF' : '$' + d.resume.first.min} </div>`;
        html = html + `<div><b>Max ddo 1ra instancia:</b>${_.isEqual(opts.unit, 'uf') ? d.resume.first.max + ' UF' : '$' + d.resume.first.max}</div>`;
        html = html + `<div><b>Promedio ddo 1ra instancia:</b>${_.isEqual(opts.unit, 'uf') ? d.resume.first.average + ' UF' : '$' + d.resume.first.average}</div>`;
        html = html + `<br/>`;
    
        html = html + `<div><b>Mín ddo otorgado:</b>${_.isEqual(opts.unit, 'uf') ? d.resume.full.min + ' UF' : '$' + d.resume.full.min}</div>`;
        html = html + `<div><b>Max ddo otorgado:</b>${_.isEqual(opts.unit, 'uf') ? d.resume.full.min + ' UF' : '$' + d.resume.full.min}</div>`;
        html = html + `<div><b>Promedio ddo otorgado:</b>${_.isEqual(opts.unit, 'uf') ? d.resume.full.average + ' UF' : '$' + d.resume.full.average}</div>`;
        html = html + `<br/>`;
        
        var sequels = d.data.map(doc => { return _.get(doc, opts.sequelField) })
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
            if(compromised.length > 0 &&
                natural.JaroWinklerDistance(compromised[0], "NO SEGMENTABLE", undefined, true) >= opts.threshold){
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
        if(a.data.length>0){
            var amountsFirst = a.data.map(doc => { return _.isEqual(opts.unit, 'uf') ? parseInt(_.get(doc, opts.amountFirstField), 10) / uf : parseInt(_.get(doc, opts.amountFirstField), 10) });
            var minFirst = Math.min.apply(Math, amountsFirst);
            var maxFirst = Math.max.apply(Math, amountsFirst);
            var sum = amountsFirst.reduce((a, b) => a + b, 0);
            var averageDdoFirst = (sum / amountsFirst.length) || 0;
            var amountsFull = a.data.map(doc => { return _.isEqual(opts.unit, 'uf') ? parseInt(_.get(doc, opts.amountFullField), 10) / uf : parseInt(_.get(doc, opts.amountFullField), 10) });
            var minFull = Math.min.apply(Math, amountsFull);
            var maxFull = Math.max.apply(Math, amountsFull);
            sum = amountsFull.reduce((a, b) => a + b, 0);
            var averageFull = (sum / amountsFull.length) || 0;
            _.assign(a, {
                data: filter,
                resume: {
                    first:{
                        min: minFirst.toFixed(2),
                        max: maxFirst.toFixed(2),
                        average: averageDdoFirst.toFixed(2)
                    },
                    full:{
                        min: minFull.toFixed(2),
                        max: maxFull.toFixed(2),
                        average: averageFull.toFixed(2)
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
        console.log(selected);
        showTooltip(selected, opts);
    }
}

function mouseout() {
    selected = null;
    hideTooltip();
}

function fillColor(d) {
    if(d.data.length>0) console.log(d);
    return {strokeColor:"FF0000",strokeWidth:5,fillColor:"FFFFFF",fillOpacity:0.5};
}

function chart(querySelector, data, opts) {
    let finalOptions = {};
    _.assign(finalOptions, defaultOptions, opts);

    uf = _.isEqual(finalOptions.unit,'uf') ? _.get(finalOptions, 'uf'): 29300;

    data = _.get(data, 'documents');
    data = filterData(data, finalOptions);
    console.log('bodyInjuriesMap', data);

    createTooltip(querySelector);
    const width = finalOptions.width;
    const height = finalOptions.height;

    var canvas = d3.select(querySelector)
        .attr("width", width)
        .attr("height", height)
        .style("margin", "-15px auto")


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

        console.log(front);
        console.log(back);
        console.log(unsegmented);

        var imgFront = canvas.append('img')
            .attr('id', 'myFrontImg')
            .attr('name', 'myFrontImg')
            .attr('src', front.img)
            .attr('alt', 'front')
            .attr('usemap', '#myFrontMap');
            
        imgFront.append("text")
        .attr("x", (width / 2))             
        .attr("y", 200)
        .attr("text-anchor", "middle")  
        .style('position', 'relative')
        .style('z-index', '99')
        .style("font-size", "16px") 
        .style("text-decoration", "underline")  
        .text("Value vs Date Graph");

        var imgBack = canvas.append('img')
            .attr('id', 'myBackImg')
            .attr('name', 'myBackImg')
            .attr('src', back.img)
            .attr('alt', 'back')
            .attr('usemap', '#myBackMap')
            
        var imgUnseg = canvas.append('img')
            .attr('id', 'myUnsegImg')
            .attr('name', 'myUnsegImg')
            .attr('src', unsegmented.img)
            .attr('alt', 'Unseg')
            .attr('usemap', '#myUnsegMap');

        var mapFront = canvas.append('map')
            .attr('id', 'myFrontMap')
            .attr('name', 'myFrontMap')
            .selectAll('area')
            .data(front.areas)
            .enter()
            .append('area')
            .attr('id', d => { return 'area-front-' + d.id })
            .attr('shape', d => { return d.shape })
            .attr('title', d => { return d.title })
            .attr('coords', d => { return d.coords })
            .attr('data-maphilight', d => { return fillColor(d)})
            .attr('target', '_self')
            .attr('href', d => { return d.data.length > 0 ? '#' : null; })
            .on('mouseover', d => { mouseover(d, finalOptions) })
            .on('mouseout', () => { mouseout() })



        var mapBack = canvas.append('map')
            .attr('id', 'myBackMap')
            .attr('name', 'myBackMap')
            .selectAll('area')
            .data(back.areas)
            .enter()
            .append('area')
            .attr('id', d => { return 'area-back' + d.id })
            .attr('shape', d => { return d.shape })
            .attr('title', d => { return d.title })
            .attr('coords', d => { return d.coords })
            .attr('href', d => { return d.data.length > 0 ? '#' : null; })
            .on('mouseover', d => { mouseover(d, finalOptions) })
            .on('mouseout', () => { mouseout() })

        var mapUnseg = canvas.append('map')
            .attr('id', 'myUnsegMap')
            .attr('name', 'myUnsegMap')
            .selectAll('area')
            .data(unsegmented.areas)
            .enter()
            .append('area')
            .attr('id', d => { return 'area-back' + d.id })
            .attr('shape', d => { return d.shape })
            .attr('title', d => { return d.title })
            .attr('coords', d => { return d.coords })
            .attr('href', d => { return d.data.length > 0 ? '#' : null; })
            .on('mouseover', d => { mouseover(d, finalOptions) })
            .on('mouseout', () => { mouseout() })


        $(document).ready(function () {
            $('#myFrontImg').mapster(
                mainOptions
                );
            $('#myBackImg').mapster(
                mainOptions
                );
            $('#myUnsegImg').mapster({
                fillColor: 'add8e6',
                fillOpacity: 0.3,
                strokeColor: '4682b4',
                stroke: true,
                selected: true,
                isDeselectable: false,
                singleSelect: true,
                scaleMap: true,
            });
        });


    }
}

module.exports = exports = chart;