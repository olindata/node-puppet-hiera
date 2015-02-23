/**
 * Git adapter for Puppet Hiera.
 *
 * @author rajkissu <rajkissu@gmail.com>
 */

/* jslint node: true */
'use strict';

var git = require('nodegit');

/**
 * The Git adapter class.
 *
 * @class Git
 */
class Git {
  /**
   * The Git constructor.
   *
   * @constructor
   *
   * @param {string} repo - the configuration file path.
   * @param {string} signature - the configuration file path.
   *
   * @example new File('/path/to/hiera.yaml');
   */
  constructor(repo, signature) {
    this.repo = repo;
    this.signature = signature;

    this.repo = '/home/rajkissu/Downloads/hiera-test/.git';
    this.signature = git.Signature.create('Raj Kissu', 'rajkissu@gmail.com', 123456789, 60);
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
    var _repository;

    git.Repository.open(path.resolve(__dirname, this.repo))
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
      return _repository.createCommit('HEAD', this.signature, this.signature, 'Saves ' + file, _oid, [ parent ]);
    })
    .then(function () {
      return git.Remote.create(_repository, 'origin', this.repo)
        .then(function (remote) {
          remote.connect(git.Enums.DIRECTION.PUSH);

          var push;

          // We need to set the auth on the remote, not the push object
          remote.setCallbacks({
            credentials: function(url, userName) {
              return git.Cred.sshKeyFromAgent(userName);
            }
          });

          // Create the push object for this remote
          return git.Push.create(remote)
          .then(function(pushResult) {
            push = pushResult;

            // This just says what branch we're pushing onto what remote branch
            return push.addRefspec("refs/heads/master:refs/heads/master");
          }).then(function() {
            // This is the call that performs the actual push
            return push.finish();
          }).then(function() {
            // Check to see if the remote accepted our push request.
            return push.unpackOk();
          });
        });
    })
    .done(cb);
  }
}
