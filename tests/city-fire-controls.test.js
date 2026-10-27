import test from 'node:test';
import assert from 'node:assert/strict';
import {createCityBuilder,createCityState,cityPlace} from '../src/city-builder.js';
test('fire truck cab, Drive, spray, pause and timed return preserve the city',async()=>{
 const saved=Object.fromEntries(['document','window','requestAnimationFrame','cancelAnimationFrame'].map(k=>[k,globalThis[k]]));
 class Element extends EventTarget{constructor(){super();this.children=[];this.dataset={};this.classList={toggle(){},remove(){}};this.tagName='BUTTON';}setAttribute(){}focus(){}closest(){return dialog;}replaceChildren(){this.children=[];}append(...children){this.children.push(...children);}querySelector(id){if(!elements.has(id))elements.set(id,new Element());return elements.get(id);}}
 const elements=new Map(),dialog=new Element(),panel=new Element(),canvas=new Element(),state=createCityState();cityPlace(state,2,2,'fire');let frame,now=0,snapshot,game,eaten,blooms=0;
 globalThis.document=Object.assign(new Element(),{hidden:false,querySelector:()=>panel,createElement:()=>new Element()});globalThis.window=Object.assign(new Element(),{localStorage:{getItem:()=>JSON.stringify(state),setItem(){}}});globalThis.requestAnimationFrame=fn=>(frame=fn,1);globalThis.cancelAnimationFrame=()=>{};
 const view={canvas,portrait(){},furnish:()=>[],faceDoor(){},yaw:()=>0,dispose(){},eatOrder(kind){eaten=kind;},growFlower(){blooms++;},render(value){snapshot=structuredClone(value);}};
 const button=id=>panel.querySelector('#city-'+id),tick=n=>{for(let i=0;i<n;i++){now+=40;frame(now);}},key=(type,k)=>{const e=new Event(type);e.key=k;window.dispatchEvent(e);},walk=(k,n)=>{key('keydown',k);tick(n);key('keyup',k);};

 try{
  game=createCityBuilder({canvas,onHud(){},loadScene:async()=>({createCityScene:()=>view})});game.start();await Promise.resolve();button('play').dispatchEvent(new Event('click'));walk('w',2);const original=JSON.stringify(state.tiles);walk('w',26);tick(1);assert.equal(snapshot.fire.phase,'cab');assert.equal(button('fire-drive').hidden,false);
  button('fire-drive').dispatchEvent(new Event('click'));tick(1);assert.equal(snapshot.fire.phase,'drive');assert.ok(snapshot.fire.trip.remaining>59);assert.equal(button('fire-spray').hidden,false);
  key('keydown',' ');tick(55);key('keyup',' ');assert.equal(snapshot.fire.trip.extinguished,1);
  game.pause(true);const remaining=snapshot.fire.trip.remaining;tick(100);assert.equal(snapshot.fire.trip.remaining,remaining);game.pause(false);
  const z=snapshot.fire.trip.z;walk('w',20);assert.ok(snapshot.fire.trip.z<z);button('play').dispatchEvent(new Event('click'));tick(1);assert.equal(snapshot.mode,'walk','building mode cannot strand the trip');
  tick(1500);assert.equal(snapshot.fire.phase,'failure');assert.equal(snapshot.fire.trip.remaining,0);assert.equal(snapshot.fire.trip.spraying,false);assert.match(button('fire-status').textContent,/Try again/);assert.equal(button('fire-return').hidden,true);
  const clipTime=snapshot.fire.clipTime;game.pause(true);tick(100);assert.equal(snapshot.fire.clipTime,clipTime);game.pause(false);tick(150);assert.equal(snapshot.fire,null);assert.ok(snapshot.interior);assert.equal(snapshot.player.x,0);assert.equal(snapshot.player.z,3.6);assert.equal(JSON.stringify(state.tiles),original);assert.equal(button('fire-drive').hidden,true);
  walk('w',16);assert.equal(snapshot.fire.phase,'cab');button('fire-drive').dispatchEvent(new Event('click'));tick(1);assert.equal(snapshot.fire.trip.extinguished,0);button('fire-return').dispatchEvent(new Event('click'));tick(1);assert.equal(snapshot.fire,null);
 }finally{game?.destroy();for(const [k,v]of Object.entries(saved))if(v===undefined)delete globalThis[k];else globalThis[k]=v;}
});
