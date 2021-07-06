'use strict';

const debug = require('debug')('stare.js:client/charts/d3/map');

const d3 = require(`d3`);
const topojson = require("topojson-client");
const _ = require('lodash');
const natural = require('natural'); //Copyright (c) 2011, 2012 Chris Umbel, Rob Ellis, Russell Mull


//#region Options
const defaultOptions = {
    width: 1000,
    height: 1000,
    threshold: 0.95,
    unit: 'uf',
    uf: 29355.01,
    appelateCourtField: 'metrics.courts.appelateCourt.name',

    amountGivenFirstField: 'metrics.lawsuit-ammount.otorgado.primera',
    amountGivenFirstUfField: 'metrics.lawsuit-ammount.otorgado.primeraUF',
    amountGivenFirstPresentField: 'metrics.lawsuit-ammount.otorgado.primeraPresente',
    amountGivenFirstPresentUfField: 'metrics.lawsuit-ammount.otorgado.primeraPresenteUF',

    amountAskedFullField: 'metrics.lawsuit-ammount.demandado.demandado',
    amountAskedFullUfField: 'metrics.lawsuit-ammount.demandado.demandadoUF',
    amountAskedFullPresentField: 'metrics.lawsuit-ammount.demandado.demandadoPresente',
    amountAskedFullPresentUfField: 'metrics.lawsuit-ammount.demandado.demandadoPresenteUF',

    categoryField: 'metrics.category',
    filterCategory: 'Accidente del Trabajo',
    baseOpacity: 0.4,
    baseColor: 'red',
    filledOpacity: 0.8,
    fillWith: 'primera.average',
    colorInterpolation: 'interpolateBrBG',
    stroke: false,
    strokeColor: 'black',
    topoJurisdicciones: 'https://nicoolivaresg.github.io/json-files/topojson/jurisdicciones-3.json',
    topoCortes: 'https://nicoolivaresg.github.io/json-files/topojson/cortes.json',
    scaleFactor: 1.25,
    legendBarHeight: 50,
    margin: { top: 20, right: 5, bottom: 20, left: 5 },

    dynamicCard: {
        width: '85',
        height: '85',
        backgroundColor: 'white',
        borderRadius: '10px',
        fadeInTime: 400,
        fadeOutTime: 200
    },

    resultsCaratuladoField: 'title',
    resultsHechosFundantesField: 'snippet',
    resultsCourtNameField: 'metrics.courts.court.name',
    resultsFirstSentenceDateField: 'metrics.courts.court.sentenceDate',
    resultsCourtAppelateField: 'metrics.courts.appelateCourt.name',
    resultsCourtSupremeField: 'metriipc anualcs.courts.supreme.name',
};
//#endregion

var topojsonFiles = [
    defaultOptions.topoJurisdicciones,
    defaultOptions.topoCortes
]

//global
let tooltip = null;
let modal = null;
let legend = null;
let uf = null;
let mapSVG = null;
let legendSVG = null;
let categoryDropDown = null;
let categorySelected = 'Accidente del Trabajo';
const categories = ['Accidente del Trabajo', 'Enfermedad Profesional'];
let results = null;
let pdfWindow = null;
let legendWidth = null;
let legendHeight = null;
let projection = null;
let dynamicCard = null;

// Definición de containers principales
let mainContainer = null;
let filtersContainer = null;
let wideContainer = null;
let mapContainer = null;
let interactionContainer = null;
let legendsContainer = null;
let dynamicContainer = null;
let resultsContainer = null;

//#region Manejo eventos
function createTooltip() {
    tooltip = d3.select('body')
        .append('div')
        .attr('class', 'stare__tooltip')
        .style('opacity', 0)
}

