import { createKnightMaze, drawKnightPreview } from './knight-maze.js';
// Register future games here. Engines receive a canvas and shared character/modifiers.
// Each renderer returns start(), pause(), and destroy(); onFinish reports earned coins.
export const GAMES = [
  { id: 'knight-ember', name: 'Knights and Dragons', dimension: '2D', genre: 'ARCADE MAZE QUEST', description: 'Brave the dragon maze. Gather colorful gems, find a sword, and turn the chase around for 30 seconds.', tone: 'dungeon', mode: 'THREE LIVES · CLEAR THE MAZE', instructions: 'Move with WASD / arrow keys, swipe, or use the direction buttons. Collect every gem to win. Swords grant 30 seconds to defeat dragons on contact. Gems earn 1 coin; dragons earn 10. Defeated dragons return after 8 seconds.', width: 760, height: 760, directional: true, preview: drawKnightPreview, create: createKnightMaze },
  { id: 'orbit-garden', name: 'Orbit Garden', dimension: '3D', genre: 'EXPLORE & DISCOVER', description: 'A tiny world with a different perspective. Find your way through a garden floating in space.', tone: 'space', create: createAdventure },
];
export function drawCharacter(ctx, x, y, scale, character) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  ctx.fillStyle = '#28362b22'; ctx.beginPath(); ctx.ellipse(0, 14, 21, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#354134'; ctx.fillRect(-13, 6, 9, 9); ctx.fillRect(5, 6, 9, 9);
  ctx.fillStyle = character.color; ctx.beginPath(); ctx.roundRect(-14, -7, 28, 18, 6); ctx.fill();
  if (character.style === 'antenna') { ctx.fillRect(-1, -39, 3, 12); ctx.beginPath(); ctx.arc(0, -40, 5, 0, Math.PI * 2); ctx.fill(); }
  if (character.style === 'ears') { ctx.beginPath(); ctx.roundRect(-17, -40, 8, 18, 4); ctx.roundRect(9, -40, 8, 18, 4); ctx.fill(); }
  ctx.beginPath(); ctx.roundRect(-21, -29, 42, 32, 11); ctx.fill();
  ctx.fillStyle = '#28322c'; ctx.beginPath(); ctx.ellipse(-8, -15, 2.5, 3.5, 0, 0, 7); ctx.ellipse(8, -15, 2.5, 3.5, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -9, 3, 0, Math.PI); ctx.strokeStyle = '#28322c'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
}
function coin(ctx, x, y, size) {
  ctx.fillStyle = '#c69838'; ctx.beginPath(); ctx.ellipse(x + 2, y + 2, size, size * 1.12, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#f5d47c'; ctx.beginPath(); ctx.ellipse(x, y, size, size * 1.12, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#ad7c2a'; ctx.font = `bold ${size * 1.4}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('✦', x, y + 1);
}
function flower(ctx, x, y, size, color) { ctx.fillStyle = color; for (let j = 0; j < 5; j++) { ctx.beginPath(); ctx.arc(x + Math.cos(j * 1.26) * size, y + Math.sin(j * 1.26) * size, size * .75, 0, 7); ctx.fill(); } ctx.fillStyle = '#f3db8e'; ctx.beginPath(); ctx.arc(x,y,size * .6,0,7);ctx.fill(); }
function drawMeadow(ctx, player, coins, character, modifiers, time = 0) {
  ctx.fillStyle = '#dce3c9'; ctx.fillRect(0, 0, 960, 540);
  ctx.fillStyle = '#cad6b0'; ctx.beginPath();ctx.ellipse(450,295,410,185,-.05,0,7);ctx.fill();
  ctx.strokeStyle = '#e3e8cf';ctx.lineWidth = 45;ctx.beginPath();ctx.moveTo(60,400);ctx.bezierCurveTo(280,100,640,460,900,150);ctx.stroke();
  for (let i = 0; i < 45; i++) { const x = 30 + (i * 137) % 900, y = 40 + (i * 83) % 460; ctx.strokeStyle = '#a6b98a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-3,y-4);ctx.lineTo(x,y);ctx.lineTo(x+4,y-6);ctx.stroke(); if(modifiers.garden)flower(ctx,x+8,y,4,i%2?'#e9a185':'#ad93c5'); }
  for (const [x,y,s] of [[100,100,1],[800,120,1.2],[840,430,.8],[170,440,.7]]) { ctx.fillStyle='#a9b99555';ctx.beginPath();ctx.ellipse(x+7,y+35,38*s,14*s,0,0,7);ctx.fill();ctx.fillStyle='#78845d';ctx.fillRect(x-5,y-15,10,45);ctx.fillStyle=modifiers.garden?'#a5a0bd':'#8aa271';ctx.beginPath();ctx.ellipse(x,y-30,32*s,45*s,0,0,7);ctx.fill(); }
  for (const c of coins) coin(ctx,c.x,c.y + Math.sin(time * 3 + c.x) * 3,10);
  drawCharacter(ctx,player.x,player.y,1.2,character);
}
// Perspective projection of world-space ground, trees, cubes, coins and explorer.
// Keep progression independent of this renderer so it can be replaced with WebGL.
function drawOrbit(ctx, player, coins, character, modifiers, time = 0) {
  ctx.fillStyle = '#dcd6e8';ctx.fillRect(0,0,960,540);
  for(let i=0;i<36;i++){ctx.fillStyle='#ffffff99';ctx.beginPath();ctx.arc((i*173)%960,(i*79)%540,i%3===0?2:1,0,7);ctx.fill();}
  const project=(x,y,z=0)=>{const depth=650+y*.62;const s=630/depth;return {x:480+(x-480)*s,y:115+(y*.62-z)*s,s};};
  function polygon(points,color){ctx.fillStyle=color;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fill();}
  const tl=project(40,30),tr=project(920,30),br=project(920,510),bl=project(40,510);
  polygon([bl,br,{x:br.x,y:br.y+35},{x:bl.x,y:bl.y+35}],'#9690ae');
  polygon([tr,br,{x:br.x,y:br.y+35},{x:tr.x,y:tr.y+35}],'#aca5bd');polygon([tl,tr,br,bl],'#c5c5b5');
  ctx.strokeStyle='#deded2';ctx.lineWidth=1;for(let x=40;x<=920;x+=80){const a=project(x,30),b=project(x,510);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}for(let y=30;y<=510;y+=60){const a=project(40,y),b=project(920,y);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
  const objects=[...coins.map(c=>({...c,type:'coin'})),{...player,type:'player'},...[{x:100,y:120},{x:840,y:140},{x:130,y:450},{x:820,y:450}].map(c=>({...c,type:'tree'}))].sort((a,b)=>a.y-b.y);
  for(const obj of objects){const p=project(obj.x,obj.y);if(obj.type==='coin'){const a=project(obj.x,obj.y,20+Math.sin(time*3+obj.x)*4);coin(ctx,a.x,a.y,11*p.s);}else if(obj.type==='player')drawCharacter(ctx,p.x,p.y,1.3*p.s,character);else{const top=project(obj.x,obj.y,65),l=project(obj.x-23,obj.y,48),r=project(obj.x+23,obj.y,48),front=project(obj.x,obj.y+28,48),bottom=project(obj.x,obj.y+28,10);ctx.fillStyle='#7e806a';ctx.fillRect(p.x-3,p.y-28*p.s,6,29*p.s);polygon([top,r,front,l],modifiers.garden?'#e0b2c5':'#b1b89a');polygon([l,front,bottom,{x:l.x,y:l.y+38*p.s}],modifiers.garden?'#b998b6':'#8d9c80');polygon([front,r,{x:r.x,y:r.y+38*p.s},bottom],modifiers.garden?'#c7a3c1':'#a0ad8e');}}
  if(modifiers.garden)for(let i=0;i<20;i++){const p=project(180+(i*97)%600,60+(i*83)%400);flower(ctx,p.x,p.y,4*p.s,'#f0c6a3');}
}
export function drawPreview(canvas, game, character, modifiers) {
  if(game.preview){game.preview(canvas,character,modifiers);return;}
  const ctx=canvas.getContext('2d');if(!ctx)return;
  const coins=[{x:340,y:170},{x:600,y:240},{x:710,y:370},{x:270,y:350}];
  (game.dimension==='3D'?drawOrbit:drawMeadow)(ctx,{x:480,y:300},coins,character,modifiers);
}
export function createAdventure({canvas,game,character,modifiers,onHud,onFinish}) {
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Your browser does not support canvas.');
  const controller=new AbortController(),keys=new Set();let player={x:480,y:280},coins=[],remaining=45,earned=0,active=false,paused=false,frame=0,last=0,target=null;
  const draw=game.dimension==='3D'?drawOrbit:drawMeadow;
  function spawn(){coins=Array.from({length:12},()=>({x:210+Math.random()*540,y:100+Math.random()*330}));}spawn();
  const options={signal:controller.signal};
  const controls=['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d'];
  canvas.addEventListener('keydown',e=>{const key=e.key.toLowerCase();if(controls.includes(key)){e.preventDefault();keys.add(key);target=null;}},options);
  canvas.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()),options);
  canvas.addEventListener('blur',()=>keys.clear(),options);
  function pointer(e){const r=canvas.getBoundingClientRect();let x=(e.clientX-r.left)/r.width*960,y=(e.clientY-r.top)/r.height*540;if(game.dimension==='3D'){const v=Math.max(0,Math.min(204,y-115));const worldY=v*650/(.62*(630-v));x=480+(x-480)*(650+worldY*.62)/630;y=worldY;}target={x:Math.max(65,Math.min(895,x)),y:Math.max(65,Math.min(475,y))};}
  canvas.addEventListener('pointerdown',e=>{canvas.focus();canvas.setPointerCapture(e.pointerId);pointer(e);},options);
  canvas.addEventListener('pointermove',e=>{if(e.buttons)pointer(e);},options);
  function finish(){active=false;onFinish(earned);}
  function tick(now){const dt=Math.min((now-last)/1000,.04);last=now;if(active&&!paused&&!document.hidden){remaining=Math.max(0,remaining-dt);let dx=Number(keys.has('arrowright')||keys.has('d'))-Number(keys.has('arrowleft')||keys.has('a')),dy=Number(keys.has('arrowdown')||keys.has('s'))-Number(keys.has('arrowup')||keys.has('w'));if(target){dx=target.x-player.x;dy=target.y-player.y;if(Math.hypot(dx,dy)<5){dx=dy=0;target=null;}}const length=Math.hypot(dx,dy);if(length){const step=Math.min(190*modifiers.speed*dt,target?length:Infinity);player.x=Math.max(65,Math.min(895,player.x+dx/length*step));player.y=Math.max(65,Math.min(475,player.y+dy/length*step));}coins=coins.filter(c=>{if(Math.hypot(c.x-player.x,c.y-player.y)<24*modifiers.pickupRadius){earned+=2;return false;}return true;});if(!coins.length)spawn();onHud({remaining:Math.ceil(remaining),earned});if(remaining<=0)finish();}draw(ctx,player,coins,character,modifiers,now/1000);frame=requestAnimationFrame(tick);}
  frame=requestAnimationFrame(tick);
  return {start(){player={x:480,y:280};spawn();remaining=45;earned=0;paused=false;active=true;keys.clear();target=null;canvas.focus();},pause(value){paused=value;keys.clear();target=null;},destroy(){cancelAnimationFrame(frame);controller.abort();if(active)finish();}};
}
