import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PUMPKINS, CARVING_TOOLS, createPumpkin, pumpkinContains, drawPumpkinScene, createPumpkinGame } from '../src/pumpkin.js';
import { createSystem } from '../src/system.js';

test('all pumpkins and tools render the same carving in the workshop and ending',()=>{
  const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
  for(const kind of Object.keys(PUMPKINS)){
    const pumpkin={kind,cuts:Object.keys(CARVING_TOOLS).map(tool=>({tool,points:[{x:-30,y:-20},{x:30,y:20}]}))},before=JSON.stringify(pumpkin);
    for(const t of [null,0,1.3,3,4.5,7])for(const reduced of [true,false])drawPumpkinScene(ctx,pumpkin,450,310,t,reduced);
    assert.equal(JSON.stringify(pumpkin),before);
  }
  assert.equal(pumpkinContains(0,0),true);assert.equal(pumpkinContains(180,0),false);
  const a=createPumpkin(),b=createPumpkin();a.cuts.push({});assert.equal(b.cuts.length,0);
});
test('pumpkin drawing, tools, undo, pause, replay and wallet settlement work together',()=>{
  const original={document:globalThis.document,window:globalThis.window,requestAnimationFrame:globalThis.requestAnimationFrame,cancelAnimationFrame:globalThis.cancelAnimationFrame};
  class PumpkinElement{
    constructor(){this.children=[];this.attrs={};}
    append(...items){this.children.push(...items);}
    replaceChildren(...items){this.children=items;}
    setAttribute(k,v){this.attrs[k]=v;}
    focus(){}
  }
  const handlers={},keys={},controls=new PumpkinElement();
  const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
  const canvas={width:900,height:620,getContext:()=>ctx,focus(){},setPointerCapture(){},getBoundingClientRect:()=>({left:0,top:0,width:450,height:310}),addEventListener:(name,fn)=>handlers[name]=fn};
  let frame,now=100,finishes=0,hud;
  globalThis.document={hidden:false,createElement:()=>new PumpkinElement(),addEventListener(){}};
  globalThis.window={addEventListener:(name,fn)=>keys[name]=fn};
  globalThis.requestAnimationFrame=fn=>(frame=fn,1);globalThis.cancelAnimationFrame=()=>{};
  const wallet=createSystem({getItem:()=>null,setItem(){}});let session=wallet.beginSession('carve-pumpkin'),engine;
  const advance=n=>{for(let i=0;i<n;i++){frame(now);now+=100;}};
  const pointer={pointerId:1,button:0,clientX:225,clientY:165,preventDefault(){}};
  try{
    engine=createPumpkinGame({canvas,controls,onHud:value=>hud=value.text,onFinish:coins=>{assert.equal(coins,5);session.finish(coins);finishes++;}});
    const [,pumpkins,tools,,actions]=controls.children,[undo,clear,done,clean]=actions.children;
    assert.equal(done.disabled,true);engine.start();done.onclick();advance(80);assert.equal(finishes,0);
    handlers.pointerdown({...pointer,clientX:0,clientY:0});assert.equal(done.disabled,true);
    pumpkins.children[2].onclick();assert.equal(pumpkins.children[2].attrs['aria-pressed'],'true');
    assert.equal(tools.children[2].disabled,true);
    handlers.pointerdown(pointer);assert.equal(hud.includes('1 / 3'),true);
    engine.pause(true);clean.onclick();assert.equal(hud.includes('1 / 3'),true);engine.pause(false);
    handlers.pointerdown(pointer);assert.equal(hud.includes('2 / 3'),true);assert.equal(done.disabled,true);
    handlers.pointerdown(pointer);assert.equal(clean.hidden,true);assert.equal(done.disabled,true);
    assert.equal(tools.children[2].disabled,false);
    tools.children[2].onclick();handlers.pointerdown(pointer);handlers.pointerup(pointer);assert.equal(done.disabled,false);
    undo.onclick();assert.equal(done.disabled,true);
    tools.children[0].onclick();handlers.pointerdown(pointer);handlers.pointermove({...pointer,clientX:245});handlers.pointercancel();
    assert.equal(hud.includes('1 cuts'),true);
    clear.onclick();assert.equal(done.disabled,true);
    handlers.keydown({key:' ',preventDefault(){}});handlers.keydown({key:'ArrowRight',preventDefault(){}});keys.keyup({key:' '});
    done.onclick();assert.equal(done.disabled,false);
    const panel=controls.children[5],hats=panel.children[1],extras=panel.children[3];
    assert.equal(panel.hidden,false);hats.children[1].onclick();extras.children[0].onclick();extras.children[1].onclick();
    assert.equal(hats.children[1].attrs['aria-pressed'],'true');assert.equal(extras.children[0].attrs['aria-pressed'],'true');
    handlers.pointerdown(pointer);assert.equal(wallet.snapshot().coins,0);
    actions.children[4].onclick();assert.equal(panel.hidden,true);done.onclick();assert.equal(hats.children[1].attrs['aria-pressed'],'true');
    done.onclick();assert.equal(done.disabled,true);
    advance(20);assert.equal(wallet.snapshot().coins,0);
    engine.pause(true);advance(100);assert.equal(finishes,0);
    engine.pause(false);globalThis.document.hidden=true;advance(100);assert.equal(finishes,0);
    globalThis.document.hidden=false;advance(80);assert.equal(finishes,1);assert.equal(wallet.snapshot().coins,5);
    advance(20);assert.equal(finishes,1);
    session=wallet.beginSession('carve-pumpkin');engine.start();assert.equal(done.disabled,true);assert.equal(clean.hidden,false);
    clean.onclick();clean.onclick();clean.onclick();
    handlers.pointerdown(pointer);handlers.pointerup(pointer);done.onclick();done.onclick();advance(80);
    assert.equal(finishes,2);assert.equal(wallet.snapshot().coins,10);
    session=wallet.beginSession('carve-pumpkin');engine.start();handlers.pointerdown(pointer);engine.destroy();engine.destroy();
    assert.equal(finishes,2);assert.equal(wallet.snapshot().coins,10);assert.equal(controls.children.length,0);
  }finally{engine?.destroy();Object.assign(globalThis,original);}
});
