import { chromium } from 'playwright';
import fs from 'fs'; import path from 'path';
const exe='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const nav=await chromium.launch({...(fs.existsSync(exe)?{executablePath:exe}:{}),args:['--blink-settings=minimumFontSize=8']});
const p=await nav.newPage({viewport:{width:412,height:915},deviceScaleFactor:2});
const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
await p.goto('file://'+path.resolve('juego/juego.html'));
await p.waitForFunction(()=>typeof window.ROSTER!=='undefined');
await p.evaluate(()=>{
  const l=ROSTER.filter(c=>c.alineable);
  S.coleccion=[]; S.plantilla={};
  DIVISIONES.forEach((d,i)=>{const c=l.find(x=>x.division===d.id);
    if(c){const iid='z'+i;S.coleccion.push({iid,cid:c.id});S.plantilla[d.id]=iid;}});
  ROSTER.slice(0,25).forEach((c,i)=>S.coleccion.push({iid:'y'+i,cid:c.id}));
  S.divisa=250; S.fichas=0; S.sobres=[{tipo:'oro'}]; S.tutorialHecho=false; ir('inicio');
});
const dir='/tmp/claude-0/-home-user-slotdiego/b4a5e0b8-270e-5f10-9132-d74ca2d0c34d/scratchpad/';
for(const [v,f] of [['inicio','n-inicio'],['tienda','n-tienda'],['club','n-club']]){
  await p.evaluate(x=>ir(x), v); await p.waitForTimeout(450);
  await p.screenshot({path:dir+f+'.png'});
}
console.log('errores:', errs.length?errs.slice(0,4):'ninguno');
await nav.close();
