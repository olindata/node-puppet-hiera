/**
 * Library to interface with Puppet Hiera.
 *
 * @author rajkissu <rajkissu@gmail.com>
 */

/* jslint node: true */
'use strict';

var fs, path, async, yaml, j2y, git;

require('sugar');

fs    = require('fs');
path  = require('path');
async = require('async');
yaml  = require('js-yaml');
j2y   = require('json2yaml');
git   = require('nodegit');

var _repository, _signature, _oid;

_signature = git.Signature.create('Raj Kissu', 'rajkissu@gmail.com', 123456789, 60);

/**
 * Retrieves Hiera configuration.
 *
 * @param {string} configFile - the path to `hiera.yaml`.
 * @param {Function} cb - callback to invoke.
 *
 * @example getConfig('/path/to/hiera.yaml', cb);
 */
function getConfig(configFile, cb) {
  fs.readFile(configFile, 'utf8', function (err, data) {
    if (err) {
      cb(err);
      return;
    }

    cb(null, yaml.safeLoad(data));
  });
}

/**
 * Saves Hiera configuration to file.
 *
 * @param {string} configFile - the path to `hiera.yaml`.
 * @param {Object} data - an object loaded with hiera configuration.
 * @param {Function} cb - callback to invoke.
 *
 * @example saveConfig('/path/to/hiera.yaml', hieraConfig, cb);
 */
function saveConfig(configFile, data, cb) {
  fs.writeFile(configFile, j2y.stringify(data), function (err) {
    if (err) {
      cb(err);
      return;
    }

    git.Repository.open(path.resolve(__dirname, '/home/rajkissu/Downloads/hiera-test/.git'))
    .then(function (repo) {
      _repository = repo;

      return repo.openIndex();
    })
    .then(function (index) {
      index.read();
      index.addByPath('hiera.yaml');
      index.write();

      return index.writeTree();
    })
    .then(function (oid) {
      _oid = oid;

      return git.Reference.nameToId(_repository, 'HEAD');
    })
    .then(function (head) {
      return _repository.getCommit(head);
    })
    .then(function (parent) {
      return _repository.createCommit('HEAD', _signature, _signature, 'Saves hiera.yaml', _oid, [ parent ]);
    })
    .then(function () {
      return git.Remote.create(_repository, 'origin', 'git@github.com:rajkissu/hiera-test.git')
        .then(function (remote) {
          remote.connect(nodegit.Enums.DIRECTION.PUSH);

          var push;

          // We need to set the auth on the remote, not the push object
          remote.setCallbacks({
            credentials: function(url, userName) {
              return nodegit.Cred.sshKeyFromAgent(userName);
            }
          });

          // Create the push object for this remote
          return nodegit.Push.create(remote)
          .then(function(pushResult) {
            push = pushResult;

            // This just says what branch we're pushing onto what remote branch
            return push.addRefspec("refs/heads/master:refs/heads/master");
          }).then(function() {
            // This is the call that performs the actual push
            return push.finish();
          }).then(function() {
            // Check to see if the remote accepted our push request.
            return push.unpackOk();
          });
        });
    })
    .done(cb);
  });
}

/**
 * Gets the Hiera hierarchy.
 *
 * @param {string} configFile - the path to `hiera.yaml`.
 * @param {Function} cb - callback to invoke.
 *
 * @example getHierarchy('/path/to/hiera.yaml', cb);
 */
function getHierarchy(configFile, cb) {
  getConfig(configFile, function (err, config) {
    if (err) {
      cb(err);
      return;
    }

    cb(null, config[':hierarchy']);
  });
}

/**
 * Retrieves all Hiera backend configurations.
 *
 * @param {string} configFile - the path to `hiera.yaml`.
 * @param {Function} cb - callback to invoke.
 *
 * @example getBackends('/path/to/hiera.yaml', cb);
 */
function getBackends(configFile, cb) {
  getConfig(configFile, function (err, config) {
    if (err) {
      cb(err);
      return;
    }

    cb(null, config[':backends']);
  });
}

/**
 * Gets configuration for a specific backend.
 *
 * @param {string} configFile - the path to `hiera.yaml`.
 * @param {string} backend - the backend to load.
 * @param {Function} cb - callback to invoke.
 *
 * @example getBackendConfig('/path/to/hiera.yaml', 'yaml', cb);
 */
function getBackendConfig(configFile, backend, cb) {
  getConfig(configFile, function (err, config) {
    if (err) {
      cb(err);
      return;
    }

    cb(null, config[':' + backend]);
  });
}

/**
 * Retrieves data from a Hiera file.
 *
 * @param {string} configFile - the path to `hiera.yaml`.
 * @param {string} backend - the backend to load.
 * @param {string} file - the Hiera file to load.
 * @param {Function} cb - callback to invoke.
 *
 * @example getFile('/path/to/hiera.yaml', 'yaml', 'defaults.yaml', cb);
 */
function getFile(configFile, backend, file, cb) {
  getBackendConfig(configFile, backend, function (err, config) {
    file = [ config[':datadir'], '/', file ].join('');

    fs.readFile(file, 'utf8', cb);
  });
}

