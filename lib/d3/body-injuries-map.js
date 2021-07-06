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

var link  = document.createElement('link');
link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css';
link.type = 'text/css';
link.rel = "stylesheet";
document.getElementsByTagName('head')[0].appendChild(link);


var $ = require('jquery');
const { rgb, image } = require('d3');
const { result, remove } = require('lodash');
window.jQuery = $;
window.$ = $;

//Activar imagemapster
// $('img[usemap]').mapster();


//global
let selected = null;
let tooltip = null;
let width = null;
let height = null;
let categoryDropDown = null;
let categorySelected = 'Accidente del Trabajo';
const categories = ['Accidente del Trabajo', 'Enfermedad Profesional'];
let results = null;
let pdfWindow = null;

// Definición de containers principales
let mainContainer = null;
let filtersContainer = null;
let imagesContainer = null;
let legendsContainer = null;
let resultsContainer = null;
let frontImgContainer = null;
let backImgContainer = null;
let unsegImgContainer = null;


var bodyMapData = [
    'https://nicoolivaresg.github.io/json-files/json/front-body-map.json',
    'https://nicoolivaresg.github.io/json-files/json/back-body-map.json',
    'https://nicoolivaresg.github.io/json-files/json/unsegmented-body-map.json'
]

const defaultOptions = {
    sequelField: 'metrics.injuries.sequel',
    injuriesField: 'metrics.injuries',

    amountGivenFirstField: 'metrics.lawsuit-ammount.otorgado.primera',
    amountGivenFirstUfField: 'metrics.lawsuit-ammount.otorgado.primeraUF',
    amountGivenFirstPresentField: 'metrics.lawsuit-ammount.otorgado.primeraPresente',
    amountGivenFirstPresentUfField: 'metrics.lawsuit-ammount.otorgado.primeraPresenteUF',

    amountAskedFullField: 'metrics.lawsuit-ammount.demandado.demandado',
    amountAskedFullUfField: 'metrics.lawsuit-ammount.demandado.demandadoUF',
    amountAskedFullPresentField: 'metrics.lawsuit-ammount.demandado.demandadoPresente',
    amountAskedFullPresentUfField: 'metrics.lawsuit-ammount.demandado.demandadoPresenteUF',

    metricsField: 'metrics',
    categoryField: 'metrics.category',
    filterCategory: 'Accidente del Trabajo', // Puede ser "Accidente del Trabajo" o "Enfermedad Profesional"
    unit: 'uf',
    fillWith: 'primera.average',
    colorInterpolation: 'interpolateBrBG',
    affectedBodyPartsField: 'metrics.injuries.affectedBodyParts',
    threshold: 0.95,
    width: window.innerWidth,
    height: window.innerHeight,
    fillColor: 'lightblue',
    legendBarHeight: 50,
    margin: { top: 20, right: 40, bottom: 30, left: 40 },
    imgUnsegmented: 'https://nicoolivaresg.github.io/json-files/img/front.png',
    
    resultsCaratuladoField: 'title',
    resultsHechosFundantesField: 'snippet',
    resultsCourtNameField: 'metrics.courts.court.name',
    resultsFirstSentenceDateField: 'metrics.courts.court.sentenceDate',
    resultsCourtAppelateField: 'metrics.courts.appelateCourt.name',
    resultsCourtSupremeField: 'metrics.courts.supreme.name',
};


width = defaultOptions.width;
height = defaultOptions.height;


// Opciones por defecto de las áreas del image map
const mainOptions = {
    stroke: true,
    isDeselectable: false,
    singleSelect: true,
    staticState: true,
    selected: true,
    scaleMap: true,
    mapKey: 'data-key'
};

