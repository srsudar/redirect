'use strict';

var tape = require('tape');
var sinon = require('sinon');
var proxyquire = require('proxyquire');
require('sinon-as-promised');

var commonUi = require('../../app/scripts/common-ui');

/**
 * Manipulating the object directly leads to polluting the require cache. Any
 * test that modifies the required object should call this method to get a
 * fresh version
 */
function resetCommonUi() {
  delete require.cache[
    require.resolve('../../app/scripts/common-ui')
  ];
  commonUi = require('../../app/scripts/common-ui');
}

tape('openSettings calls create', function(t) {
  var expectedCreateArg = { url: 'settings.html' };
  var createStub = sinon.stub();

  commonUi = proxyquire(
    '../../app/scripts/common-ui',
    {
      './chrome-apis/tabs': {
        create: createStub
      }
    }
  );

  commonUi.openSettings();
  t.deepEqual(createStub.args[0], [expectedCreateArg]);
  resetCommonUi();
  t.end();
});

tape('alertIsInvalidKey calls setMessage', function(t) {
  var setMessageStub = sinon.stub();
  commonUi.setMessage = setMessageStub;

  commonUi.alertIsInvalidKey();
  t.deepEqual(setMessageStub.args[0], [commonUi.MSG_BAD_KEY]);
  resetCommonUi();
  t.end();
});

tape('setSaveMessageSuccess sets message', function(t) {
  var setMessageStub = sinon.stub();
  commonUi.setMessage = setMessageStub;

  var redirect = 'gm';
  var url = 'https://www.gmail.com';

  var expectedMessage = commonUi.MSG_SAVE_SUCCESS + redirect + ' → ' + url;

  commonUi.setSaveMessageSuccess(redirect, url);

  t.deepEqual(setMessageStub.args[0], [expectedMessage]);
  resetCommonUi();
  t.end();
});

tape('setSaveMessageError calls with error', function(t) {
  var setMessageStub = sinon.stub();
  commonUi.setMessage = setMessageStub;
  var error = 'went wrong';
  
  var expectedMessage = commonUi.MSG_SAVE_FAIL + error;

  commonUi.setSaveMessageError(error);
  t.deepEqual(setMessageStub.args[0], [expectedMessage]);
  resetCommonUi();
  t.end();
});

tape('saveRedirectWithOverwrite validates key and fails', function(t) {
  var redirect = 'f-w';
  var url = 'feedwrangler';

  var isValidKeyStub = sinon.stub().returns(false);
  var saveRedirectStub = sinon.stub().resolves();
  var alertIsInvalidKeyStub = sinon.stub();

  commonUi = proxyquire(
    '../../app/scripts/common-ui',
    {
      './common': {
        isValidKey: isValidKeyStub,
        saveRedirect: saveRedirectStub
      }
    }
  );
  commonUi.alertIsInvalidKey = alertIsInvalidKeyStub;

  commonUi.saveRedirectWithOverwrite(redirect, url);
  t.equal(saveRedirectStub.callCount, 0);
  t.deepEqual(isValidKeyStub.args[0], [redirect]);
  t.equal(alertIsInvalidKeyStub.callCount, 1);
  resetCommonUi();
  t.end();
});

tape('saveRedirectWithOverwrite validates key and succeeds', function(t) {
  var redirect = 'fw';
  var url = 'feedwrangler';

  var isValidKeyStub = sinon.stub().returns(true);
  var saveRedirectStub = sinon.stub().resolves();

  commonUi = proxyquire(
    '../../app/scripts/common-ui',
    {
      './common': {
        isValidKey: isValidKeyStub,
        saveRedirect: saveRedirectStub
      }
    }
  );

  commonUi.saveRedirectWithOverwrite(redirect, url);
  t.deepEqual(saveRedirectStub.args[0], [redirect, url]);
  t.deepEqual(isValidKeyStub.args[0], [redirect]);
  resetCommonUi();
  t.end();
});

