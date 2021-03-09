'use strict';

import JSONFormatter from 'json-formatter-js';
import axios from 'axios';
import _ from 'lodash';
import stare from '../../../';

// import serverResponse from './responseSence.json';
import serverResponse from './responseBaremo.json';

const STARE_API_URL = 'http://localhost:3000';

(function() {
  const engine = document.querySelector('#engine');
  const query = document.querySelector('#query');
  const pageNumber = document.querySelector('#pageNumber');
  const searchBtn = document.querySelector('#searchBtn');
  const results = document.querySelector('#results');
  const resultsCount = document.querySelector('#resultsCount');

  // const metric = document.querySelector('#metric');
  const library = document.querySelector('#library');
  const visualization = document.querySelector('#visualization');
  const visualizeBtn = document.querySelector('#visualizeBtn');
  const canvas = document.querySelector('#canvas');

  // let currentData = serverResponse;
  let currentData = null;

  const getResults = (engine, query, pageNumber) => {
    return new Promise((resolve, reject) => {
      axios.get(`${STARE_API_URL}/${engine}?query=${query}&pageNumber=${pageNumber}`)
        .then(response => resolve(_.get(response, 'data')))
        .catch(error => reject(error));
    })
  };

  const showResults = () => {
    query.classList = '';

    if (query.value === '') {
      query.classList = 'error';
      return false;
    }

    results.innerHTML = 'Cargando...';

    getResults(engine.value, query.value, pageNumber.value)
      .then(data => {
        results.innerHTML = '';
        currentData = data;
        let formatter = new JSONFormatter(data);
        results.appendChild(formatter.render());
        resultsCount.innerHTML = 'Resultados ' + currentData.numberOfItems;
        visualize();
      })
      .catch(err => {
        results.innerHTML = err;
        alert("Unable to retrieve results")
      });
  };

  const visualize = () => {
    if (_.isEmpty(currentData)) {
      alert('No data to visualize, you must do a query first');
      return;
    }

    let chart = undefined;
    console.log(engine.value);
    console.log(visualization.value);
    if(_.isEqual(engine.value,'baremo')){
      if(_.isEqual(visualization.value,'map') || _.isEqual(visualization.value,'bodyInjuriesMap')){
        chart = stare(library.value, visualization.value);
      }
    }
    if(_.isEqual(engine.value,'sence')){
      if(_.isEqual(visualization.value,'elementsBubble') || _.isEqual(visualization.value,'mosaic')){
        chart = stare(library.value, visualization.value);
      }
    }

    if (chart) {
      document.querySelector('#canvas').innerHTML = '';
      
      if (visualization.value === 'grid' || visualization.value === 'bodyInjuriesMap') {
        chart('#canvas', currentData, {});
      } else if (visualization.value === 'tiles' || visualization.value === 'tiles3') {
        currentData.documents.forEach((v, i) => {
          let div = document.createElement('div');
          div.setAttribute('class', 'svg-tiles');
          let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svg.setAttribute('id', 'svg-'+i);
          div.appendChild(svg);
          canvas.appendChild(div);
          // console.log(`chart('#svg-'${i}, ${v}, {})`);
          chart('#svg-'+i, v, {});
        });
      } else {
        let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('id', 'svg');
        canvas.appendChild(svg);
        chart('#svg', currentData, {});
        // chart('#svg', currentData, {
        //   labelField: 'metrics.ranking',
        //   valueField: 'metrics.keywords-position.documentLength',
        //   groupField: 'metrics.language',
        //   width: 500,
        //   height: 400,
        //   fillColor: 'steelblue',
        //   margin: {top: 30, right: 0, bottom: 30, left: 40}
        // });
        
      }
    }else{
      alert("Unable to draw visualization");
    }
  }

  searchBtn.onclick = showResults;
  visualizeBtn.onclick = visualize;
})();