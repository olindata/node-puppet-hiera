'use strict';

var fs, path, yaml, j2y;

fs       = require('fs');
path     = require('path');
yaml     = require('js-yaml');
j2y      = require('json2yaml');

function getConfig(configFile) {
  return yaml.safeLoad(fs.readFileSync(configFile, 'utf8'));
}

function saveConfig(configFile, data) {
  return fs.writeFileSync(configFile, j2y.stringify(data));
}

function getHierarchy(configFile) {
  var hieraConfig = getConfig(configFile);

  return hieraConfig[':hierarchy'];
}

function getBackends(configFile) {
  var hieraConfig = getConfig(configFile);

  return hieraConfig[':backends'];
}

function getBackendConfig(configFile, backend) {
  var hieraConfig = getConfig(configFile);

  return hieraConfig[':' + backend];
}

function getFile(configFile, backend, file) {
  var config, datadir;

  config  = getBackendConfig(configFile, backend);
  datadir = config[':datadir'];
  file    = [ datadir, '/', file ].join('');

  return fs.readFileSync(file, 'utf8');
}

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
