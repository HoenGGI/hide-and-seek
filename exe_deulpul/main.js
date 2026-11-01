const {app,BrowserWindow,Menu,dialog}=require('electron');
const fs=require('fs'),path=require('path');

// the game is one HTML file; new versions are pulled from the public repo, so friends never reinstall for content updates
const UPDATE_URL=process.env.DEULPUL_UPDATE_URL||'https://raw.githubusercontent.com/HoenGGI/hide-and-seek/main/'+encodeURIComponent('몬스터게임.html');
const bundled=path.join(__dirname,'app');
const gameDir=()=>path.join(app.getPath('userData'),'game');
const versionOf=html=>{const m=/const GAME_VERSION=(\d+);/.exec(html);return m?+m[1]:0};
// a download only counts if it is clearly the game, not an error page or a half file
const looksValid=html=>html.length>50000&&(html.includes('<title>환켓몬스터</title>')||html.includes('<title>들풀 동행기</title>'))&&versionOf(html)>0;

// pick the newest of the bundled copy and the last download, and lay it out next to the Photon SDK
function prepareGame(){
  const dir=gameDir();fs.mkdirSync(dir,{recursive:true});
  const mine=fs.readFileSync(path.join(bundled,'index.html'),'utf8');
  let html=mine;
  try{const saved=fs.readFileSync(path.join(dir,'latest.html'),'utf8');if(looksValid(saved)&&versionOf(saved)>=versionOf(mine))html=saved}catch(e){}
  fs.writeFileSync(path.join(dir,'index.html'),html);
  fs.copyFileSync(path.join(bundled,'photon-realtime.js'),path.join(dir,'photon-realtime.js'));
  return versionOf(html);
}

async function checkUpdate(win,current){
  try{
    const res=await fetch(UPDATE_URL+'?t='+Date.now(),{signal:AbortSignal.timeout(8000),cache:'no-store'});
    if(!res.ok)return;
    const html=await res.text();
    if(!looksValid(html)||versionOf(html)<=current)return;
    fs.writeFileSync(path.join(gameDir(),'latest.html'),html);
    const {response}=await dialog.showMessageBox(win,{type:'info',title:'환켓몬스터',buttons:['지금 적용','다음에 켤 때'],defaultId:1,cancelId:1,
      message:`새 버전(v${versionOf(html)})을 받았어요.`,detail:'지금 적용하면 게임이 다시 시작돼요. 저장하지 않은 진행은 사라지니, 먼저 메뉴에서 저장해 주세요.'});
    if(response===0){prepareGame();win.loadFile(path.join(gameDir(),'index.html'))}
  }catch(e){} // offline or GitHub unreachable: keep playing the version we have
}

function readConfig(){try{return JSON.parse(fs.readFileSync(path.join(bundled,'config.json'),'utf8'))}catch(e){return {}}}

function create(){
  const win=new BrowserWindow({
    width:1024,height:820,minWidth:660,minHeight:540,
    backgroundColor:'#000000',title:'환켓몬스터',autoHideMenuBar:true,
    icon:path.join(bundled,'icon.png'),
    webPreferences:{preload:path.join(__dirname,'preload.js'),additionalArguments:['--deulpul-appid='+(readConfig().appId||'')]},
  });
  Menu.setApplicationMenu(null);
  const v=prepareGame();
  win.loadFile(path.join(gameDir(),'index.html'));
  win.webContents.once('did-finish-load',()=>checkUpdate(win,v));
  // F11 toggles full screen (Esc stays with the game's menu)
  win.webContents.on('before-input-event',(e,input)=>{
    if(input.type==='keyDown'&&input.key==='F11'){win.setFullScreen(!win.isFullScreen());e.preventDefault()}
  });
}
app.whenReady().then(create);
app.on('window-all-closed',()=>app.quit());
