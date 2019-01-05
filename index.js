const fs = require('fs');
const child = require('child_process');
const moment = require('moment');
const archiver = require('archiver');
const mkdirp = require('mkdirp');

const settings = {
  USERNAME: '',
  PASSWORD: '123456',
  DB: 'cms',
  mongoBinPath: '/usr/local/bin/',
  dataFolder: process.cwd() + '/data/',
};
let ms = moment().format('YYYYMMDDHHmmss');
const dataPath = settings.dataFolder + ms;
const mongoBinPath = settings.mongoBinPath;

const userstring =
  settings.USERNAME && settings.PASSWORD
    ? `-u ${settings.USERNAME} -p ${settings.PASSWORD}`
    : '';
const isDev = true;
let cmdstr = isDev
  ? `mongodump -d ${settings.DB} -o '${dataPath}'`
  : `${mongoBinPath}mongodump ${userstring} -d ${settings.DB} -o '${dataPath}'`;

if (!fs.existsSync(dataPath)) {
  mkdirp.sync(dataPath, null, (err, s) => {
    console.log(err, s);
  });
}

child.exec(cmdstr, function(error, stdout, stderr) {
  if (error !== null) {
    console.log('exec error: ' + error);
  } else {
    //生成压缩文件
    let output = fs.createWriteStream(dataPath + '.zip');
    let archive = archiver('zip');

    output.on('close', function() {
      console.log(archive.pointer() + ' total bytes');
      console.log('--数据备份成功--');
      // 操作记录入库
      let optParams = {
        logs: '数据备份',
        path: dataPath,
        fileName: ms + '.zip'
      };
      console.log('写入数据库', optParams);
    });

    output.on('end', function() {
      console.log('Data has been drained');
    });

    archive.on('error', function(err) {
      throw err;
    });

    archive.pipe(output);
    archive.directory(dataPath + '/', false);
    archive.finalize();
  }
});
