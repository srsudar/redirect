require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* globals Promise, chrome */
'use strict';

/**
 * This module provides a wrapper around the chrome.storage.local API and
 * provides an alternative based on Promises.
 */

/**
 * @param {boolean} useSync
 *
 * @return {StorageArea} chrome.storage.sync or chrome.storage.local depending
 * on the value of useSync
 */
function getStorageArea(useSync) {
  if (useSync) {
    return chrome.storage.sync;
  } else {
    return chrome.storage.local;
  }
}

/**
 * @param {string|Array<string>} keyOrKeys
 * @param {boolean} useSync true to use chrome.storage.sync, otherwise will use
 * chrome.storage.local
 *
 * @return {Promise} Promise that resolves with an object of key value mappings
 */
exports.get = function(keyOrKeys, useSync) {
  var storageArea = getStorageArea(useSync);
  return new Promise(function(resolve) {
    storageArea.get(keyOrKeys, function(items) {
      resolve(items);
    });
  });
};

/**
 * @param {string|Array<string>} keyOrKeys
 * @param {boolean} useSync true to use chrome.storage.sync, otherwise will use
 * chrome.storage.local
 *
 * @return {Promise} Promise that resolves with an integer of the number of
 * bytes in use for the given key or keys
 */
exports.getBytesInUse = function(keyOrKeys, useSync) {
  var storageArea = getStorageArea(useSync);
  return new Promise(function(resolve) {
    storageArea.getBytesInUse(keyOrKeys, function(numBytes) {
      resolve(numBytes);
    });
  });
};

/**
 * @param {object} items an object of key value mappings
 * @param {boolean} useSync true to use chrome.storage.sync, otherwise will use
 * chrome.storage.local
 *
 * @return {Promise} Promise that resolves when the operation completes
 */
exports.set = function(items, useSync) {
  var storageArea = getStorageArea(useSync);
  return new Promise(function(resolve) {
    storageArea.set(items, function() {
      resolve();
    });
  });
};

/**
 * @param {string|Array<string>} keyOrKeys
 * @param {boolean} useSync true to use chrome.storage.sync, otherwise will use
 * chrome.storage.local
 *
 * @return {Promise} Promise that resolves when the operation completes
 */
exports.remove = function(keyOrKeys, useSync) {
  var storageArea = getStorageArea(useSync);
  return new Promise(function(resolve) {
    storageArea.remove(keyOrKeys, function() {
      resolve();
    });
  });
};

/**
 * @param {boolean} useSync true to use chrome.storage.sync, otherwise will use
 * chrome.storage.local
 *
 * @return {Promise} Promise that resolves when the operation completes
 */
