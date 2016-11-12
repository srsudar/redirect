'use strict';
var tape = require('tape');
var sinon = require('sinon');
var proxyquire = require('proxyquire');
require('sinon-as-promised');

var common = require('../../app/scripts/common');

/**
 * Manipulating the object directly leads to polluting the require cache. Any
 * test that modifies the required object should call this method to get a
 * fresh version
 */
function resetCommon() {
  delete require.cache[
    require.resolve('../../app/scripts/common')
  ];
  common = require('../../app/scripts/common');
}

tape('isValidKey false if starts with punctuation', function(t) {
  var badKey1 = '_hello';
  var badKey2 = '-hello';

  t.false(common.isValidKey(badKey1));
  t.false(common.isValidKey(badKey2));

  t.end();
});

tape('isValidKey false if middle punctuation', function(t) {
  var badKey1 = 'hel-lo';
  var badKey2 = 'hel_lo';

  t.false(common.isValidKey(badKey1));
  t.false(common.isValidKey(badKey2));

  t.end();
});

tape('isValidKey false if end punctuation', function(t) {
  var badKey1 = 'hello_';
  var badKey2 = 'hello-';

  t.false(common.isValidKey(badKey1));
  t.false(common.isValidKey(badKey2));

  t.end();
});

tape('isPrivateKey true if starts with underscore', function(t) {
  var isPrivate = '_foo';

  t.true(common.isPrivateKey(isPrivate));
  t.end();
});

tape('isPrivateKey false if does not start with underscore', function(t) {
  var isNotPrivate = 'foo';

  t.false(common.isPrivateKey(isNotPrivate));
  t.end();
});

tape('saveRedirect calls chrome.set', function(t) {
  var setStub = sinon.stub().resolves();

  common = proxyquire(
    '../../app/scripts/common',
    {
      './chrome-apis/storage': {
        set: setStub
      }
    }
  );

  var redirect = 'gmail';
  var targetUrl = 'https://www.gmail.com';

  var expected = {};
  expected[redirect] = targetUrl;

  common.saveRedirect(redirect, targetUrl)
  .then(() => {
    // We don't expect anything passed to resolve
    t.deepEqual(setStub.args[0], [expected]);
    resetCommon();
    t.end();
  });
});

tape('removeRedirect calls remove', function(t) {
  var redirect = 'removeMe';

  var removeStub = sinon.stub().resolves();

  common = proxyquire(
    '../../app/scripts/common',
    {
      './chrome-apis/storage': {
        remove: removeStub
      }
    }
  );
  
  common.removeRedirect(redirect)
  .then(() => {
    t.deepEqual(removeStub.args[0], [redirect]);
    resetCommon();
    t.end();
  });
});

tape('getSavedVersion returns version if present', function(t) {
  var expected = '1.1.1';
  var getResult = {};
  getResult[common.VERSION_KEY] = expected;

  var getStub = sinon.stub().withArgs(common.VERSION_KEY).resolves(getResult);

  common = proxyquire(
    '../../app/scripts/common',
    {
      './chrome-apis/storage': {
        get: getStub
      }
    }
  );
  
  common.getSavedVersion()
  .then(actual => {
    t.equal(actual, expected);
    resetCommon();
    t.end();
  });
});

tape('getSavedVersion returns null if not present', function(t) {
  // {} if the key isn't found.
  var getStub = sinon.stub().withArgs(common.VERSION_KEY).resolves({});

  common = proxyquire(
    '../../app/scripts/common',
    {
      './chrome-apis/storage': {
        get: getStub
      }
    }
  );
  
  common.getSavedVersion()
  .then(actual => {
    t.equal(actual, null);
    resetCommon();
    t.end();
  });
});

tape('getCurrentTab resolves with tab object', function(t) {
  var expected = { thisIsA: 'tab' };
  var expectedQueryArg = { active: true };

  // We expect query to return an array of tabs.
  var queryStub = sinon.stub().resolves([expected]);

  common = proxyquire(
    '../../app/scripts/common',
    {
      './chrome-apis/tabs': {
        query: queryStub
      }
    }
  );

  common.getCurrentTab()
  .then(actual => {
    t.deepEqual(actual, expected);
    t.deepEqual(queryStub.args[0], [expectedQueryArg]);
    resetCommon();
    t.end();
  });
});

