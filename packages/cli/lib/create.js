const fs = require('fs');
const tar = require('tar');
const path = require('path');
const upkg = require('upkg');
const zlib = require('zlib');
const https = require('https');

const ensureDir = async dir => {
  const paths = [];
  dir.split(path.sep).reduce((prev, cur) => {
    const result = path.join(prev, cur);
    paths.push(result);
    return result;
  }, path.sep);
  for(const cur of paths){
    const isExists = await exists(cur);
    !isExists && await mkdir(cur);
  }
};

const create = async (projectName, options) => {
  if(!projectName) return console.error('[@vxapp/cli] project name is required');
  const npm = new upkg(options);
  const pkg = await npm.fetch(options.template);
  const version = pkg['dist-tags']['latest'];
  const info = pkg.versions[version];
  await ensureDir(projectName);
  https.get(info.dist.tarball, res => {
    console.log('create project:', projectName);
    res
    .pipe(zlib.createGunzip())
    .pipe(tar.t())
    .on('entry', entry => {
      const filename = entry.header.path.replace(/^package/, projectName);
      ensureDir(path.dirname(filename)).then(() => {
        entry.pipe(fs.createWriteStream(filename));
      });
    })
  });
};

module.exports = create;