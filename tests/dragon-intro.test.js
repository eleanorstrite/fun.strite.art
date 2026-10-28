import test from 'node:test';
import assert from 'node:assert/strict';
import {dragonIntroPose,DRAGON_INTRO_SECONDS,DRAGON_INVITATION} from '../src/dragon-intro.js';
test('rainbow dragon flies in, turns to the viewer, greets them and accelerates offscreen',()=>{
 assert.equal(DRAGON_INVITATION,'Are you ready to play memory?');assert.ok(dragonIntroPose(0).x<0);assert.equal(dragonIntroPose(2).phase,'fly-in');assert.equal(dragonIntroPose(2.9).phase,'turn');assert.ok(dragonIntroPose(2.9).face>0&&dragonIntroPose(2.9).face<1);assert.equal(dragonIntroPose(4).face,1);assert.equal(dragonIntroPose(4).phase,'greeting');assert.equal(dragonIntroPose(8).phase,'fly-away');assert.ok(dragonIntroPose(9).x-dragonIntroPose(8.5).x>dragonIntroPose(8).x-dragonIntroPose(7.5).x);assert.ok(dragonIntroPose(DRAGON_INTRO_SECONDS).x>1240);assert.equal(dragonIntroPose(DRAGON_INTRO_SECONDS).done,true);
});
test('reduced motion still crosses the screen without bobbing or rapid wing changes',()=>{
 for(const time of [1,3,4,8]){const pose=dragonIntroPose(time,true);assert.equal(pose.x,dragonIntroPose(time).x);assert.equal(pose.y,295);assert.equal(pose.wing,0);}assert.ok(dragonIntroPose(1,true).x<dragonIntroPose(2,true).x);assert.ok(dragonIntroPose(8,true).x>dragonIntroPose(4,true).x);assert.ok(dragonIntroPose(9.5,true).x>1240);assert.equal(dragonIntroPose(4,true).face,1);assert.equal(dragonIntroPose(9.5,true).done,true);
});

test('slow or failed artwork loading never silently skips the dragon flight',async()=>{
 const {createDragonIntro}=await import('../src/dragon-intro.js');const originals={document:globalThis.document,window:globalThis.window,Image:globalThis.Image};const images=[],positions=[];
 const context=new Proxy({}, {get(target,key){if(key in target)return target[key];if(key==='translate')return x=>positions.push(x);if(String(key).startsWith('create'))return ()=>({addColorStop(){}});return ()=>{};}});
 class Element{constructor(){this.children=[];this.dataset={};this.hidden=false;this.disabled=false;this.handlers={};this.classList={add(){},remove(){}};}append(...nodes){this.children.push(...nodes);}prepend(node){this.children.unshift(node);}setAttribute(){}addEventListener(name,fn){this.handlers[name]=fn;}getContext(){return context;}focus(){}remove(){this.removed=true;}}
 const wrap=new Element(),start=new Element();wrap.querySelector=()=>start;let completed=0,clip;
 try{globalThis.document={createElement:()=>new Element()};globalThis.window={matchMedia:()=>({matches:true})};globalThis.Image=class{constructor(){images.push(this);this.naturalWidth=1400;this.naturalHeight=1120;}};
  clip=createDragonIntro(wrap,{onDone(){completed++;}});const stage=wrap.children[0];clip.tick(12);assert.equal(completed,0);assert.equal(start.disabled,true);assert.equal(stage.removed,undefined);images[0].onerror();assert.equal(completed,0);const retry=stage.children.at(-1).children.find(e=>e.textContent==='Reload dragon');assert.equal(retry.hidden,false);retry.handlers.click();images[0].onload();clip.tick(2);const entrance=positions.at(-1);clip.tick(2);assert.ok(positions.at(-1)>entrance);assert.equal(stage.dataset.phase,'greeting');assert.equal(completed,0);clip.tick(4);assert.ok(positions.at(-1)>480);clip.tick(2);assert.equal(completed,1);assert.equal(stage.removed,true);assert.equal(start.disabled,false);clip.tick(10);assert.equal(completed,1);
 }finally{clip?.destroy();for(const [key,value]of Object.entries(originals)){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}}
});
