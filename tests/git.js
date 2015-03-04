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
    ':hierarchy' : [ 'teams', 'common', 'defaults' ],
    ':yaml'      : { ':datadir' : __dirname + '/yaml' },
    ':gpg'       : { ':datadir' : __dirname + '/gpg' }
  },

  hiera     : {
    yaml : [
      {
        file : __dirname + '/yaml/teams.yaml',
        data : {
          akey : 'teamsAKey'
        }
      },

      {
        file : __dirname + '/yaml/common.yaml',
        data : {
          akey : 'commonAKey',
          bkey : 'commonBKey'
        }
      },

      {
        file : __dirname + '/yaml/defaults.yaml',
        data : {
          akey : 'defaultsAKey',
          bkey : 'defaultsBKey',
          ckey : 'defaultsCKey'
        }
      }
    ],

    gpg : [
      {
        file : __dirname + '/gpg/defaults.yaml',
        data : {
          akey : 'somedata'
        }
      }
    ]
  }
};

suite('puppet-hiera', function () {
  before(function (done) {
    async.series([
      function createYamlDir(cb) {
        fs.mkdir(fixture.config[':yaml'][':datadir'], cb);
      },

      function createYaml(cb) {
        var tasks = [];

        fixture.hiera.yaml.each(function (item) {
          tasks.push(function (cb) {
            fs.writeFile(
              item.file,
              j2y.stringify(item.data),
              cb
            );
          });
        });

        async.parallel(tasks, cb);
      },

      function createGpgDir(cb) {
        fs.mkdir(fixture.config[':gpg'][':datadir'], cb);
      },

      function createGpg(cb) {
        var tasks = [];

        fixture.hiera.gpg.each(function (item) {
          tasks.push(function (cb) {
            fs.writeFile(
              item.file,
              j2y.stringify(item.data),
              cb
            );
          });
        });

        async.parallel(tasks, cb);
      },

      function createHieraConfigFile(cb) {
        fs.writeFile(
          fixture.configFile,
          j2y.stringify(fixture.config),
          cb
        );
      }
    ], done);
  });

  suite('#init() git adapter', function () {
    test('initializes Hiera module', function (done) {
      hiera.init('git', {
        configFile : fixture.configFile,
        repo       : '/home/rajkissu/Downloads/hiera-test/.git',
        signature  : [ 'Raj Kissu', 'rajkissu@gmail.com', 123456789, 60 ]
      });
      done();
    });
  });

  suite('#getConfig()', function () {
    test('retrieves configuration', function (done) {
      hiera.getConfig(function (err, config) {
        assert.isNull(err);
        assert.isNotNull(config);

        assert.isArray(config[':backends'], 'Hiera backends is a collection of backends');
        assert.notEqual(0, config[':backends'].length, 'Hiera contains at least one backend');

        done();
      });
    });
  });

  suite('#saveConfig()', function () {
    test('saves configuration', function (done) {
      hiera.saveConfig(
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
        'yaml', function (err, backend) {
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
        'yaml',
        path.basename(fixture.hiera.yaml[0].file),
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
        'yaml',
        path.basename(fixture.hiera.yaml[0].file),
        j2y.stringify(fixture.hiera.yaml[0].data),
        function (err) {
          assert.isNull(err);

          done();
        }
      );
    });
  });

  suite('#getOverrides', function () {
    test('returns overriding keys if present', function (done) {
      hiera.getOverrides(
        'yaml',
        path.basename(fixture.hiera.yaml.last().file),
        function (err, overrides) {
          assert.isNull(err);
          assert.isNotNull(overrides);
          assert.isObject(overrides);

          done();
        }
      );
    });
  });

  after(function (done) {
    async.series([
      function removeYaml(cb) {
        var tasks = [];

        fixture.hiera.yaml.each(function (item) {
          tasks.push(function (cb) {
            fs.unlink(item.file, cb);
          });
        });

        async.parallel(tasks, cb);
      },

      function removeGpg(cb) {
        var tasks = [];

        fixture.hiera.gpg.each(function (item) {
          tasks.push(function (cb) {
            fs.unlink(item.file, cb);
          });
        });

        async.parallel(tasks, cb);
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
