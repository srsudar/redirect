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
