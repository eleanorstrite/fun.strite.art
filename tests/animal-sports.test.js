import test from 'node:test';
import assert from 'node:assert/strict';
import {createSportsState,sportsAction,tickSports,sportsReward} from '../src/animal-sports-rules.js';
import {SPORTS_ANIMALS,SPORTS_EQUIPMENT,SPORTS_SHOP_ITEMS,validateSportsSettings} from '../src/animal-sports-settings.js';
import {createSystem} from '../src/system.js';
const advance=(s,seconds,input={})=>{for(let t=0;t<seconds;t+=.02)tickSports(s,.02,input);};
test('bowling aims, prevents multiple balls, knocks down pins and finishes five rounds',()=>{
 const s=createSportsState('bowling');advance(s,3,{x:1});assert.equal(s.player.x,645);advance(s,.55,{x:-1});assert.ok(Math.abs(s.player.x-480)<10);
 assert.equal(sportsAction(s,'roll'),true);assert.equal(sportsAction(s,'roll'),false);advance(s,1.7);assert.ok(s.score>0);const score=s.score;advance(s,.1);assert.equal(s.score,score);
 for(let roll=0;roll<12&&!s.done;roll++){advance(s,1.2);sportsAction(s,'roll');advance(s,1.8);}assert.equal(s.done,true);assert.equal(s.round,6);assert.ok(s.score<=50);assert.equal(sportsAction(s,'roll'),false);assert.equal(sportsReward(s),s.score);
});
test('tennis requires a timed swing and ends at five points for either side',()=>{
 const s=createSportsState('tennis');assert.equal(sportsAction(s,'swing'),true);assert.equal(sportsAction(s,'swing'),false);advance(s,.3);s.ball={x:s.player.x,y:450,vx:0,vy:250};assert.equal(sportsAction(s,'swing'),true);assert.ok(s.ball.vy<0);
 advance(s,.3);s.ball={x:220,y:450,vx:0,vy:250};s.player.x=730;assert.equal(sportsAction(s,'swing'),false);advance(s,.4);assert.equal(s.opponent.score,1);
 for(let i=1;i<5;i++){s.ball={x:220,y:529,vx:0,vy:250};tickSports(s,.02);}assert.equal(s.done,true);assert.equal(s.opponent.score,5);
 const win=createSportsState('tennis');for(let i=0;i<5;i++){win.opponent.x=730;win.ball={x:220,y:191,vx:0,vy:-250};tickSports(win,.02);}assert.equal(win.done,true);assert.equal(win.score,5);assert.equal(sportsReward(win),15);
});
test('basketball passes possession, supports targeted passes, scores and ends at the buzzer',()=>{
 const s=createSportsState('basketball');assert.equal(sportsAction(s,'pass',2),true);assert.equal(sportsAction(s,'shoot'),false);advance(s,.5);assert.equal(s.active,2);assert.equal(s.passCount,1);assert.equal(sportsAction(s,'pass',2),false);
 s.team[2]={x:480,y:210};assert.equal(sportsAction(s,'shoot',null,()=>0),true);advance(s,1.2);assert.equal(s.score,2);assert.equal(s.ball,null);advance(s,.4);s.team[2]={x:480,y:520};sportsAction(s,'shoot',null,()=>0);advance(s,1.2);assert.equal(s.score,5);
 s.remaining=.01;tickSports(s,.02);assert.equal(s.done,true);assert.equal(sportsReward(s),10);assert.equal(sportsAction(s,'shoot'),false);
});
test('movement stays inside courts, diagonal movement is normalized and zero ticks freeze play',()=>{
 const s=createSportsState('basketball');const before=structuredClone(s);tickSports(s,0,{x:1,y:1});assert.deepEqual(s,before);tickSports(s,.04,{x:1,y:1});assert.ok(Math.abs(Math.hypot(s.team[0].x-480,s.team[0].y-490)-10)<.001);advance(s,8,{x:1,y:1});assert.equal(s.team[0].x,780);assert.equal(s.team[0].y,530);
});
test('all five animals and free accessories are available while equipment requires shared ownership',()=>{
 assert.equal(SPORTS_ANIMALS.length,5);for(const animal of SPORTS_ANIMALS)assert.equal(validateSportsSettings({animal}).animal,animal);
 assert.equal(validateSportsSettings({bowling:'galaxy'}).bowling,'classic');assert.equal(validateSportsSettings({bowling:'galaxy'},['sports-galaxy-ball']).bowling,'galaxy');assert.equal(validateSportsSettings({animal:'unknown',jersey:'red'}).jersey,'#27bdd1');assert.equal(validateSportsSettings(null).animal,'capybara');
 const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)},system=createSystem(storage);system.beginSession('animal-sports').finish(150);for(const item of SPORTS_SHOP_ITEMS)system.buy(item.id);assert.equal(system.snapshot().coins,0);assert.equal(system.snapshot().upgrades.filter(id=>id.startsWith('sports-')).length,3);const next=createSystem(storage);for(const [sport,choices]of Object.entries(SPORTS_EQUIPMENT)){const [key]=Object.entries(choices).find(([,item])=>item.upgrade);assert.equal(validateSportsSettings({[sport]:key},next.snapshot().upgrades)[sport],key);}
});
