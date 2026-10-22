import { drawAirplane, formatRaceTime } from './air-race.js';
import { FLIGHT_VIEWS, FLIGHT_LEVELS, FLIGHT_ANIMALS, FLIGHT_BACKGROUNDS, PIPE_STYLES } from './flight-settings.js';
import { drawFlyer } from './sky-flight.js';
import { initBackgroundPicker } from './backgrounds.js';
import { drawKnight, KNIGHT_LEVELS } from './knight-maze.js';
import { createSystem, COLORS, UPGRADES, ARMORS, HELMETS, DRAGON_STYLES, ROBOT_OUTFITS, ROBOT_HATS, PLANE_STYLES, AIR_DIFFICULTIES, airRecordId, AIR_BACKGROUNDS, PLANE_UNLOCKS, PLANE_HATS, PLANE_SCARVES } from './system.js';
import { GAMES, drawPreview } from './games.js';
const $ = selector => document.querySelector(selector);
let toastTimer;
function notify(message) { $('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),4000); }
let storage;
try { storage=window.localStorage; } catch { storage={getItem(){throw new Error();},setItem(){throw new Error();}}; }
const system=createSystem(storage,()=>notify('Browser saving unavailable. Export a save to keep your progress.'));
let selectedColor=system.snapshot().character.color,filter='all',engine=null,session=null,currentGame=null,running=false,paused=false;
const dialog=$('#game-dialog');
let mazeView='2d';
try{if(storage.getItem('sidequest.maze-view')==='3d')mazeView='3d';}catch{}
function syncMazeView(){
  for(const view of ['2d','3d'])$('#maze-view-'+view).setAttribute('aria-pressed',String(mazeView===view));
}
for(const view of ['2d','3d'])$('#maze-view-'+view).onclick=()=>{
  if(!currentGame?.directional||!engine?.setView?.(view))return;
  mazeView=view;syncMazeView();try{storage.setItem('sidequest.maze-view',view);}catch{}
};
// Keep camera shortcuts local to the open game and leave form typing alone.
dialog.addEventListener('keydown',event=>{
  if(!dialog.open||event.key!=='3'||event.repeat||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey)return;
  if(event.target?.closest?.('input, select, textarea, [contenteditable]'))return;
  if(currentGame?.directional){
    event.preventDefault();$('#maze-view-3d').onclick();
  }else if(currentGame?.flight&&engine?.setView?.('firstperson')){
    event.preventDefault();
    const character=system.snapshot().character;
    system.setCharacter({...character,flight:{...character.flight,view:'firstperson'}});
    $('#flight-view').value='firstperson';
    $('#game-canvas').focus({preventScroll:true});
  }
});
let mazeMuted=false;
function syncPlaneCustomizer(){
  const save=system.snapshot(),plane=save.character.plane;
  for(const [id,values] of [['plane-style',Object.entries(PLANE_STYLES).map(([key,name])=>[key,{name,upgrade:PLANE_UNLOCKS[key]}])],['plane-background',Object.entries(AIR_BACKGROUNDS)]]){
    for(const option of $('#'+id).children){
      const item=values.find(([key])=>key===option.value)[1],locked=item.upgrade&&!save.upgrades.includes(item.upgrade);
      option.disabled=Boolean(locked);option.textContent=item.name+(locked?' · Shop: 200 coins':item.upgrade?' · Owned':' · Free');
    }
  }
  $('#plane-background').value=plane.background;
  $('#plane-hat').value=plane.hat;$('#plane-scarf').value=plane.scarf;$('#plane-accessory-color').value=plane.accessoryColor;
  $('#plane-color').value=plane.color;$('#plane-style').value=plane.style;$('#plane-difficulty').value=plane.difficulty;
  const ctx=$('#plane-preview').getContext('2d');
  if(ctx){ctx.clearRect(0,0,240,150);drawAirplane(ctx,120,70,140,plane);}
}
for(const [value,label] of Object.entries(PLANE_STYLES)){
  const option=document.createElement('option');option.value=value;option.textContent=label;$('#plane-style').append(option);
}
for(const [value,scene] of Object.entries(AIR_BACKGROUNDS)){
  const option=document.createElement('option');option.value=value;option.textContent=scene.name;$('#plane-background').append(option);
}
for(const [value,level] of Object.entries(AIR_DIFFICULTIES)){
  const option=document.createElement('option');option.value=value;option.textContent=level.name+' — '+level.coins+' coin'+(level.coins===1?'':'s')+' per hoop';$('#plane-difficulty').append(option);
}
for(const [id,choices] of [['plane-hat',PLANE_HATS],['plane-scarf',PLANE_SCARVES]]){
  for(const [value,label] of Object.entries(choices)){
    const option=document.createElement('option');option.value=value;option.textContent=label;$('#'+id).append(option);
  }
}
for(const page of ['design','accessories'])$('#plane-'+page+'-button').onclick=()=>{
  for(const name of ['design','accessories']){
    $('#plane-'+name+'-page').hidden=name!==page;
    $('#plane-'+name+'-button').setAttribute('aria-pressed',String(name===page));
  }
};
$('#plane-form').onsubmit=e=>e.preventDefault();
$('#plane-form').onchange=()=>{
  if(running)return;
  try{system.setCharacter({...system.snapshot().character,plane:{color:$('#plane-color').value,style:$('#plane-style').value,difficulty:$('#plane-difficulty').value,background:$('#plane-background').value,hat:$('#plane-hat').value,scarf:$('#plane-scarf').value,accessoryColor:$('#plane-accessory-color').value}});$('#plane-status').textContent='Airplane saved. Ready to race!';}catch(error){notify(error.message);}
};
$('#random-plane').onclick=()=>{if(running)return;randomizeSelect('plane-style');randomizeSelect('plane-background');randomizeSelect('plane-hat');randomizeSelect('plane-scarf');$('#plane-accessory-color').value=pickRandom(COLORS);$('#plane-color').value=pickRandom(COLORS);$('#plane-form').onchange();};
// Keep held steering keys active when the pointer toggles Boost.
$('#race-boost').addEventListener('pointerdown',event=>event.preventDefault());
$('#race-boost').onclick=()=>{
  if(!running||paused||!currentGame?.airRace)return;
  const enabled=$('#race-boost').getAttribute('aria-pressed')!=='true';
  $('#race-boost').setAttribute('aria-pressed',String(enabled));$('#race-boost').textContent=enabled?'Boost on — tap to cruise':'Boost';
  engine?.setBoost?.(enabled);
};
function resetRaceBoost(){
  $('#race-boost').setAttribute('aria-pressed','false');$('#race-boost').textContent='Boost';
}
function syncLevelButtons(){
  $('#maze-levels').hidden=!currentGame?.directional;
  for(const button of $('#maze-levels').children)button.setAttribute('aria-pressed',String(Number(button.dataset.level)===system.snapshot().mazeLevel));
}
KNIGHT_LEVELS.forEach((level,index)=>{
  const button=document.createElement('button');button.type='button';button.className='button outline';
  button.dataset.level=String(index);button.textContent=`Level ${index+1} · ${level.name}`;
  button.style.setProperty('--level-accent',level.accent);
  button.onclick=()=>{if(!currentGame?.directional||!engine?.selectLevel?.(index))return;$('#restart-game').onclick();};
  $('#maze-levels').append(button);
});
function renderLives(lives){const row=$('#maze-lives');row.replaceChildren();row.setAttribute('aria-label',`${lives} ${lives===1?'life':'lives'} remaining`);const label=document.createElement('span');label.textContent='LIVES';row.append(label);for(let i=0;i<lives;i++){const face=document.createElement('span');face.className='life-face';face.textContent='☺';face.setAttribute('aria-hidden','true');row.append(face);}}
$('#maze-sound').onclick=()=>{mazeMuted=!mazeMuted;engine?.setMuted?.(mazeMuted);$('#maze-sound').textContent=mazeMuted?'Sound off':'Sound on';$('#maze-sound').setAttribute('aria-pressed',String(mazeMuted));};
function syncFlightCustomizer(){
  const state=system.snapshot(),settings=state.character.flight;
  for(const option of $('#flight-background').children){
    const scene=FLIGHT_BACKGROUNDS[option.value],locked=scene.upgrade&&!state.upgrades.includes(scene.upgrade);
    option.disabled=Boolean(locked);option.textContent=scene.name+(locked?' · Buy for 200 coins in the shop':scene.upgrade?' · Owned':' · Free');
  }
  for(const [field,id] of [['view','flight-view'],['background','flight-background'],['animal','flight-animal'],['difficulty','flight-difficulty'],['color','flight-color'],['pipe','flight-pipe'],['pipeColor','flight-pipe-color']])$('#'+id).value=settings[field];
  const level=FLIGHT_LEVELS[settings.difficulty];$('#flight-rate').textContent=`${level.name} · ${level.reward} coin${level.reward===1?'':'s'} per pipe`;
  const ctx=$('#flyer-preview').getContext('2d');if(ctx){ctx.clearRect(0,0,240,150);drawFlyer(ctx,120,90,100,settings);}
}
for(const [id,values] of [['flight-view',Object.entries(FLIGHT_VIEWS)],['flight-background',Object.entries(FLIGHT_BACKGROUNDS).map(([id,scene])=>[id,scene.name])],['flight-animal',Object.entries(FLIGHT_ANIMALS)],['flight-pipe',Object.entries(PIPE_STYLES)],['flight-difficulty',Object.entries(FLIGHT_LEVELS).map(([id,l])=>[id,`${l.name} · ${l.reward} coins / pipe`])]])for(const [value,label] of values){const option=document.createElement('option');option.value=value;option.textContent=label;$('#'+id).append(option);}
$('#flight-form').onsubmit=e=>e.preventDefault();
$('#flight-form').onchange=()=>{
  if(running)return;
  if($('#flight-background').value==='underwater'&&system.snapshot().character.flight.background!=='underwater'){
    $('#flight-pipe').value='coral';$('#flight-pipe-color').value='#de879a';
  }
  try{system.setCharacter({...system.snapshot().character,flight:{view:$('#flight-view').value,background:$('#flight-background').value,animal:$('#flight-animal').value,difficulty:$('#flight-difficulty').value,color:$('#flight-color').value,pipe:$('#flight-pipe').value,pipeColor:$('#flight-pipe-color').value}});$('#flight-settings-status').textContent=system.isSaved()?'Flight settings saved. Ready to fly!':'Settings applied for this visit. Export to keep them.';}catch(error){notify(error.message);}
};
function pickRandom(values){return values[Math.floor(Math.random()*values.length)];}
function randomizeSelect(id){
  const select=$('#'+id),available=[...select.children].filter(option=>!option.disabled);
  select.value=pickRandom(available).value;
}
$('#random-flight').onclick=()=>{
  if(running)return;
  randomizeSelect('flight-animal');
  const current=$('#flight-color').value;
  $('#flight-color').value=pickRandom([...COLORS,'#df8eb3','#68bf99','#f4c476','#b6c6dd'].filter(color=>color!==current));
  $('#flight-form').onchange();
};
$('#random-knight').onclick=()=>{
  if(running&&!paused)$('#pause-game').onclick();
  for(const id of ['knight-armor','knight-helmet','dragon-style'])randomizeSelect(id);
  $('#knight-color').value=pickRandom(COLORS.filter(color=>color!==$('#knight-color').value));
  $('#knight-cape').checked=Math.random()<.5;
  $('#knight-shield').checked=Math.random()<.5;
  $('#knight-look-form').onchange();
};
$('#flap-button').onclick=()=>{if(running&&!paused){engine?.input?.();$('#game-canvas').focus();}};
function syncKnightCustomizer(){
  const character=system.snapshot().character;
  for(const option of $('#knight-armor').children)option.disabled=Boolean(ARMORS[option.value].upgrade&&!system.snapshot().upgrades.includes(ARMORS[option.value].upgrade));
  for(const option of $('#knight-helmet').children)option.disabled=option.value==='winged'&&!system.snapshot().upgrades.includes('winged-helmet');
  for(const option of $('#dragon-style').children)option.disabled=Boolean(DRAGON_STYLES[option.value].upgrade&&!system.snapshot().upgrades.includes(DRAGON_STYLES[option.value].upgrade));
  $('#dragon-style').value=character.dragon;$('#knight-color').value=character.color;$('#knight-armor').value=character.armor;$('#knight-helmet').value=character.helmet;$('#knight-cape').checked=character.cape;$('#knight-shield').checked=character.shield;
  const canvas=$('#knight-preview'),ctx=canvas.getContext('2d');if(ctx){ctx.clearRect(0,0,180,180);drawKnight(ctx,90,102,125,character);}
  engine?.setCharacter?.(character);
}
for(const [id,options] of [['knight-color',COLORS.map((color,i)=>[color,['Terracotta','Sage','Lilac','Ocean','Honey'][i]])],['knight-armor',Object.entries(ARMORS).map(([id,a])=>[id,a.name+(a.upgrade?' · shop unlock':'')])],['knight-helmet',Object.entries(HELMETS).map(([id,name])=>[id,name+(id==='winged'?' · shop unlock':'')])],['dragon-style',Object.entries(DRAGON_STYLES).map(([id,d])=>[id,d.name+(d.upgrade?' · shop unlock':'')])]]){
  for(const [value,label] of options){const option=document.createElement('option');option.value=value;option.textContent=label;$('#'+id).append(option);}
}
$('#knight-look-form').onsubmit=e=>e.preventDefault();
$('#knight-look-form').addEventListener('focusin',()=>{if(running&&!paused){$('#pause-game').onclick();}});
$('#knight-look-form').onchange=()=>{
  try{system.setCharacter({...system.snapshot().character,color:$('#knight-color').value,armor:$('#knight-armor').value,helmet:$('#knight-helmet').value,cape:$('#knight-cape').checked,shield:$('#knight-shield').checked,dragon:$('#dragon-style').value});syncForm();$('#knight-save-status').textContent=system.isSaved()?'Knight saved!'+(running?' Tap Resume when ready.':''):'Updated for this session. Export to keep your knight.';}catch(error){notify(error.message);}
};
function applyRobotLook(robot){document.querySelectorAll('.avatar').forEach(el=>{el.dataset.outfit=robot.outfit;el.dataset.hat=robot.hat;el.style.setProperty('--outfit-color',robot.color);for(const accessory of ['glasses','headphones','backpack'])el.classList.toggle('with-'+accessory,robot[accessory]);});}
for(const [id,options] of [['robot-outfit',Object.entries(ROBOT_OUTFITS)],['robot-hat',Object.entries(ROBOT_HATS)],['robot-color',COLORS.map((color,i)=>[color,['Terracotta','Sage','Lilac','Ocean','Honey'][i]])]])for(const [value,label] of options){const option=document.createElement('option');option.value=value;option.textContent=label;$('#'+id).append(option);}
function characterClass(style){document.querySelectorAll('.avatar').forEach(el=>{el.classList.toggle('ears',style==='ears');el.classList.toggle('plain',style==='plain');});}
function swatches(){const box=$('#swatches');box.replaceChildren();for(const color of COLORS){const button=document.createElement('button');button.type='button';button.className='swatch'+(selectedColor===color?' selected':'');button.style.background=color;button.setAttribute('aria-label',({'#ed6e40':'Terracotta','#86966a':'Sage','#9b85bb':'Lilac','#6e9eae':'Ocean','#d5aa4d':'Honey'})[color]);button.setAttribute('aria-pressed',String(selectedColor===color));button.onclick=()=>{selectedColor=color;document.documentElement.style.setProperty('--character',color);swatches();saveExplorer();};box.append(button);}}
function renderLibrary(){$('#game-count').textContent=String(GAMES.length).padStart(2,'0');document.querySelectorAll('[data-filter]').forEach(button=>{button.hidden=button.dataset.filter!=='all'&&!GAMES.some(game=>game.dimension===button.dataset.filter);});const grid=$('#game-grid');grid.replaceChildren();for(const game of GAMES.filter(g=>filter==='all'||g.dimension===filter)){const card=document.createElement('article');card.className='game-card';card.innerHTML=`<div class="game-art ${game.tone}"><canvas width="960" height="540" aria-hidden="true"></canvas><span class="game-tag">${game.dimension} WORLD</span></div><div class="card-content"><div class="card-title"><h3>${game.name}</h3><span class="genre">${game.genre}</span></div><p>${game.description}</p><div class="card-bottom"><span class="reward">✦ &nbsp; ${game.pumpkin?'5 coins per pumpkin':game.creative?'5 coins per ice cream':game.van?system.snapshot().ravenLevel+' best: '+formatRaceTime(system.snapshot().stats['family-van-'+system.snapshot().ravenLevel]?.bestTimeMs):game.airRace?'Best: '+formatRaceTime(system.snapshot().stats[airRecordId(system.snapshot().character.plane.difficulty)]?.bestTimeMs):'Collect coins as you play'}</span><button type="button">Let's play ↗</button></div></div>`;card.querySelector('button').onclick=()=>openGame(game);grid.append(card);drawPreview(card.querySelector('canvas'),game,system.snapshot().character,system.modifiers());}}
let boostHud={boosts:{boots:0,magnet:0,eliminator:0},canBoost:false};
function renderBoosts(){
  const bag=system.snapshot().boosts;
  $('#boost-bag').textContent=`Boost bag: ${bag.boots+bag.magnet+bag.eliminator}/3 · Each lasts 15 seconds`;
  for(const id of ['boots','magnet','eliminator']){
    const button=$('#boost-'+id),seconds=Math.ceil(boostHud.boosts?.[id]||0),name={boots:'Super speed',magnet:'Gem magnet',eliminator:'Dragon eliminator'}[id];
    button.textContent=`${{boots:'👟',magnet:'🧲',eliminator:'🐉'}[id]} ${name} · ${seconds?seconds+'s':bag[id]+' left'}`;
    button.disabled=!boostHud.canBoost||!bag[id]||seconds>0;
    button.setAttribute('aria-label',`${name}: ${bag[id]} stored${seconds?', active for '+seconds+' more seconds':', activate for 15 seconds'}`);
  }
}
for(const id of ['boots','magnet','eliminator'])$('#boost-'+id).onclick=()=>engine?.activateBoost(id);
let ravenSnackHud={seconds:0,canUse:false};
function renderRavenSnack(){
  const button=$('#van-snack'),count=system.snapshot().boosts.snack;
  button.textContent='🍿 Snack Attack · '+(ravenSnackHud.seconds>0?Math.ceil(ravenSnackHud.seconds)+'s':count+' left');
  button.disabled=!ravenSnackHud.canUse||ravenSnackHud.seconds>0||count<1;
}
$('#van-snack').onclick=()=>engine?.activateSnack?.();
function renderShop(){
  const state=system.snapshot(),full=state.boosts.boots+state.boosts.magnet+state.boosts.eliminator>=3;
  $('#shop-gameplay').replaceChildren();$('#shop-appearance').replaceChildren();
  for(const item of UPGRADES){
    const consumable=item.group==='gameplay',owned=state.upgrades.includes(item.id),canBuy=state.unlimitedCoins||state.coins>=item.cost,blocked=consumable&&item.id!=='snack'&&full;
    const card=document.createElement('article');card.className='shop-card';
    card.innerHTML=`<div class="shop-icon">${item.icon}</div><small>${item.category}</small><h4>${item.name}</h4><p>${item.description}${item.id==='snack'?' '+state.boosts.snack+' uses stored.':consumable?' '+state.boosts[item.id]+' stored · Bag '+(state.boosts.boots+state.boosts.magnet+state.boosts.eliminator)+'/3.':''}</p><button class="button outline" ${owned||!canBuy||blocked?'disabled':''}><span>${owned?'Owned ✓':blocked?'Boost bag full':canBuy?consumable?'Buy one boost':'Unlock upgrade':`Earn ${item.cost-state.coins} more coins`}</span><span>${owned?'✓':`✦ ${item.cost}`}</span></button>`;
    card.querySelector('button').onclick=()=>{try{system.buy(item.id);notify(`${item.name} ${consumable?'added to your inventory':'unlocked'}!`);}catch(e){notify(e.message);}};
    $('#shop-'+item.group).append(card);
  }
}

function render(){const state=system.snapshot();$('#balance').textContent=state.unlimitedCoins?'∞':state.coins.toLocaleString();$('#explorer-name').textContent=state.character.name;$('#played-count').textContent=Object.values(state.stats).reduce((sum,s)=>sum+s.plays,0);$('#upgrade-count').textContent=`${state.upgrades.length} / ${UPGRADES.filter(item=>item.group==='appearance').length}`;$('#storage-status').textContent=system.isSaved()?'Progress stays in this browser':'Not saved — export to keep progress';document.documentElement.style.setProperty('--character',state.character.color);characterClass(state.character.style);applyRobotLook(state.character.robot);syncLevelButtons();renderLibrary();renderShop();renderBoosts();renderRavenSnack();syncKnightCustomizer();syncFlightCustomizer();syncPlaneCustomizer();}
function syncForm(){const c=system.snapshot().character;selectedColor=c.color;$('#character-name').value=c.name;$('#character-style').value=c.style;$('#robot-outfit').value=c.robot.outfit;$('#robot-hat').value=c.robot.hat;$('#robot-color').value=c.robot.color;for(const accessory of ['glasses','headphones','backpack'])$('#robot-'+accessory).checked=c.robot[accessory];swatches();}
function saveExplorer(){
  const name=$('#character-name').value.trim();if(!name){$('#robot-save-status').textContent='Give your explorer a name to save this look.';return;}
  const robot={outfit:$('#robot-outfit').value,hat:$('#robot-hat').value,color:$('#robot-color').value,glasses:$('#robot-glasses').checked,headphones:$('#robot-headphones').checked,backpack:$('#robot-backpack').checked};
  try{system.setCharacter({...system.snapshot().character,name,color:selectedColor,style:$('#character-style').value,robot});$('#robot-save-status').textContent=system.isSaved()?'Explorer saved! All robot outfits are free.':'Look updated for this visit. Export a save to keep it.';return true;}catch(error){notify(error.message);return false;}
}
$('#character-form').onchange=saveExplorer;
$('#character-form').onsubmit=e=>{e.preventDefault();saveExplorer();};
document.querySelectorAll('[data-filter]').forEach(button=>button.onclick=()=>{filter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(b=>{b.classList.toggle('selected',b===button);b.setAttribute('aria-pressed',String(b===button));});renderLibrary();});
function openGame(game){currentGame=game;$('#tag-controls').hidden=!game.tag;$('#tag-mode').hidden=!game.tag;$('#van-controls').hidden=!game.van;$('#van-boosts').hidden=!game.van;ravenSnackHud={seconds:0,canUse:false};renderRavenSnack();$('#maze-view-controls').hidden=!game.directional;syncMazeView();$('#ice-controls').hidden=!game.creative||Boolean(game.pumpkin);$('#pumpkin-controls').hidden=!game.pumpkin;$('#game-character').hidden=Boolean(game.creative||game.van||game.tag);$('#air-controls').hidden=!game.airRace;$('#plane-options').disabled=false;$('#race-boost').disabled=true;resetRaceBoost();syncPlaneCustomizer();syncLevelButtons();$('#next-level').hidden=true;boostHud={boosts:{boots:0,magnet:0,eliminator:0},canBoost:false};$('#maze-boosts').hidden=!game.directional;renderBoosts();$('#game-title').textContent=game.name;$('#game-mode').textContent=`${game.dimension} WORLD · ${game.mode || '45 SECOND ADVENTURE'}`;$('#game-instructions').textContent=game.instructions || 'Move with WASD or arrow keys, or tap and drag. Collect coins before time runs out. Each pickup earns 2 coins.';$('#game-hud').textContent='Your explorer and upgrades are ready.';$('#game-result').hidden=true;$('#game-overlay').hidden=false;$('#restart-game').textContent='Start game ▶';$('#restart-game').disabled=false;$('#pause-game').disabled=true;$('#pause-game').textContent='Pause';const canvas=$('#game-canvas');canvas.width=game.width||960;canvas.height=game.height||540;canvas.style.aspectRatio=`${canvas.width} / ${canvas.height}`;canvas.setAttribute('aria-label',game.tag?'Tag arena. Player 1 uses W A D; Player 2 uses arrow keys.':game.van?'The Raven time trial. Left and Right dodge, Up jumps, hold Space to fly, Down brakes.':game.pumpkin?'Pumpkin carving area. Drag to carve, or use arrow keys and Space.':game.creative?'Your ice cream creation and dragon ending clip. Use the choice buttons below.':game.airRace?'Airplane hoop race. Steer with arrow keys, WASD, or drag. Space boosts.':game.directional?'Knight and dragon maze. Use arrow keys, WASD, swipe, or direction buttons to steer.':'Flying game. Tap or press Space or Arrow Up to flap. Avoid pipes and the edges.');dialog.classList.toggle('maze-dialog',Boolean(game.directional));dialog.classList.toggle('flight-dialog',Boolean(game.flight));$('#flight-controls').hidden=!game.flight;$('#flight-options').disabled=false;$('#flap-button').disabled=true;$('#game-character').textContent=game.airRace?'Customize airplane':game.flight?'Customize flyer':'Character studio';$('#direction-pad').hidden=!game.directional;$('#maze-life-bar').hidden=false;$('#maze-lives').hidden=!game.directional;$('#knight-customizer').hidden=!game.directional;syncKnightCustomizer();if(game.directional)renderLives(3);dialog.showModal();try{engine=game.create({canvas:$('#game-canvas'),game,view:mazeView,getUpgrades:()=>system.snapshot().upgrades,character:system.snapshot().character,modifiers:system.modifiers(),bestTimeMs:system.snapshot().stats[game.van?game.id:airRecordId(system.snapshot().character.plane.difficulty)]?.bestTimeMs??null,bestTimes:Object.fromEntries(Object.keys(AIR_DIFFICULTIES).map(id=>[id,system.snapshot().stats[airRecordId(id)]?.bestTimeMs??null])),level:system.snapshot().mazeLevel,onLevelChange:level=>system.setMazeLevel(level),initialLevel:system.snapshot().ravenLevel,getBestTime:id=>system.snapshot().stats['family-van-'+id]?.bestTimeMs??null,onLevelChangeRaven:id=>system.setRavenLevel(id),consumeBoost:id=>system.consumeBoost(id),onHud:({remaining,earned,text,lives,boosts,canBoost,raceBoost,ravenSnack})=>{
if(ravenSnack){ravenSnackHud=ravenSnack;renderRavenSnack();}
if(typeof raceBoost==='boolean'){$('#race-boost').setAttribute('aria-pressed',String(raceBoost));$('#race-boost').textContent=raceBoost?'Boost on — tap to cruise':'Boost';}if(boosts){boostHud={boosts,canBoost};renderBoosts();}$('#game-hud').textContent=text||`${remaining}s left · ✦ ${earned} coins collected`;if(Number.isInteger(lives)&&$('#maze-lives').getAttribute('aria-label')!==`${lives} ${lives===1?'life':'lives'} remaining`)renderLives(lives);},onFinish:(earned,resultInfo={})=>{session?.finish(earned,resultInfo.timeMs??null);running=false;$('#plane-options').disabled=false;$('#race-boost').disabled=true;resetRaceBoost();boostHud.canBoost=false;renderBoosts();$('#flight-options').disabled=false;$('#flap-button').disabled=true;$('#flight-settings-status').textContent='Customize before your next flight.';$('#restart-game').disabled=false;$('#restart-game').textContent=currentGame.pumpkin?'Carve another pumpkin':currentGame.creative?'Make another ice cream':currentGame.directional?'Play level again':'Play again ↗';$('#next-level').hidden=!resultInfo.hasNext;$('#next-level').disabled=false;$('#pause-game').disabled=true;const result=$('#game-result');result.replaceChildren();const title=document.createElement('strong');title.textContent=resultInfo.title||'A little adventure, well spent.';const subtitle=document.createElement('span');subtitle.textContent=`${earned} coins added to your wallet${resultInfo.detail?' · '+resultInfo.detail:''}`;result.append(title,subtitle);result.hidden=false;$('#game-overlay').hidden=false;$('#restart-game').focus({preventScroll:true});}});engine.setMuted?.(mazeMuted);dialog.scrollTop=0;$('#restart-game').focus({preventScroll:true});}catch(e){dialog.close();notify(e.message);}}
$('#next-level').onclick=()=>{if(!engine||running||!engine.selectNextLevel?.())return;$('#restart-game').onclick();};
$('#restart-game').onclick=()=>{if(!engine||running)return;$('#next-level').hidden=true;session=system.beginSession(currentGame.van?engine.getRecordId():currentGame.airRace?airRecordId(system.snapshot().character.plane.difficulty):currentGame.id);running=true;paused=false;$('#plane-options').disabled=Boolean(currentGame.airRace);$('#race-boost').disabled=!currentGame.airRace;resetRaceBoost();$('#flight-options').disabled=Boolean(currentGame.flight);$('#flap-button').disabled=!currentGame.flight;$('#flight-settings-status').textContent='Settings locked for this flight. You can change them next round.';$('#game-overlay').hidden=true;$('#game-result').hidden=true;$('#restart-game').disabled=true;$('#pause-game').disabled=false;$('#pause-game').textContent='Pause';engine.start();};
$('#pause-game').onclick=()=>{if(!running)return;paused=!paused;engine.pause(paused);resetRaceBoost();$('#race-boost').disabled=paused||!currentGame.airRace;$('#flap-button').disabled=paused||!currentGame.flight;$('#pause-game').textContent=paused?'Resume':'Pause';if(!paused)$('#game-canvas').focus();else $('#game-hud').textContent+=' · Paused';};
document.querySelectorAll('[data-direction]').forEach(button=>button.onclick=()=>{engine?.input?.(button.dataset.direction);});
$('#close-game').onclick=()=>dialog.close();
dialog.addEventListener('close',()=>{engine?.destroy();engine=null;session=null;running=false;});
$('#game-character').onclick=()=>{if(currentGame?.airRace){if(running)notify('Finish this race to customize your airplane.');else $('#plane-color').focus();return;}if(currentGame?.flight){if(running)notify('Finish this flight to change your flyer or difficulty.');else $('#flight-animal').focus();return;}dialog.close();location.hash='workshop';$('#character-name').focus();};
window.addEventListener('pagehide',()=>engine?.destroy());
$('#export').onclick=()=>{const url=URL.createObjectURL(new Blob([system.exportSave()],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='sidequest-save.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('Save exported. Keep it somewhere safe.');};
$('#import-trigger').onclick=()=>$('#import').click();
$('#import').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>100000)throw new Error('That save file is too large.');const raw=await file.text();if(!confirm('Replace your current character, coins, and upgrades with this save? Export your current save first if you want to keep it.'))return;system.importSave(raw);syncForm();notify('Welcome back. Your universe is restored.');}catch(err){notify(err instanceof SyntaxError?'That file is not valid JSON.':err.message);}finally{e.target.value='';}};
system.subscribe(render);render();syncForm();

initBackgroundPicker(storage,system);

// The lettering keeps its normal appearance and the rest of each logo remains a home link.
for(const letter of document.querySelectorAll('[data-brand-letter]'))letter.addEventListener('click',event=>{
  event.preventDefault();event.stopPropagation();
  $('#brand-password').value='';$('#brand-message').textContent='';
  $('#brand-dialog').showModal();$('#brand-password').focus();
});
$('#brand-cancel').addEventListener('click',()=>$('#brand-dialog').close());
$('#brand-dialog').addEventListener('close',()=>{$('#brand-password').value='';$('#brand-message').textContent='';});
$('#brand-form').addEventListener('submit',async event=>{
  event.preventDefault();
  const password=$('#brand-password').value;$('#brand-password').value='';
  try {
    if(await system.unlockWallet(password)){$('#brand-dialog').close();notify('Unlimited coins unlocked.');}
    else {$('#brand-message').textContent='Incorrect password.';$('#brand-password').focus();}
  } catch {$('#brand-message').textContent='Could not unlock. Please try again.';}
});
