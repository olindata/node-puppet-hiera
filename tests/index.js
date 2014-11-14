'use strict';

var fs, sinon, chai, j2y, hiera, assert, fixture;

fs      = require('fs');
sinon   = require('sinon');
chai    = require('chai');
j2y     = require('json2yaml');
hiera   = require('../index');
assert  = chai.assert;
fixture = {
  configFile : __dirname + '/fixtures/hiera.yaml',
  nonFile    : '/file/does/not/exist.yaml',

  config     : {
    ':backends'  : [ 'yaml', 'gpg' ],
    ':hierarchy' : [ 'defaults', 'common' ],
    ':yaml'      : { ':datadir' : '/etc/puppet/hieradata/yaml' },
    ':gpg'       : { ':datadir' : '/etc/puppet/hieradata/gpg' }
  }
};

suite('puppet-hiera', function () {
  before(function (done) {
    fs.writeFile(fixture.configFile, j2y.stringify(fixture.config), done);
  });

  suite('#getConfig()', function () {
    test('retrieves configuration', function (done) {
      hiera.getConfig(fixture.configFile, function (err, config) {
        assert.isNull(err);
        assert.isNotNull(config);

        assert.isArray(config[':backends'], 'Hiera backends is a collection of backends');
        assert.notEqual(0, config[':backends'].length, 'Hiera contains at least one backend');

        done();
      });
    });

    test('throws error when configuration file does not exist', function (done) {
      hiera.getConfig(fixture.nonFile, function (err) {
        assert.instanceOf(err, Error);
        assert.propertyVal(err, 'errno', 34);
        assert.propertyVal(err, 'code', 'ENOENT');

        done();
      });
    });
  });

  suite('#saveConfig()', function () {
    test('saves configuration', function (done) {
      hiera.saveConfig(fixture.configFile, fixture.config, function (err) {
        assert.isNull(err);

        done();
      });
    });
  });

  suite('#getHierarchy', function () {
    test('gets the hierarchy order', function (done) {
      hiera.getHierarchy(fixture.configFile, function (err, hierarchy) {
        assert.isNull(err);
        assert.isNotNull(hierarchy);

        done();
      });
    });
  });

  suite('#getBackends', function () {
    test('gets supported backends', function (done) {
      hiera.getBackends(fixture.configFile, function (err, backends) {
        assert.isNull(err);
        assert.isNotNull(backends);

        done();
      });
    });
  });

  suite('#getBackendConfig', function () {
    test('', function () {
    });
  });

  suite('#getFile', function () {
    test('', function () {
    });
  });

  suite('#saveFile', function () {
    test('', function () {
    });
  });

  after(function (done) {
    fs.unlink(fixture.configFile, done);
  });
});
