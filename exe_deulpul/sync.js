// copy the latest game page, the Photon SDK and the shared app ID into the app folder before running or building
const fs=require('fs'),path=require('path');
const app=path.join(__dirname,'app');
fs.mkdirSync(app,{recursive:true});
fs.copyFileSync(path.join(__dirname,'..','몬스터게임.html'),path.join(app,'index.html'));
fs.copyFileSync(require.resolve('photon-realtime'),path.join(app,'photon-realtime.js'));
if(fs.existsSync(path.join(__dirname,'icon.png')))fs.copyFileSync(path.join(__dirname,'icon.png'),path.join(app,'icon.png'));
// photon-appid.txt stays out of git; players get the ID only inside the built exe
let appId='';try{appId=fs.readFileSync(path.join(__dirname,'photon-appid.txt'),'utf8').trim()}catch(e){}
if(appId&&!/^[0-9a-f-]{20,64}$/i.test(appId))throw new Error('photon-appid.txt does not look like a Photon app ID');
fs.writeFileSync(path.join(app,'config.json'),JSON.stringify({appId}));
console.log('synced 몬스터게임.html -> app/index.html (+ photon-realtime.js, app ID '+(appId?'set':'not set')+')');
