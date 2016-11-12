'use strict';
var tape = require('tape');
var sinon = require('sinon');
var proxyquire = require('proxyquire');
require('sinon-as-promised');

var bgModule = require('../../app/scripts/backround-module');

/**
 * Manipulating the object directly leads to polluting the require cache. Any
 * test that modifies the required object should call this method to get a
 * fresh version
 */
function resetBackgroundModule() {
  delete require.cache[
    require.resolve('../../app/scripts/backround-module')
  ];
  bgModule = require('../../app/scripts/backround-module');
}

function createSuggestionObj(description) {
  return { description: description };
}

tape('omniboxOnChangedListener sets suggestion for found url', function(t) {
  var redirect = 'gm';
  var url = 'gmail.com';
  var expectedSuggestion = createSuggestionObj('Redirecting you to: ' + url);

  var getUrlForRedirectStub = sinon.stub().resolves(url);
  var setDefaultSuggestionStub = sinon.stub();

  bgModule = proxyquire(
    '../../app/scripts/backround-module',
    {
      './common': {
        getUrlForRedirect: getUrlForRedirectStub
      },
      './chrome-apis/omnibox': {
        setDefaultSuggestion: setDefaultSuggestionStub
      }
    }
  );

  bgModule.omniboxOnChangedListener(redirect)
  .then(() => {
    t.deepEqual(getUrlForRedirectStub.args[0], [redirect]);
    t.deepEqual(setDefaultSuggestionStub.args[0], [expectedSuggestion]);
    resetBackgroundModule();
    t.end();
  });
});

tape('omniboxOnChangedListener sets suggestion for unknown', function(t) {
  var redirect = 'gm';
  var expectedSuggestion = createSuggestionObj('No redirect found.');

  var getUrlForRedirectStub = sinon.stub().resolves(null);
  var setDefaultSuggestionStub = sinon.stub();

  bgModule = proxyquire(
    '../../app/scripts/backround-module',
    {
      './common': {
        getUrlForRedirect: getUrlForRedirectStub
      },
      './chrome-apis/omnibox': {
        setDefaultSuggestion: setDefaultSuggestionStub
      }
    }
  );

  bgModule.omniboxOnChangedListener(redirect)
  .then(() => {
    t.deepEqual(getUrlForRedirectStub.args[0], [redirect]);
    t.deepEqual(setDefaultSuggestionStub.args[0], [expectedSuggestion]);
    resetBackgroundModule();
    t.end();
  });
});

tape('omniboxOnInputEnteredListener updates URL if exists', function(t) {
  var redirect = 'ex';
  var url = 'example.com';

  var getUrlForRedirectStub = sinon.stub().resolves(url);
  var updateStub = sinon.stub();

  bgModule = proxyquire(
    '../../app/scripts/backround-module',
    {
      './common': {
        getUrlForRedirect: getUrlForRedirectStub
      },
      './chrome-apis/tabs': {
        update: updateStub
      }
    }
  );

  bgModule.omniboxOnInputEnteredListener(redirect)
  .then(() => {
    t.deepEqual(getUrlForRedirectStub.args[0], [redirect]);
    t.deepEqual(updateStub.args[0], [{ url: url }]);
    resetBackgroundModule();
    t.end();
  });
});

tape('omniboxOnInputEnteredListener does nothing if not url', function(t) {
  var redirect = 'ex';

  var getUrlForRedirectStub = sinon.stub().resolves(null);
  var updateStub = sinon.stub();

  bgModule = proxyquire(
    '../../app/scripts/backround-module',
    {
      './common': {
        getUrlForRedirect: getUrlForRedirectStub
      },
      './chrome-apis/tabs': {
        update: updateStub
      }
    }
  );

  bgModule.omniboxOnInputEnteredListener(redirect)
  .then(() => {
    t.deepEqual(getUrlForRedirectStub.args[0], [redirect]);
    t.equal(updateStub.callCount, 0);
    resetBackgroundModule();
    t.end();
  });
});
