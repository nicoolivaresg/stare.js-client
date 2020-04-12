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

  let currentData = [{"title":"Stare seagulls out to save your snacks, researcher says ...","link":"https://www.theguardian.com/environment/2019/aug/07/stare-seagulls-out-to-save-your-snacks-researcher-says","snippet":"Aug 7, 2019 ... Giving marauding birds the eye makes them more wary of stealing food, study \nfinds.","metrics":{"ranking":1,"language":"english","perspicuity":0,"length":8544,"a":0,"b":0}},{"title":"Stare Down Gulls to Avoid Lunch Loss - Scientific American","link":"https://www.scientificamerican.com/podcast/episode/stare-down-gulls-to-avoid-lunch-loss/","snippet":"Aug 8, 2019 ... Researchers slowed the approach of greedy gulls by an average of 21 seconds \nby staring at the birds versus looking elsewhere. Christopher ...","image":"https://static.scientificamerican.com/sciam/cache/file/92F5CD8E-25AB-425F-918F91D5BAB6CB74.jpg","metrics":{"ranking":2,"language":"english","perspicuity":0,"length":5200,"a":0,"b":0}},{"title":"Hollywood and hyper-surveillance: the incredible story of Gorgon ...","link":"https://www.nature.com/articles/d41586-019-01792-5","snippet":"Jun 11, 2019 ... Hollywood and hyper-surveillance: the incredible story of Gorgon Stare. Sharon \nWeinberger commends a book on how a film inspired the ...","image":"https://media.nature.com/lw1024/magazine-assets/d41586-019-01792-5/d41586-019-01792-5_16774518.jpg","metrics":{"ranking":3,"language":"english","perspicuity":0,"length":33312,"a":0,"b":0}},{"title":"Silencing Stare | Divinity Original Sin 2 Wiki","link":"https://divinityoriginalsin2.wiki.fextralife.com/Silencing+Stare","snippet":"Dec 1, 2019 ... Silencing Stare. Silencing Stare. Destroy [X] Magic Armour and Silence all \nenemies in a cone in front of you. Set Silenced for 1 turn(s). Requires ...","image":"https://i.ytimg.com/vi/m-3sZdW57rQ/hqdefault.jpg","metrics":{"ranking":4,"language":"english","perspicuity":0,"length":11347,"a":0,"b":0}},{"title":"Demdike Stare's favourite tracks | Music | The Guardian","link":"https://www.theguardian.com/music/2014/feb/07/demdike-stare-favourite-tracks","snippet":"Feb 7, 2014 ... Demdike Stare's favourite tracks. Ben Beaumont-Thomas. Miles and Sean, the \npair behind the ace Testpressing series, empty the contents of ...","metrics":{"ranking":5,"language":"english","perspicuity":0,"length":8140,"a":0,"b":0}},{"title":"\"The US military doesn't need men who stare at goats - it's got ...","link":"https://tech.newstatesman.com/guest-opinion/men-who-stare-at-goats","snippet":"Aug 8, 2016 ... Christopher Farnsworth, author of sci-fi thriller Killfile, discusses the US military's \nlatest efforts to read people's minds.","image":"https://tech.newstatesman.com/wp-content/uploads/2016/08/goat-50290_1280-200x200.jpg","metrics":{"ranking":6,"language":"english","perspicuity":0,"length":13291,"a":0,"b":0}},{"title":"Supreme Court Nominees and Stare Decisis - Tucker Law Firm, PLC","link":"http://tuckerlawplc.com/supreme-court-nominees-stare-decisis/","snippet":"Feb 1, 2017 ... Translated from Latin, stare decisis means to stand by things decided. It is a legal \nprinciple meaning that courts make rulings based on precedent, ...","metrics":{"ranking":7,"language":"english","perspicuity":0,"length":5409,"a":0,"b":0}},{"title":"Gorgon Stare Aerial Surveillance Drones Might Be Coming To Your ...","link":"https://observer.com/2019/06/gorgon-stare-aerial-surveillance-drones/","snippet":"Jun 28, 2019 ... The Gorgon Stare is the eye-in-the-sky, a military surveillance drone built by the \nPentagon, that can simultaneously track 1000 moving targets.","image":"https://observer.com/wp-content/uploads/sites/2/2019/06/gorgon-stare.jpg?quality=80&strip","metrics":{"ranking":8,"language":"english","perspicuity":0,"length":11493,"a":0,"b":0}},{"title":"Demonic Stare | Divinity Original Sin 2 Wiki","link":"https://divinityoriginalsin2.wiki.fextralife.com/Demonic+Stare","snippet":"Jul 16, 2018 ... Demonic Stare. Drain [X] Magical Armour magic_armour-icon from target \ncharacter and gain that amount yourself. Restore up to [Y] Magic ...","metrics":{"ranking":9,"language":"english","perspicuity":0,"length":9737,"a":0,"b":0}},{"title":"Gorgon Stare","link":"https://www.sncorp.com/press-releases/snc-gorgon-stare/","snippet":"Jul 1, 2014 ... Sierra Nevada Corporation Achieves Milestone for USAF's Advanced Wide-Area \nAirborne Persistent Surveillance System – Gorgon Stare ...","metrics":{"ranking":10,"language":"english","perspicuity":0,"length":24369,"a":0,"b":0}}];

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
      chart('#svg', currentData, {});
    }
  }

  searchBtn.onclick = showResults;
  visualizeBtn.onclick = visualize;
})();