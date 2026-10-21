import { createMazeAudio } from './maze-audio.js';

import { ICE_CONES, ICE_FLAVORS, ICE_TOPPINGS, ICE_UNLOCKS, iceIngredientUnlocked } from './ice-settings.js';

export const ICE_CLIP_SECONDS=7.5;
export function createIceRecipe(){return {cone:'waffle',flavor:'vanilla',toppings:[]};}
const iceClamp=(n,a,b)=>Math.max(a,Math.min(b,n));
// Seeded scatter stays still between frames, without rows or a repeating grid.
export function scatterIceChips(count=22,seed=9137){
  let value=seed;
  const random=()=>{value=(value*1664525+1013904223)>>>0;return value/4294967296;};
  const points=[];
  while(points.length<count){
    const x=random()*110-55,y=random()*85-75;
    if((x/60)**2+((y+30)/50)**2>1||points.some(p=>Math.hypot(p.x-x,p.y-y)<9))continue;
    points.push({x,y,angle:random()*Math.PI,size:3+random()*3});
  }
  return points;
}
const ICE_CHIP_POINTS=scatterIceChips();
export const ICE_BITES=[{x:29,y:-65,r:60},{x:-32,y:-40,r:65},{x:12,y:30,r:73},{x:0,y:113,r:66}];
export function iceBiteCount(time){return ICE_BITES.filter((_,i)=>time>=2.1+i*.95).length;}
function iceOval(ctx,x,y,rx,ry,color){
  ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();
}
function iceShape(ctx,points,color){
  ctx.fillStyle=color;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();
}
export function drawIceDessert(ctx,recipe,x,y,scale=1,bites=0){
  ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
  // Intersect the dessert with the outside of each bite; the remaining portion
  // keeps its original size and position, with visible scalloped bite edges.
  if(bites>0){ctx.beginPath();ctx.rect(-200,-82,400,282);ctx.clip();}
  for(const bite of ICE_BITES.slice(0,bites)){
    ctx.beginPath();ctx.rect(-200,-200,400,400);
    ctx.moveTo(bite.x+bite.r,bite.y);ctx.arc(bite.x,bite.y,bite.r,0,Math.PI*2);
    ctx.clip('evenodd');
  }
  const coneColor={waffle:'#dca25e',sugar:'#edc88b',chocolate:'#6b4336',cup:'#8fcfd3',pretzel:'#a96f36',cookie:'#cfab73'}[recipe.cone];
  if(recipe.cone==='cup'){
    iceShape(ctx,[[-63,5],[63,5],[47,100],[-47,100]],coneColor);
    for(let i=0;i<5;i++){ctx.fillStyle=['#ef90ad','#f3c871','#b3d8af'][i%3];ctx.fillRect(-42+i*18,25,12,55);}
    iceOval(ctx,0,6,64,12,'#e7fcf3');iceOval(ctx,0,6,55,7,'#659ba5');
  }else{
    iceShape(ctx,[[-57,5],[57,5],[0,150]],coneColor);
    ctx.save();ctx.beginPath();ctx.moveTo(-55,6);ctx.lineTo(55,6);ctx.lineTo(0,148);ctx.closePath();ctx.clip();
    ctx.strokeStyle=recipe.cone==='chocolate'?'#ae7d57':'#b87a41';ctx.lineWidth=2;
    for(let i=-140;i<150;i+=19){
      ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i+130,150);ctx.moveTo(i,0);ctx.lineTo(i-130,150);ctx.stroke();
    }
    ctx.restore();iceOval(ctx,0,6,57,9,'#f3d29d');
  }
  if(recipe.cone==='pretzel'||recipe.cone==='cookie'){
    ctx.fillStyle=recipe.cone==='pretzel'?'#fff0ca':'#6f4837';
    for(const [x,y] of [[-30,25],[20,21],[0,43],[-15,69],[12,85],[0,117]])ctx.fillRect(x,y,recipe.cone==='cookie'?6:3,4);
  }
  const flavor=ICE_FLAVORS[recipe.flavor];
  iceOval(ctx,0,-30,69,61,flavor.color);
  for(let i=0;i<6;i++)iceOval(ctx,-52+i*21,7,16,13,flavor.color);
  if(recipe.flavor==='rainbow'){
    ctx.save();ctx.beginPath();ctx.ellipse(0,-30,69,61,0,0,7);ctx.clip();
    for(let i=0;i<4;i++){ctx.fillStyle=['#a4d9e8','#b6d9a1','#f8d788','#ef9bb9'][i];ctx.fillRect(-75,-90+i*32,150,29);}
    ctx.restore();
  }
  iceOval(ctx,-22,-57,24,10,'#ffffff44');
  if(recipe.flavor==='mint'||recipe.flavor==='cookies'||recipe.toppings.includes('chips')){
    for(const chip of ICE_CHIP_POINTS){
      ctx.save();ctx.translate(chip.x,chip.y);ctx.rotate(chip.angle);
      iceShape(ctx,[[-chip.size,2],[0,-chip.size],[chip.size,1],[1,chip.size]],'#69463e');ctx.restore();
    }
  }
  if(recipe.toppings.includes('sauce')){
    ctx.strokeStyle='#633c32';ctx.lineWidth=7;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(-48,-46);ctx.bezierCurveTo(-25,-66,-22,10,0,-37);ctx.bezierCurveTo(22,-70,28,3,48,-30);ctx.stroke();
  }
  if(recipe.toppings.includes('sprinkles'))for(let i=0;i<35;i++){
    ctx.save();ctx.translate(-52+(i*29)%105,-72+(i*17)%78);ctx.rotate(i);
    ctx.fillStyle=['#df5283','#f5ce4d','#65b8c5','#fff7e1','#9c70c8'][i%5];ctx.fillRect(-3,-1,7,3);ctx.restore();
  }
  if(recipe.toppings.includes('stars'))for(let i=0;i<7;i++){
    const x=-44+(i*29)%90,y=-63+(i*23)%60;
    iceShape(ctx,Array.from({length:10},(_,j)=>[x+Math.cos(j*Math.PI/5-Math.PI/2)*(j%2?3:8),y+Math.sin(j*Math.PI/5-Math.PI/2)*(j%2?3:8)]),'#ffe18b');
  }
  if(recipe.toppings.includes('caramel')){
    ctx.strokeStyle='#bc792e';ctx.lineWidth=6;ctx.lineCap='round';ctx.beginPath();
    ctx.moveTo(-47,-42);ctx.bezierCurveTo(-22,-80,-20,0,1,-40);ctx.bezierCurveTo(25,-78,24,0,46,-26);ctx.stroke();
  }
  if(recipe.toppings.includes('marshmallows'))for(const [x,y] of [[-37,-41],[5,-63],[35,-30],[-7,-12]]){
    ctx.fillStyle='#fff8ef';ctx.beginPath();ctx.roundRect(x-7,y-6,14,13,4);ctx.fill();iceOval(ctx,x,y-5,7,3,'#ffe5ee');
  }
  if(recipe.toppings.includes('berries'))for(const [x,y,i] of [[-42,-27,0],[-18,-64,1],[23,-47,0],[37,-15,1]]){
    iceOval(ctx,x,y,8,8,i?'#686ba6':'#cf5479');iceOval(ctx,x-2,y-3,2,2,'#ffffff88');
  }
  if(recipe.toppings.includes('cream')){
    iceOval(ctx,0,-87,28,12,'#fffaf0');iceOval(ctx,2,-101,20,11,'#fffaf0');iceOval(ctx,5,-113,11,9,'#fffaf0');
  }
  if(recipe.toppings.includes('cherry')){
    const cy=recipe.toppings.includes('cream')?-126:-94;
    iceOval(ctx,3,cy,11,10,'#d44c65');iceOval(ctx,0,cy-3,3,2,'#ffbdba');
    ctx.strokeStyle='#53754b';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(4,cy-7);ctx.quadraticCurveTo(1,cy-26,15,cy-25);ctx.stroke();
  }
  ctx.restore();
}
function drawIceDragon(ctx,x,y,time,mouth,headX=0,headY=0){
  ctx.save();ctx.translate(x,y);
  // A friendly, round dragon with folded wings, little horns and expressive eyes.
  iceShape(ctx,[[45,60],[130,20],[114,120],[65,105]],'#6899a4');
  iceShape(ctx,[[52,64],[114,40],[99,93],[64,100]],'#acc6cf');
  iceShape(ctx,[[40,139],[127,151],[148,124],[135,170],[65,174]],'#71a991');
  iceOval(ctx,35,118,63,75,'#71a991');iceOval(ctx,15,127,36,56,'#bdd4a0');
  iceOval(ctx,-1,185,30,12,'#578c79');iceOval(ctx,67,185,30,12,'#578c79');
  for(let i=0;i<4;i++)iceShape(ctx,[[64+i*10,44+i*26],[86+i*9,54+i*26],[66+i*9,66+i*26]],'#e4c177');
  ctx.strokeStyle='#81b69b';ctx.lineWidth=48;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(28,80);ctx.quadraticCurveTo(20+headX,60+headY,headX+8,headY+28);ctx.stroke();
  ctx.save();ctx.translate(headX,headY);
  iceOval(ctx,0,19,64,62,'#81b69b');
  iceShape(ctx,[[-34,-29],[-44,-66],[-13,-38]],'#f3dfac');
  iceShape(ctx,[[24,-34],[42,-65],[43,-17]],'#f3dfac');
  iceOval(ctx,-46,43,44,25,'#9dcaab');
  iceOval(ctx,-17,0,15,20,'#fff7e8');iceOval(ctx,23,0,14,19,'#fff7e8');
  iceOval(ctx,-22,2,6,10,'#29464e');iceOval(ctx,18,2,6,10,'#29464e');
  iceOval(ctx,-24,-2,2,3,'#fff');iceOval(ctx,16,-2,2,3,'#fff');
  iceOval(ctx,-66,36,3,3,'#537e6e');iceOval(ctx,-44,31,3,3,'#537e6e');
  iceOval(ctx,-29,29,11,5,'#eba99c');
  if(mouth>0){
    iceOval(ctx,-54,56,29,8+mouth*22,'#5b3a49');
    iceOval(ctx,-56,65+mouth*10,17,5,'#eb9baf');
    iceShape(ctx,[[-73,48],[-65,48],[-68,59]],'#fff7de');
  }else{
    ctx.strokeStyle='#426d61';ctx.lineWidth=3;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-78,53);ctx.quadraticCurveTo(-56,67,-35,51);ctx.stroke();
  }
  ctx.restore();
  ctx.save();ctx.translate(-6,92);ctx.rotate(Math.sin(time*4)*.08);
  iceOval(ctx,-15,0,30,13,'#81b69b');ctx.restore();
  ctx.restore();
}
export function drawIceScene(ctx,recipe,width,height,clipTime=null,reducedMotion=false){
  ctx.save();ctx.scale(width/900,height/620);
  ctx.fillStyle='#fff1df';ctx.fillRect(0,0,900,620);
  for(let i=0;i<12;i++){ctx.fillStyle=i%2?'#f3b8c5':'#fff5e7';ctx.fillRect(i*75,0,75,68);iceOval(ctx,i*75+37.5,68,37.5,18,ctx.fillStyle);}
  ctx.fillStyle='#e4f2ed';ctx.fillRect(55,124,790,330);
  ctx.strokeStyle='#aaccc3';ctx.lineWidth=7;ctx.strokeRect(55,124,790,330);
  ctx.fillStyle='#cbe4db';ctx.fillRect(445,124,8,330);
  ctx.fillStyle='#c79575';ctx.fillRect(0,470,900,150);ctx.fillStyle='#eec8a2';ctx.fillRect(0,456,900,24);
  ctx.textAlign='center';ctx.fillStyle='#533e4a';ctx.font='bold 28px sans-serif';
  ctx.fillText(clipTime===null?'THE LITTLE DRAGON ICE CREAM PARLOR':'A treat for your dragon!',450,111);
  if(clipTime===null){
    iceOval(ctx,450,493,145,20,'#a67c6244');
    drawIceDessert(ctx,recipe,450,307,1.15);
    ctx.font='20px sans-serif';ctx.fillStyle='#fff6e8';ctx.fillText(ICE_FLAVORS[recipe.flavor].name+' · '+ICE_CONES[recipe.cone],450,566);
  }else{
    const t=clipTime;
    const arrive=iceClamp(t/1.4,0,1),bites=iceBiteCount(t);
    const biteIndex=Math.min(3,Math.max(0,Math.floor((t-1.5)/.95)));
    const phase=iceClamp((t-1.5-biteIndex*.95)/.95,0,1),target=ICE_BITES[biteIndex];
    const lunge=t>=1.5&&t<5.35?(reducedMotion ? .65 :Math.sin(phase*Math.PI)):0;
    const mouth=lunge>.3&&phase<.65?.9:lunge>.15?.15:0;
    drawIceDragon(ctx,900-arrive*330,277,reducedMotion?0:t,mouth,(420+target.x-516)*lunge,(314+target.y-333)*lunge);
    if(bites<4)drawIceDessert(ctx,recipe,420,314,1,bites);
    if(!reducedMotion&&bites>0&&t<5.5){
      const bite=ICE_BITES[bites-1],elapsed=t-(2.1+(bites-1)*.95);
      if(elapsed<.35)for(let i=0;i<5;i++)iceOval(ctx,420+bite.x+(i-2)*9,314+bite.y+elapsed*95+i*4,3,3,ICE_FLAVORS[recipe.flavor].color);
    }
    if(t>=5.5){
      ctx.fillStyle='#fff8e8';ctx.beginPath();ctx.roundRect(200,167,280,95,22);ctx.fill();
      iceShape(ctx,[[470,239],[505,270],[454,254]],'#fff8e8');
      ctx.fillStyle='#533e4a';ctx.font='bold 33px sans-serif';ctx.fillText('Yum! Thank you!',340,224);
      ctx.font='23px sans-serif';ctx.fillText('One very happy dragon.',450,565);
      for(let i=0;i<3;i++){ctx.fillStyle='#d96d8f';ctx.font='30px sans-serif';ctx.fillText('♥',610+i*45,200-i*24);}
    }
  }
  ctx.restore();
}
export function drawIcePreview(canvas){
  const ctx=canvas.getContext('2d');if(!ctx)return;
  drawIceScene(ctx,{cone:'waffle',flavor:'strawberry',toppings:['sprinkles','cream','cherry']},canvas.width,canvas.height);
}
export function createIceCream({canvas,onHud,onFinish,controls=document.querySelector('#ice-controls'),getUpgrades=()=>[]}){
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('Your browser does not support canvas.');
  const audio=createMazeAudio(),controller=new AbortController();
  const reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;
  let recipe=createIceRecipe(),step=0,active=false,paused=false,clip=null,spoken=false,lastBites=0,destroyed=false,last=0,frame;
  const steps=['Cone','Ice cream','Toppings'];
  const tabs=document.createElement('div');tabs.className='ice-steps';
  const heading=document.createElement('h3');heading.tabIndex=-1;
  const choices=document.createElement('div');choices.className='ice-choices';
  const navigation=document.createElement('div');navigation.className='ice-navigation';
  const back=document.createElement('button'),next=document.createElement('button');
  back.type=next.type='button';back.className='button outline';next.className='button dark';back.textContent='← Back';
  navigation.append(back,next);controls.replaceChildren(tabs,heading,choices,navigation);
  const stepButtons=steps.map((label,index)=>{
    const button=document.createElement('button');button.type='button';button.className='button outline';button.textContent=(index+1)+'. '+label;
    button.onclick=()=>{if(active&&!paused&&clip===null){step=index;renderControls();heading.focus({preventScroll:true});}};
    tabs.append(button);return button;
  });
  function renderControls(){
    const locked=!active||paused||clip!==null;
    stepButtons.forEach((button,index)=>{button.disabled=locked;button.setAttribute('aria-pressed',String(index===step));});
    heading.textContent=clip!==null?'Your dragon is enjoying its ice cream!':step===0?'Choose your cone':step===1?'Choose your ice cream':'Choose your toppings — mix as many as you like';
    choices.replaceChildren();
    const options=step===0?ICE_CONES:step===1?Object.fromEntries(Object.entries(ICE_FLAVORS).map(([id,f])=>[id,f.name])):ICE_TOPPINGS;
    for(const [id,label] of Object.entries(options)){
      const button=document.createElement('button');button.type='button';button.className='button outline';const kind=step===0?'cone':step===1?'flavor':'topping',owned=iceIngredientUnlocked(kind,id,getUpgrades());
      button.textContent=label+(!owned?' · Shop: 200 coins':ICE_UNLOCKS[kind]?.[id]?' · Owned':'');
      button.disabled=locked||!owned;
      const selected=step===0?recipe.cone===id:step===1?recipe.flavor===id:recipe.toppings.includes(id);
      button.setAttribute('aria-pressed',String(selected));
      button.onclick=()=>{
        if(!active||paused||clip!==null||!iceIngredientUnlocked(kind,id,getUpgrades()))return;
        if(step===0)recipe.cone=id;else if(step===1)recipe.flavor=id;
        else recipe.toppings=recipe.toppings.includes(id)?recipe.toppings.filter(item=>item!==id):[...recipe.toppings,id];
        audio.play('gem');renderControls();
        choices.children[Object.keys(options).indexOf(id)]?.focus({preventScroll:true});
      };
      choices.append(button);
    }
    back.disabled=locked||step===0;next.disabled=locked;
    next.textContent=step===2?'Done — feed the dragon!':'Next: '+steps[step+1]+' →';
    onHud({text:clip!==null?'Watch your dragon enjoy the treat!':steps[step]+' · '+recipe.toppings.length+' toppings · More ingredients in the Appearance shop'});
  }
  back.onclick=()=>{if(active&&!paused&&clip===null&&step>0){step--;renderControls();heading.focus({preventScroll:true});}};
  next.onclick=()=>{
    if(!active||paused||clip!==null)return;
    if(step<2)step++;else{clip=0;spoken=false;lastBites=0;audio.play('win');}
    renderControls();heading.focus({preventScroll:true});
  };
  function finish(){
    if(!active)return;active=false;
    onFinish(5,{title:'Your dragon loved it!',detail:'Make another delicious creation!'});
  }
  function tick(now){
    if(destroyed)return;
    const dt=last?Math.min(.1,(now-last)/1000):0;last=now;
    if(active&&!paused&&!document.hidden&&clip!==null){
      clip=Math.min(ICE_CLIP_SECONDS,clip+dt);
      const bites=iceBiteCount(clip);if(bites>lastBites){lastBites=bites;audio.play('gulp');}
      if(clip>=5.5&&!spoken){spoken=true;audio.say('Yum! Thank you!',1.1);}
      if(clip>=ICE_CLIP_SECONDS)finish();
    }
    drawIceScene(ctx,recipe,canvas.width,canvas.height,clip,reduced);
    frame=requestAnimationFrame(tick);
  }
  document.addEventListener?.('visibilitychange',()=>{last=0;if(document.hidden)audio.stop();},{signal:controller.signal});
  renderControls();frame=requestAnimationFrame(tick);
  return {
    start(){audio.stop();audio.unlock();recipe=createIceRecipe();step=0;clip=null;spoken=false;active=true;paused=false;last=0;renderControls();stepButtons[0].focus({preventScroll:true});},
    pause(value){paused=value;last=0;if(value)audio.stop();renderControls();},
    setMuted:value=>audio.setMuted(value),
    destroy(){if(destroyed)return;destroyed=true;active=false;controller.abort();audio.destroy();cancelAnimationFrame(frame);controls.replaceChildren();}
  };
}
