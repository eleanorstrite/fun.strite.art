import test from 'node:test';
import assert from 'node:assert/strict';
import {createCityBuilder,createCityState,cityPlace} from '../src/city-builder.js';
for(const [x,kind] of [[0,'owner'],[1,'cat'],[2,'dog']])test(`${kind} protest starts in bed and stops immediately when standing or closing`,async()=>{
  const names=['document','window','requestAnimationFrame','cancelAnimationFrame','AudioContext','speechSynthesis','SpeechSynthesisUtterance'],saved=Object.fromEntries(names.map(key=>[key,globalThis[key]]));
  const elements=new Map();class Element extends EventTarget{constructor(){super();this.children=[];this.dataset={};this.classList={toggle(){},remove(){}};this.tagName='BUTTON';}setAttribute(){}focus(){}setPointerCapture(){}closest(){return dialog;}replaceChildren(){this.children=[];}append(...items){this.children.push(...items);}querySelector(id){if(!elements.has(id))elements.set(id,new Element());return elements.get(id);}}
  const dialog=new Element(),panel=new Element(),canvas=new Element(),state=createCityState();cityPlace(state,x,2,'cottage');let frame,now=0,snapshot,game,cancels=0;const sounds=[],words=[];
  const param=()=>({setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}});
  globalThis.AudioContext=class{state='running';currentTime=0;destination={};resume(){}close(){}createGain(){return {gain:param(),connect(){},disconnect(){}};}createOscillator(){const sound={frequency:param(),connect(){},disconnect(){},start(){},stop(){this.stops=(this.stops||0)+1;}};sounds.push(sound);return sound;}};
  globalThis.speechSynthesis={speak:line=>words.push(line),cancel:()=>cancels++};globalThis.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};
  globalThis.document=Object.assign(new Element(),{hidden:false,querySelector:()=>panel,createElement:()=>new Element()});globalThis.window=Object.assign(new Element(),{localStorage:{getItem:()=>JSON.stringify(state),setItem(){}}});globalThis.requestAnimationFrame=fn=>(frame=fn,1);globalThis.cancelAnimationFrame=()=>{};
  const view={canvas,portrait(){},furnish:()=>[{x:0,z:2,w:1.5,d:2,use:{pose:'lie',x:0,z:2,angle:0,height:.9}}],faceDoor(){},yaw:()=>0,dispose(){},render(value){snapshot=structuredClone(value);}};
  const tick=n=>{for(let i=0;i<n;i++){now+=40;frame(now);}},key=(type,key)=>{const e=new Event(type);e.key=key;window.dispatchEvent(e);};
  try{game=createCityBuilder({canvas,onHud(){},loadScene:async()=>({createCityScene:()=>view})});game.start();await Promise.resolve();panel.querySelector('#city-play').dispatchEvent(new Event('click'));key('keydown','w');tick(25);key('keyup','w');assert.equal(snapshot.resting.pose,'lie');assert.equal(panel.querySelector('#city-shop-status').hidden,false);
    if(kind==='owner')assert.equal(words[0].text,'Hey, get out of the bed!');else assert.equal(sounds.length,kind==='dog'?2:1);
    key('keydown','s');if(kind==='owner')assert.equal(cancels,1);else assert.equal(sounds[0].stops,2);tick(7);key('keyup','s');assert.equal(snapshot.resting,null);assert.equal(panel.querySelector('#city-shop-status').hidden,true);
    key('keydown','w');tick(16);key('keyup','w');assert.equal(snapshot.resting.pose,'lie');game.destroy();game=null;if(kind==='owner')assert.equal(cancels,2);else assert.equal(sounds.at(-1).stops,2);
  }finally{game?.destroy();for(const [key,value]of Object.entries(saved))if(value===undefined)delete globalThis[key];else globalThis[key]=value;}
});
