/**
 * Git adapter for Puppet Hiera.
 *
 * @author rajkissu <rajkissu@gmail.com>
 */

/* jslint node: true */
'use strict';

var path, git, File;

path = require('path');
git  = require('nodegit');
File = require('./file');

/**
 * The Git adapter class.
 *
 * @class Git
 */
class Git extends File {
  /**
   * The Git constructor.
   *
   * @constructor
   *
   * @param {Object} config - configuration options.
   *
   * @example new Git({
   *   token : 'sometoken',
   *   repo : '/path/to/repo.git',
   *   signature : { name : 'Name', email : '<email>' }
   * });
   */
  constructor(config) {
    super(config);

    var signature = config.signature;

    this.token = config.token;
    this.repo = config.repo;
    this.signature = git.Signature.create(
      signature.name,
      signature.email,
      Math.floor((new Date).getTime() / 1000),
      480
    );
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
    var me, _repository, _oid;

    me = this;

    git.Repository.open(path.resolve(__dirname, me.repo))
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
      return _repository.createCommit('HEAD', me.signature, me.signature, 'Saves ' + file, _oid, [ parent ]);
    })
    .then(function () {
      return git.Remote.lookup(_repository, 'origin')
        .then(function (remote) {
          remote.connect(git.Enums.DIRECTION.PUSH);

          remote.setCallbacks({
            credentials: function(url, userName) {
              return git.Cred.userpassPlaintextNew(me.token, 'x-oauth-basic');
            },

            certificateCheck: function () {
              return 1;
            }
          });

          return remote;
        })
        .then(function (remote) {
          var refs = ["refs/heads/master:refs/heads/master"];

          // Create the push object for this remote
          return remote.push(
            refs,
            null,
            me.signature,
            "Push to master"
          );
        });
    })
    .done(cb);
  }
}

module.exports = Git;
