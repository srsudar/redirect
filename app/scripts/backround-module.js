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
