import test from 'node:test';
import assert from 'node:assert/strict';
import {createSportsState,sportsAction,tickSports,sportsReward,sportsShotPoint,sportsShotAligned} from '../src/animal-sports-rules.js';
import {SPORTS_ANIMALS,SPORTS_EQUIPMENT,SPORTS_SHOP_ITEMS,validateSportsSettings} from '../src/animal-sports-settings.js';
import {createSystem} from '../src/system.js';
const advance=(s,seconds,input={})=>{for(let t=0;t<seconds;t+=.02)tickSports(s,.02,input,()=>1);};
test('bowling aims, prevents multiple balls, knocks down pins and finishes five rounds',()=>{
 const s=createSportsState('bowling');advance(s,3,{x:1});assert.equal(s.player.x,645);advance(s,.66,{x:-1});assert.ok(Math.abs(s.player.x-480)<10);
 assert.equal(sportsAction(s,'roll'),true);assert.equal(sportsAction(s,'roll'),false);advance(s,2.4);assert.ok(s.score>0);const score=s.score;advance(s,.1);assert.equal(s.score,score);
 for(let roll=0;roll<12&&!s.done;roll++){advance(s,1.2);sportsAction(s,'roll');advance(s,2.4);}assert.equal(s.done,true);assert.equal(s.round,6);assert.ok(s.score<=50);assert.equal(sportsAction(s,'roll'),false);assert.equal(sportsReward(s),s.score);
});
test('tennis requires a timed swing and ends at five points for either side',()=>{
 const s=createSportsState('tennis');assert.equal(sportsAction(s,'swing'),true);assert.equal(sportsAction(s,'swing'),false);advance(s,.5);s.ball={x:s.player.x,y:450,vx:0,vy:250};assert.equal(sportsAction(s,'swing'),true);assert.ok(s.ball.vy<0);
 advance(s,.5);s.ball={x:220,y:450,vx:0,vy:250};s.player.x=730;assert.equal(sportsAction(s,'swing'),true);advance(s,.5);assert.equal(s.opponent.score,1);
 for(let i=1;i<5;i++){s.ball={x:220,y:539,vx:0,vy:250};tickSports(s,.02);}assert.equal(s.done,true);assert.equal(s.opponent.score,5);
 const win=createSportsState('tennis');for(let i=0;i<5;i++){win.opponent.x=730;win.ball={x:220,y:131,vx:0,vy:-250};tickSports(win,.02);}assert.equal(win.done,true);assert.equal(win.score,5);assert.equal(sportsReward(win),15);
});
test('basketball passes possession, supports targeted passes, scores and ends at the buzzer',()=>{
 const s=createSportsState('basketball');assert.equal(sportsAction(s,'pass',2),true);assert.equal(sportsAction(s,'shoot'),false);advance(s,.5);assert.equal(s.active,2);assert.equal(s.passCount,1);assert.equal(sportsAction(s,'pass',2),false);
 s.team[2]={x:480,y:210};assert.equal(sportsAction(s,'aim'),true);s.aim={x:480,y:170};assert.equal(sportsAction(s,'shoot'),true);advance(s,1.2);assert.equal(s.score,2);assert.equal(s.ball,null);advance(s,.4);s.team[2]={x:480,y:520};sportsAction(s,'aim');s.aim={x:480,y:170};sportsAction(s,'shoot');advance(s,1.2);assert.equal(s.score,5);
 s.remaining=.01;tickSports(s,.02);assert.equal(s.done,true);assert.equal(sportsReward(s),10);assert.equal(sportsAction(s,'shoot'),false);
});
test('movement stays inside courts, diagonal movement is normalized and zero ticks freeze play',()=>{
 const s=createSportsState('basketball');const before=structuredClone(s);tickSports(s,0,{x:1,y:1});assert.deepEqual(s,before);tickSports(s,.04,{x:1,y:1});assert.ok(Math.abs(Math.hypot(s.team[0].x-480,s.team[0].y-490)-10)<.001);advance(s,8,{x:1,y:1});assert.equal(s.team[0].x,780);assert.equal(s.team[0].y,530);
});
test('all five animals and free accessories are available while equipment requires shared ownership',()=>{
 assert.equal(SPORTS_ANIMALS.length,5);for(const animal of SPORTS_ANIMALS)assert.equal(validateSportsSettings({animal}).animal,animal);
 assert.equal(validateSportsSettings({bowling:'galaxy'}).bowling,'classic');assert.equal(validateSportsSettings({bowling:'galaxy'},['sports-galaxy-ball']).bowling,'galaxy');assert.equal(validateSportsSettings({animal:'unknown',jersey:'red'}).jersey,'#27bdd1');assert.equal(validateSportsSettings(null).animal,'capybara');
 const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)},system=createSystem(storage);system.beginSession('animal-sports').finish(SPORTS_SHOP_ITEMS.length*50);for(const item of SPORTS_SHOP_ITEMS)system.buy(item.id);assert.equal(system.snapshot().coins,0);assert.equal(system.snapshot().upgrades.filter(id=>id.startsWith('sports-')).length,SPORTS_SHOP_ITEMS.length);const next=createSystem(storage);for(const [sport,choices]of Object.entries(SPORTS_EQUIPMENT)){const [key]=Object.entries(choices).find(([,item])=>item.upgrade);assert.equal(validateSportsSettings({[sport]:key},next.snapshot().upgrades)[sport],key);}
});

