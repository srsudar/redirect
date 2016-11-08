'use strict';
var tape = require('tape');
var sinon = require('sinon');
var proxyquire = require('proxyquire');
require('sinon-as-promised');

var common = require('../../app/scripts/common');

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
    t.end();
  });
});
