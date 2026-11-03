import {drawWizardBackground,drawWizardBlock,wizardBackground} from './wizard-themes.js';
import {drawStormWizard,stormWizard} from './storm-wizards.js';
import {STORM_WIZARD_BOUNDS} from './storm-wizard-bounds.js';
import {STORM_MODES,WIZARD_SPELLS} from './wizard-rules.js';
import {wizardPickupPosition} from './wizard-match.js';
let island;
export function wizardIslandAtlas(){if(typeof Image==='undefined')return null;if(!island){island=new Image();island.src=new URL('../assets/wizard-floating-island.png',import.meta.url).href;}return island;}
export function drawWizardIsland(c,center,base,width=260){const image=wizardIslandAtlas();if(image?.complete&&image.naturalWidth){c.drawImage(image,center-width/2,base-width*.16,width,width*.5);}else{c.fillStyle='#7cbb79';c.beginPath();c.ellipse(center,base+7,width/2,15,0,0,Math.PI*2);c.fill();c.fillStyle='#67577f';c.beginPath();c.moveTo(center-width/2,base+14);c.lineTo(center,base+92);c.lineTo(center+width/2,base+14);c.fill();}}
function text(c,value,x,y,size=15,color='#fff0c6'){c.fillStyle=color;c.font=`600 ${size}px system-ui`;c.textAlign='center';c.fillText(value,x,y);}
function plate(c,x,y,w,h,color='#08182bc4'){c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,12);c.fill();}
export function wizardArenaField(index,single=false){const center=single?480:270+index*420,cell=18;return {center,cell,x:center-90,y:106,base:538,wizardX:center-113,wizardY:556};}
function wandPoint(s,field){const b=STORM_WIZARD_BOUNDS[s.wizard]||STORM_WIZARD_BOUNDS.sorceress,size=Math.min(104/b.w,190/b.h)*.5,w=b.w*size,h=b.h*size;const point=({'sorceress':[.88,.18],'blue-mage':[.12,.17],'wand-apprentice':[.9,.26],'star-sage':[.14,.12],'ice-sorceress':[.85,.1],'spellkeeper':[.46,.4]})[s.wizard]||[.8,.2];return {x:field.wizardX-w/2+w*point[0],y:field.wizardY-h+h*point[1]};}
export function drawWizardTether(c,s,field,time=0){
 const p=s.piece;if(!p||!['ready','playing'].includes(s.status))return;
 const minX=Math.min(...p.cells.map(([x])=>x)),maxX=Math.max(...p.cells.map(([x])=>x)),minY=Math.min(...p.cells.map(([,y])=>y)),maxY=Math.max(...p.cells.map(([,y])=>y));
 const cx=field.x+(p.x+(minX+maxX+1)/2)*field.cell,cy=field.y+(p.y+(minY+maxY+1)/2)*field.cell,from=wandPoint(s,field),rx=(maxX-minX+1)*field.cell/2+8,ry=(maxY-minY+1)*field.cell/2+7;
 c.save();c.strokeStyle='#fbd681bb';c.lineWidth=1.4;c.shadowColor='#ffd782';c.shadowBlur=9;c.beginPath();c.moveTo(from.x,from.y);c.bezierCurveTo(from.x+65,from.y-70,cx-60,cy+45,cx,cy+ry);c.stroke();
 for(let i=0;i<2;i++){c.beginPath();c.ellipse(cx,cy,rx,ry*(.75+i*.25),Math.sin(time*1.7+i)*.18,0,Math.PI*2);c.stroke();}
 c.lineWidth=.9;for(const [x,y]of p.cells){c.beginPath();c.roundRect(field.x+(p.x+x)*field.cell+.5,field.y+(p.y+y)*field.cell+.5,field.cell-1,field.cell-1,3);c.stroke();}
 for(let i=0;i<7;i++){const a=time*1.8+i*Math.PI*2/7;c.fillStyle='#fff2b7';c.beginPath();c.arc(cx+Math.cos(a)*rx,cy+Math.sin(a)*ry,1.7,0,Math.PI*2);c.fill();}c.restore();
}
function playerField(c,s,index,time,reduced,single=false,ending=false){
 const f=wizardArenaField(index,single);drawWizardIsland(c,f.center,f.base);
 for(let y=0;y<24;y++)for(let x=0;x<10;x++)if(s.board[y][x])drawWizardBlock(c,f.x+x*f.cell,f.y+y*f.cell,f.cell,s.board[y][x]-1,s.blockStyle,time);
 c.save();c.translate(f.wizardX,f.wizardY);c.scale(.5,.5);drawStormWizard(c,s.wizard,0,0,time,false);c.restore();
 if(!ending){let gy=s.piece.y;while(s.piece.cells.every(([x,y])=>gy+y+1<24&&!s.board[gy+y+1][s.piece.x+x]))gy++;
 c.globalAlpha=.22;for(const [x,y]of s.piece.cells)drawWizardBlock(c,f.x+(s.piece.x+x)*f.cell,f.y+(gy+y)*f.cell,f.cell,s.piece.kind,s.blockStyle,time);c.globalAlpha=1;
 for(const [x,y]of s.piece.cells)drawWizardBlock(c,f.x+(s.piece.x+x)*f.cell,f.y+(s.piece.y+y)*f.cell,f.cell,s.piece.kind,s.blockStyle,time);
 drawWizardTether(c,s,f,time);
 for(const piece of s.tumbling){const t=piece.age,fall=Math.max(0,t-.4);c.save();c.translate(f.x+piece.pivotX*f.cell+piece.direction*90*fall*fall,f.y+piece.pivotY*f.cell+200*fall*fall);c.rotate(reduced?0:piece.direction*t);for(const [x,y]of piece.cells)drawWizardBlock(c,(x-piece.pivotX)*f.cell,(y-piece.pivotY)*f.cell,f.cell,piece.kind,s.blockStyle,time);c.restore();}
 if(s.mode!=='survival'){const y=f.y+(24-s.target)*f.cell;c.strokeStyle='#ffe5a777';c.lineWidth=1;c.setLineDash([5,7]);c.beginPath();c.moveTo(f.x-6,y);c.lineTo(f.x+186,y);c.stroke();c.setLineDash([]);}
 }
 return f;
}
export function drawWizardArena(c,match,width,height,reduced=false){
 c.save();c.fillStyle='#071327';c.fillRect(0,0,width,height);const scale=Math.min(width/960,height/650);c.translate((width-960*scale)/2,(height-650*scale)/2);c.scale(scale,scale);const time=reduced?0:match.elapsed;
 drawWizardBackground(c,match.background,time,reduced);text(c,'WIZARD TETRIS',480,25,19);
 const single=match.players.length===1;
 for(let i=0;i<match.players.length;i++){const p=match.players[i],f=playerField(c,p,i,time,reduced,single,match.status==='ending'||match.status==='finished');const name=single?'Your tower':i===0?'Player 1 · WASD':match.opponent==='computer'?'Computer':'Player 2 · Arrows';
 plate(c,f.center-130,36,260,46);text(c,name+' · '+p.height+'/'+p.target+' high',f.center,54,14);text(c,Math.max(0,3-p.misses)+' lives · '+stormWizard(p.wizard).name,f.center,72,11,'#dae9ff');
 if(p.pickup&&match.status!=='ending'&&match.status!=='finished'){const pos=wizardPickupPosition(i,time),spell=WIZARD_SPELLS.find(sp=>sp.id===p.pickup.id);c.save();c.shadowColor='#ffe99b';c.shadowBlur=14;c.fillStyle='#ffd979';c.beginPath();c.arc(pos.x,pos.y,23,0,Math.PI*2);c.fill();c.restore();text(c,'✦',pos.x,pos.y+7,25,'#674a7c');plate(c,pos.x-58,pos.y+30,116,38,'#14213bc9');text(c,spell?.name||'Magic',pos.x,pos.y+45,12);text(c,i===0?'Click / Space':match.opponent==='computer'?'Computer item':'Click / Enter',pos.x,pos.y+59,10,'#e7eaff');}
 if(p.noticeTime>0){plate(c,f.center-95,430,190,32,'#14213bda');text(c,p.spellNotice,f.center,451,13);}
 text(c,single?'Choose your blocks below':i===0?'A / D move · W rotate · S faster':'← / → move · ↑ rotate · ↓ faster',f.center,626,12,'#eff5ff');
 }
 plate(c,437,38,86,38);text(c,Number.isFinite(match.remaining)?Math.ceil(match.remaining)+'s':'∞',480,64,21);text(c,wizardBackground(match.background).name,480,644,11,'#e6eeff');
 if(match.status==='ending'||match.status==='finished'){plate(c,265,214,430,135,'#101e36e8');const winner=match.winner;const title=winner===-1?'A MAGICAL DRAW!':winner===0?'PLAYER 1 WINS!':match.opponent==='computer'?'COMPUTER WINS!':'PLAYER 2 WINS!';text(c,title,480,259,27);text(c,match.reason||'A little tower magic.',480,297,18);}
 c.restore();
}
export function drawSoloWizardArena(c,s,width,height,reduced=false){drawWizardArena(c,{players:[s],background:s.background,elapsed:s.elapsed,remaining:s.remaining,status:s.status,mode:s.mode,winner:s.won?0:1,reason:s.won?'Your tower reaches the clouds.':'Try another magical tower.'},width,height,reduced);}
