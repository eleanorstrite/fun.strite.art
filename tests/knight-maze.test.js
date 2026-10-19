import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAZE, createMazeState, neighbors, tickMaze, SWORD_SECONDS, createKnightMaze } from '../src/knight-maze.js';
function safeState(){const state=createMazeState();state.player.dir='up';state.dragons.forEach(d=>d.respawn=999);return state;}
function elapse(state,seconds){for(let i=0;i<Math.round(seconds*100);i++)tickMaze(state,.01);}
test('every gem and sword is reachable in a rectangular enclosed maze',()=>{
  assert.equal(MAZE.length,19);MAZE.forEach(row=>assert.equal(row.length,19));
  const seen=new Set(['9,15']),queue=[{x:9,y:15}];for(let i=0;i<queue.length;i++)for(const n of neighbors(queue[i].x,queue[i].y)){const k=`${n.x},${n.y}`;if(!seen.has(k)){seen.add(k);queue.push(n);}}
  const state=createMazeState();for(const k of [...state.gems,...state.swords])assert.equal(seen.has(k),true);
  assert.equal(state.swords.size,4);
});
test('swords grant 30 seconds, expire, and another sword refreshes rather than stacks',()=>{
  const s=safeState();s.player={x:1,y:1,to:null,dir:'up'};tickMaze(s,.01);assert.equal(s.sword,SWORD_SECONDS);elapse(s,29.9);assert.equal(s.sword>0,true);elapse(s,.11);assert.equal(s.sword,0);
  s.sword=20;s.player={x:17,y:1,to:null,dir:'up'};tickMaze(s,.01);assert.equal(s.sword,30);assert.equal(s.swords.size,2);
});
test('walls block movement, buffered turns work, and boots increase movement',()=>{
  const a=safeState(),b=safeState();tickMaze(a,.1,'up');assert.equal(a.player.y,15);
  b.modifiers.speed=1.25;tickMaze(a,.1,'left');tickMaze(b,.1,'left');assert.equal(b.player.x<a.player.x,true);
  const c=safeState();elapse(c,.1);tickMaze(c,.1,'left');tickMaze(c,.25,'up');assert.equal(c.player.y<15,true);
});
test('gems pay once and magnet cannot collect through a wall',()=>{
  const s=safeState();s.player={x:1,y:3,to:null,dir:'left'};tickMaze(s,.01);const earned=s.earned;tickMaze(s,.01);assert.equal(s.earned,earned);
  s.modifiers.pickupRadius=2;s.player={x:1,y:1,to:null,dir:'up'};s.gems.add('2,2');tickMaze(s,.01);assert.equal(s.gems.has('2,2'),true);assert.equal(s.gems.has('2,1'),false);
});
test('armed contact defeats a dragon, pays ten coins, and respawns after eight seconds',()=>{
  const s=safeState();s.sword=30;Object.assign(s.dragons[0],{x:9,y:15,to:null,respawn:0});tickMaze(s,.01);assert.equal(s.kills,1);assert.equal(s.earned,10);assert.equal(s.dragons[0].respawn,8);
  elapse(s,7.9);assert.equal(s.dragons[0].respawn>0,true);elapse(s,.11);assert.equal(s.dragons[0].respawn,0);
});
test('getting eaten removes one life, emits once, and freezes the world before respawn',()=>{
  const s=safeState(),events=[];s.grace=0;Object.assign(s.dragons[0],{x:9,y:15,to:null,respawn:0});
  tickMaze(s,.01,undefined,e=>events.push(e));assert.equal(s.lives,2);assert.equal(s.status,'dying');assert.deepEqual(events,['eaten']);
  const positions=JSON.stringify([s.player,s.dragons]),elapsed=s.elapsed,gems=s.gems.size;
  for(let i=0;i<10;i++)tickMaze(s,.1,'right',e=>events.push(e));
  assert.equal(JSON.stringify([s.player,s.dragons]),positions);assert.equal(s.elapsed,elapsed);assert.equal(s.gems.size,gems);assert.equal(s.lives,2);assert.deepEqual(events,['eaten']);
  elapse(s,.51);assert.equal(s.status,'playing');assert.equal(s.player.y,15);assert.equal(s.grace>2.9,true);
  Object.assign(s.dragons[0],{x:s.player.x,y:s.player.y,to:null,respawn:0});tickMaze(s,.01);assert.equal(s.lives,2);
});
test('last life waits for the eaten pause before game over, and restart restores three lives',()=>{
  const s=safeState();s.lives=1;s.grace=0;Object.assign(s.dragons[0],{x:9,y:15,to:null,respawn:0});
  tickMaze(s,.01);assert.equal(s.lives,0);assert.equal(s.status,'dying');elapse(s,1.49);assert.equal(s.status,'dying');elapse(s,.02);assert.equal(s.status,'lost');
  const earned=s.earned;tickMaze(s,.2);assert.equal(s.earned,earned);assert.equal(s.lives,0);assert.equal(createMazeState().lives,3);
});
test('dragon defeats and pickups emit distinct sound events without repeat rewards',()=>{
  const s=safeState(),events=[];s.sword=30;Object.assign(s.dragons[0],{x:9,y:15,to:null,respawn:0});
  tickMaze(s,.01,undefined,e=>events.push(e));assert.deepEqual(events,['dragon']);tickMaze(s,.01,undefined,e=>events.push(e));assert.deepEqual(events,['dragon']);
  s.player={x:1,y:1,to:null,dir:'up'};tickMaze(s,.01,undefined,e=>events.push(e));assert.deepEqual(events,['dragon','sword']);
  s.player={x:2,y:1,to:null,dir:'up'};tickMaze(s,.01,undefined,e=>events.push(e));assert.equal(events.includes('gem'),true);
});
test('collecting the last gem wins the maze',()=>{const s=safeState();s.gems=new Set(['9,15']);tickMaze(s,.01);assert.equal(s.status,'won');assert.equal(s.earned,1);});
test('engine pauses timers, freezes hidden tabs, and settles only once on destroy',()=>{
  const original={requestAnimationFrame:globalThis.requestAnimationFrame,cancelAnimationFrame:globalThis.cancelAnimationFrame,document:globalThis.document};
  let frame,settled=0,hudCount=0;
  globalThis.requestAnimationFrame=fn=>(frame=fn,1);globalThis.cancelAnimationFrame=()=>{};globalThis.document={hidden:false};
  const ctx=new Proxy({},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
  const canvas={width:760,height:760,getContext:()=>ctx,addEventListener(){},focus(){}};
  try {const engine=createKnightMaze({canvas,character:{color:'#ed6e40'},modifiers:{},onHud(){hudCount++},onFinish(){settled++}});engine.start();frame(100);engine.pause(true);const n=hudCount;frame(200);assert.equal(hudCount,n);engine.pause(false);globalThis.document.hidden=true;frame(300);assert.equal(hudCount,n);globalThis.document.hidden=false;frame(400);assert.equal(hudCount>n,true);engine.destroy();engine.destroy();assert.equal(settled,1);}finally{Object.assign(globalThis,original);}
});
test('winning delays rewards for the ending, freezes on pause, and allows skip without double settlement',()=>{
  const original={requestAnimationFrame:globalThis.requestAnimationFrame,cancelAnimationFrame:globalThis.cancelAnimationFrame,document:globalThis.document};
  const maze=MAZE.slice();let frame,settled=0,now=100;const handlers={};
  globalThis.requestAnimationFrame=fn=>(frame=fn,1);globalThis.cancelAnimationFrame=()=>{};globalThis.document={hidden:false};
  const ctx=new Proxy({},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
  const canvas={width:760,height:760,getContext:()=>ctx,addEventListener(name,fn){handlers[name]=fn;},focus(){}};
  let engine;
  try {
    MAZE.forEach((row,i)=>MAZE[i]=row.replace(/\./g,'D'));
    engine=createKnightMaze({canvas,character:{color:'#ed6e40'},modifiers:{},onHud(){},onFinish(){settled++;}});
    const frames=n=>{for(let i=0;i<n;i++){frame(now);now+=100;}};
    engine.start();frames(2);assert.equal(settled,0);engine.pause(true);frames(100);assert.equal(settled,0);engine.pause(false);frames(80);assert.equal(settled,1);
    engine.start();frames(2);assert.equal(settled,1);handlers.keydown({key:'Enter',preventDefault(){}});assert.equal(settled,2);engine.destroy();assert.equal(settled,2);
  } finally {engine?.destroy();MAZE.splice(0,MAZE.length,...maze);Object.assign(globalThis,original);}
});
