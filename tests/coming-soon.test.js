import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {publicGames,previewGames,createPreviewAccess} from '../src/coming-soon.js';
import {GAMES} from '../src/games.js';
test('Dragon Adventures is listed only among coming soon games',()=>{assert.deepEqual(previewGames(GAMES).map(g=>g.id),['dragon-adventures']);assert.ok(publicGames(GAMES).every(g=>g.id!=='dragon-adventures'));assert.equal(publicGames(GAMES).length+previewGames(GAMES).length,GAMES.length);});
test('preview password preserves its leading zero, gates all previews and relocks',()=>{const gate=createPreviewAccess(),dragon=GAMES.find(g=>g.id==='dragon-adventures');assert.equal(gate.canPlay(dragon),false);for(const password of ['80315',80315,'080315 ','','wrong'])assert.equal(gate.unlock(password),false);assert.equal(gate.unlock('080315'),true);assert.equal(gate.canPlay(dragon),true);gate.lock();assert.equal(gate.canPlay(dragon),false);assert.equal(gate.canPlay(publicGames(GAMES)[0]),true);assert.equal(createPreviewAccess().canPlay(dragon),false);});
test('Coming Soon follows the shop and game opening checks preview access',()=>{const html=readFileSync(new URL('../index.html',import.meta.url),'utf8'),app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');assert.ok(html.indexOf('id="coming-soon"')>html.indexOf('id="shop-appearance"'));assert.match(app,/function openGame\(game\)\{if\(!previewAccess.canPlay\(game\)\)/);});
