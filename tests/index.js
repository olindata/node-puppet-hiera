'use strict';

var fs, path, async, chai, j2y, hiera, assert, fixture;

fs      = require('fs');
path    = require('path');
async   = require('async');
chai    = require('chai');
j2y     = require('json2yaml');
hiera   = require('../index');
assert  = chai.assert;

fixture = {
  configFile : __dirname + '/hiera.yaml',
  nonFile    : '/file/does/not/exist.yaml',

  config     : {
    ':backends'  : [ 'yaml', 'gpg' ],
    ':hierarchy' : [ 'defaults', 'common' ],
    ':yaml'      : { ':datadir' : __dirname + '/yaml' },
    ':gpg'       : { ':datadir' : __dirname + '/gpg' }
  },

  hiera     : {
    yaml : {
      file : __dirname + '/yaml/defaults.yaml',
      data : {
        akey : 'somedata'
      }
    },

    gpg : {
      file : __dirname + '/gpg/defaults.yaml',
      data : {
        akey : 'somedata'
      }
    }
  }
};

suite('puppet-hiera', function () {
  before(function (done) {
    async.series([
      function (cb) {
        fs.mkdir(fixture.config[':yaml'][':datadir'], cb);
      },

      function (cb) {
        fs.writeFile(
          fixture.hiera.yaml.file,
          j2y.stringify(fixture.hiera.yaml.data),
          cb
        );
      },

      function (cb) {
        fs.mkdir(fixture.config[':gpg'][':datadir'], cb);
      },

      function (cb) {
        fs.writeFile(
          fixture.hiera.gpg.file,
          j2y.stringify(fixture.hiera.gpg.data),
          cb
        );
      },

      function (cb) {
        fs.writeFile(
          fixture.configFile,
          j2y.stringify(fixture.config),
          cb
        );
      }
    ], done);
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
        assert.propertyVal(err, 'errno', -2);
        assert.propertyVal(err, 'code', 'ENOENT');


        done();
      });
    });
  });

  suite('#saveConfig()', function () {
    test('saves configuration', function (done) {
      hiera.saveConfig(
        fixture.configFile,
        fixture.config,
        function (err) {
          assert.isNull(err);

          done();
        }
      );
    });
  });

  suite('#getHierarchy', function () {
    test('gets the hierarchy order', function (done) {
      hiera.getHierarchy(
        fixture.configFile,
        function (err, hierarchy) {
          assert.isNull(err);
          assert.isNotNull(hierarchy);

          done();
        }
      );
    });
  });

  suite('#getBackends', function () {
    test('gets supported backends', function (done) {
      hiera.getBackends(
        fixture.configFile,
        function (err, backends) {
          assert.isNull(err);
          assert.isNotNull(backends);

          done();
        }
      );
    });
  });

  suite('#getBackendConfig', function () {
    test('gets configuration for a specific backend', function (done) {
      hiera.getBackendConfig(
        fixture.configFile, 'yaml',
        function (err, backend) {
          assert.isNull(err);
          assert.isNotNull(backend);

          done();
        }
      );
    });
  });

  suite('#getFile', function () {
    test('gets key-value data from a Hiera file', function (done) {
      hiera.getFile(
        fixture.configFile, 'yaml',
        path.basename(fixture.hiera.yaml.file),
        function (err, data) {
          assert.isNull(err);
          assert.isNotNull(data);

          done();
        }
      );
    });
  });

  suite('#saveFile', function () {
    test('saves key-value data to a Hiera file', function (done) {
      hiera.saveFile(
        fixture.configFile, 'yaml',
        path.basename(fixture.hiera.yaml.file),
        j2y.stringify(fixture.hiera.yaml.data),
        function (err) {
          assert.isNull(err);

          done();
        }
      );
    });
  });

  after(function (done) {
    async.series([
      function (cb) {
        fs.unlink(fixture.hiera.yaml.file, cb);
      },

      function (cb) {
        fs.unlink(fixture.hiera.gpg.file, cb);
      },

      function (cb) {
        fs.rmdir(fixture.config[':yaml'][':datadir'], cb);
      },

      function (cb) {
        fs.rmdir(fixture.config[':gpg'][':datadir'], cb);
      },

      function (cb) {
        fs.unlink(fixture.configFile, cb);
      }
    ], done);
  });
});
