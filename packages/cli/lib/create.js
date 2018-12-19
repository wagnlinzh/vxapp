const tar = require('tar');
const fs = require('fs-extra');
const path = require('path');
const upkg = require('upkg');
const zlib = require('zlib');
const https = require('https');

const create = async (projectName, options) => {
  if(!projectName) return console.error('[@vxapp/cli] project name is required');
  const npm = new upkg(options);
  const pkg = await npm.fetch(options.template);
  const version = pkg['dist-tags']['latest'];
  const info = pkg.versions[version];
  await fs.ensureDir(projectName);
  https.get(info.dist.tarball, res => {
    res
    .pipe(zlib.createGunzip())
    .pipe(tar.t())
    .on('entry', entry => {
      const filename = entry.header.path.replace(/^package/, projectName);
      fs.ensureDirSync(path.dirname(filename));
      entry.pipe(fs.createWriteStream(filename));
    })
  });
  console.log('create project:', projectName);
};

module.exports = create;