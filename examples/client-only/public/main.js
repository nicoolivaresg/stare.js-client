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

  let currentData = [{"title":"HTML5 Multimedia Redirection: State of the Union Part II | Citrix Blogs","link":"https://www.citrix.com/blogs/2018/01/03/html5-multimedia-redirection-state-of-the-union-part-ii/","snippet":"Jan 3, 2018 ... Tagged under: Apps & Desktops · Citrix Receiver · Citrix Tech Bytes · Citrix Virtual \nApps & Desktops (XenApp & XenDesktop) · HDX · HTML5.","image":"https://www.citrix.com/blogs/wp-content/uploads/2018/01/html5-1036x479.jpg","metrics":{"ranking":1,"links":-1}},{"title":"IE program manager endorses HTML 5 multimedia tags | Ars Technica","link":"https://arstechnica.com/microsoft/news/2009/09/ie-program-manager-endorses-html-5-multimedia-tags.ars","snippet":"Sep 17, 2009 ... IE program manager endorses HTML 5 multimedia tags ... substantive feedback \non the current editor's draft of HTML5 on behalf of Microsoft.","image":"https://cdn.arstechnica.net/wp-content/uploads/2009/09/html_tags_ars.jpg","metrics":{"ranking":2,"links":-1}},{"title":"HTML5 Multimedia Redirection: State of the Union | Citrix Blogs","link":"https://www.citrix.com/blogs/2017/11/06/html5-multimedia-redirection-state-of-the-union/","snippet":"Nov 6, 2017 ... You can use the developer tools in your browser to inspect the video element, \nand find the source in the HTML5 <video> tag. You will notice a ...","image":"https://www.citrix.com/blogs/wp-content/uploads/2017/11/streaming-video-1036x479.jpg","metrics":{"ranking":3,"links":-1}},{"title":"Web Development Reading List: Multimedia - the new code","link":"http://thenewcode.com/759/Web-Development-Reading-List-Multimedia","snippet":"Dec 11, 2017 ... HTML5 has dramatically changed web multimedia: for that reason, this ... The \nobject tag · Create An Imagemap · Codecs & Containers · Format ...","image":"http://thenewcode.com/assets/images/nightclub-lasers-2x.jpg","metrics":{"ranking":4,"links":["thenewcode.com","twitter.com","dudleystorey.com","oreilly.com","google.com","patreon.com","dudleystorey.github.io","massiveheadcanon.com","amazon.com","facebook.com","teamtreehouse.com","webplatform.org","amazon.ca","amazon-adsystem.com","flickr.com"]}},{"title":"Google official reaffirms HTML5 readiness | InfoWorld","link":"https://www.infoworld.com/article/2626570/google-official-reaffirms-html5-readiness.html","snippet":"Apr 30, 2010 ... Google engineer confirms Steve Jobs' pronouncement that HTML5 can be ... Like \nthe other HTML5 features, the built-in multimedia tags are ...","image":"https://idge.staticworld.net/ifw/IFW_logo_social_300x300.png","metrics":{"ranking":5,"links":["infoworld.com","computerworld.com","cio.com","idginsiderpro.com","idgesg.net","idg.com","linkedin.com","twitter.com","facebook.com","reddit.com","techhive.com","idgnews.net","forrester.com","msdn.com","csoonline.com","networkworld.com"]}},{"title":"Pro HTML5 with CSS, JavaScript, and Multimedia","link":"https://www.researchgate.net/publication/315364578_Pro_HTML5_with_CSS_JavaScript_and_Multimedia","snippet":"Download Citation | Pro HTML5 with CSS, JavaScript, and Multimedia | Learn ... \nWhat You Will Learn: How, and when, to use all the HTML5 markup tags Use ...","image":"https://www.researchgate.net/images/template/default_publication_preview_large.png","metrics":{"ranking":6,"links":["researchgate.net","facebook.com","twitter.com","linkedin.com","reddit.com","rgstatic.net"]}},{"title":"HTML5 Multimedia Part - 2 - Eduonix Blog","link":"https://blog.eduonix.com/html5-tutorials/html5-multimedia-part-2/","snippet":"Mar 5, 2014 ... HTML5 Multimedia Part – 2. March 5 ... Through the theory, we now know that \nsame HTML tags are used for both video and audio. So, in this ...","image":"https://blogeduonix-2f3a.kxcdn.com/wp-content/uploads/2014/02/blue_developer_video_folder-300x224.jpg","metrics":{"ranking":7,"links":["eduonix.com","facebook.com","instagram.com","linkedin.com","pinterest.com","twitter.com","youtube.com","kxcdn.com","kickstarter.com","mix.com","jobsora.com","convertplug.com"]}},{"title":"HTML5: New version of HTML with Multimedia support","link":"https://www.markupbox.com/blog/html5-new-version-of-html-with-multimedia-support/","snippet":"Dec 15, 2011 ... The top high quality HTML5 multimedia elements are listed below: CCGallery ... \nThe content of document is markup by semantic tags. So use ...","image":"https://www.markupbox.com/blog/wp-content/uploads/2011/12/BeFunky_images-11.jpg.jpg","metrics":{"ranking":8,"links":["markupbox.com","feedburner.com","google.com","twitter.com","linkedin.com","facebook.com"]}},{"title":"All Updates tagged: multimedia | Web | Google Developers","link":"https://developers.google.com/web/updates/tags/multimedia?hl=hi","snippet":"All Updates tagged: multimedia. सामग्री ... local_offer news multimedia voice \nwebspeech synthesis ... HTML5 audio and the Web Audio API are BFFs!","image":"https://developers.google.com/web/images/social-webfu-16x9.png?hl=hi","metrics":{"ranking":9,"links":["google.com","web.dev","creativecommons.org","apache.org","chromium.org","gstatic.com","twitter.com","chrome.com","sitekit.withgoogle.com","github.com"]}},{"title":"HTML5: Generic Containers | Packt Hub","link":"https://hub.packtpub.com/html5-generic-containers/","snippet":"Jun 1, 2011 ... HTML5 Multimedia Development Cookbook Recipes for practical, ... The and and \ntags (as well as their closing tags) are now optional in the ...","image":"https://hub.packtpub.com/wp-content/uploads/2018/03/pexels-photo-461662.jpeg","metrics":{"ranking":10,"links":["packtpub.com","facebook.com","linkedin.com","twitter.com","youtube.com","whatwg.org","w3.org","validator.nu","html5doctor.com","priceline.com","nypl.org","microformats.org"]}}];

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