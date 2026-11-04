import {loadWizardSidekick} from './wizard-sidekicks.js';
import {createWizardMatch,updateWizardLevels} from './wizard-match.js';
import {drawWizardArena} from './wizard-arena.js';
import {loadStormWizard} from './storm-wizards.js';
import {WIZARD_BLOCKS} from './wizard-themes.js';
export function drawStormCoverFrame(canvas,time=0){
 const c=canvas.getContext('2d');if(!c)return false;
 const scene=Math.floor(time/4)%8,match=createWizardMatch({random:()=>.42,background:scene,wizard:loadStormWizard(),sidekick:loadWizardSidekick(0),rivalSidekick:loadWizardSidekick(1),blocks:WIZARD_BLOCKS[scene%6].id,rivalBlocks:WIZARD_BLOCKS[(scene+1)%6].id});
 match.elapsed=time;match.remaining=30;match.status='playing';
 for(let i=0;i<2;i++){const p=match.players[i];p.status='playing';for(let y=14+i*2;y<24;y++)for(let x=3;x<=5;x++)p.board[y][x]=1+(x+y)%7;p.height=10-i*2;p.piece.y=Math.floor((time%4)*2);updateWizardLevels(match,i);}
 drawWizardArena(c,match,canvas.width,canvas.height,true);return true;
}
export function animateStormCover(canvas){
 canvas.width=960;canvas.height=650;canvas.parentElement?.classList.add('storm-art');const reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;let start;
 function frame(now){if(!canvas.isConnected)return;start??=now;if(!globalThis.document?.hidden)drawStormCoverFrame(canvas,reduced?0:(now-start)/1000);requestAnimationFrame(frame);}
 drawStormCoverFrame(canvas,0);requestAnimationFrame(frame);
}
