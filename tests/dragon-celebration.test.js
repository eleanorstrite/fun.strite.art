import test from 'node:test';
import assert from 'node:assert/strict';
import {DRAGON_TRIBE_EFFECTS} from '../src/dragon-celebration.js';
import {MEMORY_DRAGONS} from '../src/dragon-memory.js';
test('every dragon has a tribe blast, including the requested color families',()=>{
 assert.equal(DRAGON_TRIBE_EFFECTS.length,MEMORY_DRAGONS.length);
 const effects=Object.fromEntries(MEMORY_DRAGONS.map((name,i)=>[name,DRAGON_TRIBE_EFFECTS[i]]));
 for(const name of ['Emerald forest','Lime meadow'])assert.equal(effects[name],'leaves');
 for(const name of ['Icy pearl','Silver moon'])assert.equal(effects[name],'frost');
 for(const name of ['Obsidian night','Midnight indigo'])assert.equal(effects[name],'stars');
 for(const name of ['Chocolate earth','Copper canyon'])assert.equal(effects[name],'mud');
 for(const name of ['Coral ember','Ruby flame','Peach dawn'])assert.equal(effects[name],'fire');
 assert.equal(effects['Ivory cloud'],'clouds');assert.equal(effects['Golden sun'],'sunlight');assert.equal(effects['Crimson velvet'],'fireball');
 assert.equal(effects['Rainbow opal'],'rainbows');assert.ok(Object.values(effects).every(Boolean));
});
