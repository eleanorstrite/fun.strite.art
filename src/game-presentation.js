import {equipmentAtlas} from './sports-equipment-art.js';
import {playAtlas,playBackdropAtlas} from './play-art.js';
import {createMazeState,drawMaze,drawMaze3D} from './knight-maze.js';
import {drawPlatformJump} from './platform-jump-art.js';
import {JUMP_DEFAULTS,validateJumpSettings,createJumpState} from './platform-jump-rules.js';
import {outfitAtlas} from './platform-jump-clothes.js';
import {hairAtlas} from './platform-hair-shop.js';
import {drawSports} from './animal-sports-art.js';
import {createSportsState} from './animal-sports-rules.js';
import {SPORTS_DEFAULTS,validateSportsSettings} from './animal-sports-settings.js';
import {loadStormWizard,stormWizardAtlas} from './storm-wizards.js';
import {wizardBlockAtlas,loadWizardSetting} from './wizard-themes.js';
import {loadWizardSidekick,wizardSidekickAtlas} from './wizard-sidekicks.js';
import {createWizardMatch,startWizardMatch,updateWizardLevels} from './wizard-match.js';
import {drawWizardArena} from './wizard-arena.js';
import {loadCustomWizard,customWizardAtlas} from './wizard-custom.js';
import {createBurgerState,drawBurgerScene} from './burger-stack.js';
import {createTagState,drawTagScene,defaultTagSettings,validateTagSettings} from './tag.js';
import {createVanState,drawVanScene} from './van-adventure.js';
import {drawFlight,drawFlightDuel,createFlightState} from './sky-flight.js';
import {createFlightDuel,loadFlightDuel} from './flight-duel.js';
import {FLIGHT_DEFAULTS} from './flight-settings.js';
import {createAirState,drawAirRace} from './air-race.js';
import {createIceRecipe,drawIceScene} from './ice-cream.js';
import {iceArtAtlas} from './ice-art.js';
import {createDragonAdventureState} from './dragon-adventure-rules.js';
import {drawDragonAdventure,dragonAdventureArtReady} from './dragon-adventure-art.js';
import {drawPumpkinScene,createPumpkin} from './pumpkin.js';
const read=(key,fallback)=>{try{return JSON.parse(globalThis.localStorage?.getItem(key)||'null')||fallback;}catch{return fallback;}};
let memoryArt,cityArt,ready;
export function memoryPresentationArt(){if(!memoryArt&&typeof Image!=='undefined'){memoryArt=new Image();memoryArt.src=new URL('../assets/dragon-memory-colors.png',import.meta.url).href;}return memoryArt;}
function cityPresentationArt(){if(!cityArt&&typeof Image!=='undefined'){cityArt=new Image();cityArt.src=new URL('../assets/city-builder-preview.jpg',import.meta.url).href;}return cityArt;}
export function gamePresentationReady(){if(!ready){const images=[...['characters','objects','details','knight','tag-people','flyers-detailed','platforms','platform-faces'].map(playAtlas),playBackdropAtlas(),stormWizardAtlas(),wizardBlockAtlas(),memoryPresentationArt(),cityPresentationArt(),equipmentAtlas(),...["cat","dog","dragon"].map(wizardSidekickAtlas),...['flavors','cones','toppings'].map(iceArtAtlas),...['adult-heads','kid-heads','outfits','shop-gowns','boy-outfits','hair-back'].map(customWizardAtlas),outfitAtlas(),hairAtlas()];ready=Promise.all([dragonAdventureArtReady(),...images.filter(Boolean).map(im=>im.decode?im.decode().catch(()=>{}):Promise.resolve())]);}return ready;}
// These are actual game scenes and legal example states, not separate cover characters or levels.
export function drawGamePresentation(c,id,character={},time=0){
 c.save();c.fillStyle='#1c2f49';c.fillRect(0,0,960,540);const save=read('sidequest.save.v1',{}),owned=save.upgrades||[];
 switch(id){
  case 'dragon-adventures':{const s=createDragonAdventureState();s.time=time;drawDragonAdventure(c,s,960,540);break;}
  case 'knight-ember':{const look={armor:'silver',helmet:'plume',cape:true,shield:false,dragon:'classic',color:'#ed6e40',...character},s=createMazeState();s.elapsed=time;s.grace=0;let view;try{view=globalThis.localStorage?.getItem('sidequest.maze-view');}catch{}(view==='2d'?drawMaze:drawMaze3D)(c,s,look,960,540);break;}
  case 'platform-jump':{const look=validateJumpSettings(read('sidequest.platform-jump',JUMP_DEFAULTS),owned),s=createJumpState(look.difficulty);s.time=time;s.grounded=true;drawPlatformJump(c,s,look);break;}
  case 'animal-sports':{const look=validateSportsSettings(read('sidequest.animal-sports',SPORTS_DEFAULTS),owned),s=createSportsState(look.arena,look);s.time=time;drawSports(c,s,look,true);break;}
  case 'storm-stack':{const s=createWizardMatch({background:Number(loadWizardSetting('background',0))||0,wizard:loadStormWizard(),blocks:loadWizardSetting('blocks','galaxy'),customWizard:loadCustomWizard(),sidekick:loadWizardSidekick()});startWizardMatch(s);s.elapsed=time;for(const p of s.players){for(let row=p.board.length-4;row<p.board.length;row++){p.board[row][4]=2;p.board[row][5]=2;}p.height=4;p.highWater=4;updateWizardLevels(s,s.players.indexOf(p));}drawWizardArena(c,s,960,540);break;}
  case 'tag':{const settings=validateTagSettings(read('sidequest.tag.settings.v1',defaultTagSettings())),s=createTagState(settings);s.status='playing';s.time=5+time%8;s.players[0].x=410+Math.sin(time*1.7)*35;s.players[0].y=335;s.players[0].vx=100;s.players[1].x=715+Math.sin(time*1.5)*30;s.players[1].y=240;s.players[1].facing=-1;drawTagScene(c,s,960,540);break;}
  case 'family-van':{const s=createVanState(save.ravenLevel||'easy');s.status='playing';s.time=time;s.z=65+time%3*8;drawVanScene(c,s,960,540);break;}
  case 'sky-flight':{const look={...FLIGHT_DEFAULTS,...character.flight},rival=loadFlightDuel();if(rival.mode==='local'){const s=createFlightDuel(look,rival,241);for(let i=0;i<2;i++){const p=s.players[i];p.status='playing';p.time=time;p.y=330+Math.sin(time*2+i)*35;p.pipes.forEach(pipe=>pipe.x-=240);}drawFlightDuel(c,s,960,540);}else{const s=createFlightState(look,()=>.5);s.status='playing';s.time=time;s.y=330+Math.sin(time*2)*30;s.pipes.forEach(pipe=>pipe.x-=240);drawFlight(c,s,960,540);}break;}
  case 'hoop-flight':{const look=character.plane||{color:'#ed6e40',style:'sport'},s=createAirState(look.difficulty);s.distance=300;s.time=time;drawAirRace(c,s,look,960,540);break;}
  case 'burger-stack':{const s=createBurgerState();s.status='playing';s.time=time;for(let i=0;i<6;i++)s.layers.push({x:190,width:220,kind:['patty','cheese','lettuce','tomato','patty','bun'][i]});s.score=6;s.moving.x=170+Math.sin(time)*75;drawBurgerScene(c,s,960,540,6);break;}
  case 'ice-cream':{const r={...createIceRecipe(),flavors:['vanilla','strawberry'],toppings:['oreo','sprinkles','cream','cherry']};drawIceScene(c,r,960,540,1.7+time%3);break;}
  case 'carve-pumpkin':{const p=createPumpkin();p.scoops=3;p.accessories={hat:'witch',scarf:true,earmuffs:false,color:'#8858ad'};drawPumpkinScene(c,p,960,540,2+time%3);break;}
  case 'dragon-memory':{const im=memoryPresentationArt();c.fillStyle='#354e63';c.fillRect(0,0,960,540);if(im?.complete&&im.naturalWidth){const w=im.naturalWidth/5,h=im.naturalHeight/4;for(let i=0;i<8;i++){const x=102+(i%4)*224,y=42+Math.floor(i/4)*245;c.fillStyle='#ffffff18';c.beginPath();c.roundRect(x-4,y-4,205,220,14);c.fill();c.drawImage(im,(i%4)*w,0,w,h,x,y+Math.sin(time*2+i)*3,197,205);}}break;}
  case 'city-builder':{const im=cityPresentationArt();if(im?.complete&&im.naturalWidth)c.drawImage(im,0,0,im.naturalWidth,im.naturalHeight,0,0,960,540);break;}
 }
 c.restore();
}
