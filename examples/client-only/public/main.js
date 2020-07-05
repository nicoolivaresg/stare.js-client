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

  let currentData = [{"title":"¡Hola mundo! | Turtle + The Wolf","link":"https://turtleandthewolf.com/2015/04/13/hola-mundo/","snippet":"13 Abr 2015 ... Hola, esto es un comentario. Para borrar un comentario simplemente accede y \nrevisa los comentarios de la entrada. Ahí tendrás la opción de ...","image":"https://turtleandthewolf.com/wp-content/uploads/2015/10/webretina-white.png","metrics":{"ranking":1,"keywords-position":{"documentLength":1389,"keywords":{"hola":[291,509],"mundo":[296]}}}},{"title":"'Hola, Mundo', un documental sobre los beneficios del viaje en los ...","link":"https://www.traveler.es/viajeros/articulos/documental-hola-mundo-beneficios-de-viajar-primeros-anos-de-vida-de-un-nino-viajar-en-familia/16442","snippet":"24 Oct 2019 ... Donde muchos encuentran obstáculos y miedos, ellos ven aventura y \noportunidades para disfrutar del tiempo en familia. Lucía y Rubén ...","image":"https://aws.traveler.es/prod/designs/v1/assets/940x627/150641.jpg","metrics":{"ranking":2,"keywords-position":{"documentLength":52369,"keywords":{"hola":[10585,14370,16226,20860,36599,36611,40223],"mundo":[4537,10591,14376,15618,16232,16309,19387,20866,27951,36605,36617,39494,39702,40229,41846,48637,48693,49025,51636,51739,52119]}}}},{"title":"¡Hola mundo! – La Casa del Mundo","link":"http://www.lacasadelmundo.com/hola-mundo/","snippet":"21 Jun 2019 ... Hola, esto es un comentario. Para empezar a moderar, editar y borrar \ncomentarios, por favor, visita la pantalla de comentarios en el escritorio.","metrics":{"ranking":3,"keywords-position":-1}},{"title":"Hola Mundo - Curso de iniciación a la programación con Python en ...","link":"https://www.programoergosum.com/cursos-online/raspberry-pi/244-iniciacion-a-python-en-raspberry-pi/hola-mundo","snippet":"El Hola Mundo se caracteriza por su sencillez, especialmente cuando se ejecuta \nen una terminal o shell. Si tenemos instalado el sistema operativo Raspbian en ...","image":"https://www.programoergosum.com/images/cursos/244-iniciacion-a-python-en-raspberry-pi/iniciacion-a-python-en-raspberry-pi.png","metrics":{"ranking":4,"keywords-position":{"documentLength":2916,"keywords":{"hola":[673,838,858,946,1203,2118,2235,2270],"mundo":[678,843,863,951,1208,2123,2240,2275]}}}},{"title":"¡Hola mundo!Misaki Sushi & Bar","link":"http://misakisushibar.com/hola-mundo/","snippet":"26 Sep 2019 ... Bienvenido a WordPress. Esta es tu primera entrada. Edítala o bórrala, ¡y \ncomienza a publicar!....","image":"http://misakisushibar.com/wp-content/uploads/2015/07/logo.png","metrics":{"ranking":5,"keywords-position":{"documentLength":3384,"keywords":{"hola":[53,208,602,1095,1166],"mundo":[58,213,1100,1171]}}}},{"title":"¡Hola mundo! | First Cup Cafe","link":"http://firstcupcafetx.com/2017/09/05/hola-mundo/","snippet":"5 Sep 2017 ... ¡Hola mundo! Bienvenido a WordPress. Esta es tu primera entrada. Edítala o \nbórrala, ¡y comienza a publicar!. Categories Sin categoría. 0 likes ...","metrics":{"ranking":6,"keywords-position":{"documentLength":1037,"keywords":{"hola":[42,277,559,616,627],"mundo":[47,564,621]}}}},{"title":"Hola mundo! - Encienda nuestros corazones, hogares y comunidades","link":"https://archkcks.org/es/2018/08/hello-world","snippet":"23 Ago 2018 ... Bienvenido a WordPress. Este es tu primer post. Editar o eliminar, a continuación\n, empezar a escribir! Compartir esta entrada. Compartir en ...","image":"http://archkcks.org/wp-content/uploads/2019/10/EOH-New-logo.png","metrics":{"ranking":7,"keywords-position":{"documentLength":1851,"keywords":{"hola":[],"mundo":[]}}}},{"title":"¡Hola mundo! - The King Of Shave","link":"http://www.thekingofshave.com/hola-mundo/","snippet":"4 Ago 2016 ... Hola, esto es un comentario. Para borrar un comentario simplemente accede y \nrevisa los comentarios de la entrada. Ahí tendrás la opción de ...","image":"http://www.thekingofshave.com/wp-content/uploads/2016/08/logo1.png","metrics":{"ranking":8,"keywords-position":{"documentLength":2253,"keywords":{"hola":[237,799,1384],"mundo":[242,804]}}}},{"title":"Instalando App Inventor, primeros pasos y “¡hola mundo!” | DIWO","link":"http://diwo.bq.com/instalando-app-inventor-primeros-pasos-y-hola-mundo/","snippet":"24 Abr 2015 ... Aprende los conocimientos básicos de App Inventor y comienza a crear tus \npropias aplicaciones!","image":"http://diwo.bq.com/wp-content/uploads/2015/04/destacada_appinventor.png","metrics":{"ranking":9,"keywords-position":{"documentLength":24597,"keywords":{"hola":[480,2389,3212,3236,4344,14037,14720,15418,17691,18306,18435,19059,20919,21086,21694,22373,23382],"mundo":[485,2394,3217,3241,4349,18440,21091,24549]}}}},{"title":"¡Hola mundo! | Sal de Aquí","link":"https://saldeaqui.com.mx/hola-mundo/","snippet":"Bienvenido a WordPress. Esta es tu primera entrada. Edítala o bórrala, ¡y \ncomienza a publicar!. About dobleuese. What you can read next. Mapa SDA. \nDeja un ...","image":"https://saldeaqui.com.mx/sal//wp-content/uploads/2017/12/LogoSDA-wfix.png","metrics":{"ranking":10,"keywords-position":{"documentLength":1638,"keywords":{"hola":[398,586],"mundo":[403,591]}}}},{"title":"¡Hola mundo! – Carlos'n Charlie's Las Vegas","link":"https://carlosncharlies-lv.com/hola-mundo/","snippet":"11 Feb 2019 ... Bienvenido a WordPress. Esta es tu primera entrada. Edítala o bórrala, ¡y \ncomienza a publicar!. Entradas recientes. ¡Hola mundo! Comentarios ...","image":"https://carlosncharlies-lv.com/wp-content/uploads/2019/02/logo-cnc.png","metrics":{"ranking":11,"keywords-position":{"documentLength":766,"keywords":{"hola":[93,105,117,461,526],"mundo":[98,110,122,466,531]}}}},{"title":"\"Hola Mundo\". Elements - HTML-CSS - The freeCodeCamp Forum","link":"https://www.freecodecamp.org/forum/t/hola-mundo-elements/195800","snippet":"Jun 3, 2018 ... Tell us what's happening: Your code so far <h1> \"Hello World\". </h1> Your \nbrowser information: User Agent is: Mozilla/5.0 (Windows NT 10.0; ...","image":"https://discourse-user-assets.s3.dualstack.us-east-1.amazonaws.com/original/3X/2/0/206c254cf9e405bcddf6caea7f882dca146dcd3c.png","metrics":{"ranking":12,"keywords-position":{"documentLength":12241,"keywords":{"hola":[1201,1235,3367,4570,6144,6729,8254,8904,10415,11034],"mundo":[1206,1240,3372,4575,6149,6734,8259,8909,10420,11039]}}}}];

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
      document.querySelector('#svg').remove();

      if (visualization.value === 'tiles') {
        currentData.forEach((v, i) => {
          let div = document.createElement('div');
          div.setAttribute('class', 'svg-tiles');
          let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svg.setAttribute('id', 'svg-'+i);
          div.appendChild(svg);
          canvas.appendChild(div);
          console.log(`chart('#svg-'${i}, ${v}, {})`);
          chart('#svg-'+i, v, {});
        });
      } else {
        let svg = document.createElement('svg');
        svg.setAttribute('id', 'svg');
        canvas.appendChild(svg);
        chart('#svg', currentData, {});
      }
    }
  }

  searchBtn.onclick = showResults;
  visualizeBtn.onclick = visualize;
})();