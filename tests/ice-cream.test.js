import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createIceRecipe, createIceCream, drawIceScene, scatterIceChips, iceBiteCount, pourIceChocolate, tickIceChocolate, iceCleanup } from '../src/ice-cream.js';
import { ICE_CONES, ICE_FLAVORS, ICE_TOPPINGS, ICE_SHOP_ITEMS, iceIngredientUnlocked } from '../src/ice-settings.js';
import { createSystem } from '../src/system.js';

test('every ice cream ingredient and both animation modes render without changing the recipe',()=>{
  const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
  for(const cone of Object.keys(ICE_CONES))for(const flavor of Object.keys(ICE_FLAVORS)){
    const recipe={cone,flavor,toppings:Object.keys(ICE_TOPPINGS)},before=JSON.stringify(recipe);
    for(const t of [null,0,1.8,2.7,3.5,6])for(const reduced of [true,false])drawIceScene(ctx,recipe,450,310,t,reduced);
    assert.equal(JSON.stringify(recipe),before);
  }
  const a=createIceRecipe(),b=createIceRecipe();a.toppings.push('cherry');assert.equal(b.toppings.length,0);
});
test('ice cream buttons preserve choices, toggle toppings, pause the ending, finish once, and replay',()=>{
  const original={document:globalThis.document,requestAnimationFrame:globalThis.requestAnimationFrame,cancelAnimationFrame:globalThis.cancelAnimationFrame};
  class IceElement{
    constructor(){this.children=[];this.attributes={};this.disabled=false;}
    append(...children){this.children.push(...children);}
    replaceChildren(...children){this.children=children;}
    setAttribute(name,value){this.attributes[name]=value;}
    focus(){}
  }
  let frame,finishes=0,now=100,bottles=0;
  const wallet=createSystem({getItem:()=>null,setItem(){}});let session=wallet.beginSession('ice-cream');
  const handlers={},drops=[];
  const ctx=new Proxy({fillText(text){if(text==='CHOCO')bottles++;},ellipse(x,y,rx,ry){if(this.fillStyle==='#633c32')drops.push({x,y,rx});}},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
  const controls=new IceElement(),canvas={width:900,height:620,getContext:()=>ctx,addEventListener:(name,fn)=>handlers[name]=fn,focus(){},setPointerCapture(){},getBoundingClientRect:()=>({left:0,top:0,width:450,height:310})};
  globalThis.document={hidden:false,createElement:()=>new IceElement(),addEventListener(){}};
  globalThis.requestAnimationFrame=fn=>(frame=fn,1);globalThis.cancelAnimationFrame=()=>{};
  let engine;
  const advance=n=>{for(let i=0;i<n;i++){frame(now);now+=100;}};
  try{
    engine=createIceCream({canvas,controls,onHud(){},onFinish:(coins,result)=>{assert.equal(coins,5);session.finish(coins);assert.equal(result.title,'Your dragon loved it!');finishes++;}});
    const [tabs,,choices,navigation]=controls.children,[back,next]=navigation.children;
    assert.equal(next.disabled,true);engine.start();
    assert.equal(choices.children[4].disabled,true);choices.children[4].onclick();assert.equal(choices.children[4].attributes['aria-pressed'],'false');
    choices.children[2].onclick();assert.equal(choices.children[2].attributes['aria-pressed'],'true');
    next.onclick();choices.children[3].onclick();next.onclick();
    choices.children[0].onclick();choices.children[4].onclick();choices.children[0].onclick();
    assert.equal(choices.children[0].attributes['aria-pressed'],'false');assert.equal(choices.children[4].attributes['aria-pressed'],'true');
    choices.children[2].onclick(); // Bring out the chocolate bottle.
    const pointer={pointerId:7,button:0,clientX:225,clientY:94,preventDefault(){}};
    handlers.pointerdown(pointer);advance(2);const tapSize=drops.at(-1).rx;
    advance(5);assert.equal(drops.at(-1).rx>tapSize,true);
    handlers.pointermove({...pointer,clientX:246});advance(2);
    assert.equal(drops.some(drop=>drop.x>20),true);
    handlers.pointerup(pointer);const released=drops.at(-1).rx;advance(4);
    assert.equal(drops.at(-1).rx<=released,true);
    handlers.pointerdown({...pointer,clientX:246});handlers.pointercancel();advance(1);
    const cancelled=drops.at(-1).rx;advance(3);assert.equal(drops.at(-1).rx<=cancelled,true);
    engine.pause(true);advance(1);const pausedSize=drops.at(-1).rx;advance(4);assert.equal(drops.at(-1).rx,pausedSize);
    engine.pause(false);globalThis.document.hidden=true;advance(4);assert.equal(drops.at(-1).rx,pausedSize);globalThis.document.hidden=false;
    const shown=bottles;choices.children[0].onclick();advance(2);assert.equal(bottles,shown);
    assert.equal(choices.children[2].attributes['aria-pressed'],'true');
    choices.children[2].onclick();advance(1);assert.equal(bottles>shown,true);
    assert.equal(choices.children[2].attributes['aria-pressed'],'true');
    back.onclick();assert.equal(choices.children[3].attributes['aria-pressed'],'true');
    tabs.children[0].onclick();assert.equal(choices.children[2].attributes['aria-pressed'],'true');
    tabs.children[2].onclick();next.onclick();assert.equal(next.disabled,true);
    advance(20);assert.equal(finishes,0);
    engine.pause(true);advance(100);assert.equal(finishes,0);
    engine.pause(false);globalThis.document.hidden=true;advance(100);assert.equal(finishes,0);
    globalThis.document.hidden=false;advance(65);assert.equal(finishes,1);
    advance(20);assert.equal(finishes,1);assert.equal(wallet.snapshot().coins,5);
    session=wallet.beginSession('ice-cream');engine.start();assert.equal(next.disabled,false);assert.equal(choices.children[0].attributes['aria-pressed'],'true');
    tabs.children[2].onclick();next.onclick();advance(80);assert.equal(finishes,2);assert.equal(wallet.snapshot().coins,10);
    session=wallet.beginSession('ice-cream');engine.start();
    engine.destroy();engine.destroy();assert.equal(finishes,2);assert.equal(wallet.snapshot().coins,10);assert.equal(controls.children.length,0);
  }finally{engine?.destroy();Object.assign(globalThis,original);}
});

test('ice cream shop ingredients unlock permanently and original choices stay free',()=>{
  const data=new Map(),storage={getItem:key=>data.get(key),setItem:(key,value)=>data.set(key,value)};
  const system=createSystem(storage);
  assert.equal(ICE_SHOP_ITEMS.length,8);
  assert.equal(iceIngredientUnlocked('flavor','mint'),true);
  assert.equal(iceIngredientUnlocked('cone','pretzel'),false);
  assert.equal(iceIngredientUnlocked('flavor','mango'),false);
  assert.equal(iceIngredientUnlocked('topping','berries'),false);
  assert.throws(()=>system.buy('ice-flavor-mango'));
  system.beginSession('test-treats').finish(1600);
  for(const item of ICE_SHOP_ITEMS){assert.equal(item.cost,200);system.buy(item.id);assert.throws(()=>system.buy(item.id));}
  const restored=createSystem(storage),owned=restored.snapshot().upgrades;
  assert.equal(restored.snapshot().coins,0);
  assert.equal(iceIngredientUnlocked('cone','pretzel',owned),true);
  assert.equal(iceIngredientUnlocked('flavor','mango',owned),true);
  assert.equal(iceIngredientUnlocked('topping','berries',owned),true);
  const copy=createSystem({getItem:()=>null,setItem(){}});copy.importSave(restored.exportSave());
  assert.deepEqual(copy.snapshot().upgrades,owned);
});
test('chip scatter is stable, spread across the scoop, and bites advance in discrete chunks',()=>{
  const points=scatterIceChips();assert.equal(points.length,22);assert.deepEqual(points,scatterIceChips());
  for(const p of points){
    assert.equal((p.x/60)**2+((p.y+30)/50)**2<=1,true);
    assert.equal(points.filter(q=>q!==p&&Math.hypot(p.x-q.x,p.y-q.y)<9).length,0);
  }
  for(const signX of [-1,1])for(const signY of [-1,1])assert.equal(points.some(p=>p.x*signX>0&&(p.y+30)*signY>0),true);
  assert.equal(new Set(points.map(p=>p.angle)).size,22);
  assert.equal(iceBiteCount(1.9),0);assert.equal(iceBiteCount(2.2),1);
  assert.equal(iceBiteCount(3.2),2);assert.equal(iceBiteCount(4.1),3);assert.equal(iceBiteCount(5.1),4);
});

test('chocolate pours accumulate at the bottle location and remain bounded on the scoop',()=>{
  const recipe=createIceRecipe();pourIceChocolate(recipe,0,-30,1);assert.equal(recipe.sauceDrops.length,0);
  recipe.toppings.push('sauce');pourIceChocolate(recipe,-20,-40,.1);
  const first=recipe.sauceDrops[0].amount;
  pourIceChocolate(recipe,-20,-40,1);assert.equal(recipe.sauceDrops[0].amount>first,true);
  pourIceChocolate(recipe,25,-10,.2);assert.equal(recipe.sauceDrops.length,2);
  pourIceChocolate(recipe,400,400,1);assert.equal(recipe.sauceDrops.length,2);
  for(let i=0;i<100;i++)pourIceChocolate(recipe,-20,-40,1);
  assert.equal(recipe.sauceDrops[0].amount,3);
});

test('syrup forms at most two trails, slows down, and sets permanently on every cone',()=>{
  for(const cone of Object.keys(ICE_CONES)){
    const recipe=createIceRecipe();recipe.cone=cone;recipe.toppings=['sauce'];
    for(const x of [-40,-20,0,20,40])pourIceChocolate(recipe,x,-30,1);
    tickIceChocolate(recipe,1);
    const runs=recipe.sauceDrops.filter(p=>p.flowY!==undefined);
    assert.equal(runs.length,2);
    const firstDistance=runs[0].flowY-runs[0].y,firstY=runs[0].flowY;
    tickIceChocolate(recipe,1);
    assert.equal(runs[0].flowY-firstY<firstDistance,true);
    for(let i=0;i<10;i++)tickIceChocolate(recipe,1);
    assert.equal(runs[0].flowY<100,true);
    assert.equal(recipe.sauceDrops.every(p=>p.amount>.8),true);
    const stopped=JSON.stringify(recipe);
    for(let i=0;i<20;i++)tickIceChocolate(recipe,1);
    assert.equal(JSON.stringify(recipe),stopped);
    pourIceChocolate(recipe,runs[0].x,runs[0].y,1);
    const settledY=runs[0].flowY;tickIceChocolate(recipe,1);
    assert.equal(runs[0].flowY,settledY);
  }
});
test('syrup settles consistently across frame rates and never streams during long pours',()=>{
  function simulate(dt){const r=createIceRecipe();r.toppings=['sauce'];pourIceChocolate(r,-30,-30,3);for(let i=0;i<Math.round(10/dt);i++)tickIceChocolate(r,dt);return r;}
  const a=simulate(1/60),b=simulate(.1);
  assert.equal(Math.abs(a.sauceDrops[0].flowY-b.sauceDrops[0].flowY)<.1,true);
  const stoppedY=a.sauceDrops[0].flowY;
  for(let i=0;i<600;i++){pourIceChocolate(a,-30,-30,.1);tickIceChocolate(a,.1);}
  assert.equal(a.sauceDrops[0].flowY,stoppedY);
  assert.equal(a.sauceFalling.length,0);
  assert.equal(a.saucePuddles.reduce((n,p)=>n+p.volume,0)<=.12,true);
});

test('a heavy syrup drip can fall off a cup once, without becoming a stream',()=>{
  const recipe=createIceRecipe();recipe.cone='cup';recipe.toppings=['sauce'];pourIceChocolate(recipe,0,12,3);
  for(let i=0;i<100;i++)tickIceChocolate(recipe,.1);
  assert.equal(recipe.sauceDrops[0].detached,true);
  assert.equal(recipe.saucePuddles[0].volume,.06);
  for(let i=0;i<100;i++)tickIceChocolate(recipe,.1);
  assert.equal(recipe.saucePuddles[0].volume,.06);
});

test('syrup squeezed beside the scoop falls to the floor on both sides and stops after release',()=>{
  for(const x of [-150,150,58]){
    const r=createIceRecipe();r.toppings=['sauce'];
    pourIceChocolate(r,x,12,.12);
    assert.equal(r.sauceDrops.length,0);assert.equal(r.sauceFalling.length,1);
    const start=r.sauceFalling[0].y;tickIceChocolate(r,.1);
    assert.equal(r.sauceFalling[0].y>start,true);
    for(let i=0;i<30;i++)tickIceChocolate(r,.1);
    assert.equal(r.sauceFalling.length,0);
    assert.equal(r.saucePuddles.length,1);
    assert.equal(r.saucePuddles[0].x,Math.round(x/4)*4);
    assert.equal(r.saucePuddles[0].volume,.12);
    const settled=JSON.stringify(r);tickIceChocolate(r,1);assert.equal(JSON.stringify(r),settled);
  }
});
test('a pour above the scoop lands on it instead of falling through it',()=>{
  const r=createIceRecipe();r.toppings=['sauce'];pourIceChocolate(r,50,-75,.12);
  for(let i=0;i<30;i++)tickIceChocolate(r,.1);
  assert.equal(r.sauceDrops.length,1);assert.equal(r.sauceFalling.length,0);assert.equal(r.saucePuddles.length,0);
});

test('dragon cleanup removes all puddles after eating and extends only messy endings',()=>{
  const recipe=createIceRecipe();recipe.toppings=['sauce'];recipe.saucePuddles=[{x:-120,volume:1},{x:0,volume:2},{x:170,volume:.2}];
  const before=JSON.stringify(recipe);
  assert.equal(iceCleanup(recipe,5).licking,false);
  assert.equal(iceCleanup(recipe,5).puddles.length,3);
  assert.equal(iceCleanup(recipe,6).licking,true);
  assert.equal(iceCleanup(recipe,7).puddles.length<3,true);
  assert.equal(iceCleanup(recipe,8.5).puddles.length,0);
  assert.equal(iceCleanup(recipe,10.8).puddles.length,0);
  const ctx=new Proxy({},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
  for(const t of [5,5.5,6,7,8.5,10.8])for(const reduced of [false,true])drawIceScene(ctx,recipe,900,620,t,reduced);
  assert.equal(JSON.stringify(recipe),before);
  assert.equal(iceCleanup(createIceRecipe(),6).end,7.5);
});
