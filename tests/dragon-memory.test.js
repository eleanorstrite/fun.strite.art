import test from 'node:test';
import assert from 'node:assert/strict';
import {DRAGON_MEMORY_LEVELS,MEMORY_DRAGONS,createDragonMemoryState,revealMemoryDragon,tickDragonMemory} from '../src/dragon-memory.js';
test('all four difficulties contain exactly two of each distinct dragon',()=>{
 assert.equal(new Set(MEMORY_DRAGONS).size,20);assert.deepEqual(Object.values(DRAGON_MEMORY_LEVELS).map(v=>v.pairs),[4,5,10,20]);
 for(const [level,{pairs}]of Object.entries(DRAGON_MEMORY_LEVELS)){const s=createDragonMemoryState(level,()=>.42);assert.equal(s.cards.length,pairs*2);const counts=new Map();for(const c of s.cards)counts.set(c.kind,(counts.get(c.kind)||0)+1);assert.equal(counts.size,pairs);assert.ok([...counts.values()].every(n=>n===2));assert.ok(s.cards.every(c=>!c.matched));}
 assert.equal(createDragonMemoryState('unknown').level,'easy');
});
test('mismatches wait, block extra reveals and hide only unmatched dragons',()=>{
 const s=createDragonMemoryState('easy',()=>.99),pair=[0,1];revealMemoryDragon(s,pair[0]);assert.equal(revealMemoryDragon(s,pair[0]),false);revealMemoryDragon(s,pair[1]);assert.equal(s.matches,1);assert.ok(s.cards[0].matched);assert.equal(s.moves,1);
 revealMemoryDragon(s,2);revealMemoryDragon(s,4);assert.equal(s.moves,2);assert.equal(revealMemoryDragon(s,3),false);tickDragonMemory(s,1);assert.deepEqual(s.open,[2,4]);tickDragonMemory(s,.25);assert.deepEqual(s.open,[]);assert.ok(s.cards[0].matched&&s.cards[1].matched);assert.equal(revealMemoryDragon(s,-1),false);assert.equal(revealMemoryDragon(s,100),false);assert.equal(revealMemoryDragon(s,0),false);
});
test('every difficulty is winnable and completion prevents additional moves',()=>{
 for(const level of Object.keys(DRAGON_MEMORY_LEVELS)){const s=createDragonMemoryState(level);for(let kind=0;kind<s.cards.length/2;kind++){const pair=s.cards.flatMap((c,i)=>c.kind===kind?[i]:[]);pair.forEach(i=>assert.equal(revealMemoryDragon(s,i),true));}assert.equal(s.won,true);assert.equal(s.moves,s.cards.length/2);assert.equal(revealMemoryDragon(s,0),false);}
});
test('new rounds have fresh state, and a zero-duration tick keeps a revealed mismatch',()=>{
 const s=createDragonMemoryState('easy',()=>.99);revealMemoryDragon(s,0);revealMemoryDragon(s,2);const before=structuredClone(s);tickDragonMemory(s,0);assert.deepEqual(s,before);const next=createDragonMemoryState('easy');assert.equal(next.moves,0);assert.deepEqual(next.open,[]);assert.equal(next.matches,0);
});
