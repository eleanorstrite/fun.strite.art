import test from 'node:test';
import assert from 'node:assert/strict';
import {sportsWon,SPORTS_VICTORY_DURATION} from '../src/sports-victory.js';
import {createSportsState} from '../src/animal-sports-rules.js';
test('victory clips require a completed win, never a loss or tied scoreboard',()=>{
 for(const sport of ['bowling','tennis','basketball']){const s=createSportsState(sport);s.score=50;assert.equal(sportsWon(s),false);s.done=true;assert.equal(sportsWon(s),true);s.score=0;assert.equal(sportsWon(s),false);}
 const bowl=createSportsState('bowling');bowl.done=true;bowl.score=40;assert.equal(sportsWon(bowl),false);bowl.score=41;assert.equal(sportsWon(bowl),true);
 const basket=createSportsState('basketball');basket.done=true;basket.score=4;basket.enemyScore=4;assert.equal(sportsWon(basket),false);basket.score=6;assert.equal(sportsWon(basket),true);assert.equal(SPORTS_VICTORY_DURATION,10);
});
