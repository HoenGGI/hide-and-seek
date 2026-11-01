// hands the shared Photon app ID (from app/config.json, never in the repo) to the game page
const {contextBridge}=require('electron');
const arg=process.argv.find(a=>a.startsWith('--deulpul-appid='));
contextBridge.exposeInMainWorld('deulpulConfig',{appId:arg?arg.slice('--deulpul-appid='.length):''});
