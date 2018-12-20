const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const { exec } = require('child_process');
const { MINA } = require('wechat-lite');
const { HOME } = process.env;
const root = process.cwd();

const devtools = new MINA({});

const APP_DIR = path.join(HOME, '.vxapp');
const profile = path.join(APP_DIR, 'profile');
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const mkdir = promisify(fs.mkdir);
const exists = promisify(fs.exists);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

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

const save = async session => {
  await ensureDir(APP_DIR);
  return writeFile(profile, JSON.stringify(session));
};

const restore = () => {
  return readFile(profile, 'utf8').then(JSON.parse, x => null);
};

const getAppId = () => {
  var pkg, filename = path.join(root, 'project.config.json');
  try{
    pkg = require(filename);
  }catch(e){
    console.log('[@vxapp/cli] can not access', filename);
    process.exit(2);
    return;
  }
  if(!pkg.appid){
    console.log('[@vxapp/cli] appid is required in project.config.json');
    process.exit(3);
    return;
  }
  return pkg.appid;
};

const run = promisify(exec);
const open = link => run(`open ${link} &`);

const getCode = ({ print }) => new Promise((resolve, reject) => {
  devtools.qrconnect({
    redirect_uri: 'https://mp.weixin.qq.com/xxx'
  }, async (err, res) => {
    if(err) return reject(err);
    const { state, qrcode, code } = res;
    switch(state){
      case 0:
        if(print){
          console.log('qrcode:', qrcode);
        }else{
          open(qrcode);
        }
        break;
      case 405:
        resolve(code);
        break;
    }
  });
});

devtools.pack = project => MINA.pack(project);
devtools.unpack = (project, to) => MINA.unpack(project, to);
devtools.requireLogin = async ({ print, force } = {}) => {
  const session = await restore();
  if(!force && session){
    devtools.appid = getAppId();
    return Object.assign(devtools, session);
  }
  const code = await getCode({ print });
  const user = await devtools.login(code);
  console.log(`[@vxapp/cli] login success, welcome "${user.nickname}"`);
  return save(user);
};


module.exports = devtools;