tape('getCurrentTab rejects if no active tabs', function(t) {
  // We expect an error message
  var expected = { msg: 'No active tab' };

  // We expect query to return an array of tabs.
  var queryStub = sinon.stub().resolves([]);

  common = proxyquire(
    '../../app/scripts/common',
    {
      './chrome-apis/tabs': {
        query: queryStub
      }
    }
  );

  common.getCurrentTab()
  .catch(actual => {
    t.deepEqual(actual, expected);
    resetCommon();
    t.end();
  });
});

tape('getUrlOfCurrentTab returns url property of tab', function(t) {
  var expected = 'https://www.gmail.com';
  
  common.getCurrentTab = sinon.stub().resolves({ url: expected });

  common.getUrlOfCurrentTab()
  .then(actual => {
    t.equal(actual, expected);
    resetCommon();
    t.end();
  });
});

tape('getExistingRedirects empty array if nothing saved', function(t) {
  var url = 'url';
  var expected = [];
  var getResult = {};

  var getStub = sinon.stub().resolves(getResult);

  common = proxyquire(
    '../../app/scripts/common',
    {
      './chrome-apis/storage': {
        get: getStub
      }
    }
  );

  common.getExistingRedirects(url)
  .then(actual => {
    t.deepEqual(actual, expected);
    t.deepEqual(getStub.args[0], [null]);
    resetCommon();
    t.end();
  });
});

tape('getExistingRedirects returns all for multiple', function(t) {
  var url = 'url';

  var redirect1 = 'foo';
  var redirect2 = 'bar';
  var getResult = {};
  getResult[redirect1] = url;
  getResult[redirect2] = url;

  // We don't know the order of the returned array, so we're going to use a Set
  // to perform our equals.
  var expectedAsSet = new Set();
  expectedAsSet.add(redirect1);
  expectedAsSet.add(redirect2);

  var getStub = sinon.stub().resolves(getResult);

  common = proxyquire(
    '../../app/scripts/common',
    {
      './chrome-apis/storage': {
        get: getStub
      }
    }
  );

  common.getExistingRedirects(url)
  .then(actual => {
    var actualAsSet = new Set();
    actual.forEach(element => {
      actualAsSet.add(element);
    });

    t.deepEqual(actualAsSet, expectedAsSet);
    t.deepEqual(getStub.args[0], [null]);
    resetCommon();
    t.end();
  });
});

tape('getUrlForRedirect resolves url if present', function(t) {
  var redirect = 'gmail';
  var getResult = {};
  var url = 'gmail.com';
  getResult[redirect] = url;

  var getStub = sinon.stub().resolves(getResult);

  common = proxyquire(
    '../../app/scripts/common',
    {
      './chrome-apis/storage': {
        get: getStub
      }
    }
  );

  common.getUrlForRedirect(redirect)
  .then(actual => {
    t.equal(actual, url);
    t.end();
  });
});

tape('getUrlForRedirect resolves null if not present', function(t) {
  var redirect = 'gmail';
  var getResult = {};

  var getStub = sinon.stub().resolves(getResult);

  common = proxyquire(
    '../../app/scripts/common',
    {
      './chrome-apis/storage': {
        get: getStub
      }
    }
  );

  common.getUrlForRedirect(redirect)
  .then(actual => {
    t.equal(actual, null);
    t.end();
  });
});

tape('redirectExists returns true', function(t) {
  var redirect = 'gmail';
  var url = 'gmail.com';

  var getUrlForRedirectStub = sinon.stub().resolves(url);
  common.getUrlForRedirect = getUrlForRedirectStub;

  common.redirectExists(redirect)
  .then(actual => {
    t.true(actual);
    resetCommon();
    t.end();
  });
});

tape('redirectExists returns false', function(t) {
  var redirect = 'gmail';

  var getUrlForRedirectStub = sinon.stub().resolves(null);
  common.getUrlForRedirect = getUrlForRedirectStub;

  common.redirectExists(redirect)
  .then(actual => {
    t.false(actual);
    resetCommon();
    t.end();
  });
});
