---
---
{% include_relative _js/wikihub.min.js %}

(function() {
  var opts = {
    owner:  '{{ site.owner  }}',
    repo:   '{{ site.repo   }}',
    branch: '{{ site.branch }}'
  }

  var showSection    = document.getElementById('show-section');
  var errorSection   = document.getElementById('error-section');
  var successSection = document.getElementById('success-section');
  var loginSection   = document.getElementById('login-section');
  var editSection    = document.getElementById('edit-section');
  var sections = [showSection, errorSection, loginSection, editSection, successSection];

  var tokenElem   = document.getElementsByName('token')[0];
  var textElem    = document.getElementsByName('text')[0];
  var messageElem = document.getElementsByName('message')[0];

  function show(elem) { elem.className = elem.className.replace('hide', ''); }
  function hideAll() { sections.forEach(hide); }
  function hide(elem) {
    show(elem);
    elem.className += ' hide';
  }

  function load() {
    wikihub.load(opts)
      .then(function(text) {
        textElem.value = text;
        hideAll();
        show(editSection);
        localStorage.setItem('token', opts.token);
      })
      .catch(displayError);
  }

  function displayError(err) {
    var message = !err.request ? err.message :
      err.request.statusText + ': ' + JSON.parse(err.request.response).message;

    errorSection.innerHTML = message;
    show(errorSection);
  }

  window.suggest = function(path) {
    opts.path = path;
    opts.token = localStorage.getItem('token');

    if(opts.token) { load(); }
    else {
      hide(showSection);
      show(loginSection);
    }
  }

  window.login = function() {
    opts.token = tokenElem.value;
    load();
  }

  window.cancel = function() {
    hideAll();
    show(showSection);
  };

  window.logout = function() {
    cancel();
    localStorage.removeItem('token');
  };

  window.save = function() {
    opts.text = textElem.value;
    opts.message = messageElem.value;

    wikihub.save(opts)
      .then(function() {
        hideAll();
        show(successSection);
        show(showSection);
      })
      .catch(displayError);
  }

})();