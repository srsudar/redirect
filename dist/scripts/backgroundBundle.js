require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* global chrome */
'use strict';

var bgModule = require('./backround-module');

// This event is fired each time the user updates the text in the omnibox,
// as long as the extension's keyword mode is still active.
chrome.omnibox.onInputChanged.addListener(bgModule.omniboxOnChangedListener);

// This event is fired when the user accepts the input in the omnibox.
// It opens the redirect that the user-given key maps to. 
chrome.omnibox.onInputEntered.addListener(
  bgModule.omniboxOnInputEnteredListener
);

},{"./backround-module":2}],2:[function(require,module,exports){
'use strict';

var common = require('./common');
var omnibox = require('./chrome-apis/omnibox');
var tabs = require('./chrome-apis/tabs');

exports.omniboxOnChangedListener = function(text) {
  return new Promise(function(resolve) {
    common.getUrlForRedirect(text)
    .then(url => {
      if (url) {
        // We found something.
        omnibox.setDefaultSuggestion(
          { 'description' : 'Redirecting you to: ' + url }
        );
      } else {
        // Nothing was found.
        omnibox.setDefaultSuggestion(
          { 'description' : 'No redirect found.' }
        );
      }
      resolve();
    });
  });
};

exports.omniboxOnInputEnteredListener = function(text) {
  return new Promise(function(resolve) {
    common.getUrlForRedirect(text)
    .then(url => {
      if (url) {
        tabs.update({ url: url });
      }
      resolve();
    });
  });
};

},{"./chrome-apis/omnibox":3,"./chrome-apis/tabs":5,"./common":"common"}],3:[function(require,module,exports){
/* global chrome */
'use strict';

/**
 * Wrappers around the chrome.omnibox APIs.
 */

exports.setDefaultSuggestion = function(suggestionObj) {
  chrome.omnibox.setDefaultSuggestion(suggestionObj);
};

},{}],4:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){
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

},{}],"common":[function(require,module,exports){
/* global console, localStorage */
'use strict';

var chromeStorage = require('./chrome-apis/storage');
var tabs = require('./chrome-apis/tabs');

// Functions shared between pages.

// The key in the key value store under which the version is saved. It is
// important to note the leading underscore, which prevents collisions with
// user-defined redirects (at least as of alphanumeric checking introduced in
// 1.1.0).
exports.VERSION_KEY = '_version';

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
 * @param {String} redirect the user-provided label. Should have been validated
 * as legal
 * @param {String} targetUrl the URL the redirect points to
 *
 * @return {Promise} Promise that resolves when the write completes
 */
exports.saveRedirect = function(redirect, targetUrl) {
  var keyValue = {};
  keyValue[redirect] = targetUrl;
  return chromeStorage.set(keyValue);
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
 *
 * @return {Promise} Promise that resolves with the saved value or null if no
 * value is present
 */
exports.getSavedVersion = function() {
  return new Promise(function(resolve) {
    chromeStorage.get(exports.VERSION_KEY)
    .then(items => {
      if (items.hasOwnProperty(exports.VERSION_KEY)) {
        // We have a previous version saved.
        resolve(items[exports.VERSION_KEY]);
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
        reject({ msg: 'No active tab' });
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
 * Gets the URL matching the given redirect.
 *
 * @param {String} redirect
 *
 * @return {Promise} Promise that resolves with the String URL or null if this
 * redirect does not exist
 */
exports.getUrlForRedirect = function(redirect) {
  return new Promise(function(resolve) {
    chromeStorage.get(redirect)
    .then(keyValue => {
      var url = keyValue[redirect];
      if (url) {
        resolve(url);
      } else {
        resolve(null);
      }
    });
  });
};

/**
 * Resolves true if a redirect exists with this value, else resolves false.
 *
 * @param {String} redirect a redirect, eg gmail
 *
 * @return {Promise} Promise that resolves with true or false
 */
exports.redirectExists = function(redirect) {
  return new Promise(function(resolve) {
    exports.getUrlForRedirect(redirect)
    .then(url => {
      if (url) {
        resolve(true);
      } else {
        resolve(false);
      }
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
// upgrade();

},{"./chrome-apis/storage":4,"./chrome-apis/tabs":5}]},{},[1]);
