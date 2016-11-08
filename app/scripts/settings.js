/* global document, window */
'use strict';

var chromeStorage = require('./chrome-apis/storage');
var common = require('./common');
var commonUi = require('./common-ui');

// This script contains logic for the settings page. It allows users to 
// create new directs and delete ones. 

/**
 * Removes the redirect and updates the UI to reflect the deletion.
 */
function removeRedirect(button) {  
  var redirect = button.id;
  common.removeRedirect(redirect)
  .then(() => {
    populateRedirects();
  });
}

function addRemoveListeners() {
  var removers = document.getElementsByClassName('removeElement');
  for (var i = 0; i < removers.length; i++) {
    var element = removers[i];
    element.addEventListener('click', function() {
      removeRedirect(this);
    });
  }
}

function populateRedirects() {
  // First remove all existing rows. Important for updating after manually
  // creating a redirect while on the settings page.
  var table = document.getElementById('mainTables');
  while (table.firstChild) {
    table.removeChild(table.firstChild);
  }

  // Pass in null to get all the items saved in sync storage. The callback
  // function is invoked with an object full of key->redirect mappings.
  chromeStorage.get(null)
  .then(items => {
    for (var key in items) {
      // check hasOwnProperty to make sure it's a key and doesn't come from the
      // prototype
      if (items.hasOwnProperty(key) && !common.isPrivateKey(key)) {
        // Creates an empty table row and adds it to the first position of the
        // table
        var row = table.insertRow(-1);

        // Insert three new cells into the new table row
        var cell1 = row.insertCell(0);
        var cell2 = row.insertCell(1);
        var cell3 = row.insertCell(2);

        // Populates the new cells with text and a delete button
        cell1.innerHTML = key;
        cell2.innerHTML = items[key];
        cell3.innerHTML = '<button id="' + key +
          '" class="removeElement btn btn-danger btn-sm" >Remove</button>';
      }
    }
    addRemoveListeners();
  });
}

// When the user specifies a key and redirect, it's saved. 
var createRedirect = function() {
  var redirect = document.getElementById('newInput').value;
  var targetUrl = document.getElementById('url').value;

  if (!common.isValidKey(redirect)) {
    commonUi.alertIsInvalidKey();
    return;
  }

  // If they didn't include the scheme, we need to include it and will default
  // to http.
  if (!/^http[s]?:\/\//.test(redirect)) {
    redirect = 'http://'.concat(redirect);  
  }

  common.saveRedirect(redirect, targetUrl)
  .then(() => {
    populateRedirects();
  });
};


// Displays saved redirects in a table.
window.onload = function() {
  populateRedirects();
};

document.getElementById('new').onclick = createRedirect;
