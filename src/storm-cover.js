import {loadWizardSidekick,drawWizardSidekick} from './wizard-sidekicks.js';
import {createWizardMatch} from './wizard-match.js';
import {drawWizardIsland,drawWizardTether,wizardArenaField} from './wizard-arena.js';
import {loadStormWizard,drawStormWizard} from './storm-wizards.js';
import {drawWizardBackground,drawWizardBlock,loadWizardSetting} from './wizard-themes.js';
import {drawWizardPowerIcon} from './wizard-powers.js';
export function drawStormCoverFrame(canvas,time=0){
 const c=canvas.getContext('2d');if(!c)return false;c.save();c.scale(canvas.width/960,canvas.height/650);
 const background=Number(loadWizardSetting('background',0))||0,match=createWizardMatch({random:()=>.42,background,wizard:loadStormWizard(),sidekick:loadWizardSidekick(0),rivalSidekick:loadWizardSidekick(1)});
 drawWizardBackground(c,background,time,false);
 const shade=c.createLinearGradient(0,0,0,650);shade.addColorStop(0,'#0a163c99');shade.addColorStop(.5,'#0b14300a');shade.addColorStop(1,'#131329cc');c.fillStyle=shade;c.fillRect(0,0,960,650);
 c.textAlign='center';c.shadowColor='#ffc769';c.shadowBlur=18;c.fillStyle='#fff1bf';c.font='900 58px system-ui';c.fillText('WIZARD TETRIS',480,71);c.shadowBlur=0;c.fillStyle='#f4eaff';c.font='600 18px system-ui';c.fillText('WOBBLY TOWERS. WILD MAGIC. YOUR SIDEKICK.',480,105);
 for(let i=0;i<2;i++){
  const f=wizardArenaField(i),p=match.players[i],style=i?'rainbow':'gold';drawWizardIsland(c,f.center,535,310);
  const shapes=[[[0,0],[1,0],[0,1],[1,1]],[[0,0],[0,1],[1,1],[2,1]],[[0,0],[1,0],[2,0],[3,0]],[[1,0],[0,1],[1,1],[2,1]],[[0,0],[1,0],[0,1],[1,1]],[[1,0],[0,1],[1,1],[2,1]]];
  let base=535;for(let row=0;row<shapes.length;row++){const cells=shapes[row],x=f.center-48+(row%2)*12,y=base-(Math.max(...cells.map(p=>p[1]))+1)*27;base=y;c.save();c.translate(x+40,y+36);c.rotate(Math.sin(time*2+row+i)*(.025+row*.009));for(const [dx,dy]of cells)drawWizardBlock(c,dx*27-40,dy*27-36,27,row, row%2?style:i?'lightning':'galaxy',time);c.restore();}
  p.status='playing';p.piece.x=3+Math.round(Math.sin(time*1.1+i));p.piece.y=3+Math.sin(time*1.3+i);for(const [x,y]of p.piece.cells)drawWizardBlock(c,f.x+(p.piece.x+x)*18,f.y+(p.piece.y+y)*18,18,p.piece.kind,i?'lightning':'gold',time);
  drawWizardTether(c,p,f,time);c.save();c.translate(f.wizardX-12,570);c.scale(.65,.65);drawStormWizard(c,p.wizard,0,0,time,false);c.restore();drawWizardSidekick(c,p.sidekick,f.wizardX+50,569,time,{maxW:65,maxH:55});
 }
 // A block tipping away makes the balance challenge visible before opening the game.
 c.save();c.translate(390+Math.sin(time)*8,330+(time%3)*22);c.rotate(time*.7);drawWizardBlock(c,-18,-18,36,2,'galaxy',time);c.restore();
 for(let i=0;i<20;i++){const x=(i*137+time*12)%960,y=145+(i*79)%420;c.globalAlpha=.35+.3*Math.sin(time*2+i);c.fillStyle='#ffe59a';c.beginPath();c.arc(x,y,1+i%3,0,Math.PI*2);c.fill();}c.globalAlpha=1;
 c.fillStyle='#13213be8';c.beginPath();c.roundRect(210,585,540,49,24);c.fill();const powers=['island','lightning','ice'];for(let i=0;i<3;i++)drawWizardPowerIcon(c,powers[i],228+i*165,590,38);c.font='700 13px system-ui';c.fillStyle='#fff1cb';c.fillText('BUILD',311,614);c.fillText('CAST',476,614);c.fillText('SABOTAGE',641,614);c.restore();return true;
}
export function animateStormCover(canvas){
 canvas.width=960;canvas.height=650;canvas.parentElement?.classList.add('storm-art');const reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;let start;
 function frame(now){if(!canvas.isConnected)return;start??=now;if(!globalThis.document?.hidden)drawStormCoverFrame(canvas,reduced?0:(now-start)/1000);requestAnimationFrame(frame);}
 drawStormCoverFrame(canvas,0);requestAnimationFrame(frame);
}
