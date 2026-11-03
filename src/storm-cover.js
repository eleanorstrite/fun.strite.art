import {drawWizardBackground,drawWizardBlock,WIZARD_BLOCKS} from './wizard-themes.js';
import {drawStormWizard,loadStormWizard} from './storm-wizards.js';
// A live miniature of the actual backgrounds, character sprites and block finishes.
export function drawStormCoverFrame(canvas,time=0){
 const c=canvas.getContext('2d');if(!c)return false;const w=canvas.width,h=canvas.height;
 c.save();c.scale(w/960,h/640);const scene=Math.floor(time/4)%8,style=WIZARD_BLOCKS[Math.floor(time/4)%6];drawWizardBackground(c,scene,time,true);
 c.fillStyle='#07152b70';c.fillRect(0,0,960,640);
 c.fillStyle='#a98bd3';c.beginPath();c.roundRect(310,520,440,25,12);c.fill();c.fillStyle='#493d70';c.beginPath();c.moveTo(320,545);c.lineTo(530,607);c.lineTo(740,545);c.fill();
 for(let y=0;y<11;y++)for(let x=0;x<6;x++)if((y<3||x>=1&&x<5)&&(y<8||x>=2&&x<=3))drawWizardBlock(c,405+x*35,485-y*35,35,(x+y)%7,style.id,time);
 const drop=(time%4)/4;for(const [x,y]of [[0,0],[0,1],[1,1],[2,1]])drawWizardBlock(c,470+x*35,46+drop*75+y*35,35,2,style.id,time);
 c.save();c.translate(210,535);c.scale(2.2,2.2);drawStormWizard(c,loadStormWizard(),0,0,time,true);c.restore();
 c.fillStyle='#08142de8';c.beginPath();c.roundRect(36,24,360,90,18);c.fill();c.fillStyle='#ffe8a0';c.font='700 32px system-ui';c.textAlign='left';c.fillText('WIZARD TETRIS',58,67);c.fillStyle='#d7e7ff';c.font='16px system-ui';c.fillText('A little balance. A lot of magic.',58,94);
 c.fillStyle='#08142de8';c.beginPath();c.roundRect(612,560,300,48,15);c.fill();c.fillStyle='#ffe8a0';c.font='600 18px system-ui';c.textAlign='center';c.fillText(style.name+' blocks · 5 spells',762,591);c.restore();return true;
}
export function animateStormCover(canvas){
 canvas.width=960;canvas.height=640;canvas.parentElement?.classList.add('storm-art');
 const reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;let start;
 function frame(now){if(!canvas.isConnected)return;start??=now;if(!globalThis.document?.hidden)drawStormCoverFrame(canvas,reduced?0:(now-start)/1000);requestAnimationFrame(frame);}
 drawStormCoverFrame(canvas,0);requestAnimationFrame(frame);
}
