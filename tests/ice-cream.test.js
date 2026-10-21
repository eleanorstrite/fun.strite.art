import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createIceRecipe, createIceCream, drawIceScene, scatterIceChips, iceBiteCount } from '../src/ice-cream.js';
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
  let frame,finishes=0,now=100;
  const wallet=createSystem({getItem:()=>null,setItem(){}});let session=wallet.beginSession('ice-cream');
  const ctx=new Proxy({},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
  const controls=new IceElement(),canvas={width:900,height:620,getContext:()=>ctx};
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