exports.clear = function(useSync) {
  var storageArea = getStorageArea(useSync);
  return new Promise(function(resolve) {
    storageArea.clear(function() {
      resolve();
    });
  });
};

},{}],2:[function(require,module,exports){
/* global chrome */
'use strict';

/**
 * Promise-ified wrappers around the chrome.tabs API.
 */

exports.query = function(queryArg) {
  return new Promise(function(resolve) {
    chrome.tabs.query(queryArg, function(tab) {
      resolve(tab);
    });
  });
};

exports.create = function(createArg) {
  chrome.tabs.create(createArg);
};

},{}],3:[function(require,module,exports){
'use strict';

var common = require('./common');
var tabs = require('./chrome-apis/tabs');

var MSG_SAVE_FAIL = 'Your direct was not saved: ';
var MSG_SAVE_SUCCESS = 'Your redirect was created!<br>';
var MSG_BAD_KEY = 'Redirects must be alphanumeric.';

/**
 * The ID of the element that into which the user inputs a direct label. This
 * should be the same in all html (eg settings and popup) to allow us to use
 * the same selector code.
 */
var ID_INPUT_REDIRECT = 'inputval';

/**
 * Returns the user-entered value from the UI. This is not validated or
 * checked, but just pulled directly from the UI.
 */
exports.getRedirectLabelFromUi = function() {
    var result = document.getElementById(ID_INPUT_REDIRECT).value;
    return result;
};

/**
 * Validates that the redirect can be saved and saves the redirect, updating
 * the UI with the appropriate message.
 *
 * @param {String} redirect
 */
exports.validateAndSaveRedirect = function(redirect) {
    if (common.keyExists(redirect)) { 
      // TODO: somehthing here?    
    } else {
      if (!common.isValidKey(redirect)) {
        exports.alertIsInvalidKey();
        return;
      }
      common.getUrlOfCurrentTab()
      .then(url => {
        common.saveRedirect(redirect, url);
      });
    }
};

/**
 * Open the settings page.
 */
exports.openSettings = function() {
  tabs.create({ url: 'settings.html' });
};

/**
 * Sets msg to be displayed to the user. If msg is not truthy, does nothing.
 * This uses .innerHTML, permitting styling, but also requiring the caller to
 * escape the message as necessary.
 *
 * This function expects confirmation to occur in an element with the id
 * '_confirmation'. The underscore is important as it is illegal in keys,
 * ensuring that keys are safe to use as id values in HTML elements.
 */
exports.setMessage = function(msg) {
  if (!msg) {
    console.log('untruthy str passed to setMessage: ' + msg);
    return;
  }
  document.getElementById('_confirmation').innerHTML = msg;
};

exports.alertIsInvalidKey = function() {
  exports.setMessage(MSG_BAD_KEY);
};

exports.setSaveMessageSuccess = function(key, value) {
  exports.setMessage(MSG_SAVE_SUCCESS + key + ' → ' + value);
};

exports.setSaveMessageError = function(error) {
  exports.setMessage(MSG_SAVE_FAIL + error);
};

},{"./chrome-apis/tabs":2,"./common":"common"}],4:[function(require,module,exports){
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

},{"./chrome-apis/storage":1,"./common":"common","./common-ui":3}],"common":[function(require,module,exports){
/* global console, chrome, localStorage */
'use strict';

var chromeStorage = require('./chrome-apis/storage');
var tabs = require('./chrome-apis/tabs');

// Functions shared between pages.

// The key in the key value store under which the version is saved. It is
// important to note the leading underscore, which prevents collisions with
// user-defined redirects (at least as of alphanumeric checking introduced in
// 1.1.0).
var VERSION_KEY = '_version';

// A string representing the current version. Should be incremented with each
// release.
exports.VERSION = '1.2.1';

// The error code when trying to access local storage.
exports.ERROR_FLAG = -1;

/**
 * Returns true if str is a valid key, else returns false.
 */
exports.isValidKey = function(str){
  if (!str) {
    // null, '', and undefined checking. Must be truthy.
    return false;
  }
  var alphanumericRegex = /^[a-zA-Z0-9]+$/;
  return alphanumericRegex.test(str);
};

/**
 * Save the redirect. It is the caller's responsibility to ensure that the
 * key is valid and safe for storage.
 *
 * @return {Promise} Promise that resolves when the write completes
 */
exports.saveRedirect = function(key, value) {
  var keyValue = {};
  keyValue[key] = value;
  return chrome.set(keyValue);
};

/**
 * Delete the given redirect.
 *
 * @return {Promise} Promise that resolves when the delete completes
 */
exports.removeRedirect = function(redirect) {
  return new Promise(function(resolve) {
    chromeStorage.remove(redirect)
    .then(() => {
      resolve();
    });
  });
};

/**
 * Returns the version saved in storage. callback is invoked on completion.
 * It accounts for three cases with (parameters).
 *
 * 1) Success and an existing version (version_string)
 * 2) Success and no prior existing version (null)
 * --This will only occur when upgrading from 1.0.2
 * 3) Error (-1, error_msg)
 * --The error warning is defined by ERROR_FLAG, and in this example is -1
 *
 * @return {Promise} Promise that resolves with the saved value or null if no
 * value is present
 */
exports.getSavedVersion = function() {
  return new Promise(function(resolve) {
    chromeStorage.get(VERSION_KEY)
    .then(items => {
      if (items.hasOwnProperty(VERSION_KEY)) {
        // We have a previous version saved.
        resolve(items[VERSION_KEY]);
      } else {
        // No previous version was saved in storage.
        resolve(null);
      }
    });
  });
};

/**
 * Returns true if the key is not a redirect but a key private to the
 * extension machinery. This gives Redirect a way to store values that were
 * not created by users (e.g. a version string) in storage. Returns false if
 * not a private key or if key isn't truthy.
 */
exports.isPrivateKey = function(key) {
  if (key) {
    // We are assuming private keys start with a leading underscore.
    return key.startsWith('_');
  } else {
    console.log('key passed to isPrivateKey() was not truthy: ' + key);
    return false;
  }
};

/**
 * @return {Promise} returns a Promise with the active Tab object. Rejects if a
 * tab isn't active.
 */
exports.getCurrentTab = function() {
  return new Promise(function(resolve, reject) {
    tabs.query({ active: true })
    .then(tabs => {
      if (tabs.length > 0) {
        resolve(tabs[0]);
      } else {
        reject('No active tab');
      }
    });
  });
};

/**
 * Get the URL of the current tab.
 *
 * @return {Promise} Promise that resolves with a string URL of the current tab
 */
exports.getUrlOfCurrentTab = function () {
  return new Promise(function(resolve) {
    exports.getCurrentTab()
    .then(tab => {
      resolve(tab.url);
    });
  });
};

/**
 * Get any redirects that exist for the given URL. Resolves an empty array if
 * no redirects exist.
 *
 * @return {Promise} Promise that resolves with an Array of strings
 */
exports.getExistingRedirects = function(url) {
  return new Promise(function(resolve) {
    var result = [];
    chromeStorage.get(null)
    .then(items => {
      for (var key in items) {
        // check hasOwnProperty to make sure it's a key and doesn't come from the
        // prototype
        if (items.hasOwnProperty(key) && !exports.isPrivateKey(key)) {
          if (url === items[key]) {
            result.push(key);
          }
        }
      }
      resolve(result);
    });
  });
};

/**
 * Performs a version upgrade.
 */
function upgrade() {
  exports.getSavedVersion(function(version, errMsg) {
    if (version === exports.errorFlag) {
      console.log('An error occurred during upgrade attempt: ' + errMsg);
      return;
    }
    if (version === null) {
      // Upgrading from 1.0.2, which did not have a version saved.
      // Copy all keys from local storage.
      var keyValues = {};
      for (var key in localStorage) {
        keyValues[key] = localStorage[key];
      }
      // At this point we want to write the redirects to sync storage. After
      // that has completed, we want to add the version key to sync storage.
      // chrome.storage.sync.set() can fail during write, at which point we
      // might be left in an indeterminate state. This will be compounded if
      // using pub.saveRedirect(), which saves a single key at a time.
      // Instead we are going to call the storage API directly.
      chrome.storage.sync.set(keyValues, function() {
        if (chrome.runtime.lastError) {
          console.log('Error occurred during upgrade attempt. ' +
            'Upgrade was not completed: ' +
            chrome.runtime.lastError);
        } else {
          var versionInfo = {};
          versionInfo[VERSION_KEY] = exports.version;
          chrome.storage.sync.set(versionInfo, function() {
            if (chrome.runtime.lastError) {
              console.log('Version could not be written to storage: ' +
                chrome.runtime.lastError);
            } else {
              console.log('Upgraded to ' + exports.version + '!');
            }
          });
        }
      });
    }
  });
}

// Every time this script is loaded, attempt an upgrade.
// TODO: move this to a more appropriate place
upgrade();

},{"./chrome-apis/storage":1,"./chrome-apis/tabs":2}]},{},[4]);
