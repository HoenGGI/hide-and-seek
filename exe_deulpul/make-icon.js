// draws a 32x32 pixel-art 승환이 (the flame starter) and saves it as a 256x256 icon.png (no image libraries needed)
const fs=require('fs'),zlib=require('zlib'),path=require('path');
const N=32,SCALE=8,px=Array.from({length:N},()=>Array(N).fill(null));
const set=(x,y,c)=>{if(x>=0&&y>=0&&x<N&&y<N)px[y][x]=c};
const rect=(x,y,w,h,c)=>{for(let j=0;j<h;j++)for(let i=0;i<w;i++)set(x+i,y+j,c)};
const disc=(cx,cy,rx,ry,c)=>{for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(((x+0.5-cx)/rx)**2+((y+0.5-cy)/ry)**2<=1)set(x,y,c)};
// rounded sky-blue tile behind him
for(let y=0;y<N;y++)for(let x=0;x<N;x++){const dx=Math.max(0,Math.abs(x+0.5-16)-11),dy=Math.max(0,Math.abs(y+0.5-16)-11);if(dx*dx+dy*dy<=20)set(x,y,'#78a8d0')}
// flame tuft
disc(16,9,5,6,'#8a3a14');disc(16,9.5,4,5,'#ffd34d');rect(12,4,2,4,'#ffd34d');rect(19,3,2,5,'#ffd34d');disc(16,11,2,3,'#ff6a3a');
// orange body with outline, belly and feet
disc(16,20,11,8.5,'#8a3a14');disc(16,20,10,7.5,'#ff9a3c');disc(16,23,6,3.5,'#ffd0a0');
rect(10,27,5,2,'#8a3a14');rect(18,27,5,2,'#8a3a14');
// face
rect(12,17,2,3,'#1b1b2a');rect(19,17,2,3,'#1b1b2a');rect(12,17,1,1,'#ffffff');rect(19,17,1,1,'#ffffff');
rect(8,21,3,1,'#f59ab0');rect(22,21,3,1,'#f59ab0');
// PNG encoding
const W=N*SCALE,raw=Buffer.alloc((W*4+1)*W);
for(let y=0;y<W;y++){raw[y*(W*4+1)]=0;for(let x=0;x<W;x++){const c=px[Math.floor(y/SCALE)][Math.floor(x/SCALE)],o=y*(W*4+1)+1+x*4;
  if(c){raw[o]=parseInt(c.slice(1,3),16);raw[o+1]=parseInt(c.slice(3,5),16);raw[o+2]=parseInt(c.slice(5,7),16);raw[o+3]=255}}}
const crcTable=Array.from({length:256},(_,n)=>{let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0});
const crc=b=>{let c=0xffffffff;for(const x of b)c=crcTable[(c^x)&255]^(c>>>8);return(c^0xffffffff)>>>0};
const chunk=(type,data)=>{const len=Buffer.alloc(4);len.writeUInt32BE(data.length);const td=Buffer.concat([Buffer.from(type),data]);const cr=Buffer.alloc(4);cr.writeUInt32BE(crc(td));return Buffer.concat([len,td,cr])};
const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(W,0);ihdr.writeUInt32BE(W,4);ihdr[8]=8;ihdr[9]=6;
const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);
fs.writeFileSync(path.join(__dirname,'icon.png'),png);
console.log('wrote icon.png');
