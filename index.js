var yaml    = require('js-yaml');
var fs      = require('fs');

var getHieraConfig = function(hieraConfigFile) {
  return(yaml.safeLoad(fs.readFileSync(hieraConfigFile, 'utf8')));
}

var getHieraHierarchies = function(hieraConfigFile) {

  var hieraConfig = getHieraConfig(hieraConfigFile);

  return(hieraConfig[':hierarchy']);

}

var getHieraBackends = function(hieraConfigFile) {
  
  var hieraConfig = getHieraConfig(hieraConfigFile);

  return(hieraConfig[':backends']);
  
}

var getHieraBackendConfig = function(hieraConfigFile, hieraBackend) {
  
  var hieraConfig = getHieraConfig(hieraConfigFile);

  return(hieraConfig[':' + hieraBackend]);
  
}

exports.getHieraHierarchies = getHieraHierarchies;
exports.getHieraBackends = getHieraBackends;
exports.getHieraBackendConfig = getHieraBackendConfig;
