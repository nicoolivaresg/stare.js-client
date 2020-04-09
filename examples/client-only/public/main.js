'use strict';

(function() {
  const engine = document.querySelector('#engine');
  const query = document.querySelector('#query');
  const pageNumber = document.querySelector('#pageNumber');

  const moreBtn = document.querySelector('#moreBtn');

  const results = document.querySelector('#results');

  const showResults = () => {
    stare.queries.get(engine.value, query.value, pageNumber.value)
      .then(data => {
        results.innerHTML = data;
      })
      .catch(error => {
        console.log(error);
      });
  }

  const moreResults = () => {
    stare.queries.more()
      .then(data => {
        results.innerHTML = data;
      })
      .catch(error => {
        console.log(error);
      });
  }


  engine.addEventListener('change', showResults);
  query.addEventListener('change', showResults);
  pageNumber.addEventListener('change', showResults);
  
  moreBtn.addEventListener('click', moreResults);
})();