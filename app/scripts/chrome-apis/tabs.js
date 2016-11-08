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
