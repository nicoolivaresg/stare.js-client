'use strict';

import JSONFormatter from 'json-formatter-js';
import axios from 'axios';
import _ from 'lodash';
import stare from '../../../';

const STARE_API_URL = 'http://localhost:3000';

(function() {
  const engine = document.querySelector('#engine');
  const query = document.querySelector('#query');
  const pageNumber = document.querySelector('#pageNumber');
  const searchBtn = document.querySelector('#searchBtn');
  const results = document.querySelector('#results');

  const metric = document.querySelector('#metric');
  const visualization = document.querySelector('#visualization');
  const visualizeBtn = document.querySelector('#visualizeBtn');
  const canvas = document.querySelector('#canvas');

  let currentChart = null;
  let currentData = [
    {name: "Infinite Jest at 20: still a challenge, still brilliant | Books | The Guardian", value: 11550},
    {name: "Testing React Applications with Jest", value: 221051},
    {name: "Infinite Jest at 20: 20 things you need to know | Books | The Guardian", value: 14821},
    {name: "Review: Infinite Jest, a Postmodern Saga of Damnation and ...", value: 13676},
    {name: "Infinite Jest on stage: Berlin theater adaptation of David Foster ...", value: 18038},
    {name: "David Foster Wallace Predicted Our Selfie Anxiety Back in 1996 ...", value: 9040},
    {name: "Test JavaScript with Jest from @kentcdodds on @eggheadio", value: 4336},
    {name: "Four Theories Toward the Timeless Brilliance of Infinite Jest ...", value: 20895},
    {name: "Jest, Snapshot Testing - Wallaby.js Supported technologies", value: 20181},
    {name: "Introduction to Testing With Jest ← Alligator.io", value: 4003}
  ];

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
      })
      .catch(err => console.error(err));
  };

  const visualize = () => {
    if (_.isEmpty(currentData)) {
      // canvas.innerHTML = 'No data to visualize, you must do a query first';
      return;
    }

    if (currentChart) {
      currentChart.remove();
    }

    // let data = currentData.documents.map(d => ({ name: d.title, value: d.metrics.length }));
    let data = currentData;
    console.log(data);
    let chart = stare('d3', visualization.value);

    if (chart) {
      chart('#svg', data, {});
    }
  }

  searchBtn.onclick = showResults;
  visualizeBtn.onclick = visualize;
})();