/**
 * Saves data to a Hiera file.
 *
 * @param {string} configFile - the path to `hiera.yaml`.
 * @param {string} backend - the backend to load.
 * @param {string} file - the Hiera file to save to.
 * @param {Object} data - contents to save to the Hiera file.
 * @param {Function} cb - callback to invoke once file saving completes.
 *
 * @example saveFile(
 *  '/path/to/hiera.yaml', 'gpg',
 *  '/path/to/file.gpg', fileData,
 *  function (err) { ... }
 * );
 */
function saveFile(configFile, backend, file, data, cb) {
  cb = typeof(cb) === 'function' ? cb : function () {};

  getBackendConfig(configFile, backend, function (err, config) {
    var datadir = config[':datadir'];
    file = path.join(datadir, file);

    fs.writeFile(file, data, 'utf8', cbfunction () {
      git.Repository.open(path.resolve(__dirname, '/home/rajkissu/Downloads/hiera-test/.git'))
      .then(function (repo) {
        _repository = repo;

        return repo.openIndex();
      })
      .then(function (index) {
        index.read();
        index.addByPath(file);
        index.write();

        return index.writeTree();
      })
      .then(function (oid) {
        _oid = oid;

        return git.Reference.nameToId(_repository, 'HEAD');
      })
      .then(function (head) {
        return _repository.getCommit(head);
      })
      .then(function (parent) {
        return _repository.createCommit('HEAD', _signature, _signature, 'Saves hiera.yaml', _oid, [ parent ]);
      })
      .then(function () {
        return git.Remote.create(_repository, 'origin', 'git@github.com:rajkissu/hiera-test.git')
          .then(function (remote) {
            remote.connect(nodegit.Enums.DIRECTION.PUSH);

            var push;

            // We need to set the auth on the remote, not the push object
            remote.setCallbacks({
              credentials: function(url, userName) {
                return nodegit.Cred.sshKeyFromAgent(userName);
              }
            });

            // Create the push object for this remote
            return nodegit.Push.create(remote)
            .then(function(pushResult) {
              push = pushResult;

              // This just says what branch we're pushing onto what remote branch
              return push.addRefspec("refs/heads/master:refs/heads/master");
            }).then(function() {
              // This is the call that performs the actual push
              return push.finish();
            }).then(function() {
              // Check to see if the remote accepted our push request.
              return push.unpackOk();
            });
          });
      })
      .done(cb);
    });
  });
}

/**
 * Check for hierarchy overrides for a given file.
 *
 * @param {string} configFile - the path to `hiera.yaml`.
 * @param {string} backend - the backend to load.
 * @param {string} file - the Hiera file to check overrides for.
 * @param {Function} cb - callback to invoke once override checking completes.
 *
 * @example getOverrides(
 *  '/path/to/hiera.yaml', 'gpg',
 *  '/path/to/file.gpg', function (err) { ... }
 * );
 */
function getOverrides(configFile, backend, file, cb) {
  async.parallel([
    function hierarchy(cb) {
      getHierarchy(configFile, cb);
    },

    function backendConfig(cb) {
      getBackendConfig(configFile, backend, cb);
    }
  ], function (err, results) {
    var hierarchy, datadir, filename, tasks,
        pos, searchHierarchy, tasks;

    hierarchy = results[0];
    datadir   = results[1][':datadir'];
    filename  = file.remove('.' + backend);
    tasks     = [];

    // remove the file's matching hierarchy
    pos = hierarchy.findIndex(filename);
    searchHierarchy = hierarchy.to(pos);

    getFile(configFile, backend, file, function (err, data) {
      var sourceData;

      if (err) {
        cb(err);
        return;
      }

      sourceData = yaml.safeLoad(data);

      // setup hierarchy search tasks
      searchHierarchy.each(function (hierarchy) {
        tasks.push(hierarchy + '.' + backend);
      });

      async.map(tasks, function (f, cb) {
        // get data for each file in the hierarchy
        // TODO: support magic hiera vars
        getFile(configFile, backend, f, function (err, data) {
          cb(null, {
            file : f,
            data : yaml.safeLoad(data)
          });
        });
      }, function (err, comparisonData) {
        var list = {};

        if (err) {
          cb(err);
          return;
        }

        Object.each(sourceData, function (key, value) {
          comparisonData.each(function (set) {
            Object.each(set.data, function (cKey, cValue) {
              if (cKey === key) {
                list[cKey] = {
                  file  : set.file,
                  value : cValue
                };
              }
            });

            if (list[key]) {
              // already exists
              return false;
            }
          });
        });

        cb(null, list);
      });
    });
  });
}

module.exports = {
  getConfig        : getConfig,
  saveConfig       : saveConfig,
  getHierarchy     : getHierarchy,
  getBackends      : getBackends,
  getBackendConfig : getBackendConfig,
  getFile          : getFile,
  saveFile         : saveFile,
  getOverrides     : getOverrides
};
