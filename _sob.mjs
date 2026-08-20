import { chromium } from 'playwright';
import fs from 'fs'; import path from 'path';
const exe='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const nav=await chromium.launch({...(fs.existsSync(exe)?{executablePath:exe}:{}),
  args:['--blink-settings=minimumFontSize=8,minimumLogicalFontSize=8']});
const p=await nav.newPage({viewport:{width:412,height:915},deviceScaleFactor:2});
const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
await p.goto('file://'+path.resolve('juego/juego.html'));
await p.waitForFunction(()=>typeof window.ROSTER!=='undefined');
await p.evaluate(()=>{ S.divisa=1200; S.sobres=[{tipo:'oro'}]; ir('tienda');
  document.querySelector('[data-a="versobre"][data-t="oro"]').click(); });
await p.waitForTimeout(500);
await p.screenshot({path:'/tmp/claude-0/-home-user-slotdiego/b4a5e0b8-270e-5f10-9132-d74ca2d0c34d/scratchpad/v2-sobre.png'});
console.log('errores:', errs.length?errs:'ninguno');
await nav.close();
