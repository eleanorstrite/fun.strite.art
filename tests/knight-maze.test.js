import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAZE, KNIGHT_LEVELS, PORTAL_ROW, activateMazeBoost, createMazeState, neighbors, tickMaze, SWORD_SECONDS, createKnightMaze, drawKnight, calculateMazeReward, drawMaze3D, projectMazePoint, MAZE_WALL_HEIGHT, mazeInputDirection, chooseDragonTurn } from '../src/knight-maze.js';
function safeState(){const state=createMazeState();state.player.dir='up';state.dragons.forEach(d=>d.respawn=999);return state;}
function elapse(state,seconds){for(let i=0;i<Math.round(seconds*100);i++)tickMaze(state,.01);}
test('every gem and sword is reachable in a rectangular maze',()=>{
  assert.equal(MAZE.length,19);MAZE.forEach(row=>assert.equal(row.length,19));
  const seen=new Set(['9,15']),queue=[{x:9,y:15}];for(let i=0;i<queue.length;i++)for(const n of neighbors(queue[i].x,queue[i].y)){const k=`${n.x},${n.y}`;if(!seen.has(k)){seen.add(k);queue.push(n);}}
  const state=createMazeState();for(const k of [...state.gems,...state.swords])assert.equal(seen.has(k),true);
  assert.equal(state.swords.size,4);
});
test('swords grant 10 seconds, expire, and another sword refreshes rather than stacks',()=>{
  const s=safeState();s.player={x:1,y:1,to:null,dir:'up'};tickMaze(s,.01);assert.equal(s.sword,SWORD_SECONDS);elapse(s,9.9);assert.equal(s.sword>0,true);elapse(s,.11);assert.equal(s.sword,0);
  s.sword=5;s.player={x:17,y:1,to:null,dir:'up'};tickMaze(s,.01);assert.equal(s.sword,10);assert.equal(s.swords.size,2);
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
test('armed contact defeats a dragon, pays two bonus coins, and respawns after eight seconds',()=>{
  const s=safeState();s.sword=SWORD_SECONDS;Object.assign(s.dragons[0],{x:9,y:15,to:null,respawn:0});tickMaze(s,.01);assert.equal(s.kills,1);assert.equal(s.earned,2);assert.equal(s.dragons[0].respawn,8);
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
  const s=safeState(),events=[];s.sword=SWORD_SECONDS;Object.assign(s.dragons[0],{x:9,y:15,to:null,respawn:0});
  tickMaze(s,.01,undefined,e=>events.push(e));assert.deepEqual(events,['dragon']);tickMaze(s,.01,undefined,e=>events.push(e));assert.deepEqual(events,['dragon']);
  s.player={x:1,y:1,to:null,dir:'up'};tickMaze(s,.01,undefined,e=>events.push(e));assert.deepEqual(events,['dragon','sword']);
  s.player={x:2,y:1,to:null,dir:'up'};tickMaze(s,.01,undefined,e=>events.push(e));assert.equal(events.includes('gem'),true);
});
test('collecting the last gem wins the maze',()=>{const s=safeState();s.gems=new Set(['9,15']);tickMaze(s,.01);assert.equal(s.status,'won');assert.equal(s.earned,30);});
test('engine pauses timers, freezes hidden tabs, and settles only once on destroy',()=>{
  const original={requestAnimationFrame:globalThis.requestAnimationFrame,cancelAnimationFrame:globalThis.cancelAnimationFrame,document:globalThis.document};
  let frame,settled=0,hudCount=0,boostUses=0,lastHud;
  globalThis.requestAnimationFrame=fn=>(frame=fn,1);globalThis.cancelAnimationFrame=()=>{};globalThis.document={hidden:false};
  const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
  const canvas={width:760,height:760,getContext:()=>ctx,addEventListener(){},focus(){}};
  try {const engine=createKnightMaze({canvas,character:{color:'#ed6e40'},modifiers:{},consumeBoost(){boostUses++;return true;},onHud(value){hudCount++;lastHud=value;},onFinish(){settled++}});assert.equal(engine.activateBoost('boots'),false);engine.start();assert.equal(engine.activateBoost('boots'),true);assert.equal(engine.activateBoost('boots'),false);frame(100);const viewHud=JSON.stringify(lastHud);assert.equal(engine.setView('3d'),true);assert.equal(engine.setView('bad'),false);assert.equal(JSON.stringify(lastHud),viewHud);assert.equal(settled,0);engine.pause(true);assert.equal(engine.activateBoost('magnet'),false);const timer=lastHud.boosts.boots;const n=hudCount;frame(200);assert.equal(engine.setView('2d'),true);assert.equal(hudCount,n);engine.pause(false);globalThis.document.hidden=true;frame(300);assert.equal(hudCount,n+1);assert.equal(lastHud.boosts.boots,timer);assert.equal(engine.activateBoost('magnet'),false);assert.equal(boostUses,1);globalThis.document.hidden=false;frame(400);assert.equal(hudCount>n,true);engine.destroy();engine.destroy();assert.equal(settled,1);}finally{Object.assign(globalThis,original);}
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
test('defeat ending follows the last life, pauses, and settles once when skipped',()=>{
  const original={requestAnimationFrame:globalThis.requestAnimationFrame,cancelAnimationFrame:globalThis.cancelAnimationFrame,document:globalThis.document};
  let frame,settled=0,now=100,hud={};const handlers={};
  globalThis.requestAnimationFrame=fn=>(frame=fn,1);globalThis.cancelAnimationFrame=()=>{};globalThis.document={hidden:false};
  const ctx=new Proxy({},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
  const canvas={width:760,height:760,getContext:()=>ctx,addEventListener(name,fn){handlers[name]=fn;},focus(){}};
  let engine;
  try{
    engine=createKnightMaze({canvas,character:{color:'#ed6e40'},modifiers:{},onHud:value=>hud=value,onFinish(){settled++;}});engine.start();
    for(let i=0;i<3000&&!hud.text.includes('one last surprise');i++){frame(now);now+=100;}
    assert.equal(hud.lives,0);assert.equal(hud.text.includes('one last surprise'),true);assert.equal(settled,0);
    engine.pause(true);for(let i=0;i<100;i++){frame(now);now+=100;}assert.equal(settled,0);
    engine.pause(false);handlers.keydown({key:'Enter',preventDefault(){}});assert.equal(settled,1);engine.destroy();assert.equal(settled,1);
  }finally{engine?.destroy();Object.assign(globalThis,original);}
});

test('knight renderer applies armor colors and optional cape, plume, and shield',()=>{
  const used=[];const ctx=new Proxy({fillRect(){used.push(this.fillStyle);}}, {get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
  const character={color:'#ed6e40',armor:'gold',helmet:'plain',cape:false,shield:false};
  drawKnight(ctx,90,90,120,character);assert.equal(used.includes('#b88b38'),true);assert.equal(used.includes(character.color),false);
  drawKnight(ctx,90,90,120,{...character,shield:true});assert.equal(used.includes(character.color),true);
});

test('maze rewards scale with progress and dragon defeats and never exceed forty',()=>{
  assert.equal(calculateMazeReward(180,180,0),0);
  assert.equal(calculateMazeReward(180,90,0),15);
  assert.equal(calculateMazeReward(180,90,2),19);
  assert.equal(calculateMazeReward(180,0,0),30);
  assert.equal(calculateMazeReward(180,0,3),36);
  assert.equal(calculateMazeReward(180,0,5),40);
  assert.equal(calculateMazeReward(180,0,100),40);
  assert.equal(calculateMazeReward(0,0,0),0);
});

test('boost activation consumes once, expires after fifteen seconds and cannot stack',()=>{
 const s=safeState();let consumed=0;const consume=()=>{consumed++;return true;};
 assert.equal(activateMazeBoost(s,'boots',()=>false),false);assert.equal(s.boosts.boots,0);
 assert.equal(activateMazeBoost(s,'boots',consume),true);
 assert.equal(activateMazeBoost(s,'boots',consume),false);assert.equal(consumed,1);
 assert.equal(activateMazeBoost(s,'magnet',consume),true);assert.equal(consumed,2);
 elapse(s,14.9);assert.equal(s.boosts.boots>0,true);elapse(s,.11);assert.equal(s.boosts.boots,0);assert.equal(s.boosts.magnet,0);
 assert.equal(activateMazeBoost(s,'boots',consume),true);
 s.status='dying';s.deathPause=1;tickMaze(s,.25);assert.equal(s.boosts.boots,15);
 assert.equal(activateMazeBoost(s,'magnet',consume),false);assert.equal(consumed,3);
 s.status='won';assert.equal(activateMazeBoost(s,'magnet',consume),false);
});
test('speed and magnet only affect movement and pickup while their timers are active',()=>{
 const a=safeState(),b=safeState();activateMazeBoost(b,'boots',()=>true);
 tickMaze(a,.1,'left');tickMaze(b,.1,'left');assert.equal(b.player.x<a.player.x,true);
 const s=safeState();s.player={x:1,y:1,to:null,dir:'up'};s.swords.clear();
 tickMaze(s,.01);assert.equal(s.gems.has('2,1'),true);
 activateMazeBoost(s,'magnet',()=>true);tickMaze(s,.01);assert.equal(s.gems.has('2,1'),false);
 elapse(s,15);s.gems.add('2,1');tickMaze(s,.01);assert.equal(s.gems.has('2,1'),true);
});

test('side portals transport in both directions and continue inward without bouncing',()=>{
 for(const [x,dir,exit] of [[0,'left',18],[18,'right',0]]){
  const s=safeState(),events=[];s.player={x,y:PORTAL_ROW,to:null,dir};
  tickMaze(s,.01,dir,e=>events.push(e));assert.equal(s.player.x,exit);assert.equal(s.player.y,PORTAL_ROW);
  assert.deepEqual(events,['portal']);tickMaze(s,.1,dir,e=>events.push(e));
  assert.equal(exit===18?s.player.x<18:s.player.x>0,true);
  assert.equal(events.filter(e=>e==='portal').length,1);
 }
});
test('portals are reachable from corridors, preserve powers, and never sweep through the center',()=>{
 const s=safeState();s.player={x:1,y:PORTAL_ROW,to:null,dir:'left'};s.grace=0;s.sword=5;s.boosts.boots=5;
 s.dragons[0]={x:9,y:PORTAL_ROW,to:null,dir:'left',home:{x:7,y:9},index:0,respawn:0};
 const events=[];tickMaze(s,.25,'left',e=>events.push(e));
 assert.equal(s.player.x>17,true);assert.equal(s.kills,0);assert.equal(s.lives,3);
 assert.equal(s.sword>4,true);assert.equal(s.boosts.boots>4,true);assert.equal(events.includes('portal'),true);
});
test('portal links exist only on the middle row and dragons can use them',()=>{
 assert.equal(neighbors(0,PORTAL_ROW).find(n=>n.dir==='left').x,18);
 assert.equal(neighbors(18,PORTAL_ROW).find(n=>n.dir==='right').x,0);
 assert.equal(neighbors(1,3).some(n=>n.x===0),false);
 const s=safeState();s.player={x:17,y:PORTAL_ROW,to:null,dir:'up'};
 s.dragons[0]={x:0,y:PORTAL_ROW,to:null,dir:'left',home:{x:7,y:9},index:0,respawn:0};
 tickMaze(s,.01);assert.equal(s.dragons[0].x,18);
});

test('eliminator freezes every dragon for fifteen seconds without kills or contact damage',()=>{
 const s=safeState();s.grace=0;s.player={x:1,y:1,to:null,dir:'up'};s.swords.clear();
 s.dragons[0]={...s.dragons[0],x:1,y:1,to:{x:2,y:1},respawn:0};
 s.dragons[1].respawn=0;
 const positions=JSON.parse(JSON.stringify(s.dragons));let consumed=0;
 assert.equal(activateMazeBoost(s,'eliminator',()=>{consumed++;return true;}),true);
 assert.equal(activateMazeBoost(s,'eliminator',()=>{consumed++;return true;}),false);
 elapse(s,14.9);assert.equal(s.boosts.eliminator>0,true);
 assert.deepEqual(s.dragons,positions);assert.equal(s.lives,3);assert.equal(s.kills,0);
 elapse(s,.1);assert.equal(s.boosts.eliminator<1e-8,true);assert.deepEqual(s.dragons,positions);
 tickMaze(s,.02);assert.equal(s.boosts.eliminator,0);assert.equal(s.lives,2);assert.equal(consumed,1);
});
test('eliminator cannot be used while dying and keeps its remaining time during a death pause',()=>{
 const s=safeState();s.status='dying';s.deathPause=1;
 assert.equal(activateMazeBoost(s,'eliminator',()=>true),false);
 s.status='playing';activateMazeBoost(s,'eliminator',()=>true);s.status='dying';
 tickMaze(s,.25);assert.equal(s.boosts.eliminator,15);
});

test('all four distinct level mazes have reachable gems, swords, portals and dragon homes',()=>{
 assert.equal(KNIGHT_LEVELS.length,4);assert.equal(new Set(KNIGHT_LEVELS.map(l=>l.maze.join(''))).size,4);
 for(let level=0;level<KNIGHT_LEVELS.length;level++){
  const s=createMazeState({},level),seen=new Set(['9,15']),queue=[{x:9,y:15}];
  assert.equal(s.maze.length,19);s.maze.forEach(row=>assert.equal(row.length,19));
  for(let i=0;i<queue.length;i++)for(const n of neighbors(queue[i].x,queue[i].y,s.maze)){
   const key=n.x+','+n.y;if(!seen.has(key)){seen.add(key);queue.push(n);}
  }
  for(const key of [...s.gems,...s.swords,'0,9','18,9',...s.dragons.map(d=>d.x+','+d.y)])assert.equal(seen.has(key),true);
  assert.equal(s.swords.size,4);assert.equal(s.lives,3);
  s.player={x:0,y:9,to:null,dir:'left'};s.dragons.forEach(d=>d.respawn=999);
  tickMaze(s,.01,'left');assert.equal(s.player.x,18);
 }
});
test('winning offers replay or next level, each run resets, and the last level ends the campaign',()=>{
 const original={requestAnimationFrame:globalThis.requestAnimationFrame,cancelAnimationFrame:globalThis.cancelAnimationFrame,document:globalThis.document};
 const mazes=KNIGHT_LEVELS.map(l=>l.maze.slice());let frame,now=100,hud,result,finishes=0;const changes=[],handlers={};
 globalThis.requestAnimationFrame=fn=>(frame=fn,1);globalThis.cancelAnimationFrame=()=>{};globalThis.document={hidden:false};
 const ctx=new Proxy({},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 const canvas={width:760,height:760,getContext:()=>ctx,addEventListener(name,fn){handlers[name]=fn;},focus(){}};
 let engine;
 try{
  for(const level of KNIGHT_LEVELS)level.maze.forEach((row,i)=>level.maze[i]=row.replace(/\./g,'D'));
  engine=createKnightMaze({canvas,character:{color:'#ed6e40'},modifiers:{},onHud:v=>hud=v,onFinish:(coins,v)=>{result=v;finishes++;},onLevelChange:level=>changes.push(level)});
  assert.equal(engine.selectNextLevel(),false);
  const win=()=>{engine.start();assert.equal(hud.lives,3);frame(now);now+=100;frame(now);now+=100;assert.equal(engine.selectNextLevel(),false);handlers.keydown({key:'Enter',preventDefault(){}});};
  win();assert.equal(result.level,0);assert.equal(result.hasNext,true);win();assert.equal(result.level,0);
  for(let level=1;level<4;level++){assert.equal(engine.selectNextLevel(),true);win();assert.equal(result.level,level);assert.equal(result.hasNext,level<3);}
  assert.equal(engine.selectNextLevel(),false);assert.deepEqual(changes,[1,2,3]);
  engine.destroy();assert.equal(finishes,5);
 }finally{engine?.destroy();KNIGHT_LEVELS.forEach((l,i)=>l.maze.splice(0,l.maze.length,...mazes[i]));Object.assign(globalThis,original);}
});

test('direct level selection settles the previous run once and resets a paused game',()=>{
 const original={requestAnimationFrame:globalThis.requestAnimationFrame,cancelAnimationFrame:globalThis.cancelAnimationFrame,document:globalThis.document};
 let frame,hud,finishes=0;const changes=[];
 globalThis.requestAnimationFrame=fn=>(frame=fn,1);globalThis.cancelAnimationFrame=()=>{};globalThis.document={hidden:false};
 const ctx=new Proxy({},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 const canvas={width:760,height:760,getContext:()=>ctx,addEventListener(){},focus(){}};
 let engine;
 try{
  engine=createKnightMaze({canvas,character:{color:'#ed6e40'},onHud:v=>hud=v,onFinish(){finishes++;},onLevelChange:level=>changes.push(level)});
  assert.equal(engine.selectLevel(3),true);assert.equal(finishes,0);engine.start();
  assert.equal(hud.text.includes('Ember Fortress'),true);
  engine.pause(true);assert.equal(engine.selectLevel(1),true);assert.equal(finishes,1);
  assert.equal(engine.selectLevel(9),false);assert.equal(finishes,1);
  engine.start();assert.equal(hud.lives,3);assert.equal(hud.canBoost,true);
  assert.equal(hud.text.includes('Crystal Caverns'),true);frame(100);frame(200);
  engine.selectLevel(0);assert.equal(finishes,2);assert.deepEqual(changes,[3,1,0]);
  engine.destroy();engine.destroy();assert.equal(finishes,2);assert.equal(engine.selectLevel(2),false);
 }finally{engine?.destroy();Object.assign(globalThis,original);}
});

test('3D chase camera keeps walls below the knight and dragon and leaves simulation untouched',()=>{
  const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
  for(let level=0;level<4;level++){
    const state=createMazeState({},level),before=JSON.stringify({...state,gems:[...state.gems],swords:[...state.swords]});
    for(const angle of [0,Math.PI/2,Math.PI,-Math.PI/2]){
      for(const facing of ['up','down','left','right']){
        const rendered={...state,player:{...state.player,dir:facing}};
        for(const helmet of ['plain','plume','horns','crown','winged'])drawMaze3D(ctx,rendered,{color:'#ed6e40',armor:'gold',helmet,shield:true},760,760,angle);
      }
      const ground=projectMazePoint(state,state.player.x,state.player.y,0,760,760,angle);
      const wall=projectMazePoint(state,state.player.x,state.player.y,MAZE_WALL_HEIGHT,760,760,angle);
      const knight=projectMazePoint(state,state.player.x,state.player.y,1,760,760,angle);
      const dragon=projectMazePoint(state,state.player.x,state.player.y,1.55,760,760,angle);
      assert.equal(ground.y>wall.y,true);assert.equal(wall.y>knight.y,true);assert.equal(knight.y>dragon.y,true);
    }
    assert.equal(JSON.stringify({...state,gems:[...state.gems],swords:[...state.swords]}),before);
    state.status='dying';state.boosts.eliminator=15;drawMaze3D(ctx,state,{color:'#ed6e40'},380,380);
  }
});

test('3D and 2D arrows stay aligned with the screen for every knight heading',()=>{
  const headings=['up','right','down','left'];
  for(let i=0;i<4;i++){
    for(const key of headings){
      assert.equal(mazeInputDirection(key,headings[i],'3d'),key);
      assert.equal(mazeInputDirection(key,headings[i],'2d'),key);
    }
  }
  assert.equal(mazeInputDirection('bad','up','3d'),null);
});


test('steady 3D camera does not rotate when the knight changes heading',()=>{
  const state=createMazeState();
  const point=()=>projectMazePoint(state,state.player.x+1,state.player.y-1,0,760,760);
  const before=point();
  for(const facing of ['up','right','down','left']){
    state.player.dir=facing;
    assert.deepEqual(point(),before);
  }
  const center=projectMazePoint(state,state.player.x,state.player.y,0,760,760);
  assert.ok(before.x>center.x);
  assert.ok(before.y<center.y);
});


test('close chase view keeps the knight large and reveals approaching dragons behind',()=>{
  const state=createMazeState();
  for(const size of [380,760]){
    const knight=projectMazePoint(state,state.player.x,state.player.y,.52,size,size);
    assert.ok(knight.scale>size*.11);
    for(const [dx,dy] of [[0,3],[-2,2],[2,2],[0,-3]])for(const z of [0,.78,1.55]){
      const p=projectMazePoint(state,state.player.x+dx,state.player.y+dy,z,size,size);
      assert.ok(p&&p.x>0&&p.x<size&&p.y>77&&p.y<size-34);
    }
  }
});

test('3D keyboard steers the knight without turning the camera',()=>{
  const original={requestAnimationFrame:globalThis.requestAnimationFrame,cancelAnimationFrame:globalThis.cancelAnimationFrame,document:globalThis.document};
  let frame,engine,heading='';const handlers={};
  globalThis.requestAnimationFrame=fn=>(frame=fn,1);globalThis.cancelAnimationFrame=()=>{};globalThis.document={hidden:false};
  const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}}),fillText(text){if(text.startsWith('FACING '))heading=text;}},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
  const canvas={width:760,height:760,getContext:()=>ctx,addEventListener(name,fn){handlers[name]=fn;},focus(){}};
  try{
    engine=createKnightMaze({canvas,view:'3d',character:{color:'#ed6e40'},onHud(){},onFinish(){}});engine.start();frame(100);
    assert.equal(heading,'FACING WEST');
    handlers.keydown({key:'ArrowRight',repeat:false,preventDefault(){}});
    for(let now=150;now<=700;now+=50)frame(now);
    assert.equal(heading,'FACING EAST');
    for(let now=750;now<=1100;now+=50){handlers.keydown({key:'ArrowRight',repeat:true,preventDefault(){}});frame(now);}
    assert.equal(heading,'FACING EAST');
    handlers.keydown({key:'ArrowLeft',repeat:false,preventDefault(){}});
    for(let now=1150;now<=1750;now+=50)frame(now);
    assert.equal(heading,'FACING WEST');
  }finally{engine?.destroy();Object.assign(globalThis,original);}
});


test('dragons chase most junctions but take a staggered detour once in four',()=>{
  const maze=['#####','#...#','#...#','#...#','#####'];
  const distances=new Map([['2,1',0],['3,2',2],['1,2',4],['2,3',6]]);
  for(let index=0;index<4;index++){
    const dragon={x:2,y:2,dir:'up',index},turns=[];
    for(let i=0;i<4;i++)turns.push(chooseDragonTurn(dragon,maze,distances).dir);
    assert.equal(turns.filter(d=>d==='up').length,3);
    assert.equal(turns.filter(d=>d==='right').length,1);
    assert.equal(turns[3-index],'right');
    assert.equal(chooseDragonTurn(dragon,maze,distances,true).dir,'left');
  }
});
test('less relentless dragons still escape dead ends and stay slower than the knight',()=>{
  const dragon={x:1,y:1,dir:'left',index:0};
  assert.equal(chooseDragonTurn(dragon,['#####','#...#','#####'],new Map()).dir,'right');
  const s=createMazeState();s.player.dir='up';s.grace=99;
  s.dragons.forEach((d,i)=>Object.assign(d,{x:7+i,y:9,to:null,dir:'right',respawn:0}));
  const start=s.dragons.map(d=>({...d}));tickMaze(s,.1);
  s.dragons.forEach((d,i)=>{const travel=Math.hypot(d.x-start[i].x,d.y-start[i].y);assert.ok(travel>0&&travel<.3);});
});
