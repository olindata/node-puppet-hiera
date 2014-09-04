'use strict';

var yaml, fs;

yaml = require('js-yaml');
fs   = require('fs');

function getConfig(file) {
  return yaml.safeLoad(fs.readFileSync(file, 'utf8'));
}

function getHierarchy(file) {
  var hieraConfig = getConfig(file);

  return hieraConfig[':hierarchy'];
}

function getBackends(file) {
  var hieraConfig = getConfig(file);

  return hieraConfig[':backends'];
}

function getBackendConfig(file, backend) {
  var hieraConfig = getConfig(file);

  return hieraConfig[':' + backend];
}

module.exports = {
  getConfig        : getConfig,
  getHierarchy     : getHierarchy,
  getBackends      : getBackends,
  getBackendConfig : getBackendConfig
};
