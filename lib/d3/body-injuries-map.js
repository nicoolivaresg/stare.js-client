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
    sequelField: 'metrics.injuries.sequel',
    amountFirstField: 'metrics.lawsuit-ammount.first',
    amountFullField: 'metrics.lawsuit-ammount.full',
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

const mainOptions = {
    fillColor: 'add8e6',
    strokeColor: '4682b4',
    stroke: true,
    selected: true,
    isDeselectable: false,
    singleSelect: true,
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

    var amountsFirst = d.data.map(doc => { return parseInt(_.get(doc, opts.amountFirstField), 10) });
    var minAmountFirst = Math.min.apply(Math, amountsFirst);
    var maxAmountFirst = Math.max.apply(Math, amountsFirst);
    var sum = amountsFirst.reduce((a, b) => a + b, 0);
    var meanAmountFirst = (sum / amountsFirst.length) || 0;

    html = html + `<div><b>Mín ddo 1ra instancia:</b>${minAmountFirst}</div>`;
    html = html + `<div><b>Max ddo 1ra instancia:</b>${maxAmountFirst}</div>`;
    html = html + `<div><b>Promedio ddo 1ra instancia:</b>${meanAmountFirst}</div>`;
    html = html + `<br/>`;


    var amountsFull = d.data.map(doc => { return parseInt(_.get(doc, opts.amountFullField), 10) });
    var minAmountsFull = Math.min.apply(Math, amountsFull);
    var maxAmountsFull = Math.max.apply(Math, amountsFull);
    sum = amountsFull.reduce((a, b) => a + b, 0);
    var meanAmountsFull = (sum / amountsFull.length) || 0;

    html = html + `<div><b>Mín ddo total:</b>${minAmountsFull}</div>`;
    html = html + `<div><b>Max ddo total:</b>${maxAmountsFull}</div>`;
    html = html + `<div><b>Promedio ddo total:</b>${meanAmountsFull}</div>`;
    html = html + `<br/>`;

    var sequels = d.data.map(doc => { return _.get(doc, opts.sequelField) })

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
        var filter = data.segmented.filter(d => {
            var compromised = _.get(d, opts.affectedBodyPartsField);
            var found = [];
            compromised.forEach(bodyPart => {
                bodyPart = bodyPart.split('-').length === 2 ? bodyPart.split('-')[1] : bodyPart.split('-')[0];
                bodyPart = bodyPart.toLowerCase();
                a.title = a.title.toLowerCase();
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
    })
    return mapData;
}


function clicked(d, opts) {
    d3.event.preventDefault();
    // let w = d3.select(this);
    selected ? selected = null : selected = d;
    $('img').mapster('highlight');;
    if (selected && _.has(selected, 'data') && selected.data.length > 0) {
        console.log(selected);
        showTooltip(selected, opts);
    } else {
        hideTooltip();
    }
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
        // const back = values[1];
        const front = require('./front-body-map.json');
        console.log(front);
        const back = require('./back-body-map.json');

        front.areas = assignDataToAreas(front.areas, data, finalOptions);
        back.areas = assignDataToAreas(back.areas, data, finalOptions);

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
            .attr('id', d => { return 'area-front-' + d.id })
            .attr('shape', d => { return d.shape })
            .attr('title', d => { return d.title })
            .attr('coords', d => { return d.coords })
            .attr('target', '_self')
            .attr('href', d => { return d.data.length > 0 ? '#' : null; })
            .on('mouseover', d => { clicked(d, finalOptions) })
            .on('mouseout', () => { hideTooltip() })



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
            .on('mouseover', d => { clicked(d, finalOptions) })
            .on('mouseout', () => { hideTooltip() })




        $(document).ready(function () {
            $('#myFrontImg').mapster(mainOptions);
            $('#myBackImg').mapster(mainOptions);
        });


    }
}

module.exports = exports = chart;