import test from 'node:test';
import assert from 'node:assert/strict';
import {createCityBuilder,createCityState,cityPlace} from '../src/city-builder.js';
test('last fire starts a paused-safe victory clip and then returns to the station',async()=>{
 const saved=Object.fromEntries(['document','window','requestAnimationFrame','cancelAnimationFrame'].map(k=>[k,globalThis[k]]));
 class Element extends EventTarget{constructor(){super();this.children=[];this.dataset={};this.classList={toggle(){},remove(){}};this.tagName='BUTTON';}setAttribute(){}focus(){}closest(){return dialog;}replaceChildren(){this.children=[];}append(...children){this.children.push(...children);}querySelector(id){if(!elements.has(id))elements.set(id,new Element());return elements.get(id);}}
 const elements=new Map(),dialog=new Element(),panel=new Element(),canvas=new Element(),state=createCityState();cityPlace(state,2,2,'fire');let frame,now=0,snapshot,game,eaten,blooms=0;
 globalThis.document=Object.assign(new Element(),{hidden:false,querySelector:()=>panel,createElement:()=>new Element()});globalThis.window=Object.assign(new Element(),{localStorage:{getItem:()=>JSON.stringify(state),setItem(){}}});globalThis.requestAnimationFrame=fn=>(frame=fn,1);globalThis.cancelAnimationFrame=()=>{};
 const view={canvas,portrait(){},furnish:()=>[],faceDoor(){},yaw:()=>0,dispose(){},eatOrder(kind){eaten=kind;},growFlower(){blooms++;},render(value){if(value.fire?.phase==='drive')for(const fire of value.fire.trip.fires){fire.x=0;fire.z=3;}snapshot=structuredClone(value);}};
 const button=id=>panel.querySelector('#city-'+id),tick=n=>{for(let i=0;i<n;i++){now+=40;frame(now);}},key=(type,k)=>{const e=new Event(type);e.key=k;window.dispatchEvent(e);},walk=(k,n)=>{key('keydown',k);tick(n);key('keyup',k);};


 try{
  game=createCityBuilder({canvas,onHud(){},loadScene:async()=>({createCityScene:()=>view})});game.start();await Promise.resolve();button('play').dispatchEvent(new Event('click'));walk('w',2);walk('w',26);button('fire-drive').dispatchEvent(new Event('click'));tick(1);
  key('keydown',' ');tick(55);key('keyup',' ');assert.equal(snapshot.fire.phase,'victory');assert.equal(snapshot.fire.trip.extinguished,8);assert.equal(snapshot.fire.trip.spraying,false);assert.match(button('fire-status').textContent,/Hooray! You saved the town!/);assert.equal(button('fire-return').hidden,true);
  const clock=snapshot.fire.clipTime;game.pause(true);tick(100);assert.equal(snapshot.fire.clipTime,clock);game.pause(false);tick(40);assert.equal(snapshot.fire.phase,'victory','clip must play before returning');tick(100);assert.equal(snapshot.fire,null);assert.ok(snapshot.interior);assert.equal(snapshot.player.z,3.6);
 }finally{game?.destroy();for(const [k,v]of Object.entries(saved))if(v===undefined)delete globalThis[k];else globalThis[k]=v;}
});