function showTooltip(d, opts) {
    

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

function mouseOverInfo(info) {
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

function mouseOutInfo() {
    tooltip
        .transition()
        .duration(500)
        .style('opacity', 0);
} dynamicCard

function showResults(juris, opts) {
    hideResults();

    if (juris.data != null) {
        showDynamicCard(juris, opts)
        results = resultsContainer.selectAll('div')
            .data(juris.data)
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
                    return `Monto  ${opts.fillWith.includes('demandado') ? "demandado" : "otorgado 1ra instancia"}  (valor año ${new Date().getFullYear()} en UF): ${
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

function hideResults() {
    if (resultsContainer !== null) {
        resultsContainer
            .transition()
            .duration(200)
            .style('opacity', 0);
        resultsContainer.selectAll("*").remove();
    }
}


function createDynamicCard(opts) {
    dynamicCard = dynamicContainer
        .append('div')
        .attr('class', 'dynamicCard')
        .style('width', `${_.get(opts, 'dynamicCard.width')}%`)
        .style('height', `${_.get(opts, 'dynamicCard.height')}%`)
        .style('border', '2px black')
        .style('background-color', _.get(opts, 'dynamicCard.backgroundColor'))
        .style('border-radius', _.get(opts, 'dynamiCard.borderRadius'))
        .style('box-shadow', '5px 5px 10px 1px #000')
        .style('opacity', 0)

}

function showDynamicCard(juris, opts) {
    d3.event.preventDefault();
    dynamicCard.selectAll("*").remove();

    dynamicCard
        .append('h4')
        .style('width', 'center') 
        .style('padding', '2%')
        .text(`Jurisdicción ${juris.properties.Corte}`)

    dynamicCard
        .append('p')
        .style('width', '100%')
        .style('padding', '2%')
        .text(`Causas relacionadas:  ${_.get(juris, 'data') ? juris.data.length : 0}`)

    if (_.get(juris, 'data')) {
        dynamicCard
            .append('p')
            .style('width', '100%')
            .style('padding', '2%')
            .text(`Monto ${getStadistic(opts)}  ${opts.fillWith.includes('demandado')  ? "demandado" : "otorgado 1ra instancia"}  (valor presente ${new Date().getFullYear()}):  ${_.isEqual(opts.unit, 'uf') ?
                    _.get(juris, 'properties.resume.' + opts.fillWith) + " UF" :
                    "$" + _.get(juris, 'properties.resume.' + opts.fillWith)
                }`);
    }

    dynamicCard.transition()
        .duration(_.get(opts, 'dynamicCard.fadeInTime'))
        .style('opacity', 1);

}

function hideDynamicCard(opts) {
    dynamicCard
        .transition()
        .duration(_.get(opts, 'dynamicCard.fadeOutTime'))
        .style('opacity', 0);

}
//#endregion

//#region Utils

function getStadistic(opts) {
    if(opts.fillWith.includes('min')) return "mínimo";
    if(opts.fillWith.includes('max')) return "máximo";
    if(opts.fillWith.includes('average')) return "promedio";
}

function numberWithPoints(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function formatDate(x) {
    var d = new Date(x);
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}


function assignDataToJurisdicciones(documents, jurisdicciones, opts) {
    documents.forEach(doc => {
        let juris = jurisdicciones.features.find(jur => {
            jur.properties.Corte = jur.properties.Corte.trim()
            jur.properties.Corte = jur.properties.Corte.replace(/\s+/g, ' ');
            jur.properties.Corte = jur.properties.Corte.replace('Corte de Apelaciones de', 'C.A. de');
            jur.properties.Corte = jur.properties.Corte.replace('Corte de', 'C.A. de');
            let distance = natural.JaroWinklerDistance(jur.properties.Corte, _.get(doc, opts.appelateCourtField), undefined, true);
            return distance > opts.threshold
        })
        if (juris != undefined) {
            if (juris.data != undefined) {
                juris.data.push(doc);
            } else {
                juris.data = [doc];
            }
        }
    })
    return jurisdicciones;

}


function resumeData(data, opts) {
    data.features.forEach(e => {
        if (_.has(e, 'data')) {
            let amountsGiven = e.data.map(doc => {
                return _.isEqual(opts.unit, 'uf') ?
                    parseFloat(_.get(doc, opts.amountGivenFirstPresentUfField)) :
                    parseFloat(_.get(doc, opts.amountGivenFirstPresentField))
            });
            var minFirst = Math.min.apply(Math, amountsGiven);
            var maxFirst = Math.max.apply(Math, amountsGiven);
            var sum = amountsGiven.reduce((a, b) => a + b, 0);
            var averageFirst = (sum / amountsGiven.length) || 0;
            let amountsAsked = e.data.map(doc => {
                return _.isEqual(opts.unit, 'uf') ?
                    parseFloat(_.get(doc, opts.amountAskedFullPresentUfField)) :
                    parseFloat(_.get(doc, opts.amountAskedFullPresentField))
            });
            var minFull = Math.min.apply(Math, amountsAsked);
            var maxFull = Math.max.apply(Math, amountsAsked);
            sum = amountsAsked.reduce((a, b) => a + b, 0);
            var averageFull = (sum / amountsAsked.length) || 0;
            e.properties.resume = _.assign(e.properties.resume, 
                {
                    primera: {
                        max: maxFirst.toFixed(2),
                        min: minFirst.toFixed(2),
                        average: averageFirst.toFixed(2),
                    },
                    demandado: {
                        max: minFull.toFixed(2),
                        min: maxFull.toFixed(2),
                        average: averageFull.toFixed(2)
                    }
                })
        }
    })
    return data;
}

//#endregion

//#region Chart function definition
function chart(querySelector, data, opts) {
    let finalOptions = {};
    _.assign(finalOptions, defaultOptions, opts);

    uf = _.isEqual(finalOptions.unit, 'uf') ? _.get(finalOptions, 'uf') : 29300;

    var width = finalOptions.width,
        height = finalOptions.height,
        centered;

    var margin = finalOptions.margin,
        barHeight = finalOptions.legendBarHeight;


    var documents = _.get(data, 'documents');

    console.log('jurisprudenceBar', data);
    console.log(documents);

    //Contenedor principal asociado al selector otorga
    mainContainer = d3.select(querySelector)
        .attr('width', width)
        .attr('height', height)
        .style('display', 'flex')
        .style('flex-flow', 'column nowrap')
        .style('justify-content', 'space-evenly')
        .style('text-align', 'center');

    //Contenedor principal para filtros
    filtersContainer = mainContainer.append('div').attr('id', 'filtersContainer')
        .style('width', '100%')
        .style('height', '10%')
        .style("display", "flex")
        .style("flex-flow", "row wrap")
        .style("justify-content", "space-evenly")
        .style("align-items", "center")
        .style("text-align", "left");

    //#region Filtros de categoria
    categoryDropDown = filtersContainer
        .append('select')
        .attr('id', 'selectGroup')
        .style('height', '50%')
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

    function onchange() {
        categorySelected = d3.select('#selectGroup').property('value')

        //Re renderizar visualización
        render(documents, {
            category: categorySelected
        });
    };
    //#endregion10



    function removeAll() {
        if (wideContainer !== null) wideContainer.selectAll("*").remove();
        if (mapContainer !== null) mapContainer.selectAll("*").remove();
        if (interactionContainer !== null) interactionContainer.selectAll("*").remove();
        if (legendsContainer !== null) legendsContainer.selectAll("*").remove();
        if (dynamicContainer !== null) dynamicContainer.selectAll("*").remove();
        if (resultsContainer !== null) resultsContainer.selectAll("*").remove();
    }

    function render(data, filters) {
        removeAll();

        var filteredData = data.filter(d => {
            return _.isEqual(_.get(d, finalOptions.categoryField), filters.category);
        });

        createTooltip();

        //Contenedor principal para mapContainer (50%) + interactionContainer(50%)
        wideContainer = mainContainer.append('div').attr('id', 'wideContainer')
            .style('width', '100%')
            .style('height', 'auto')
            .style("display", "flex")
            .style("flex-flow", "row wrap")
            .style("justify-content", "stretch")
            .style("text-align", "left");

        //Contenedor para la Legenda
        legendsContainer = wideContainer.append('div').attr('id', 'legendsContainer')
            .style('width', '100%')
            .style('height', '20%')
            .style('display', 'flex')
            .style('flex-flow', 'row wrap')
            .style('justify-content', 'space-evenly')
            .style('align-items', 'flex-start')
            .style('overflow', 'auto');

        //Contenedor para el mapa y toda la carga de datos en el svg
        mapContainer = wideContainer.append('div').attr('id', 'mapContainer')
            .style('width', '50%')
            .style('height', 'auto')
            .style('display', 'flex')
            .style('flex-flow', 'row wrap')
            .style('justify-content', 'center')
            .style('border', '3px solid black')
            .style('align-items', 'center')
            .style('text-align', 'left');

        //Contenedor para todas las interacciones con el contenedor mapa
        interactionContainer = wideContainer.append('div').attr('id', 'interactionContainer')
            .style('width', '50%')
            .style('height', 'auto')
            .style('display', 'flex')
            // .style('border', '3px solid black')
            // .style('border-style', 'dashed')
            .style('flex-flow', 'column nowrap')
            .style('justify-content', 'center')
            .style('align-items', 'center')
            .style('text-align', 'left');


        //Contenedor para los datos dinámicos
        dynamicContainer = interactionContainer.append('div').attr('id', 'dynamicContainer')
            .style('width', '100%')
            .style('height', '25%')
            .style('display', 'flex')
            .style('flex-flow', 'row wrap')
            .style('justify-content', 'space-evenly')
            .style('align-items', 'center')
            .style('overflow', 'auto');

        createDynamicCard(finalOptions);

        //Contenedor para los resultados
        resultsContainer = interactionContainer.append('div').attr('id', 'resultsContainer')
            .style('width', '100%')
            .style('height', '75%')
            .style('display', 'flex')
            .style('flex-flow', 'row wrap')
            .style('justify-content', 'space-evenly')
            .style('align-items', 'flex-start')
            .style('overflow', 'auto');

        var mapWidth = document.getElementById('mapContainer').offsetWidth;
        var mapHeight = height - document.getElementById('legendsContainer').offsetHeight;

        const zoom = d3.zoom()
            .scaleExtent([1, 12])
            .on('zoom', zoomed);

        mapSVG = mapContainer.append('svg').attr('id', 'mapSVG')
            .style('width', mapWidth)
            .style('height', mapHeight)


        const gJuris = mapSVG.append('g');
        const gCortes = mapSVG.append('g');


        var promises = []

        topojsonFiles.forEach(url => {
            promises.push(d3.json(url))
        })

        Promise.all(promises)
            .then(ready)

        function ready(topojsonFilesLoaded) {

            var jurisdicciones = topojsonFilesLoaded[0]
            var cortes = topojsonFilesLoaded[1]

            var dataJurisdicciones = topojson.feature(jurisdicciones, jurisdicciones.objects.jurisdicciones)
            var dataCortes = topojson.feature(cortes, cortes.objects.cortes)

            dataJurisdicciones = assignDataToJurisdicciones(filteredData, dataJurisdicciones, finalOptions);

            dataJurisdicciones = resumeData(dataJurisdicciones, finalOptions);

            mapSVG.call(zoom);

            // Proyección
            projection = d3.geoIdentity()
                .reflectY(true)
                .fitSize([mapWidth, height], dataJurisdicciones)

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
                    mouseOverInfo("Click para desplegar resultados")
                    showDynamicCard(d, finalOptions);
                })
                .on("mouseout", function () {
                    d3.select(this).transition()
                        .style("opacity", d => { return setOpacity(d) })
                    mouseOutInfo();
                    // hideDynamicCard(finalOptions);
                })
                .on("click", (d) => {
                    showResults(d, finalOptions);
                })

            // Grupo de puntos de cortes de apelaciones

            // gCortes.selectAll("path")
            //   .data(dataCortes.features)
            //   .enter()
            //   .attr("d", path)
            //   .attr("class", "centroid")
            //   .style("fill", 'red')


            // Colores y leyenda

            let amounts = filteredData.map(d => {
                if (_.isEqual(finalOptions.unit, 'uf')) {
                    return _.isEqual(finalOptions.fillWith, 'demandado') ?
                        _.get(d, finalOptions.amountAskedFullPresentUfField) :
                        _.get(d, finalOptions.amountGivenFirstPresentUfField)
                } else {
                    return _.isEqual(finalOptions.fillWith, 'demandado') ?
                        _.get(d, finalOptions.amountAskedFullPresentField) :
                        _.get(d, finalOptions.amountGivenFirstPresentField)
                }
            });
            amounts = amounts.sort((a, b) => a - b);
            let colorScale = d3.scaleSequential()
                .domain([Math.min.apply(Math, amounts), Math.max.apply(Math, amounts)])
                .interpolator(_.get(d3, finalOptions.colorInterpolation));

            /**
             * Leyenda
             */

            legendWidth = document.getElementById('legendsContainer').offsetWidth;
            legendHeight = document.getElementById('legendsContainer').offsetHeight;

            legendSVG = legendsContainer.append('svg').attr('id', 'legendSVG')
                .style('width', legendWidth)
                .style('height', margin.top + margin.top + barHeight)

            const defs = legendSVG.append("defs");

            const linearGradient = defs.append("linearGradient").attr("id", "linear-gradient");

            linearGradient.selectAll("stop")
                .data(colorScale.ticks().map((t, i, n) => {
                    return ({ offset: `${100 * i / n.length}%`, color: colorScale(t) })
                }))
                .enter().append("stop")
                .attr("offset", d => d.offset)
                .attr("stop-color", d => d.color);

            legendSVG.append('g')
                .attr("transform", `translate(0,${margin.top})`)
                .append("rect")
                .attr('transform', `translate(${margin.left}, 0)`)
                .attr("width", `${legendWidth - margin.left - margin.right}`)
                .attr("height", barHeight)
                .style("fill", "url(#linear-gradient)");

            const axisScale = d3.scaleLinear()
                .domain(colorScale.domain())
                .range([margin.left, legendWidth - margin.right]);

            const axisBottom = g => g
                .attr("class", `x-axis`)
                .attr("transform", `translate(0,${barHeight + margin.top})`)
                .call(d3.axisBottom(axisScale)
                    .ticks(legendWidth / 80)
                    .tickSize(-barHeight));

            legendSVG.append('g')
                .call(axisBottom);

            legendsContainer.append('p')
                .style('width', '100%')
                .style('height', 'auto')
                .style('text-align', 'center')
                .text(_.get(finalOptions, 'unit') === 'uf' ? 'Unidad de Fomento [uf]' : 'Pesos chilenos [$]');

            gJuris.selectAll('path')
                .style("fill", d => { return fillJuris(d); })
                .style("stroke", d => { return strokeJuris(d); })
                .style("stroke-width", '0.5px')



            function strokeJuris(d) {
                if (_.get(finalOptions, 'stroke') === true) {
                    return  _.get(finalOptions, 'strokeColor');
                } else {
                    return "";
                }
            }

            // Modifica color de Jurisdicción
            function fillJuris(d) {

                if (_.has(d.properties, 'resume')) {
                    let avg = _.get(d.properties, `resume.${finalOptions.fillWith}`);
                    return colorScale(avg);
                }
                return _.get(finalOptions, 'baseColor');
            }

            function setOpacity(d) {
                if (d.data) {
                    return _.get(finalOptions, 'filledOpacity');
                }
                return _.get(finalOptions, 'baseOpacity');
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

    render(documents, {
        category: categorySelected
    });

}

//#endregion


module.exports = exports = chart;
