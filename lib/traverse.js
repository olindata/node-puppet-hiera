'use strict';

var path, findit;

require('sugar');

path   = require('path');
findit = require('findit');

module.exports = function traverse(rootDir, cb) {
  var finder, dirs, files;

  cb     = Object.isFunction(cb) ? cb : function () {};
  finder = findit(rootDir);
  dirs   = [];
  files  = [];

  finder.on('directory', function (dir, stat, stop) {
    var base = path.basename(dir);

    // ignore special directories
    if (base === '.git' || base === 'node_modules') {
      stop();
    }

    // don't include the root directory
    if (dir !== rootDir) {
      dirs.push(dir.remove(rootDir + '/'));
    }
  });

  finder.on('file', function (file, stat) {
    var base = path.basename(file);

    if (base[0] !== '.') {
      files.push(file.remove(rootDir + '/'));
    }
  });

  finder.on('end', function () {
    var final = [];

    dirs.each(function (dir) {
      _place(final, dir);
    });

    files.each(function (file) {
      _place(final, file);
    });

    cb(null, final);
  });

  finder.on('error', function (err) {
    cb(err);
  });
}

function _place(tree, file) {
  var base, placed;

  base   = path.basename(file);
  placed = false;

  tree.each(function (value, key) {
    var id, children;

    if (Object.isString(value)) {
      return true;
    }

    id       = value.id;
    children = value.children;

    if (file.has(id)) {
      _place(children, file);

      placed = true;
      return false;
    }
  });

  if (!placed) {
    tree.push({
      id       : file,
      label    : base,
      children : []
    });
  }
}
