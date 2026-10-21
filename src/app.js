import { FLIGHT_LEVELS, FLIGHT_ANIMALS, PIPE_STYLES } from './flight-settings.js';
import { drawFlyer } from './sky-flight.js';
import { initBackgroundPicker } from './backgrounds.js';
import { drawKnight } from './knight-maze.js';
import { createSystem, COLORS, UPGRADES, ARMORS, HELMETS, DRAGON_STYLES, ROBOT_OUTFITS, ROBOT_HATS } from './system.js';
import { GAMES, drawPreview } from './games.js';
const $ = selector => document.querySelector(selector);
let toastTimer;
function notify(message) { $('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),4000); }
let storage;
try { storage=window.localStorage; } catch { storage={getItem(){throw new Error();},setItem(){throw new Error();}}; }
const system=createSystem(storage,()=>notify('Browser saving unavailable. Export a save to keep your progress.'));
let selectedColor=system.snapshot().character.color,filter='all',engine=null,session=null,currentGame=null,running=false,paused=false;
const dialog=$('#game-dialog');
let mazeMuted=false;
function renderLives(lives){const row=$('#maze-lives');row.replaceChildren();row.setAttribute('aria-label',`${lives} ${lives===1?'life':'lives'} remaining`);const label=document.createElement('span');label.textContent='LIVES';row.append(label);for(let i=0;i<lives;i++){const face=document.createElement('span');face.className='life-face';face.textContent='☺';face.setAttribute('aria-hidden','true');row.append(face);}}
$('#maze-sound').onclick=()=>{mazeMuted=!mazeMuted;engine?.setMuted?.(mazeMuted);$('#maze-sound').textContent=mazeMuted?'Sound off':'Sound on';$('#maze-sound').setAttribute('aria-pressed',String(mazeMuted));};
function syncFlightCustomizer(){
  const settings=system.snapshot().character.flight;
  for(const [field,id] of [['animal','flight-animal'],['difficulty','flight-difficulty'],['color','flight-color'],['pipe','flight-pipe'],['pipeColor','flight-pipe-color']])$('#'+id).value=settings[field];
  const level=FLIGHT_LEVELS[settings.difficulty];$('#flight-rate').textContent=`${level.name} · ${level.reward} coin${level.reward===1?'':'s'} per pipe`;
  const ctx=$('#flyer-preview').getContext('2d');if(ctx){ctx.clearRect(0,0,240,150);drawFlyer(ctx,120,90,100,settings);}
}
for(const [id,values] of [['flight-animal',Object.entries(FLIGHT_ANIMALS)],['flight-pipe',Object.entries(PIPE_STYLES)],['flight-difficulty',Object.entries(FLIGHT_LEVELS).map(([id,l])=>[id,`${l.name} · ${l.reward} coins / pipe`])]])for(const [value,label] of values){const option=document.createElement('option');option.value=value;option.textContent=label;$('#'+id).append(option);}
$('#flight-form').onsubmit=e=>e.preventDefault();
$('#flight-form').onchange=()=>{
  if(running)return;
  try{system.setCharacter({...system.snapshot().character,flight:{animal:$('#flight-animal').value,difficulty:$('#flight-difficulty').value,color:$('#flight-color').value,pipe:$('#flight-pipe').value,pipeColor:$('#flight-pipe-color').value}});$('#flight-settings-status').textContent=system.isSaved()?'Flight settings saved. Ready to fly!':'Settings applied for this visit. Export to keep them.';}catch(error){notify(error.message);}
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
function renderLibrary(){$('#game-count').textContent=String(GAMES.length).padStart(2,'0');document.querySelectorAll('[data-filter]').forEach(button=>{button.hidden=button.dataset.filter!=='all'&&!GAMES.some(game=>game.dimension===button.dataset.filter);});const grid=$('#game-grid');grid.replaceChildren();for(const game of GAMES.filter(g=>filter==='all'||g.dimension===filter)){const card=document.createElement('article');card.className='game-card';card.innerHTML=`<div class="game-art ${game.tone}"><canvas width="960" height="540" aria-hidden="true"></canvas><span class="game-tag">${game.dimension} WORLD</span></div><div class="card-content"><div class="card-title"><h3>${game.name}</h3><span class="genre">${game.genre}</span></div><p>${game.description}</p><div class="card-bottom"><span class="reward">✦ &nbsp; Collect coins as you play</span><button type="button">Let's play ↗</button></div></div>`;card.querySelector('button').onclick=()=>openGame(game);grid.append(card);drawPreview(card.querySelector('canvas'),game,system.snapshot().character,system.modifiers());}}
let boostHud={boosts:{boots:0,magnet:0},canBoost:false};
function renderBoosts(){
  const bag=system.snapshot().boosts;
  $('#boost-bag').textContent=`Boost bag: ${bag.boots+bag.magnet}/3 · Each lasts 15 seconds`;
  for(const id of ['boots','magnet']){
    const button=$('#boost-'+id),seconds=Math.ceil(boostHud.boosts?.[id]||0),name=id==='boots'?'Super speed':'Gem magnet';
    button.textContent=`${id==='boots'?'👟':'🧲'} ${name} · ${seconds?seconds+'s':bag[id]+' left'}`;
    button.disabled=!boostHud.canBoost||!bag[id]||seconds>0;
    button.setAttribute('aria-label',`${name}: ${bag[id]} stored${seconds?', active for '+seconds+' more seconds':', activate for 15 seconds'}`);
  }
}
for(const id of ['boots','magnet'])$('#boost-'+id).onclick=()=>engine?.activateBoost(id);
function renderShop(){
  const state=system.snapshot(),full=state.boosts.boots+state.boosts.magnet>=3;
  $('#shop-gameplay').replaceChildren();$('#shop-appearance').replaceChildren();
  for(const item of UPGRADES){
    const consumable=item.group==='gameplay',owned=state.upgrades.includes(item.id),canBuy=state.coins>=item.cost,blocked=consumable&&full;
    const card=document.createElement('article');card.className='shop-card';
    card.innerHTML=`<div class="shop-icon">${item.icon}</div><small>${item.category}</small><h4>${item.name}</h4><p>${item.description}${consumable?' '+state.boosts[item.id]+' stored · Bag '+(state.boosts.boots+state.boosts.magnet)+'/3.':''}</p><button class="button outline" ${owned||!canBuy||blocked?'disabled':''}><span>${owned?'Owned ✓':blocked?'Boost bag full':canBuy?consumable?'Buy one boost':'Unlock upgrade':`Earn ${item.cost-state.coins} more coins`}</span><span>${owned?'✓':`✦ ${item.cost}`}</span></button>`;
    card.querySelector('button').onclick=()=>{try{system.buy(item.id);notify(`${item.name} ${consumable?'added to your boost bag':'unlocked'}!`);}catch(e){notify(e.message);}};
    $('#shop-'+item.group).append(card);
  }
}

function render(){const state=system.snapshot();$('#balance').textContent=state.coins.toLocaleString();$('#explorer-name').textContent=state.character.name;$('#played-count').textContent=Object.values(state.stats).reduce((sum,s)=>sum+s.plays,0);$('#upgrade-count').textContent=`${state.upgrades.length} / ${UPGRADES.filter(item=>item.group==='appearance').length}`;$('#storage-status').textContent=system.isSaved()?'Progress stays in this browser':'Not saved — export to keep progress';document.documentElement.style.setProperty('--character',state.character.color);characterClass(state.character.style);applyRobotLook(state.character.robot);renderLibrary();renderShop();renderBoosts();syncKnightCustomizer();syncFlightCustomizer();}
function syncForm(){const c=system.snapshot().character;selectedColor=c.color;$('#character-name').value=c.name;$('#character-style').value=c.style;$('#robot-outfit').value=c.robot.outfit;$('#robot-hat').value=c.robot.hat;$('#robot-color').value=c.robot.color;for(const accessory of ['glasses','headphones','backpack'])$('#robot-'+accessory).checked=c.robot[accessory];swatches();}
function saveExplorer(){
  const name=$('#character-name').value.trim();if(!name){$('#robot-save-status').textContent='Give your explorer a name to save this look.';return;}
  const robot={outfit:$('#robot-outfit').value,hat:$('#robot-hat').value,color:$('#robot-color').value,glasses:$('#robot-glasses').checked,headphones:$('#robot-headphones').checked,backpack:$('#robot-backpack').checked};
  try{system.setCharacter({...system.snapshot().character,name,color:selectedColor,style:$('#character-style').value,robot});$('#robot-save-status').textContent=system.isSaved()?'Explorer saved! All robot outfits are free.':'Look updated for this visit. Export a save to keep it.';return true;}catch(error){notify(error.message);return false;}
}
$('#character-form').onchange=saveExplorer;
$('#character-form').onsubmit=e=>{e.preventDefault();saveExplorer();};
document.querySelectorAll('[data-filter]').forEach(button=>button.onclick=()=>{filter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(b=>{b.classList.toggle('selected',b===button);b.setAttribute('aria-pressed',String(b===button));});renderLibrary();});
function openGame(game){currentGame=game;boostHud={boosts:{boots:0,magnet:0},canBoost:false};$('#maze-boosts').hidden=!game.directional;renderBoosts();$('#game-title').textContent=game.name;$('#game-mode').textContent=`${game.dimension} WORLD · ${game.mode || '45 SECOND ADVENTURE'}`;$('#game-instructions').textContent=game.instructions || 'Move with WASD or arrow keys, or tap and drag. Collect coins before time runs out. Each pickup earns 2 coins.';$('#game-hud').textContent='Your explorer and upgrades are ready.';$('#game-result').hidden=true;$('#game-overlay').hidden=false;$('#restart-game').textContent='Start game ▶';$('#restart-game').disabled=false;$('#pause-game').disabled=true;$('#pause-game').textContent='Pause';const canvas=$('#game-canvas');canvas.width=game.width||960;canvas.height=game.height||540;canvas.style.aspectRatio=`${canvas.width} / ${canvas.height}`;canvas.setAttribute('aria-label',game.directional?'Knight and dragon maze. Use arrow keys, WASD, swipe, or direction buttons to steer.':'Flying game. Tap or press Space or Arrow Up to flap. Avoid pipes and the edges.');dialog.classList.toggle('maze-dialog',Boolean(game.directional));dialog.classList.toggle('flight-dialog',Boolean(game.flight));$('#flight-controls').hidden=!game.flight;$('#flight-options').disabled=false;$('#flap-button').disabled=true;$('#game-character').textContent=game.flight?'Customize flyer':'Character studio';$('#direction-pad').hidden=!game.directional;$('#maze-life-bar').hidden=false;$('#maze-lives').hidden=!game.directional;$('#knight-customizer').hidden=!game.directional;syncKnightCustomizer();if(game.directional)renderLives(3);dialog.showModal();try{engine=game.create({canvas:$('#game-canvas'),game,character:system.snapshot().character,modifiers:system.modifiers(),consumeBoost:id=>system.consumeBoost(id),onHud:({remaining,earned,text,lives,boosts,canBoost})=>{if(boosts){boostHud={boosts,canBoost};renderBoosts();}$('#game-hud').textContent=text||`${remaining}s left · ✦ ${earned} coins collected`;if(Number.isInteger(lives)&&$('#maze-lives').getAttribute('aria-label')!==`${lives} ${lives===1?'life':'lives'} remaining`)renderLives(lives);},onFinish:(earned,resultInfo={})=>{session?.finish(earned);running=false;boostHud.canBoost=false;renderBoosts();$('#flight-options').disabled=false;$('#flap-button').disabled=true;$('#flight-settings-status').textContent='Customize before your next flight.';$('#restart-game').disabled=false;$('#restart-game').textContent='Play again ↗';$('#pause-game').disabled=true;const result=$('#game-result');result.replaceChildren();const title=document.createElement('strong');title.textContent=resultInfo.title||'A little adventure, well spent.';const subtitle=document.createElement('span');subtitle.textContent=`${earned} coins added to your wallet${resultInfo.detail?' · '+resultInfo.detail:''}`;result.append(title,subtitle);result.hidden=false;$('#game-overlay').hidden=false;$('#restart-game').focus({preventScroll:true});}});engine.setMuted?.(mazeMuted);dialog.scrollTop=0;$('#restart-game').focus({preventScroll:true});}catch(e){dialog.close();notify(e.message);}}
$('#restart-game').onclick=()=>{if(!engine||running)return;session=system.beginSession(currentGame.id);running=true;paused=false;$('#flight-options').disabled=Boolean(currentGame.flight);$('#flap-button').disabled=!currentGame.flight;$('#flight-settings-status').textContent='Settings locked for this flight. You can change them next round.';$('#game-overlay').hidden=true;$('#game-result').hidden=true;$('#restart-game').disabled=true;$('#pause-game').disabled=false;$('#pause-game').textContent='Pause';engine.start();};
$('#pause-game').onclick=()=>{if(!running)return;paused=!paused;engine.pause(paused);$('#flap-button').disabled=paused||!currentGame.flight;$('#pause-game').textContent=paused?'Resume':'Pause';if(!paused)$('#game-canvas').focus();else $('#game-hud').textContent+=' · Paused';};
document.querySelectorAll('[data-direction]').forEach(button=>button.onclick=()=>{engine?.input?.(button.dataset.direction);});
$('#close-game').onclick=()=>dialog.close();
dialog.addEventListener('close',()=>{engine?.destroy();engine=null;session=null;running=false;});
$('#game-character').onclick=()=>{if(currentGame?.flight){if(running)notify('Finish this flight to change your flyer or difficulty.');else $('#flight-animal').focus();return;}dialog.close();location.hash='workshop';$('#character-name').focus();};
window.addEventListener('pagehide',()=>engine?.destroy());
$('#export').onclick=()=>{const url=URL.createObjectURL(new Blob([system.exportSave()],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='sidequest-save.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('Save exported. Keep it somewhere safe.');};
$('#import-trigger').onclick=()=>$('#import').click();
$('#import').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>100000)throw new Error('That save file is too large.');const raw=await file.text();if(!confirm('Replace your current character, coins, and upgrades with this save? Export your current save first if you want to keep it.'))return;system.importSave(raw);syncForm();notify('Welcome back. Your universe is restored.');}catch(err){notify(err instanceof SyntaxError?'That file is not valid JSON.':err.message);}finally{e.target.value='';}};
system.subscribe(render);render();syncForm();

initBackgroundPicker(storage,system);
