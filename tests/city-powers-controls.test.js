import test from 'node:test';
import assert from 'node:assert/strict';
import {createCityBuilder,createCityState,cityPlace} from '../src/city-builder.js';
for(const [id,kind,power] of [['cafe','galaxyShake','flight'],['market','fruitCup','speed'],['bakery','cake','flowers']])test(`${kind} animates the selected food and activates ${power} outdoors through real controls`,async()=>{
 const saved=Object.fromEntries(['document','window','requestAnimationFrame','cancelAnimationFrame'].map(k=>[k,globalThis[k]]));
 class Element extends EventTarget{constructor(){super();this.children=[];this.dataset={};this.classList={toggle(){},remove(){}};this.tagName='BUTTON';}setAttribute(){}focus(){}closest(){return dialog;}replaceChildren(){this.children=[];}append(...children){this.children.push(...children);}querySelector(id){if(!elements.has(id))elements.set(id,new Element());return elements.get(id);}}
 const elements=new Map(),dialog=new Element(),panel=new Element(),canvas=new Element(),state=createCityState();cityPlace(state,2,2,id);let frame,now=0,snapshot,game,eaten,blooms=0;
 globalThis.document=Object.assign(new Element(),{hidden:false,querySelector:()=>panel,createElement:()=>new Element()});globalThis.window=Object.assign(new Element(),{localStorage:{getItem:()=>JSON.stringify(state),setItem(){}}});globalThis.requestAnimationFrame=fn=>(frame=fn,1);globalThis.cancelAnimationFrame=()=>{};
 const view={canvas,portrait(){},furnish:()=>[],faceDoor(){},yaw:()=>0,dispose(){},eatOrder(kind){eaten=kind;},growFlower(){blooms++;},render(value){snapshot=structuredClone(value);}};
 const button=id=>panel.querySelector('#city-'+id),tick=n=>{for(let i=0;i<n;i++){now+=40;frame(now);}},key=(type,k)=>{const e=new Event(type);e.key=k;window.dispatchEvent(e);},walk=(k,n)=>{key('keydown',k);tick(n);key('keyup',k);};
 try{
  game=createCityBuilder({canvas,onHud(){},wallet:{snapshot:()=>({coins:100,upgrades:['city-cake','city-fruit-cup','city-galaxy-shake']}),subscribe:()=>()=>{},buyFood(){}},loadScene:async()=>({createCityScene:()=>view})});game.start();await Promise.resolve();button('play').dispatchEvent(new Event('click'));walk('w',2);if(id==='market')walk('a',25);else walk('w',58);
  button('shop-choices').children.find(b=>b.dataset.food===kind).dispatchEvent(new Event('click'));key('keydown',' ');tick(1);key('keyup',' ');assert.equal(eaten,kind);assert.ok(snapshot.powers[power]>29&&snapshot.powers[power]<=30);assert.equal(snapshot.shop.items.length,0);
  game.pause(true);const remaining=snapshot.powers[power];tick(100);assert.equal(snapshot.powers[power],remaining);game.pause(false);
  button('enter').dispatchEvent(new Event('click'));tick(1);assert.equal(snapshot.interior,null);
  if(power==='flight'){key('keydown',' ');tick(60);assert.ok(snapshot.player.altitude>10);const x=snapshot.player.x;walk('ArrowRight',10);assert.ok(snapshot.player.x>x);key('keyup',' ');tick(100);assert.equal(snapshot.player.altitude,0);}
  if(power==='speed'){const x=snapshot.player.x;walk('ArrowRight',10);assert.ok(snapshot.player.x-x>3.5);}
  if(power==='flowers'){walk('s',12);key('keydown',' ');tick(40);key('keyup',' ');assert.ok(blooms>=2);const count=blooms;tick(40);assert.equal(blooms,count);}
  if(power==='flight')key('keydown',' ');tick(850);key('keyup',' ');assert.equal(snapshot.powers[power],0);assert.equal(button('power-hud').hidden,true);assert.equal(snapshot.player.altitude,0);
 }finally{game?.destroy();for(const [k,v]of Object.entries(saved))if(v===undefined)delete globalThis[k];else globalThis[k]=v;}
});
