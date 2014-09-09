'use strict';

var fs, yaml, j2y;

fs   = require('fs');
yaml = require('js-yaml');
j2y  = require('json2yaml');

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

function getFiles(configFile, backend) {
  // TODO: traverse directories
  backend = getBackendConfig(configFile, backend);

  return fs.readdirSync(backend[':datadir']);
}

function getFile(configFile, backend, file) {
  var config, datadir;

  config  = getBackendConfig(configFile, backend);
  datadir = config[':datadir'];
  file    = [ datadir, '/', file ].join('');

  return fs.readFileSync(file, 'utf8');
}

function getBackendConfig(configFile, backend) {
  var hieraConfig = getConfig(configFile);

  return hieraConfig[':' + backend];
}

module.exports = {
  getConfig        : getConfig,
  saveConfig       : saveConfig,
  getHierarchy     : getHierarchy,
  getBackends      : getBackends,
  getBackendConfig : getBackendConfig,
  getFiles         : getFiles,
  getFile          : getFile
};
