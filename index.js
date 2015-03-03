/**
 * Library to interface with Puppet Hiera.
 *
 * @author rajkissu <rajkissu@gmail.com>
 */

/* jslint node: true */
'use strict';

var path, async, yaml, File, fs;

require('sugar');

path  = require('path');
async = require('async');
yaml  = require('js-yaml');
File  = require('./adapters/file');

/**
 * Initializes the Hiera module.
 *
 * @param {string} configFile - the path to `hiera.yaml`.
 *
 * @example init('/path/to/hiera.yaml');
 */
function init(config) {
  if (!fs) {
    fs = new File(config.configFile);
  }
}

/**
 * Retrieves Hiera configuration.
 *
 * @param {Function} cb - callback to invoke.
 *
 * @example getConfig(cb);
 */
function getConfig(cb) {
  fs.readConfig(cb);
}

/**
 * Saves Hiera configuration to file.
 *
 * @param {Object} data - an object loaded with hiera configuration.
 * @param {Function} cb - callback to invoke.
 *
 * @example saveConfig(hieraConfig, cb);
 */
function saveConfig(data, cb) {
  fs.saveConfig(data, cb);
}

/**
 * Gets the Hiera hierarchy.
 *
 * @param {Function} cb - callback to invoke.
 *
 * @example getHierarchy(cb);
 */
function getHierarchy(cb) {
  getConfig(function (err, config) {
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
 * @param {Function} cb - callback to invoke.
 *
 * @example getBackends(cb);
 */
function getBackends(cb) {
  getConfig(function (err, config) {
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
 * @param {string} backend - the backend to load.
 * @param {Function} cb - callback to invoke.
 *
 * @example getBackendConfig('yaml', cb);
 */
function getBackendConfig(backend, cb) {
  getConfig(function (err, config) {
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
 * @param {string} backend - the backend to load.
 * @param {string} file - the Hiera file to load.
 * @param {Function} cb - callback to invoke.
 *
 * @example getFile('yaml', 'defaults.yaml', function (err, data) { ... });
 */
function getFile(backend, file, cb) {
  getBackendConfig(backend, function (err, config) {
    file = [ config[':datadir'], '/', file ].join('');

    fs.readFile(file, cb);
  });
}

/**
 * Saves data to a Hiera file.
 *
 * @param {string} backend - the backend to load.
 * @param {string} file - the Hiera file to save to.
 * @param {Object} data - contents to save to the Hiera file.
 * @param {Function} cb - callback to invoke once file saving completes.
 *
 * @example saveFile(
 *  'gpg', '/path/to/file.gpg', fileData,
 *  function (err) { ... }
 * );
 */
function saveFile(backend, file, data, cb) {
  cb = typeof(cb) === 'function' ? cb : function () {};

  getBackendConfig(backend, function (err, config) {
    var datadir = config[':datadir'];
    file = path.join(datadir, file);

    fs.writeFile(file, data, cb);
  });
}

/**
 * Check for hierarchy overrides for a given file.
 *
 * @param {string} backend - the backend to load.
 * @param {string} file - the Hiera file to check overrides for.
 * @param {Function} cb - callback to invoke once override checking completes.
 *
 * @example getOverrides(
 *  'gpg', '/path/to/file.gpg', function (err) { ... }
 * );
 */
function getOverrides(backend, file, cb) {
  async.parallel([
    function hierarchy(cb) {
      getHierarchy(cb);
    },

    function backendConfig(cb) {
      getBackendConfig(backend, cb);
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

    getFile(backend, file, function (err, data) {
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
        getFile(backend, f, function (err, data) {
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
  init             : init,
  getConfig        : getConfig,
  saveConfig       : saveConfig,
  getHierarchy     : getHierarchy,
  getBackends      : getBackends,
  getBackendConfig : getBackendConfig,
  getFile          : getFile,
  saveFile         : saveFile,
  getOverrides     : getOverrides
};
