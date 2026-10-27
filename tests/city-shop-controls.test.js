import test from 'node:test';
import assert from 'node:assert/strict';
import {createCityBuilder,createCityState,cityPlace} from '../src/city-builder.js';
test('register buttons, hold gestures, Space and all exit routes share the same carried-food state',async()=>{
  const saved=Object.fromEntries(['document','window','requestAnimationFrame','cancelAnimationFrame'].map(key=>[key,globalThis[key]]));
  class Element extends EventTarget{
    constructor(){super();this.children=[];this.dataset={};this.style={};this.classList={toggle(){},remove(){}};this.tagName='BUTTON';}
    setAttribute(){}focus(){}setPointerCapture(){}closest(){return dialog;}replaceChildren(){this.children=[];}append(...children){this.children.push(...children);}
    querySelector(id){if(!elements.has(id))elements.set(id,new Element());return elements.get(id);}
  }
  const elements=new Map(),dialog=new Element(),panel=new Element(),canvas=new Element(),state=createCityState();cityPlace(state,2,2,'cafe');
  let frame,now=0,snapshot,game,hit,ate=0;
  globalThis.document=Object.assign(new Element(),{hidden:false,querySelector:()=>panel,createElement:()=>new Element()});
  globalThis.window=Object.assign(new Element(),{localStorage:{getItem:()=>JSON.stringify(state),setItem(){}}});
  globalThis.requestAnimationFrame=fn=>(frame=fn,1);globalThis.cancelAnimationFrame=()=>{};
  const view={canvas,portrait(){},furnish:()=>[],faceDoor(){},yaw:()=>0,dispose(){},pick:()=>hit,eatOrder(){ate++;},shopSurfaces:()=>[{id:'table',x:0,z:3,w:2,d:2,y:1}],render(value){snapshot=structuredClone(value);}};
  const button=id=>panel.querySelector('#city-'+id),tick=(n=1)=>{for(let i=0;i<n;i++){now+=40;frame(now);}},key=(type,key)=>{const e=new Event(type);e.key=key;window.dispatchEvent(e);},walk=(k,n)=>{key('keydown',k);tick(n);key('keyup',k);};
  const pointer=(type,x=50)=>{const e=new Event(type);Object.assign(e,{pointerId:1,button:0,clientX:x,clientY:50});canvas.dispatchEvent(e);};
  try{
    game=createCityBuilder({canvas,wallet:{snapshot:()=>({coins:100,upgrades:[]}),subscribe:()=>()=>{},buyFood(){}},onHud(){},loadScene:async()=>({createCityScene:()=>view})});game.start();await Promise.resolve();button('play').dispatchEvent(new Event('click'));walk('w',2);walk('w',58);
    assert.equal(button('shop-menu').hidden,false);const pizza=button('shop-choices').children.find(b=>b.dataset.food==='pizza');pizza.dispatchEvent(new Event('click'));tick();assert.equal(snapshot.shop.items.length,1);
    hit={x:-2,z:-3.1,orderId:snapshot.shop.items[0].id};pointer('pointerdown');tick(5);pointer('pointercancel');tick(15);assert.equal(snapshot.shop.items[0].carried,false,'cancelled holds cannot pick up');
    pointer('pointerdown');tick(5);pointer('pointermove',80);tick(15);pointer('pointerup');assert.equal(snapshot.shop.items[0].carried,false,'dragging cancels the hold');
    pointer('pointerdown');tick(5);game.pause(true);tick(20);game.pause(false);tick();assert.equal(snapshot.shop.items[0].carried,false,'pause cancels holds');
    pointer('pointerdown');tick(16);pointer('pointerup');tick();assert.equal(snapshot.shop.items[0].carried,true);
    walk('s',62);assert.ok(snapshot.interior,'walking exit is blocked while carrying');
    button('enter').dispatchEvent(new Event('click'));button('play').dispatchEvent(new Event('click'));tick();assert.ok(snapshot.interior);assert.equal(snapshot.mode,'walk','build mode cannot bypass the exit rule');
    walk('w',12);hit={x:0,z:3,surfaceId:'table'};pointer('pointerdown');tick(16);pointer('pointerup');tick();assert.equal(snapshot.shop.items[0].surface,'table');assert.equal(snapshot.shop.items[0].carried,false);
    key('keydown',' ');tick();key('keyup',' ');assert.equal(snapshot.shop.items.length,0);assert.equal(ate,1);button('enter').dispatchEvent(new Event('click'));tick();assert.equal(snapshot.interior,null);assert.equal(snapshot.shop,null);assert.equal(button('shop-menu').hidden,true);
  }finally{game?.destroy();for(const [key,value]of Object.entries(saved))if(value===undefined)delete globalThis[key];else globalThis[key]=value;}
});
