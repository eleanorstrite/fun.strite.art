import test from 'node:test';
import assert from 'node:assert/strict';
import{statSync}from'node:fs';
import{GAMES,drawPreview}from'../src/games.js';
import{GAME_COVERS}from'../src/game-covers.js';
test('every game has its own compact deployed cover matching the game identity',()=>{
 assert.equal(Object.keys(GAME_COVERS).length,GAMES.length);assert.equal(new Set(Object.values(GAME_COVERS).map(c=>c.file)).size,GAMES.length);for(const game of GAMES){const cover=GAME_COVERS[game.id];assert.equal(cover?.name,game.name);const size=statSync(new URL('../assets/game-covers/'+cover.file,import.meta.url)).size;assert.ok(size>20000&&size<600000,game.name+' cover stays small enough for the library');}
});
test('library previews load the finished artwork for every game without starting gameplay render loops',t=>{
 const original=globalThis.Image,doc=globalThis.document,raf=globalThis.requestAnimationFrame;t.after(()=>{globalThis.Image=original;globalThis.document=doc;globalThis.requestAnimationFrame=raf;});globalThis.document={};globalThis.requestAnimationFrame=()=>{throw Error("Homepage covers must keep their original artwork");};globalThis.Image=class{complete=true;naturalWidth=1280;naturalHeight=720;};for(const game of GAMES){const draws=[],classes=[],c={save(){},fillRect(){},drawImage:(...args)=>draws.push(args)},canvas={getContext:()=>c,parentElement:{classList:{add:v=>classes.push(v)}}};drawPreview(canvas,{...game,preview(){throw Error('Started old gameplay preview');}});assert.equal(draws.length,1);assert.ok(draws[0][0].src.endsWith('/assets/game-covers/'+GAME_COVERS[game.id].file));assert.deepEqual(draws[0].slice(1),[0,0,960,540]);assert.ok(classes.includes('library-cover'));}
});
