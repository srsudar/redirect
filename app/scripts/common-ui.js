'use strict';

var common = require('./common');
var tabs = require('./chrome-apis/tabs');

exports.MSG_SAVE_FAIL = 'Your direct was not saved: ';
exports.MSG_SAVE_SUCCESS = 'Your redirect was created!<br>';
exports.MSG_BAD_KEY = 'Redirects must be alphanumeric.';

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

exports.alertRedirectExists = function(redirect) {
  // TODO
};

/**
 * Validates that the redirect is not illegal and saves the redirect. Unlike
 * validateAndSaveRedirect(), this function saves even if an existing redirect
 * will be overwritten.
 *
 * @param {String} redirect
 * @param {String} url
 *
 * @return {Promise} Promise that resolves when the operation completes
 */
exports.saveRedirectWithOverwrite = function(redirect, url) {
  return new Promise(function(resolve) {
    if (!common.isValidKey(redirect)) {
      exports.alertIsInvalidKey();
      resolve();
      return;
    }
    // Since we're allowing overwrites, just save it straight away.
    common.saveRedirect(redirect, url)
    .then(() => {
      resolve();
    });
  });
};

/**
 * Validates that the redirect can be saved and saves the redirect, updating
 * the UI with the appropriate message. This is the main entrypoint into saving
 * a redirect. It essentially follows this logic:
 * 
 * Is this a valid key? If not, alert saying invalid key.
 *
 * Does a redirect exist for this key? If so, alert saying are you sure you
 * want to overwrite?
 *
 * If the previous two checks pass, save the redirect.
 *
 * @param {String} redirect
 * @param {String} url
 *
 * @return {Promise} Promise that resolves when the method completes
 */
exports.validateAndSaveRedirect = function(redirect, url) {
  return new Promise(function(resolve) {
    // Is this a valid redirect?
    if (!common.isValidKey(redirect)) {
      exports.alertIsInvalidKey();
      resolve();
      return;
    }
    // Will this overwrite an existing key?
    common.redirectExists(redirect)
    .then(exists => {
      if (exists) {
        exports.alertRedirectExists(redirect);
        resolve();
        return;
      } else {
        return common.saveRedirect(redirect, url);
      }
    })
    .then(() => {
      resolve();
    });
  });
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
  exports.setMessage(exports.MSG_BAD_KEY);
};

exports.setSaveMessageSuccess = function(key, value) {
  exports.setMessage(exports.MSG_SAVE_SUCCESS + key + ' → ' + value);
};

exports.setSaveMessageError = function(error) {
  exports.setMessage(exports.MSG_SAVE_FAIL + error);
};
