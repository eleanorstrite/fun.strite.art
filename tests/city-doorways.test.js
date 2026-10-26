import test from 'node:test';
import assert from 'node:assert/strict';
import {createCityBuilder,createCityState,cityPlace} from '../src/city-builder.js';

// Exercise the real controller and animation loop, replacing only WebGL and DOM.
for(const input of ['keyboard','touch'])test(`held ${input} movement survives entering, exiting and re-entering a building`,async()=>{
  const saved=Object.fromEntries(['document','window','requestAnimationFrame','cancelAnimationFrame'].map(key=>[key,globalThis[key]]));
  class Element extends EventTarget {
    constructor(){super();this.children=[];this.dataset={};this.classList={toggle(){},remove(){}};this.tagName='BUTTON';}
    setAttribute(){} focus(){} setPointerCapture(){} closest(){return dialog;}
    replaceChildren(){this.children=[];} append(child){this.children.push(child);}
    querySelector(id){if(!elements.has(id))elements.set(id,new Element());return elements.get(id);}
  }
  const elements=new Map(),dialog=new Element(),panel=new Element(),canvas=new Element();
  const state=createCityState();cityPlace(state,2,2,'cafe');let frame,now=0,snapshot,yaw=0,visits=0,game;
  globalThis.document=Object.assign(new Element(),{hidden:false,querySelector:()=>panel,createElement:()=>new Element()});
  globalThis.window=Object.assign(new Element(),{localStorage:{getItem:()=>JSON.stringify(state),setItem(){}}});
  globalThis.requestAnimationFrame=fn=>(frame=fn,1);globalThis.cancelAnimationFrame=()=>{};
  const view={canvas,portrait(){},furnish(){visits++;return [];},faceDoor(){yaw=0;},yaw:()=>yaw,dispose(){},render(value){snapshot=structuredClone(value);}};
  function tick(count=1){for(let i=0;i<count;i++){const next=frame;frame=null;now+=40;next(now);assert.equal(typeof frame,'function','the animation must continue');}}
  function press(direction,down){
    if(input==='keyboard'){const event=new Event(down?'keydown':'keyup');event.key=direction==='up'?'w':'s';window.dispatchEvent(event);}
    else {const event=new Event(down?'pointerdown':'pointerup');event.pointerId=1;panel.querySelector('#city-walk-'+direction).dispatchEvent(event);}
  }
  try {
    game=createCityBuilder({canvas,onHud(){},loadScene:async()=>({createCityScene:()=>view})});game.start();await Promise.resolve();
    panel.querySelector('#city-play').dispatchEvent(new Event('click'));tick();
    press('up',true);tick(2);assert.ok(snapshot.interior,'walking into the door enters');
    const entryZ=snapshot.player.z;tick(5);assert.ok(snapshot.player.z<entryZ-.5,'held movement continues inside without a second press');
    press('up',false);press('down',true);tick(9);assert.equal(snapshot.interior,null,'walking back onto the exit mat leaves');
    const outsideZ=snapshot.player.z;tick(3);assert.ok(snapshot.player.z>outsideZ,'held movement continues outside');
    press('down',false);press('up',true);tick(15);assert.ok(snapshot.interior,'the same door can be entered again');assert.equal(visits,2);
    game.pause(true);const paused=snapshot.player.z;tick(3);assert.equal(snapshot.player.z,paused);
    game.pause(false);tick(3);assert.equal(snapshot.player.z,paused,'pause still clears held movement');
  } finally {game?.destroy();for(const [key,value] of Object.entries(saved))if(value===undefined)delete globalThis[key];else globalThis[key]=value;}
});
