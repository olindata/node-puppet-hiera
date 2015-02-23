/**
 * Filesystem adapter for Puppet Hiera.
 *
 * @author rajkissu <rajkissu@gmail.com>
 */

/* jslint node: true */
'use strict';

var fs, yaml, j2y;

fs   = require('fs');
yaml = require('js-yaml');
j2y  = require('json2yaml');

/**
 * The File adapter class.
 *
 * @class File
 */
class File {
  /**
   * The File constructor.
   *
   * @constructor
   *
   * @param {string} config - the configuration file path.
   *
   * @example new File('/path/to/hiera.yaml');
   */
  constructor(config) {
    this.config = config;
  }

  /**
   * Reads a file.
   *
   * @method
   *
   * @param {string} file - the file path to read from.
   * @param {Function} cb - callback to invoke.
   *
   * @example
   */
  readFile(file, cb) {
    fs.readFile(file, 'utf8', cb);
  }

  /**
   * Writes a file.
   *
   * @method
   *
   * @param {string} file - the file path to write to.
   * @param {string} data - the data to write to the file.
   * @param {Function} cb - callback to invoke.
   *
   * @example
   */
  writeFile(file, data, cb) {
    fs.writeFile(file, data, 'utf8', cb);
  }

  /**
   * Reads a configuration file.
   *
   * @method
   *
   * @param {Function} cb - callback to invoke.
   *
   * @example
   */
  readConfig(cb) {
    fs.readFile(this.config, function (err, data) {
      if (err) {
        cb(err);
        return;
      }

      cb(null, yaml.safeLoad(data));
    });
  }

  /**
   * Saves a configuration file.
   *
   * @method
   *
   * @param {string} data - the data to write to configuration.
   * @param {Function} cb - callback to invoke.
   *
   * @example
   */
  saveConfig(data, cb) {
    fs.writeFile(this.config, j2y.stringify(data), cb);
  }
}

module.exports = File;