function showResults(documents, opts) {
    hideResults();

    if (documents != null) {
        // showDynamicCard(documents, opts)
        results = resultsContainer.selectAll('div')
            .data(documents)
            .enter()
            .append('div')
            .attr('class', 'card')
            .style('width', '200px')
            .style('height', 'auto')
            .style('margin', '2%')
            .style('padding', '2%')
            .style('background-color', 'lightblue')

        //Caratulado
        var caratulado = results.append('div')
            .style('width', '100%')
            .style('height', 'auto')
            .style('display', 'flex')
            .style('flex-flow', 'row nowrap')
            .style('font-size', '10px')
            .style('margin', '2%')
            .style('justify-content', 'space-evenly')
            .style('align-items', 'center')
            .style('text-align', 'center')
            .html('<i class="fas fa-book-open fa-lg" ></i>')
            .append('div')
            .style('display', 'flex')
            .style('align-items', 'center')
            .append('p')
            .text((d) => {
                return _.get(d, opts.resultsCaratuladoField);
            });

        //Hechos fundantes
        var anioSentencia = results.append('div')
            .style('width', '100%')
            .style('height', 'auto')
            .style('display', 'flex')
            .style('flex-flow', 'row nowrap')
            .style('font-size', '10px')
            .style('margin', '2%')
            .style('justify-content', 'space-evenly')
            .style('align-items', 'center')
            .style('text-align', 'center')
            .html('Hechos fundantes <i class="far fa-eye fa-lg" ></i>')
            .on('mouseover', (d) => {
                mouseOverInfo(_.get(d, opts.resultsHechosFundantesField));
            })
            .on('mouseout', (d) => {
                mouseOutInfo();
            });

        //Año sentencia
        var anioSentencia = results.append('div')
            .style('width', '100%')
            .style('height', 'auto')
            .style('display', 'flex')
            .style('flex-flow', 'row nowrap')
            .style('font-size', '10px')
            .style('margin', '2%')
            .style('justify-content', 'space-evenly')
            .style('align-items', 'center')
            .style('text-align', 'center')
            .html('<i class="far fa-calendar-alt fa-lg" ></i>')
            .append('div')
            .style('display', 'flex')
            .style('align-items', 'center')
            .append('p')
            .text((d) => {
                return `Fecha sentencia: ${formatDate(_.get(d, opts.resultsFirstSentenceDateField))}`
            });

        //Nombre juzgado primera instancia
        var juzgadoPrimeraInstancia = results.append('div')
            .style('width', '100%')
            .style('height', 'auto')
            .style('display', 'flex')
            .style('flex-flow', 'row nowrap')
            .style('font-size', '10px')
            .style('margin', '2%')
            .style('justify-content', 'space-evenly')
            .style('align-items', 'center')
            .style('text-align', 'center')
            .html('<i class="fa fa-university fa-lg" ></i>')
            .append('div')
            .style('display', 'flex')
            .style('align-items', 'center')
            .append('p')
            .text((d) => {
                return _.get(d, opts.resultsCourtNameField);
            });


        if (!_.isEqual(opts.unit, 'uf')) {
            results.append('div')
                .style('width', '100%')
                .style('height', 'auto')
                .style('display', 'flex')
                .style('flex-flow', 'row nowrap')
                .style('font-size', '10px')
                .style('margin', '2%')
                .style('justify-content', 'space-evenly')
                .style('align-items', 'center')
                .style('text-align', 'center')
                .html('<i class="far fa-money-bill-alt fa-lg"></i>')
                .append('div')
                .style('display', 'flex')
                .style('align-items', 'center')
                .append('p')
                .text((d) => {
                    return `Monto ${opts.fillWith.includes('demandado') ? "demandado" : "otorgado 1ra instancia"}  (valor año ${new Date(_.get(d, opts.resultsFirstSentenceDateField)).getFullYear()} en pesos chilenos): $${
                        opts.fillWith.includes('demandado') ? 
                        numberWithPoints(_.get(d, opts.amountAskedFullField))  :
                        numberWithPoints(_.get(d, opts.amountGivenFirstField))
                    }`
                });




            results.append('div')
                .style('width', '100%')
                .style('height', 'auto')
                .style('display', 'flex')
                .style('flex-flow', 'row nowrap')
                .style('font-size', '10px')
                .style('margin', '2%')
                .style('justify-content', 'space-evenly')
                .style('align-items', 'center')
                .style('text-align', 'center')
                .html('<i class="far fa-money-bill-alt fa-lg"></i>')
                .append('div')
                .style('display', 'flex')
                .style('align-items', 'center')
                .append('p')
                .text((d) => {
                    return `Monto ${opts.fillWith.includes('demandado') ? "demandado" : "otorgado 1ra instancia"} (valor año ${new Date().getFullYear()} en pesos chilenos): $${
                        opts.fillWith.includes('demandado') ?
                        numberWithPoints(_.get(d, opts.amountAskedFullPresentField))  :
                        numberWithPoints(_.get(d, opts.amountGivenFirstPresentField))
                    }`
                });
        }

        if (_.isEqual(opts.unit, 'uf')) {
            results.append('div')
                .style('width', '100%')
                .style('height', 'auto')
                .style('display', 'flex')
                .style('flex-flow', 'row nowrap')
                .style('font-size', '10px')
                .style('margin', '2%')
                .style('justify-content', 'space-evenly')
                .style('align-items', 'center')
                .style('text-align', 'center')
                .html('<i class="far fa-money-bill-alt fa-lg"></i>')
                .append('div')
                .style('display', 'flex')
                .style('align-items', 'center')
                .append('p')
                .text((d) => {
                    return `Monto ${opts.fillWith.includes('demandado') ? "demandado" : "otorgado 1ra instancia"}  (valor año ${new Date(_.get(d, opts.resultsFirstSentenceDateField)).getFullYear()} en UF): ${
                        opts.fillWith.includes('demandado') ?
                        _.get(d, opts.amountAskedFullUfField) :
                        _.get(d, opts.amountGivenFirstUfField) 
                    } UF`
                });

            results.append('div')
                .style('width', '100%')
                .style('height', 'auto')
                .style('display', 'flex')
                .style('flex-flow', 'row nowrap')
                .style('font-size', '10px')
                .style('margin', '2%')
                .style('justify-content', 'space-evenly')
                .style('align-items', 'center')
                .style('text-align', 'center')
                .html('<i class="far fa-money-bill-alt fa-lg"></i>')
                .append('div')
                .style('display', 'flex')
                .style('align-items', 'center')
                .append('p')
                .text((d) => {
                    return `Monto ${opts.fillWith.includes('demandado') ? "demandado" : "otorgado 1ra instancia"}  (valor año ${new Date().getFullYear()} en UF): ${
                        opts.fillWith.includes('demandado') ? 
                        _.get(d, opts.amountAskedFullPresentUfField) :
                        _.get(d, opts.amountGivenFirstPresentUfField)
                    } UF`
                });
        }



        //Documento sentencia (título)
        var documentoSentenciaTitle = results.append('div')
            .style('width', '100%')
            .style('height', 'auto')
            .style('display', 'flex')
            .style('flex-flow', 'row nowrap')
            .style('font-size', '10px')
            .style('margin', '2%')
            .style('justify-content', 'space-evenly')
            .style('align-items', 'center')
            .style('text-align', 'center')
            .append('p')
            .text('Documento sentencia:')

            //Documento sentenciaresultsContainer
            .style('display', 'flex')
            .style('flex-flow', 'row nowrap')
            .style('font-size', '10px')
            .style('margin', '2%')
            .style('justify-content', 'space-evenly')
            .style('align-items', 'center')
            .style('text-align', 'center')
            .html('<i class="fas fa-file fa-lg"></i> Click para revisar')
            .style('height', '30px')
            .on('click', (d) => {
                pdfWindow = window.open("")
                pdfWindow.document.write(
                    "<iframe width='100%' height='100%' src='data:application/pdf;base64, " +
                    encodeURI(d.image) + "'></iframe>"
                )
            })
    }
    else {
        var emptyResults = resultsContainer.append('div')
            .style('width', '100%')
            .style('text-align', 'center')
            .append('p')
            .text('No hay resultados para esta selección');
    }
    resultsContainer
        .transition()
        .duration(200)
        .style('opacity', 1);
}

