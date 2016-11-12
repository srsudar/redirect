/* global chrome */
'use strict';

/**
 * Wrappers around the chrome.omnibox APIs.
 */

exports.setDefaultSuggestion = function(suggestionObj) {
  chrome.omnibox.setDefaultSuggestion(suggestionObj);
};
