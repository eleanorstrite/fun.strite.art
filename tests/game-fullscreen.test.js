import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameFullscreen } from '../src/game-fullscreen.js';
const settle = () => new Promise(resolve => setImmediate(resolve));
function browser() {
  const doc = { fullscreenElement:null, calls:0, exits:0 };
  doc.documentElement = { requestFullscreen:async () => { doc.calls++; doc.fullscreenElement=doc.documentElement; } };
  doc.exitFullscreen=async () => { doc.exits++; doc.fullscreenElement=null; };
  return doc;
}
test('starting requests root fullscreen and closing releases it', async () => {
  const doc=browser(), view=createGameFullscreen(doc);
  view.enter(); view.enter(); await settle();
  assert.equal(doc.calls,1); assert.equal(doc.fullscreenElement,doc.documentElement);
  view.exit(); assert.equal(doc.exits,1);
});
test('unsupported or rejected fullscreen leaves games usable', async () => {
  const doc=browser(); doc.documentElement.requestFullscreen=undefined;
  const view=createGameFullscreen(doc); view.enter(); view.exit();
  doc.documentElement.requestFullscreen=()=>Promise.reject(new Error('Denied'));
  view.enter(); await settle(); view.exit(); assert.equal(doc.exits,0);
});
test('closing during a pending request exits after it resolves', async () => {
  const doc=browser(); let finish;
  doc.documentElement.requestFullscreen=()=>new Promise(resolve=>{finish=()=>{doc.fullscreenElement=doc.documentElement;resolve();};});
  const view=createGameFullscreen(doc); view.enter(); view.exit(); finish(); await settle();
  assert.equal(doc.fullscreenElement,null); assert.equal(doc.exits,1);
});
test('closing does not exit fullscreen that was already active', () => {
  const doc=browser(); doc.fullscreenElement=doc.documentElement;
  const view=createGameFullscreen(doc); view.enter(); view.exit(); assert.equal(doc.exits,0);
});
