import { chromium } from 'playwright';
import fs from 'fs'; import path from 'path';
const exe='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const nav=await chromium.launch({...(fs.existsSync(exe)?{executablePath:exe}:{}),
  args:['--blink-settings=minimumFontSize=8,minimumLogicalFontSize=8']});
const p=await nav.newPage({viewport:{width:412,height:915},deviceScaleFactor:2});
const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
await p.goto('file://'+path.resolve('juego/juego.html'));
await p.waitForFunction(()=>typeof window.ROSTER!=='undefined');
await p.evaluate(()=>{
  const l=ROSTER.filter(c=>c.alineable);
  S.coleccion=[]; S.plantilla={};
  DIVISIONES.forEach((d,i)=>{const c=l.find(x=>x.division===d.id);
    if(c){const iid='z'+i;S.coleccion.push({iid,cid:c.id});S.plantilla[d.id]=iid;}});
  S.divisa=1200; S.fichas=14; S.sobres=[{tipo:'oro'},{tipo:'plata'},{tipo:'plata'}];
  S.partidas=7; S.victorias=4; S.tutorialHecho=false; ir('inicio');
});
const dir='/tmp/claude-0/-home-user-slotdiego/b4a5e0b8-270e-5f10-9132-d74ca2d0c34d/scratchpad/';
for(const [v,f] of [['inicio','v2-inicio'],['tienda','v2-tienda'],['retos','v2-retos'],['club','v2-club']]){
  await p.evaluate(x=>ir(x), v); await p.waitForTimeout(350);
  await p.screenshot({path:dir+f+'.png'});
}
// medir el hueco muerto
console.log(await p.evaluate(()=>{
  const out={};
  for(const v of ['inicio','tienda','retos','club']){
    ir(v);
    const q=document.querySelector('.pila');
    const barra=parseFloat(getComputedStyle(document.body).paddingBottom)||0;
    out[v]=q?Math.round(innerHeight-q.getBoundingClientRect().bottom-barra):'sin pila';
  }
  return out;
}));
// la i
await p.evaluate(()=>{ ir('tienda'); });
await p.waitForTimeout(300);
await p.locator('.info').first().click();
await p.waitForTimeout(300);
await p.screenshot({path:dir+'v2-probs.png'});
console.log('errores:', errs.length?errs.slice(0,4):'ninguno');
await nav.close();
