import {wizardCameraHeight,WIZARD_DIFFICULTIES} from './wizard-match.js';
import {drawWizardSidekick} from './wizard-sidekicks.js';
import {drawWizardBackground,drawWizardBlock,wizardBackground} from './wizard-themes.js';
import {drawStormWizard,stormWizard} from './storm-wizards.js';
import {STORM_WIZARD_BOUNDS} from './storm-wizard-bounds.js';
import {wizardSolidAt} from './wizard-rules.js';
import {wizardPower,wizardChoicePosition,drawWizardPowerIcon} from './wizard-powers.js';

let island;
export function wizardIslandAtlas(){if(typeof Image==='undefined')return null;if(!island){island=new Image();island.src=new URL('../assets/wizard-floating-island.png',import.meta.url).href;}return island;}
export function drawWizardIsland(c,center,base,width=260){const image=wizardIslandAtlas();if(image?.complete&&image.naturalWidth){c.drawImage(image,center-width/2,base-width*.16,width,width*.5);}else{c.fillStyle='#7cbb79';c.beginPath();c.ellipse(center,base+7,width/2,15,0,0,Math.PI*2);c.fill();c.fillStyle='#67577f';c.beginPath();c.moveTo(center-width/2,base+14);c.lineTo(center,base+92);c.lineTo(center+width/2,base+14);c.fill();}}
let mobileText=false;
function text(c,value,x,y,size=15,color='#fff0c6'){if(mobileText)size=Math.min(36,size*2);c.fillStyle=color;c.font=`600 ${size}px system-ui`;c.textAlign='center';c.fillText(value,x,y);}
function plate(c,x,y,w,h,color='#08182bc4'){c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,12);c.fill();}
export function wizardArenaField(index,single=false,s=null,match=null,height=650){const center=single?480:240+index*480,cell=s?(s.cellSize||28)*(height>850?1.45:Math.min(1,(height-180)/360)):18,base=height-155,rows=s?.board.length||24,camera=s&&match?wizardCameraHeight(match,s)*cell:0;return {center,cell,x:center-cell*5,y:base-rows*cell+camera,base:base+camera,wizardX:Math.max(single?60:index*480+60,center-cell*5-35),wizardY:height-145};}
function wandPoint(s,field){if(s.wizard==='custom')return {x:field.wizardX+(s.customWizard?.outfit>=8?-34:34),y:field.wizardY-77};const b=STORM_WIZARD_BOUNDS[s.wizard]||STORM_WIZARD_BOUNDS.sorceress,size=Math.min(104/b.w,190/b.h)*.5,w=b.w*size,h=b.h*size;const point=({'sorceress':[.88,.18],'blue-mage':[.12,.17],'wand-apprentice':[.9,.26],'star-sage':[.14,.12],'ice-sorceress':[.85,.1],'spellkeeper':[.46,.4]})[s.wizard]||[.8,.2];return {x:field.wizardX-w/2+w*point[0],y:field.wizardY-h+h*point[1]};}
export function drawWizardTether(c,s,field,time=0){
 const p=s.piece;if(!p||!['ready','playing'].includes(s.status))return;
 const minX=Math.min(...p.cells.map(([x])=>x)),maxX=Math.max(...p.cells.map(([x])=>x)),minY=Math.min(...p.cells.map(([,y])=>y)),maxY=Math.max(...p.cells.map(([,y])=>y));
 const cx=field.x+(p.x+(minX+maxX+1)/2)*field.cell,cy=field.y+(p.y+(minY+maxY+1)/2)*field.cell,from=wandPoint(s,field),rx=(maxX-minX+1)*field.cell/2+8,ry=(maxY-minY+1)*field.cell/2+7;
 c.save();c.strokeStyle='#fbd681bb';c.lineWidth=1.4;c.shadowColor='#ffd782';c.shadowBlur=9;c.beginPath();c.moveTo(from.x,from.y);c.bezierCurveTo(from.x+65,from.y-70,cx-60,cy+45,cx,cy+ry);c.stroke();
 for(let i=0;i<2;i++){c.beginPath();c.ellipse(cx,cy,rx,ry*(.75+i*.25),Math.sin(time*1.7+i)*.18,0,Math.PI*2);c.stroke();}
 c.lineWidth=.9;for(const [x,y]of p.cells){c.beginPath();c.roundRect(field.x+(p.x+x)*field.cell+.5,field.y+(p.y+y)*field.cell+.5,field.cell-1,field.cell-1,3);c.stroke();}
 for(let i=0;i<7;i++){const a=time*1.8+i*Math.PI*2/7;c.fillStyle='#fff2b7';c.beginPath();c.arc(cx+Math.cos(a)*rx,cy+Math.sin(a)*ry,1.7,0,Math.PI*2);c.fill();}c.restore();
}
function playerField(c,s,index,time,reduced,single=false,ending=false,match=null,height=650){
 const f=wizardArenaField(index,single,s,match,height);c.save();c.beginPath();c.rect(index*480,90,480,height-160);c.clip();drawWizardIsland(c,f.center,f.base,f.cell*12);
 for(const platform of s.supports||[])drawWizardIsland(c,f.x+(platform.x+platform.width/2)*f.cell,f.y+platform.row*f.cell,platform.width*f.cell+35);
 for(let y=0;y<s.board.length;y++)for(let x=0;x<10;x++)if(s.board[y][x]){const effect=s.surfaceEffects?.[`${x},${y}`];const landed=s.settled?.find(p=>p.cells.some(([px,py])=>px===x&&py===y));c.save();if(landed&&!reduced){const cx=f.x+(landed.cells.reduce((n,[px])=>n+px+.5,0)/landed.cells.length)*f.cell,cy=f.y+(Math.max(...landed.cells.map(p=>p[1]))+1)*f.cell,angle=Math.sin(landed.age*9)*Math.exp(-landed.age*1.5)*landed.angle;c.translate(cx,cy);c.rotate(angle);c.translate(-cx,-cy);}if(effect?.largeX!==undefined&&(x!==effect.largeX||y!==effect.largeY)){c.restore();continue;}drawWizardBlock(c,f.x+x*f.cell,f.y+y*f.cell,f.cell*(effect?.largeX!==undefined?2:1),s.board[y][x]-1,effect?.ice?'crystal':s.blockStyle,time);c.restore();}

 if(!ending){let gy=s.piece.y;while(s.piece.cells.every(([x,y])=>gy+y+1<s.board.length&&!wizardSolidAt(s,s.piece.x+x,gy+y+1)))gy++;
 c.globalAlpha=.22;for(const [x,y]of s.piece.cells)drawWizardBlock(c,f.x+(s.piece.x+x)*f.cell,f.y+(gy+y)*f.cell,f.cell,s.piece.kind,s.blockStyle,time);c.globalAlpha=1;
 for(const [x,y]of s.piece.cells){if(s.piece.effects?.ultra&&(x%2||y%2))continue;drawWizardBlock(c,f.x+(s.piece.x+x)*f.cell,f.y+(s.piece.y+y)*f.cell,f.cell*(s.piece.effects?.ultra?2:1),s.piece.kind,s.piece.effects?.ice?'crystal':s.blockStyle,time);}
 if(s.piece.effects?.balloon){const p=s.piece,cx=f.x+(p.x+(Math.min(...p.cells.map(([x])=>x))+Math.max(...p.cells.map(([x])=>x))+1)/2)*f.cell,cy=f.y+p.y*f.cell;for(let i=0;i<3;i++){const bx=cx+(i-1)*18,by=cy-32-(i%2)*8;c.strokeStyle='#fff1d2bb';c.lineWidth=1;c.beginPath();c.moveTo(cx,cy+15);c.lineTo(bx,by+12);c.stroke();c.fillStyle=['#fc739e','#f1b7ef','#febd78'][i];c.beginPath();c.ellipse(bx,by,10,14,0,0,Math.PI*2);c.fill();}}
 if(s.piece.effects?.twist)text(c,'↻ TWISTY · rotation locked',f.center,f.y+Math.max(1,s.piece.y)*f.cell-12,10,'#efd0ff');
 drawWizardTether(c,s,f,time);
 for(const piece of s.tumbling){const t=piece.age,fall=Math.max(0,t-.4);c.save();c.translate(f.x+piece.pivotX*f.cell+piece.direction*90*fall*fall,f.y+piece.pivotY*f.cell+200*fall*fall);c.rotate(reduced?0:piece.direction*t);for(const [x,y]of piece.cells)drawWizardBlock(c,(x-piece.pivotX)*f.cell,(y-piece.pivotY)*f.cell,f.cell,piece.kind,s.blockStyle,time);c.restore();}
 const finishY=f.y+(s.board.length-s.target)*f.cell;c.strokeStyle='#ffdc75';c.lineWidth=4;c.beginPath();c.moveTo(f.x-8,finishY);c.lineTo(f.x+10*f.cell+8,finishY);c.stroke();plate(c,f.center-57,finishY-26,114,20,'#624719dd');text(c,'GOLD FINISH',f.center,finishY-11,11,'#ffe8a8');
 const next=s.nextPowerHeight??4;if(next<s.target){const y=f.y+(s.board.length-next)*f.cell,gradient=c.createLinearGradient(f.x,y,f.x+10*f.cell,y);for(const [i,color]of ['#ff6b9a','#ffcf67','#86e5a2','#7dd9ff','#bc9eff'].entries())gradient.addColorStop(i/4,color);c.strokeStyle=gradient;c.lineWidth=4;c.beginPath();c.moveTo(f.x-8,y);c.lineTo(f.x+10*f.cell+8,y);c.stroke();for(let x=f.x;x<f.x+10*f.cell;x+=24){c.save();c.translate(x,y);c.rotate(Math.PI/4);c.fillStyle=['#ff8fa8','#ffd572','#9be3b3','#91ddff','#d5afff'][Math.floor((x-f.x)/24)%5];c.fillRect(-3,-3,6,6);c.strokeStyle='#fff8e3';c.lineWidth=1;c.strokeRect(-3,-3,6,6);c.restore();}plate(c,f.x-10,y-26,166,20,'#192443dd');text(c,'◆ RAINBOW POWER-UP · '+next,f.x+73,y-11,10,'#fff9ee');}

 }
 c.restore(); c.save();c.translate(f.wizardX,f.wizardY);c.scale(.5,.5);drawStormWizard(c,s.wizard,0,0,time,false,s.customWizard);c.restore();drawWizardSidekick(c,s.sidekick,f.wizardX+43,f.wizardY+3,time,{celebrate:s.noticeTime>0||s.particles?.some(p=>p.age<.25),reduced});
 return f;
}
export function drawWizardArena(c,match,width,height,reduced=false){
 c.save();c.fillStyle='#071327';c.fillRect(0,0,width,height);mobileText=height>850;const scale=width/960;c.translate((width-960*scale)/2,0);c.scale(scale,scale);const time=reduced?0:match.elapsed;
 c.save();c.scale(1,height/650);drawWizardBackground(c,match.background,time,reduced);c.restore();text(c,'WIZARD TETRIS · '+(WIZARD_DIFFICULTIES[match.difficulty]?.name||''),480,25,19);
 const single=match.players.length===1;c.strokeStyle='#ffffff60';c.lineWidth=2;c.beginPath();c.moveTo(480,88);c.lineTo(480,height-8);c.stroke();
 for(let i=0;i<match.players.length;i++){const p=match.players[i],f=playerField(c,p,i,time,reduced,single,match.status==='ending'||match.status==='finished',match,height);const name=mobileText?(i===0?'You':match.opponent==='computer'?'Computer':'Player 2'):single?'Your tower':i===0?(match.opponent==='computer'?'You · Arrows / WASD':'Player 1 · WASD'):match.opponent==='computer'?'Computer':'Player 2 · Arrows';
 plate(c,f.center-(mobileText?225:130),36,mobileText?450:260,mobileText?76:46);text(c,name+' · '+p.height+'/'+p.target+' high',f.center,mobileText?66:54,14);text(c,'Unlimited falls'+(mobileText?'':' · '+stormWizard(p.wizard).name),f.center,mobileText?98:72,11,'#dae9ff');
 if(p.choices?.length&&match.status!=='ending'&&match.status!=='finished'){
  if(p.powerFlash>0){const glow=c.createRadialGradient?.(f.center,300,15,f.center,300,220);if(glow?.addColorStop){glow.addColorStop(0,'#ffd75d35');glow.addColorStop(1,'#ffd75d00');c.fillStyle=glow;c.fillRect(f.center-220,80,440,440);}}
  plate(c,f.center-220,mobileText?120:86,440,mobileText?48:34,'#533e12f5');text(c,mobileText?'LEVEL UP! PICK A POWER':'✦ LEVEL UP! CHOOSE YOUR MAGIC ✦',f.center,mobileText?151:109,mobileText?17:18,'#fff2b0');
  for(let slot=0;slot<p.choices.length;slot++){const pos=wizardChoicePosition(i,slot,height),power=wizardPower(p.choices[slot]),attack=power.type==='Attack';c.save();c.translate(pos.x,pos.y);c.scale(mobileText?1.5:1.25,mobileText?1.5:1.25);c.translate(-pos.x,-pos.y);c.save();c.strokeStyle=attack?'#ffa5d3':'#a4ffe1';c.shadowColor=c.strokeStyle;c.shadowBlur=reduced?0:22;c.lineWidth=3+Math.sin(time*5);c.beginPath();c.arc(pos.x,pos.y,38+(reduced?0:Math.sin(time*4)*3),0,Math.PI*2);c.stroke();c.restore();plate(c,pos.x-58,pos.y-52,116,22,attack?'#7f294bdc':'#1d665edc');text(c,power.type.toUpperCase(),pos.x,pos.y-37,11,attack?'#ffe4ee':'#d7fff1');drawWizardPowerIcon(c,power.id,pos.x-33,pos.y-32,66);plate(c,pos.x-59,pos.y+(mobileText?35:31),118,mobileText?90:30,'#13223bdf');text(c,power.name,pos.x,pos.y+(mobileText?60:44),11);text(c,i===0?['C','V','B'][slot]+' · tap / click':['1','2','3'][slot]+' · tap / click',pos.x,pos.y+(mobileText?90:59),14,'#edf2ff');c.restore();}

 }
 const effects=Object.entries(p.piece.effects||{}).filter(([,value])=>value).map(([id])=>wizardPower(id)?.name||id);if(effects.length)text(c,effects.join(' + '),f.center,height-46,11,'#ffe0ed');
 if(p.balanceNotice>0)text(c,'⚠ TOWER LOSING BALANCE!',f.center,height-96,15,'#ffd477');
 if(p.noticeTime>0&&!p.choices?.length){plate(c,f.center-95,430,190,32,'#14213bda');text(c,p.spellNotice,f.center,451,13);}
 text(c,i===0?'Powers: C · V · B | N first':'Powers: 1 · 2 · 3 | Enter',f.center,height-54,16);
 text(c,mobileText?'↔ move · ↓ faster · tap ↻':single?'Choose your blocks below':i===0?(match.opponent==='computer'?'← → move · ↑ rotate · ↓ faster':'A / D move · W rotate · S faster'):'← / → move · ↑ rotate · ↓ faster',f.center,height-22,height>850?24:16,'#eff5ff');
 }
 plate(c,437,38,86,38);text(c,Number.isFinite(match.remaining)?Math.ceil(match.remaining)+'s':'∞',480,64,21);text(c,wizardBackground(match.background).name,480,height-3,12,'#e6eeff');
 if(match.status==='intro'){const t=match.introTime,number=t>=1.8&&t<4.8?String(3-Math.floor(t-1.8)):null;plate(c,250,height/2-85,460,170,'#101e36db');text(c,number|| (t<1.8?'LOOK HOW HIGH!':'BACK TO YOUR ISLAND'),480,height/2+8,number?96:28);text(c,t<1.8?'Reach the GOLD FINISH high in the sky':t<4.8?'Get ready…':'Your tower adventure starts here',480,height/2+55,21);}
 if(match.status==='ending'||match.status==='finished'){plate(c,265,214,430,135,'#101e36e8');const winner=match.winner;const title=winner===-1?'A MAGICAL DRAW!':winner===0?'PLAYER 1 WINS!':match.opponent==='computer'?'COMPUTER WINS!':'PLAYER 2 WINS!';text(c,title,480,259,27);text(c,match.reason||'A little tower magic.',480,297,18);}
 c.restore();
}
export function drawSoloWizardArena(c,s,width,height,reduced=false){drawWizardArena(c,{players:[s],background:s.background,elapsed:s.elapsed,remaining:s.remaining,status:s.status,mode:s.mode,winner:s.won?0:1,reason:s.won?'Your tower reaches the clouds.':'Try another magical tower.'},width,height,reduced);}