function numberWithPoints(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function formatDate(x) {
    var d = new Date(x);
    return `${d.getFullYear()}-${ d.getMonth()+1}-${d.getDate()}`
}

function hideResults() {
    if (resultsContainer !== null) {
        resultsContainer
            .transition()
            .duration(200)
            .style('opacity', 0);
        resultsContainer.selectAll("*").remove();
    }
}

function createTooltip() {
    tooltip = d3.select('body')
        .append('div')
        .attr('class', 'tooltip')
        // .attr('class', 'stare__tooltip')
        .style('position', 'absolute')
        .style('padding','4px')
        .style('width','200px')
        .style('background-color','#f9f9f9')
        .style('border','1px')
        .style('border-radius','2px')
        .style('pointer-events','none')
        .style('opacity', 0)
}

function showTooltip(d, opts) {
     // _.get(d,`resume.${opts.fillWith}`)
    tooltip.selectAll('*').remove();
    tooltip
        .transition()
        .duration(200)
        .style('opacity', 1);
    tooltip
        .style('left', `${d3.event.pageX}px`)
        .style('top', `${d3.event.pageY - 28}px`)
        .append('p')
        .text( `Monto ${getStadistic(opts)}  ${opts.fillWith.includes('demandado')  ? "demandado" : "otorgado 1ra instancia"}  (valor presente ${new Date().getFullYear()}):  
            ${_.isEqual(opts.unit, 'uf') ?
                _.get(d, 'resume.' + opts.fillWith) + " UF" :
                "$" + _.get(d, 'resume.' + opts.fillWith)
        }`)
    
}

function hideTooltip() {
    tooltip
        .transition()
        .duration(500)
        .style('opacity', 0);
}

function getStadistic(opts) {
    if(opts.fillWith.includes('min')) return "mínimo";
    if(opts.fillWith.includes('max')) return "máximo";
    if(opts.fillWith.includes('average')) return "promedio";
}


function separateSegmentedUnsegmented(data, opts) {
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
                    parseFloat(_.get(doc, opts.amountGivenFirstPresentUfField)) :
                    parseFloat(_.get(doc, opts.amountGivenFirstPresentField))
            });
            var minFirst = Math.min.apply(Math, amountsFirst);
            var maxFirst = Math.max.apply(Math, amountsFirst);
            var sum = amountsFirst.reduce((a, b) => a + b, 0);
            var averageOtorgadoPrimera = (sum / amountsFirst.length) || 0;
            var amountsFull = a.data.map(doc => {
                return _.isEqual(opts.unit, 'uf') ?
                    parseFloat(_.get(doc, opts.amountAskedFullPresentUfField))  :
                    parseFloat(_.get(doc, opts.amountAskedFullPresentField));
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

function mouseOverInfo(info){
    d3.event.preventDefault();
    tooltip
        .transition()
        .duration(200)
        .style('opacity', 1);
    tooltip
        .html(
            `
            <div>
                <p>${info}</p>
            </div>
            
            `)
        .style('white-space', 'wrap')
        .style('text-overflow', 'clip')
        .style('left', `${d3.event.pageX}px`)
        .style('top', `${d3.event.pageY - 28}px`)
        .style('width', '200px')
        .style('height', 'auto');
}

function mouseOutInfo(){
    tooltip
    .transition()
    .duration(500)
    .style('opacity', 0);
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
        if (d.data.length > 0) {

            var color = rgb(0, 0, 0);
            // console.log(`resume.${opts.fillWith}`);
            console.log(_.get(d, `resume.${opts.fillWith}`));
            color = colorScale(_.get(d, `resume.${opts.fillWith}`));

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

function removeAll() {
    if (imagesContainer !== null) imagesContainer.selectAll("*").remove();
    if (legendsContainer !== null) legendsContainer.selectAll("*").remove();
    if (resultsContainer !== null) resultsContainer.selectAll("*").remove();
}

// Main function
function chart(querySelector, data, opts) {

    let finalOptions = {};
    _.assign(finalOptions, defaultOptions, opts);

    var promises = []

    bodyMapData.forEach(url => {
        promises.push(d3.json(url))
    })

    var margin = finalOptions.margin,
        barHeight = finalOptions.legendBarHeight;

    var documents = data.documents;

    //Contenedor principal asociado a selector otorogado por función chart()
    mainContainer = d3.select(querySelector)
        .attr("width", "100%")
        .attr("height", height)
        .style("display", "flex")
        .style("flex-flow", "column nowrap")
        .style("justify-content", "space-evenly")
        .style("text-align", "center");

    //Contenedor principal para filtros
    filtersContainer = mainContainer.append('div').attr('id', 'filtersContainer')
        .attr("width", "100%")
        .attr("height", 'auto')
        .style("display", "flex")
        .style("flex-flow", "row wrap")
        .style("justify-content", "space-evenly")
        .style("text-align", "left");

    categoryDropDown = filtersContainer
        .append('select')
        .attr('id', 'selectGroup')
        .on('change', onchange);

    categoryDropDown
        .selectAll('option')
        .data(categories).enter()
        .append('option')
        .text((d) => { return d; });


    var accidenteCount = documents.filter(d => {
        return _.isEqual(_.get(d, finalOptions.categoryField), "Accidente del Trabajo");
    }).length;
    filtersContainer.append('p').attr('id', 'categoryAccidenteCount').text(`Accidente del Trabajo: ${accidenteCount}`);
    filtersContainer.append('p').attr('id', 'categoryEnfermedadCount').text(`Enfermedad Profesional: ${documents.length - accidenteCount}`);


    createTooltip(querySelector);

    function onchange() {
        categorySelected = d3.select('#selectGroup').property('value')

        //Re renderizar visualización
        render(documents, {
            category: categorySelected
        });
    };



    function render(data, filters) {
        removeAll();
        // Inicialización de contenedores

        //Contenedor principal para imágenes
        imagesContainer = mainContainer.append('div').attr('id', 'imagesContainer')
            .attr("width", "100%")
            .attr("height", 'auto')
            .style("display", "flex")
            .style("flex-flow", "row wrap")
            .style("justify-content", "space-evenly")
            .style("align-items", "stretch");

        //Añade contenedores para imágenes
        frontImgContainer = imagesContainer.append('div').attr('id', 'frontImgContainer');
        backImgContainer = imagesContainer.append('div').attr('id', 'backImgContainer');
        unsegImgContainer = imagesContainer.append('div').attr('id', 'unsegImgContainer');
        //Añadir títulos de imágenes
        frontImgContainer.append('h5').text('Regiones frontales');
        backImgContainer.append('h5').text('Regiones posteriores');
        unsegImgContainer.append('h5').text('Causas sin segmentación');

        legendsContainer = mainContainer.append('div').attr('id', 'legendsContainer')
            .attr("width", "100%")
            .attr("height", 'auto');
        resultsContainer = mainContainer.append('div').attr('id', 'resultsContainer')
            .attr("width", "100%")
            .attr("height", '500px')
            .style("display", "flex")
            .style("flex-flow", "row wrap")
            .style("justify-content", "space-evenly")
            .style("align-items", "flex-start")
            .style("overflow","auto");

        var filteredData = data.filter(d => {
            return _.isEqual(_.get(d, finalOptions.categoryField), filters.category);
        });



        // Obtener el resolve de todas las promesas para el bodymap
        Promise.all(promises)
            .then(ready);

        function ready(values) {
            const front = values[0];
            const back = values[1];
            const unsegmented = values[2];

            let amounts = filteredData.map(d => {
                if (_.isEqual(finalOptions.unit, 'uf')) {
                    return finalOptions.fillWith.includes( 'demandado') ?
                        _.get(d, finalOptions.amountAskedFullPresentUfField) :
                        _.get(d, finalOptions.amountGivenFirstPresentUfField)
                } else {
                    return finalOptions.fillWith('demandado') ?
                        _.get(d, finalOptions.amountAskedFullPresentField) :
                        _.get(d, finalOptions.amountGivenFirstPresentField)
                }
            });
            amounts = amounts.sort((a, b) => a - b);
            let colorScale = d3.scaleSequential()
                .domain([Math.min.apply(Math, amounts), Math.max.apply(Math, amounts)])
                .interpolator(_.get(d3, finalOptions.colorInterpolation));

            var separatedData = separateSegmentedUnsegmented(filteredData, finalOptions);

            front.areas = assignDataToAreas(front.areas, separatedData.segmented, finalOptions);
            back.areas = assignDataToAreas(back.areas, separatedData.segmented, finalOptions);
            unsegmented.areas = assignDataToAreas(unsegmented.areas, separatedData.unsegmented, finalOptions);

            frontImgContainer.append('img')
                .attr('id', 'myImg0')
                .attr('name', 'myImg0')
                .attr('src', front.img)
                .attr('alt', 'front')
                .attr('usemap', '#myMap0');

            backImgContainer.append('img')
                .attr('id', 'myImg1')
                .attr('name', 'myImg1')
                .attr('src', back.img)
                .attr('alt', 'back')
                .attr('usemap', '#myMap1')

            unsegImgContainer.append('img')
                .attr('id', 'myImg2')
                .attr('name', 'myImg2')
                .attr('src', unsegmented.img)
                .attr('alt', 'Unseg')
                .attr('usemap', '#myMap2');


            frontImgContainer.append('map')
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
                .on('mouseover', d => { showTooltip(d, finalOptions) })
                .on('mouseout', () => { hideTooltip() })
                .on('click', d => { showResults(d.data, finalOptions) })


            backImgContainer.append('map')
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
                .on('mouseover', d => { showTooltip(d, finalOptions) })
                .on('mouseout', () => { hideTooltip() })
                .on('click', d => { showResults(d.data, finalOptions) })

            //TODO: revisar causas no segmentadas, origen de datos (cambio de origen)
            unsegImgContainer.append('map')
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
                .on('mouseover', d => { showTooltip(d, finalOptions) })
                .on('mouseout', () => { hideTooltip() })
                .on('click', d => { showResults(d.data, finalOptions) })

            var frontOptions = generateAreaStyle(front.areas, colorScale, 'area-front-', finalOptions);
            var backOptions = generateAreaStyle(back.areas, colorScale, 'area-back-', finalOptions);
            var unsegOptions = generateAreaStyle(unsegmented.areas, colorScale, 'area-unseg-', finalOptions);

            $('#myImg0').mapster(
                frontOptions
            );
            $('#myImg1').mapster(
                backOptions
            );
            $('#myImg2').mapster(
                unsegOptions
            );

            /**
             * Leyenda
             */
            var widthLegend = width - margin.left;
            var heightLegend = barHeight + margin.top;

            var svg = legendsContainer
                .style('display', 'flex')
                .style('flex-wrap', 'wrap')
                .append('div')
                .append('svg')
                .attr("width", widthLegend)
                .attr("height", heightLegend)

            const defs = svg.append("defs");


            const linearGradient = defs.append("linearGradient")
                .attr("id", "linear-gradient");

            console.log(colorScale.ticks().map((t, i, n) => {
                return ({ offset: `${100 * i / n.length}%`, color: colorScale(t) })
            }));
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

            legendsContainer.append('p')
                .style('width', '100%')
                .style('height', 'auto')
                .style('text-align', 'center')
                .text(_.get(finalOptions, 'unit') === 'uf' ? 'Unidad de Fomento [uf]' : 'Pesos chilenos [$]');


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

    render(documents, {
        category: categorySelected
    });
}

module.exports = exports = chart;