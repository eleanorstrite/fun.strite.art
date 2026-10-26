import test from 'node:test';
import assert from 'node:assert/strict';
import {createCityBuilder,createCityState,cityPlace} from '../src/city-builder.js';
test('sitting at an office desk automatically opens one live computer, rapid typing counts, and closing restores walking',async()=>{
 const saved=Object.fromEntries(['document','window','requestAnimationFrame','cancelAnimationFrame'].map(k=>[k,globalThis[k]]));
 class Element extends EventTarget{constructor(){super();this.children=[];this.dataset={};this.classList={toggle(){},remove(){}};this.tagName='BUTTON';}setAttribute(){}focus(){}closest(){return dialog;}replaceChildren(){this.children=[];}append(...children){this.children.push(...children);}querySelector(id){if(!elements.has(id))elements.set(id,new Element());return elements.get(id);}}
 const elements=new Map(),dialog=new Element(),panel=new Element(),canvas=new Element(),state=createCityState();cityPlace(state,2,2,'office');let frame,now=0,snapshot,game,eaten,blooms=0;
 globalThis.document=Object.assign(new Element(),{hidden:false,querySelector:()=>panel,createElement:()=>new Element()});globalThis.window=Object.assign(new Element(),{localStorage:{getItem:()=>JSON.stringify(state),setItem(){}}});globalThis.requestAnimationFrame=fn=>(frame=fn,1);globalThis.cancelAnimationFrame=()=>{};
 const view={canvas,portrait(){},furnish:()=>[{x:0,z:3,w:.65,d:.65,use:{pose:'sit',x:0,z:3,angle:Math.PI,height:.53,computer:{x:0,z:2}}}],faceDoor(){},yaw:()=>0,dispose(){},eatOrder(kind){eaten=kind;},growFlower(){blooms++;},render(value){snapshot=structuredClone(value);}};
 const button=id=>panel.querySelector('#city-'+id),tick=n=>{for(let i=0;i<n;i++){now+=40;frame(now);}},key=(type,k)=>{const e=new Event(type);e.key=k;window.dispatchEvent(e);},walk=(k,n)=>{key('keydown',k);tick(n);key('keyup',k);};

 try{
  game=createCityBuilder({canvas,onHud(){},loadScene:async()=>({createCityScene:()=>view})});game.start();await Promise.resolve();button('play').dispatchEvent(new Event('click'));walk('w',2);walk('w',13);assert.ok(snapshot.resting.computer);assert.equal(button('computer-type').hidden,false);
  assert.equal(snapshot.computer.open,true,'sitting opens the website without Space');assert.equal(snapshot.computer.keys,0);tick(10);assert.equal(snapshot.computer.open,true);assert.equal(button('computer').hidden,false);const screen=button('computer-screen');assert.equal(screen.children.length,1);assert.equal(screen.children[0].src,'./index.html?city-computer=1');
  for(let i=0;i<5;i++){key('keydown',' ');key('keyup',' ');tick(1);}assert.equal(snapshot.computer.keys,5);assert.equal(screen.children.length,1);assert.ok(snapshot.computer.pulse>0);
  const z=snapshot.player.z;walk('s',10);assert.equal(snapshot.player.z,z,'arrows cannot move the outer character while browsing');
  key('keydown','Escape');tick(1);assert.equal(snapshot.computer.open,false);assert.equal(screen.children.length,0);assert.equal(button('computer').hidden,true);
  button('computer-type').dispatchEvent(new Event('click'));tick(10);assert.equal(snapshot.computer.open,true);game.pause(true);tick(1);assert.equal(snapshot.computer.open,false);assert.equal(screen.children.length,0);game.pause(false);walk('s',5);assert.equal(snapshot.resting,null);
 }finally{game?.destroy();for(const [k,v]of Object.entries(saved))if(v===undefined)delete globalThis[k];else globalThis[k]=v;}
});
