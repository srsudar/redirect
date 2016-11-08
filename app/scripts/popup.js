/* global document, setTimeout, window */
'use strict';

var common = require('./common');
var commonUi = require('./common-ui');

/** 
 * Called after all Redirects are examined. Prints a message if no Redirects
 * are created for the current url.
 */ 
var showMsg = function showMsg(hasKeys) { 
  if (!hasKeys) { 
    var messg = 'No Redirects created for this url.';
    document.getElementById('userMessage').innerHTML = messg;
  }
};

/** 
  * Examines all saved Redirects for the current url and 
  * displays them in an unordered list. 
  */
var checkPreviousRedirects= function checkPreviousRedirects() { 
  var ul = document.getElementById('currentRedirects');
  
  common.getUrlOfCurrentTab()
  .then(url => {
    return common.getExistingRedirects(url);
  })
  .then(redirectArr => {
    if (redirectArr.length === 0) {
      showMsg(false);
    } else {
      var msg = 'Redirects for this url:';
      document.getElementById('usermessage').innerhtml = msg;
      redirectArr.forEach(redirect => {
        var elem = document.createElement('li');
        elem.innerHTML = redirect;
        ul.appendChild(elem);
      });
      showMsg(true);
    }
  });
};

document.querySelector('#submit').addEventListener(
  'click',
  commonUi.validateAndSaveRedirect
);

document.querySelector('#settings').addEventListener(
  'click',
  commonUi.openSettings
);

// Focus on the text box for immediate typing. We have to set a timeout because
// without one the focus change doesn't take. It seems like this is because the
// popup isn't completely rendered when we're trying to act on it. This 100ms
// timeout feels instantaneous to the user but lets the page render first.
setTimeout(function foo() {
  document.getElementById('inputval').focus();
}, 100);

// Displays previously created redirects
window.onload = function() {
  checkPreviousRedirects();
};
