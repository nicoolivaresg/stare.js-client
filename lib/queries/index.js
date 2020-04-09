const axios = require('axios');

const supportedEngines = [
  'bing',
  'google',
  'ecosia',
];

var config = {
  serverUrl: process.env.STARE_SERVER || 'http://localhost:3001',
  serverPrefix: ''
};

var lastQuery = {};

function get(engine, query, pageNumber) {

  if (typeof engine === 'object') {
    ({ engine, query, pageNumber } = engine);
  }

  if (supportedEngines.indexOf(engine) === -1) {
    throw `Engine '${engine}' not supported.`;
  }

  pageNumber = pageNumber || 1;

  lastQuery = {
    engine,
    query,
    pageNumber
  };

  return axios.get(`${config.serverUrl}/${config.serverPrefix}${engine}`, { query, pageNumber });
}

/**
 * SERP engines
 */
function bing(query, pageNumber, callback) {
  return get('bing', query, pageNumber, callback);
}

function google(query, pageNumber, callback) {
  return get('google', query, pageNumber, callback);
}

function ecosia(query, pageNumber, callback) {
  return get('ecosia', query, pageNumber, callback);
}

function more() {
  lastQuery.pageNumber += 1;

  return get(lastQuery);
}

module.exports = {
  get,
  bing,
  google,
  ecosia,
  more
}