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

  let currentData = [{"title":"Infinite Jest at 20: still a challenge, still brilliant | Books | The Guardian","link":"https://www.theguardian.com/books/booksblog/2016/feb/15/infinite-jest-at-20-still-a-challenge-still-brilliant-emma-lee-moss","snippet":"Feb 15, 2016 ... Finding my way around David Foster Wallace's monumental maze of a story has \nruined my social life and made my brain hurt – but its rewards ...","metrics":{"ranking":1,"language":"english","perspicuity":0,"length":11550,"multimedia":{"video":2,"img":2,"audio":5},"a":0,"b":0}},{"title":"Testing React Applications with Jest","link":"https://auth0.com/blog/testing-react-applications-with-jest/","snippet":"Jan 26, 2017 ... The following are some of the features that Jest offers. Performance - Jest run \ntests in parallel processes thus minimizing test runtime. Mocking - ...","image":"https://cdn.auth0.com/blog/testing-react-with-jest/logo.png","metrics":{"ranking":2,"language":"english","perspicuity":0,"length":221341,"multimedia":{"video":4,"img":40,"audio":12},"a":0,"b":0}},{"title":"Infinite Jest at 20: 20 things you need to know | Books | The Guardian","link":"https://www.theguardian.com/books/2016/feb/26/infinite-jest-david-foster-wallace-20th-anniversary-20-things-need-know","snippet":"Feb 26, 2016 ... The beloved 1100-page novel is David Foster Wallace's magnum opus and one \nof the most influential books of its time, but did you know he ...","metrics":{"ranking":3,"language":"english","perspicuity":0,"length":14821,"multimedia":{"video":7,"img":3,"audio":0},"a":0,"b":0}},{"title":"Review: Infinite Jest, a Postmodern Saga of Damnation and ...","link":"https://www.theatlantic.com/magazine/archive/1996/02/the-alchemists-retort/376533/","snippet":"Feb 1, 1996 ... Infinte Jest by David Foster Wallace. Among writers of the younger—which these \ndays means under forty—generation, David Foster Wallace ...","image":"https://cdn.theatlantic.com/thumbor/n2Q7S2oDcgGukfl44ZdzJxV1eNE=/0x15:1230x656/960x500/media/img/2016/02/infinitejest-4/original.jpg","metrics":{"ranking":4,"language":"english","perspicuity":0,"length":13676,"multimedia":{"video":0,"img":4,"audio":0},"a":0,"b":0}},{"title":"Infinite Jest on stage: Berlin theater adaptation of David Foster ...","link":"https://slate.com/culture/2012/06/infinite-jest-on-stage-berlin-theater-adaptation-of-david-foster-wallaces-novel.html","snippet":"Jun 18, 2012 ... And lo: It's five in the morning, and I'm sitting in a Boston AA meeting. The \ncaffeine powder I ingested shortly after midnight has long worn off.","image":"https://compote.slate.com/images/fc8b17a7-9a4f-4181-92c1-f1ff66e1ced6.jpg","metrics":{"ranking":5,"language":"english","perspicuity":0,"length":18268,"multimedia":{"video":0,"img":2,"audio":0},"a":0,"b":0}},{"title":"David Foster Wallace Predicted Our Selfie Anxiety Back in 1996 ...","link":"https://www.theatlantic.com/culture/archive/2014/04/david-foster-wallace-predicted-our-selfie-anxiety-in-1996/360323/","snippet":"Apr 8, 2014 ... ... actually imagined by David Foster Wallace in his 1996 epic novel Infinite Jest, \nwhich takes place in a near-future dystopian North America.","image":"https://cdn.theatlantic.com/thumbor/MXri8uMWiL1u3R1eGMLABrwcaOw=/0x286:3500x2109/960x500/media/img/upload/wire/2014/04/08/RTR3GV0E/original.jpg","metrics":{"ranking":6,"language":"english","perspicuity":0,"length":9040,"multimedia":{"video":4,"img":6,"audio":17},"a":0,"b":0}},{"title":"Test JavaScript with Jest from @kentcdodds on @eggheadio","link":"https://egghead.io/lessons/javascript-test-javascript-with-jest","snippet":"Let's learn how to unit test your JavaScript with Jest, a JavaScript unit testing \nframework from Facebook. We'll install and optimize Jest for this project and see\n ...","image":"https://og-image-react-egghead.now.sh/lesson/javascript-test-javascript-with-jest?v=20200116","metrics":{"ranking":7,"language":"english","perspicuity":63,"length":4336,"multimedia":{"video":2,"img":7,"audio":0},"a":0,"b":0}},{"title":"Four Theories Toward the Timeless Brilliance of Infinite Jest ...","link":"https://lithub.com/four-theories-toward-the-timeless-brilliance-ofinfinite-jest/","snippet":"Mar 21, 2018 ... In an essay written while he was at work on Infinite Jest, Wallace referred to the “\noracular foresight” of a writer he idolized, Don DeLillo, whose ...","image":"https://s26162.pcdn.co/wp-content/uploads/2018/03/clouds.jpg?w=640","metrics":{"ranking":8,"language":"english","perspicuity":0,"length":20932,"multimedia":{"video":3,"img":22,"audio":1},"a":0,"b":0}},{"title":"Jest, Snapshot Testing - Wallaby.js Supported technologies","link":"https://wallabyjs.com/docs/integration/jest.html","snippet":"Supported technologies: Jest, Snapshot Testing. Select configuration mode. \nWallaby can be run either with or without a configuration file. We recommend \nusing ...","image":"https://wallabyjs.com/assets/img/vsc_snapshot.gif","metrics":{"ranking":9,"language":"english","perspicuity":0,"length":20181,"multimedia":{"video":1,"img":12,"audio":0},"a":0,"b":0}},{"title":"Introduction to Testing With Jest ← Alligator.io","link":"https://alligator.io/testing/jest-intro/","snippet":"May 24, 2017 ... Jest is a JavaScript testing framework requiring little to no configuration. Here's a \nquick post to get you up and running with it.","image":"https://alligator.io/images/testing/jest-intro.png","metrics":{"ranking":10,"language":"english","perspicuity":61,"length":3154,"multimedia":{"video":10,"img":3,"audio":1},"a":0,"b":0}}];

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
      alert('No data to visualize, you must do a query first');
      return;
    }

    let chart = stare('d3', visualization.value);

    if (chart) {
      document.querySelector('#svg').innerHTML = '';
      chart('#svg', currentData, {});
    }
  }

  searchBtn.onclick = showResults;
  visualizeBtn.onclick = visualize;
})();