tape('validateAndSaveRedirect handles existing redirect', function(t) {
  var redirect = 'fw';
  var url = 'feedwrangler';

  var isValidKeyStub = sinon.stub().returns(true);
  var saveRedirectStub = sinon.stub().resolves();
  var alertRedirectExistsStub = sinon.stub();
  var alertIsInvalidKeyStub = sinon.stub();
  var redirectExistsStub = sinon.stub().resolves(true);

  commonUi = proxyquire(
    '../../app/scripts/common-ui',
    {
      './common': {
        isValidKey: isValidKeyStub,
        saveRedirect: saveRedirectStub,
        redirectExists: redirectExistsStub
      }
    }
  );
  commonUi.alertRedirectExists = alertRedirectExistsStub;

  commonUi.validateAndSaveRedirect(redirect, url)
  .then(() => {
    t.deepEqual(isValidKeyStub.args[0], [redirect]);
    t.deepEqual(redirectExistsStub.args[0], [redirect]);
    t.equal(alertIsInvalidKeyStub.callCount, 0);
    t.equal(alertRedirectExistsStub.callCount, 1);
    t.equal(saveRedirectStub.callCount, 0);
    resetCommonUi();
    t.end();
  });
});

tape('validateAndSaveRedirect handles invalid key', function(t) {
  var redirect = 'f-w';
  var url = 'feedwrangler';

  var isValidKeyStub = sinon.stub().returns(false);
  var saveRedirectStub = sinon.stub().resolves();
  var alertRedirectExistsStub = sinon.stub();
  var alertIsInvalidKeyStub = sinon.stub();
  var redirectExistsStub = sinon.stub().resolves();

  commonUi = proxyquire(
    '../../app/scripts/common-ui',
    {
      './common': {
        isValidKey: isValidKeyStub,
        saveRedirect: saveRedirectStub,
        redirectExists: redirectExistsStub
      }
    }
  );
  commonUi.alertRedirectExists = alertRedirectExistsStub;
  commonUi.alertIsInvalidKey = alertIsInvalidKeyStub;

  commonUi.validateAndSaveRedirect(redirect, url)
  .then(() => {
    t.deepEqual(isValidKeyStub.args[0], [redirect]);
    t.equal(redirectExistsStub.callCount, 0);
    t.equal(alertIsInvalidKeyStub.callCount, 1);
    t.equal(alertRedirectExistsStub.callCount, 0);
    t.equal(saveRedirectStub.callCount, 0);
    resetCommonUi();
    t.end();
  });
});

tape('validateAndSaveRedirect calls save if valid', function(t) {
  var redirect = 'fw';
  var url = 'feedwrangler';

  var isValidKeyStub = sinon.stub().returns(true);
  var saveRedirectStub = sinon.stub().resolves();
  var alertRedirectExistsStub = sinon.stub();
  var alertIsInvalidKeyStub = sinon.stub();
  var redirectExistsStub = sinon.stub().resolves(false);

  commonUi = proxyquire(
    '../../app/scripts/common-ui',
    {
      './common': {
        isValidKey: isValidKeyStub,
        saveRedirect: saveRedirectStub,
        redirectExists: redirectExistsStub
      }
    }
  );
  commonUi.alertRedirectExists = alertRedirectExistsStub;

  commonUi.validateAndSaveRedirect(redirect, url)
  .then(() => {
    t.deepEqual(isValidKeyStub.args[0], [redirect]);
    t.deepEqual(redirectExistsStub.args[0], [redirect]);
    t.equal(alertIsInvalidKeyStub.callCount, 0);
    t.equal(alertRedirectExistsStub.callCount, 0);
    t.equal(saveRedirectStub.callCount, 1);
    t.deepEqual(saveRedirectStub.args[0], [redirect, url]);
    resetCommonUi();
    t.end();
  });
});
