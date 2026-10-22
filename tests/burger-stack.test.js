import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createBurgerState,dropBurger,landBurger,tickBurger,drawBurgerScene,drawBurgerEnding,BURGER_INGREDIENTS,createBurgerStack} from '../src/burger-stack.js';
const ready=()=>({...createBurgerState(),status:'playing'});
test('burger drops trim each edge and preserve the exact surviving width for the next piece',()=>{
 const s=ready();s.moving.x=220;dropBurger(s);landBurger(s);
 assert.equal(s.score,1);assert.equal(s.layers.at(-1).x,220);assert.equal(s.layers.at(-1).width,190);assert.equal(s.moving.width,190);assert.equal(s.scraps[0].width,30);
 s.moving.x=200;dropBurger(s);landBurger(s);assert.equal(s.layers.at(-1).width,170);assert.equal(s.moving.width,170);assert.equal(s.scraps.at(-1).width,20);
 s.moving.x=s.layers.at(-1).x;landBurger(s);assert.equal(s.moving.width,170);
 for(let i=0;i<30;i++){s.moving.x=s.layers.at(-1).x+s.moving.width/2;landBurger(s);}
 assert.ok(s.moving.width<.001);assert.equal(s.status,'playing');
});
test('ingredients cycle, click freezes horizontal motion, and duplicate drops are ignored',()=>{
 const s=ready();assert.equal(dropBurger({...s,status:'ready'}),false);
 for(let i=0;i<10;i++){
  assert.equal(s.moving.kind,BURGER_INGREDIENTS[i%5]);s.moving.x=s.layers.at(-1).x;assert.equal(dropBurger(s),true);assert.equal(dropBurger(s),false);const x=s.moving.x;
  tickBurger(s,.05);assert.equal(s.moving.x,x);for(let n=0;n<4;n++)tickBurger(s,.05);assert.equal(s.score,i+1);
 }
});
test('a miss leads to the ending and animation cues fire only once',()=>{
 const s=ready(),sounds=[];s.moving.x=0; s.moving.width=100;dropBurger(s);
 for(let i=0;i<180;i++)tickBurger(s,.05,c=>sounds.push(c));assert.equal(s.score,0);assert.equal(s.status,'finished');assert.deepEqual(sounds,['crash','iceChew','whoosh','bounce']);
 const previous=JSON.stringify(s);tickBurger(s,.05);assert.equal(JSON.stringify(s),previous);
});
test('layers stay bounded while sliding and camera follows tall stacks',()=>{
 const s=ready();for(let i=0;i<1000;i++){tickBurger(s,.05);assert.ok(s.moving.x>=30&&s.moving.x+s.moving.width<=560);}
 for(let i=0;i<30;i++){s.moving.x=s.layers.at(-1).x;landBurger(s);}for(let i=0;i<50;i++)tickBurger(s,.05);assert.ok(s.camera>500);
});
test('all ingredients, cutoffs and ending stages render without mutating the game',()=>{
 const c=new Proxy({},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)}),s=ready();
 for(let i=0;i<10;i++){s.moving.x=s.layers.at(-1).x+3;landBurger(s);}
 const before=JSON.stringify(s);for(const reduced of [false,true]){drawBurgerScene(c,s,620,720,20,reduced);for(const t of [0,1.5,3,4,5.6,7.5])drawBurgerEnding(c,t,620,720,12,20,reduced);}assert.equal(JSON.stringify(s),before);
});
test('burger engine accepts drops, pauses, skips endings and settles once on close',()=>{
 const names=['document','requestAnimationFrame','cancelAnimationFrame'],original=Object.fromEntries(names.map(k=>[k,globalThis[k]]));
 class Element{children=[];listeners={};append(...v){this.children.push(...v);}replaceChildren(...v){this.children=v;}addEventListener(k,v){this.listeners[k]=v;}focus(){}}
 const canvas=new Element(),controls=new Element(),doc=new Element();canvas.width=620;canvas.height=720;canvas.getContext=()=>new Proxy({},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});doc.createElement=()=>new Element();doc.hidden=false;
 let frame,now=1,hud='',count=0,result;Object.assign(globalThis,{document:doc,requestAnimationFrame:fn=>(frame=fn,1),cancelAnimationFrame(){}});let engine;const advance=n=>{for(let i=0;i<n;i++){frame(now);now+=50;}};
 try{
  engine=createBurgerStack({canvas,controls,onHud:v=>hud=v.text,onFinish:(coins,info)=>{count++;result={coins,...info};}});engine.start();advance(1);
  engine.pause(true);advance(1);const before=hud;advance(50);assert.equal(hud,before);engine.pause(false);doc.hidden=true;advance(50);assert.equal(hud,before);doc.hidden=false;
  // Immediate drop overlaps the base and clips the left edge. The next starts on the far right and misses.
  canvas.listeners.pointerdown({button:0,preventDefault(){}});advance(6);assert.ok(hud.startsWith('1 layers'));
  canvas.listeners.keydown({code:'Space',repeat:false,preventDefault(){}});advance(20);assert.equal(count,0);assert.equal(controls.children[1].hidden,false);
  controls.children[1].onclick();assert.equal(count,1);assert.equal(result.score,1);assert.equal(result.coins,1);
  engine.destroy();assert.equal(count,1);engine.destroy();
 }finally{engine?.destroy();Object.assign(globalThis,original);}
});
