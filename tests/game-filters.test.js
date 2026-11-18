import test from 'node:test';
import assert from 'node:assert/strict';
import {GAMES} from '../src/games.js';
import {publicGames,previewGames} from '../src/coming-soon.js';
import {gameViews,gameHasBothViews,gameMatchesFilter,gameWorldLabel} from '../src/game-filters.js';
test('Both contains exactly the games that offer playable 2D and 3D views',()=>{const both=publicGames(GAMES).filter(g=>gameMatchesFilter(g,'both'));assert.deepEqual(both.map(g=>g.id),['tag','knight-ember','sky-flight']);for(const g of both){assert.ok(gameHasBothViews(g));assert.ok(gameMatchesFilter(g,'2D'));assert.ok(gameMatchesFilter(g,'3D'));assert.equal(gameWorldLabel(g),'2D + 3D');}});
test('all worlds keeps every public game and single-view games retain the correct category',()=>{const games=publicGames(GAMES);assert.equal(games.filter(g=>gameMatchesFilter(g,'all')).length,14);for(const game of games){assert.ok(gameViews(game).includes(game.dimension));if(!gameHasBothViews(game)){assert.equal(gameMatchesFilter(game,'both'),false);assert.equal(gameMatchesFilter(game,game.dimension),true);assert.equal(gameMatchesFilter(game,game.dimension==='2D'?'3D':'2D'),false);}}assert.deepEqual(previewGames(GAMES).map(g=>g.id),['four-square']);});