test('full bowling power and the center triangle always strike, with frame totals and rival scores',()=>{
 const s=createSportsState('bowling');s.charging=true;advance(s,1);assert.equal(s.power,1);sportsAction(s,'roll');advance(s,2);assert.equal(s.score,10);assert.equal(s.frameMarks[0],'X');assert.equal(s.frames[0],10);assert.equal(s.round,2);assert.equal(s.rivals.length,3);assert.ok(s.rivals.every(p=>p.name&&p.frames.length===5));
 const low=createSportsState('bowling');low.power=.2;sportsAction(low,'roll');advance(low,3);assert.ok(low.score<10);assert.equal(low.round,1);
 const side=createSportsState('bowling');side.power=1;side.player.x=640;sportsAction(side,'roll');advance(side,2);assert.ok(side.score<10);
});
test('an early tennis swing connects during its active window and player two controls are independent',()=>{
 const s=createSportsState('tennis',{tennisPlayers:2});s.ball={x:480,y:360,vx:0,vy:250};sportsAction(s,'swing');assert.ok(s.ball.vy>0);advance(s,.12);assert.ok(s.ball.vy<0,'Ball must return once it reaches active racket');assert.equal(s.rally,1);
 s.swing=0;s.opponentSwing=0;s.ball={x:480,y:290,vx:0,vy:-250};sportsAction(s,'swing2');advance(s,.1);assert.ok(s.ball.vy>0,'Second player returns with their own racket');const x=s.player.x;tickSports(s,.04,{p2x:1,p2y:1});assert.equal(s.player.x,x);assert.ok(s.opponent.x>480);assert.ok(s.opponent.y>190);
});
test('basketball alignment determines scoring and the flight uses the preview arc',()=>{
 const s=createSportsState('basketball');assert.equal(sportsAction(s,'shoot'),false);sportsAction(s,'aim');const before={...s.team[0]};tickSports(s,.04,{x:1,y:-1});assert.deepEqual(s.team[0],before,'Aim controls must not move the player');s.aim={x:680,y:260};assert.equal(sportsShotAligned(s.aim),false);sportsAction(s,'shoot');const b=s.ball;tickSports(s,.05);assert.deepEqual({x:b.x,y:b.y},sportsShotPoint({x:b.startX,y:b.startY},{x:680,y:260},b.progress));advance(s,1.2);assert.equal(s.score,0);advance(s,.4);sportsAction(s,'aim');s.aim={x:480,y:170};assert.equal(sportsShotAligned(s.aim),true);sportsAction(s,'shoot');advance(s,1.2);assert.equal(s.score,3);
});
test('each sport offers two free finishes and three purchasable finishes',()=>{
 for(const [sport,items]of Object.entries(SPORTS_EQUIPMENT)){const free=Object.entries(items).filter(([,item])=>!item.upgrade);assert.equal(free.length,2);assert.equal(Object.values(items).filter(i=>i.upgrade).length,3);for(const [key]of free)assert.equal(validateSportsSettings({[sport]:key})[sport],key);}
 assert.equal(validateSportsSettings({tennisPlayers:2}).tennisPlayers,2);
});
test('solo tennis returns close shots reliably and misses only when out of reach',()=>{
 for(const offset of [0,25,55,90]){
  const s=createSportsState('tennis');s.ball={x:480+offset,y:295,vx:0,vy:-250};
  for(let f=0;f<35;f++)tickSports(s,.02,{},()=>assert.fail('Tennis returns must not depend on random misses'));
  assert.ok(s.ball?.vy>0,`Opponent should return a reachable shot offset by ${offset}`);assert.equal(s.score,0);
 }
 for(const x of [230,730]){
  const s=createSportsState('tennis');s.ball={x,y:270,vx:0,vy:-300};
  tickSports(s,.02);assert.ok(x<480?s.opponent.x<480:s.opponent.x>480,'Opponent tries to chase the ball');
  for(let f=0;f<30;f++)tickSports(s,.02);
  assert.equal(s.score,1,'Wide ball that cannot be reached should score');assert.equal(s.ball,null);
 }
 const wide=createSportsState('tennis');wide.player.x=420;wide.ball={x:480,y:440,vx:0,vy:250};sportsAction(wide,'swing');advance(wide,1.5);assert.equal(wide.score,1,'A playable angled return must be able to beat the opponent');
 const two=createSportsState('tennis',{tennisPlayers:2});two.ball={x:570,y:220,vx:0,vy:-250};sportsAction(two,'swing2');assert.ok(two.ball.vy>0,'Human player two keeps the existing racket reach');
});
test('tennis prepares a fresh serve after each point and can return the next shot',()=>{
 const s=createSportsState('tennis');assert.equal(s.serveStarted,0);assert.match(s.message,/Serve!/);s.time=8;s.ball={x:480,y:539,vx:0,vy:250};tickSports(s,.02);assert.equal(s.serveStarted,s.time);assert.equal(s.ball,null);assert.equal(s.opponent.score,1);
 advance(s,1);sportsAction(s,'swing');assert.ok(s.ball);s.swing=0;s.ball={x:480,y:440,vx:0,vy:250};sportsAction(s,'swing');assert.ok(s.ball.vy<0);
});
test('basketball has three defenders and occasional dribble steals with recovery protection',()=>{
 let steals=0;
 for(let i=0;i<100;i++){
  const s=createSportsState('basketball');assert.equal(s.defenders.length,3);s.defenseGrace=0;s.defenders[0]={x:500,y:490};let attempts=0;
  tickSports(s,.02,{},()=>{attempts++;return i/100;});assert.equal(attempts,1);
  if(s.ball?.type==='loose'){
   steals++;assert.equal(s.turnovers,1);assert.equal(sportsAction(s,'pass'),false);
   for(let f=0;f<55;f++)tickSports(s,.02,{},()=>0);
   assert.equal(s.ball,null);assert.equal(s.active,1);assert.ok(s.defenseGrace>2.8);assert.equal(s.score,0);
   s.defenders[0]={x:s.team[1].x+22,y:s.team[1].y};tickSports(s,.02,{},()=>0);assert.equal(s.turnovers,1,'Recovery prevents an immediate repeat steal');
  }else{for(let f=0;f<20;f++)tickSports(s,.02,{},()=>{attempts++;return 1;});assert.equal(attempts,1,'Failed swats have a cooldown');}
 }
 assert.equal(steals,28);
});
test('defenders can intercept contested passes but open passes remain safe',()=>{
 let interceptions=0;
 for(let i=0;i<100;i++){
  const s=createSportsState('basketball');s.defenseGrace=0;s.team[0]={x:400,y:400};s.team[1]={x:600,y:400};s.defenders=[{x:495,y:400},{x:200,y:230},{x:750,y:230}];sportsAction(s,'pass',1);let attempts=0;
  for(let f=0;f<24;f++)tickSports(s,.02,{},()=>{attempts++;return i/100;});
  assert.equal(attempts,1,'Each contested pass has only one steal attempt');if(s.turnovers)interceptions++;else assert.equal(s.active,1);
 }
 assert.equal(interceptions,35);
 const open=createSportsState('basketball');open.defenseGrace=0;open.defenders.forEach(d=>{d.x=180;d.y=210;});sportsAction(open,'pass',2);for(let f=0;f<24;f++)tickSports(open,.02,{},()=>0);assert.equal(open.active,2);assert.equal(open.turnovers,0);
});
test('shooting mode and shots are immune to steals even with defenders touching the ball',()=>{
 const s=createSportsState('basketball');s.defenseGrace=0;s.defenders.forEach(d=>{d.x=500;d.y=490;});sportsAction(s,'aim');
 for(let f=0;f<200;f++)tickSports(s,.02,{},()=>{assert.fail('No steal rolls while aiming');});
 assert.ok(s.aim);assert.equal(s.turnovers,0);s.aim={x:480,y:170};sportsAction(s,'shoot');
 for(let f=0;f<56;f++)tickSports(s,.02,{},()=>{assert.fail('No steal rolls during a shot');});
 assert.equal(s.score,3);assert.equal(s.turnovers,0);
});
