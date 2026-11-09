import test from 'node:test';
import assert from 'node:assert/strict';
import {UPGRADES} from '../src/system.js';
import {shopItemGame,searchShopItems} from '../src/shop-search.js';
const ids=query=>searchShopItems(UPGRADES,query).map(item=>item.id);
test('an empty shop search preserves the complete catalog and its original order',()=>{
 assert.deepEqual(searchShopItems(UPGRADES,''),UPGRADES);assert.deepEqual(searchShopItems(UPGRADES,'  \t '),UPGRADES);
 for(const item of UPGRADES)assert.ok(shopItemGame(item),'Missing game assignment: '+item.id);
});
test('searching Knights and Dragons includes legacy boosts and customization together',()=>{
 const found=ids('Knights and Dragons');for(const id of ['boots','magnet','eliminator','ward','frost','ice-dragons','emerald-armor','winged-helmet'])assert.ok(found.includes(id),id);
 assert.ok(!found.includes('snack'));assert.ok(!found.some(id=>id.startsWith('ice-cone-')));
 assert.deepEqual(ids(' KNIGHTS & DRAGONS! '),found);
});
test('game search does not include items whose descriptions explicitly exclude that game',()=>{
 assert.deepEqual(ids('Flappy Bird'),['flight-city','flight-stars']);assert.deepEqual(ids('Flappy Animals'),ids('Flappy Bird'));
 assert.deepEqual(ids('Hoop Flight'),['air-stealth','air-rocket','air-aurora','air-city']);
 assert.deepEqual(ids('City Builder'),['city-cake','city-galaxy-shake','city-fruit-cup','city-white-cake']);assert.deepEqual(ids('city'),ids('City Builder'));
 assert.deepEqual(ids('The Raven'),['snack']);
});
test('search supports partial game names, aliases, and combined game and item words',()=>{
 assert.ok(ids('platform').length>10);assert.ok(ids('platform').every(id=>id.startsWith('jump-')));
 assert.deepEqual(ids('storm stack'),ids('Wizard Tetris'));assert.equal(ids('wizard').length,4);
 assert.equal(ids('Animal Sports').length,9);assert.equal(ids('ice cream').length,8);
 assert.deepEqual(ids('knights speed'),['boots']);assert.ok(ids('platform rainbow').every(id=>id.startsWith('jump-')));assert.ok(ids('platform rainbow').includes('jump-rainbow-cat'));
 assert.deepEqual(ids('Galaxy milkshake'),['city-galaxy-shake']);assert.ok(ids('background').includes('air-aurora'));assert.ok(ids('background').includes('forest-background'));
});
test('games without shop items and unmatched text return an empty result safely',()=>{
 for(const query of ['Dragon Memory','Tag','Stack the Hamburger','unknown game','<script>alert(1)</script>'])assert.deepEqual(ids(query),[],query);
});

test('Dragon Adventures search finds its sky-race side quest without unrelated dragon items',()=>{assert.deepEqual(ids('Dragon Adventures'),['dragon-race']);assert.deepEqual(ids('sky race'),['dragon-race']);});
