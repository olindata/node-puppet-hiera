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
 * @returns {Object} a Hiera backend.
 *
 * @example getBackendConfig('/path/to/hiera.yaml', 'yaml');
 */
function getBackendConfig(configFile, backend) {
  var hieraConfig = getConfig(configFile);

  return hieraConfig[':' + backend];
}

/**
 * Retrieves data from a Hiera file.
 *
 * @param {string} configFile - the path to `hiera.yaml`.
 * @param {string} backend - the backend to load.
 * @param {string} file - the Hiera file to load.
 * @returns {Object} a Hiera file data.
 *
 * @example getFile('/path/to/hiera.yaml', 'yaml');
 */
function getFile(configFile, backend, file) {
  var config, datadir;

  config  = getBackendConfig(configFile, backend);
  datadir = config[':datadir'];
  file    = [ datadir, '/', file ].join('');

  return fs.readFileSync(file, 'utf8');
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
  var config, datadir;

  cb      = Object.isFunction(cb) ? cb : function () {};
  config  = getBackendConfig(configFile, backend);
  datadir = config[':datadir'];
  file    = path.join(datadir, file);

  fs.writeFile(file, data, 'utf8', cb);
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
