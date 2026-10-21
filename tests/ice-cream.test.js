import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createIceRecipe, createIceCream, drawIceScene, ICE_CONES, ICE_FLAVORS, ICE_TOPPINGS } from '../src/ice-cream.js';

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
  const ctx=new Proxy({},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
  const controls=new IceElement(),canvas={width:900,height:620,getContext:()=>ctx};
  globalThis.document={hidden:false,createElement:()=>new IceElement(),addEventListener(){}};
  globalThis.requestAnimationFrame=fn=>(frame=fn,1);globalThis.cancelAnimationFrame=()=>{};
  let engine;
  const advance=n=>{for(let i=0;i<n;i++){frame(now);now+=100;}};
  try{
    engine=createIceCream({canvas,controls,onHud(){},onFinish:(coins,result)=>{assert.equal(coins,0);assert.equal(result.title,'Your dragon loved it!');finishes++;}});
    const [tabs,,choices,navigation]=controls.children,[back,next]=navigation.children;
    assert.equal(next.disabled,true);engine.start();
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
    advance(20);assert.equal(finishes,1);
    engine.start();assert.equal(next.disabled,false);assert.equal(choices.children[0].attributes['aria-pressed'],'true');
    engine.destroy();engine.destroy();assert.equal(finishes,1);assert.equal(controls.children.length,0);
  }finally{engine?.destroy();Object.assign(globalThis,original);}
});
