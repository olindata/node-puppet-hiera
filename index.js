/**
 * Library to interface with Puppet Hiera.
 *
 * @author rajkissu <rajkissu@gmail.com>
 */

/* jslint node: true */
'use strict';

var fs, path, yaml, j2y;

fs   = require('fs');
path = require('path');
yaml = require('js-yaml');
j2y  = require('json2yaml');

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
  fs.writeFile(configFile, j2y.stringify(data), cb);
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

    fs.writeFile(file, data, 'utf8', cb);
  });
}

module.exports = {
  getConfig        : getConfig,
  saveConfig       : saveConfig,
  getHierarchy     : getHierarchy,
  getBackends      : getBackends,
  getBackendConfig : getBackendConfig,
  getFile          : getFile,
  saveFile         : saveFile
};
