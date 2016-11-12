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
