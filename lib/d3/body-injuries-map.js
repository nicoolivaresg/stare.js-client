'use strict';

const debug = require('debug')('stare.js:client/charts/d3/body-injuries-map');

const d3 = require(`d3`);
const _ = require('lodash');
const natural = require('natural');
require('es6-promise').polyfill();
// var script = document.createElement('script');
// script.src = 'https://code.jquery.com/jquery-3.4.1.min.js';
// script.type = 'text/javascript';
// document.getElementsByTagName('head')[0].appendChild(script);

var script = document.createElement('script');
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/imagemapster/1.5.4/jquery.imagemapster.min.js';
script.type = 'text/javascript';
document.getElementsByTagName('head')[0].appendChild(script);


var $ = require('jquery');
window.jQuery = $;
window.$ = $;
// require('../../node_modules/imagemapster');
// require('../../node_modules/maphilight');


// const ImageMap = require("image-map").default;

var selected = null;

const defaultOptions = {
    amountField: 'metrics.lawsuit-ammount',
    injuriesField: 'metrics.injuries',
    affectedBodyPartsField: 'metrics.injuries.affectedBodyParts',
    labelField: 'metrics.ranking',
    valueField: 'metrics.length',
    threshold: 0.95,
    width: window.innerWidth,
    height: window.innerHeight,
    fillColor: 'lightblue',
    margin: { top: 30, right: 0, bottom: 30, left: 40 }
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


function assignDataToAreas(mapData,data, opts) {
    mapData.map(a => {
        var filter = data.segmented.filter(d => {
            var compromised = _.get(d, opts.affectedBodyPartsField);
            var found = [];
            compromised.forEach( bodyPart => {
                bodyPart = bodyPart.split('-').length === 2 ? bodyPart.split('-')[1]: bodyPart.split('-')[0];
                bodyPart = bodyPart.toLowerCase();
                a.title = a.title.toLowerCase();
                var distance = natural.DiceCoefficient( a.title, bodyPart);
                if(distance >= opts.threshold){
                        found.push(d);  
                } 
            })
            return found.length > 0;
        })
        _.assign(a, {
            data: filter
        });
    })
    return mapData;
}


function chart(querySelector, data, opts) {
    let finalOptions = {};
    _.assign(finalOptions, defaultOptions, opts);

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
        // const front = values[0];
        const front = require('./front-body-map.json');
        console.log(front);
        const back = require('./back-body-map.json');
        
        front.areas = assignDataToAreas(front.areas,data, finalOptions);
        back.areas = assignDataToAreas(back.areas,data, finalOptions);
        
        console.log(front);
        console.log(back);

        var imgFront = canvas.append('img')
            .attr('id', 'myFrontImg')
            .attr('name', 'myFrontImg')
            .attr('src', front.img)
            .attr('alt', 'front')
            .attr('usemap', '#myFrontMap');

        var imgBack = canvas.append('img')
            .attr('id', 'myBackImg')
            .attr('name', 'myBackImg')
            .attr('src', back.img)
            .attr('alt', 'back')
            .attr('usemap', '#myBackMap');

        var mapFront = canvas.append('map')
            .attr('id', 'myFrontMap')
            .attr('name', 'myFrontMap')
            .selectAll('area')
            .data(front.areas)
            .enter()
            .append('area')
            .attr('id',d => { return 'area-front-' + d.id })
            .attr('shape', d => { return d.shape })
            .attr('title', d => { return d.title })
            .attr('coords', d => { return d.coords })
            .attr('target', '_self')
            .attr('href', d => { return d.data.length > 0 ?  '#' : null ;})
            .on('click', d => {
                d3.event.preventDefault();
                // let w = d3.select(this);
                selected = d;
                if(selected.data.length>0){
                    console.log(selected);
                }
            })



        var mapBack = canvas.append('map')
            .attr('id', 'myBackMap')
            .attr('name', 'myBackMap')
            .selectAll('area')
            .data(back.areas)
            .enter()
            .append('area')
            .attr('id',d => { return 'area-back' + d.id })
            .attr('shape', d => { return d.shape })
            .attr('title', d => { return d.title })
            .attr('coords', d => { return d.coords })
            .attr('href', d => { return d.data.length > 0 ?  '#' : null ;})
            .on('click', d => {
                d3.event.preventDefault();
                // let w = d3.select(this);
                selected = d;
                if(selected.data.length>0){
                    console.log(selected);
                }
            })

        

        const mainOptions = {
            fillColor: 'add8e6',
            strokeColor: '4682b4',
            stroke: true,
            selected: true,
            isDeselectable: false,
            singleSelect: true,
            render_highlight: {
                strokeWidth: 1
            },
            areas: [{
                key: 'somearea',
                stroke: false,
                render_select: {
                    fillOpacity: 1
                }
            }]
        };

        $(document).ready(function () {
            $('#myFrontImg').mapster(mainOptions);
            $('#myBackImg').mapster(mainOptions);
        });


    }
}

module.exports = exports = chart;