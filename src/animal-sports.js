import {SPORTS_ANIMALS,SPORTS_ARENAS,SPORTS_EQUIPMENT,SPORTS_DEFAULTS,validateSportsSettings} from './animal-sports-settings.js';
import {createSportsState,tickSports,sportsAction,sportsReward,SPORTS_INSTRUCTIONS} from './animal-sports-rules.js';
import {drawSports,drawSportsAnimal} from './animal-sports-art.js';
export {drawAnimalSportsPreview} from './animal-sports-art.js';
export function createAnimalSports({canvas,wallet,onHud=()=>{},onFinish=()=>{},openFoodShop=()=>{}}){
 const ctx=canvas.getContext('2d'),abort=new AbortController(),options={signal:abort.signal},keys=new Set();let settings={...SPORTS_DEFAULTS};
 const owned=()=>wallet?.snapshot?.().upgrades||[];try{settings=validateSportsSettings(JSON.parse(localStorage.getItem('sidequest.animal-sports')||'{}'),owned());}catch{}
 let state=createSportsState(settings.arena),running=false,paused=false,destroyed=false,last=0,frame,pointer=null,swipe={x:0,y:0,time:0},finished=false,lastHud='';
 const controls=document.createElement('section');controls.className='animal-sports-controls';controls.setAttribute('aria-label','Animal Sports arenas and customizer');
 controls.innerHTML='<div class="sports-arena-picker" role="group" aria-label="Choose a sports arena"></div><details class="sports-customizer"><summary>Customize your athlete & equipment</summary><div class="sports-customizer-grid"><canvas width="220" height="190" aria-label="Your animal preview"></canvas><fieldset class="sports-appearance"><legend>Appearance</legend></fieldset><fieldset class="sports-materials"><legend>Materials & equipment</legend></fieldset></div><p>All animals and accessories are free. Equipment finishes from the shared shop cost 50 coins each.</p><button type="button" class="button secondary sports-shop">Open equipment shop ↗</button></details><p class="sports-instructions"></p>';
 canvas.parentElement.before(controls);const preview=controls.querySelector('canvas'),appearance=controls.querySelector('.sports-appearance'),materials=controls.querySelector('.sports-materials'),picker=controls.querySelector('.sports-arena-picker');
 const fields=new Map();
 function field(parent,key,title,choices){const label=document.createElement('label');label.textContent=title;const input=document.createElement('select');input.dataset.sportsSetting=key;for(const [value,name]of choices){const option=document.createElement('option');option.value=value;option.textContent=name;input.append(option);}label.append(input);parent.append(label);fields.set(key,input);return input;}
 field(appearance,'animal','Animal',SPORTS_ANIMALS.map(a=>[a,a[0].toUpperCase()+a.slice(1)]));field(appearance,'accessory','Accessory',[['none','None'],['headband','Team headband'],['cap','Sports cap'],['glasses','Sports glasses']]);
 for(const [key,title]of [['color','Fur / scales / feathers'],['jersey','Jersey & accessories']]){const label=document.createElement('label');label.textContent=title;const input=document.createElement('input');input.type='color';input.dataset.sportsSetting=key;label.append(input);appearance.append(label);fields.set(key,input);}
 for(const sport of Object.keys(SPORTS_EQUIPMENT))field(materials,sport,SPORTS_ARENAS[sport],Object.entries(SPORTS_EQUIPMENT[sport]).map(([key,item])=>[key,item.name]));
 for(const [sport,name]of Object.entries(SPORTS_ARENAS)){const button=document.createElement('button');button.type='button';button.dataset.sport=sport;button.textContent=name;button.addEventListener('click',()=>{if(running)return;settings.arena=sport;state=createSportsState(sport);save();sync();render();},options);picker.append(button);}
 function save(){try{localStorage.setItem('sidequest.animal-sports',JSON.stringify(settings));}catch{}}
 for(const [key,input]of fields)input.addEventListener('change',()=>{settings=validateSportsSettings({...settings,[key]:input.value},owned());save();sync();render();},options);
 controls.querySelector('.sports-shop').addEventListener('click',()=>{save();openFoodShop();},options);
 const actions=document.createElement('div');actions.className='sports-action-controls';canvas.parentElement.after(actions);const actionButton=document.createElement('button');actionButton.type='button';actionButton.className='button primary';actions.append(actionButton);actionButton.addEventListener('click',()=>{act(state.sport==='bowling'?'roll':state.sport==='tennis'?'swing':'shoot');canvas.focus({preventScroll:true});},options);
 function sync(){
  settings=validateSportsSettings(settings,owned());for(const [key,input]of fields){input.value=settings[key];input.disabled=running;}
  for(const [sport,items]of Object.entries(SPORTS_EQUIPMENT))for(const option of fields.get(sport).options){const item=items[option.value],locked=item.upgrade&&!owned().includes(item.upgrade);option.disabled=Boolean(locked);option.textContent=item.name+(locked?' · Shop: 50 coins':item.upgrade?' · Owned':' · Free');}
  for(const button of picker.children){button.disabled=running;button.setAttribute('aria-pressed',String(button.dataset.sport===settings.arena));}
  controls.querySelector('.sports-instructions').textContent=SPORTS_INSTRUCTIONS[settings.arena];controls.querySelector('.sports-shop').disabled=running;
  actionButton.textContent={bowling:'Roll ↑',tennis:'Swing · Space',basketball:'Shoot · Space'}[state.sport];actionButton.disabled=!running||paused;
  const p=preview.getContext('2d');p.clearRect(0,0,220,190);p.fillStyle='#e1edf0';p.fillRect(0,0,220,190);drawSportsAnimal(p,110,170,108,settings);
 }
 function act(action,target){if(!running||paused||document.hidden)return false;return sportsAction(state,action,target);}
 const keyName=key=>key.toLowerCase();canvas.addEventListener('keydown',event=>{const key=keyName(event.key);if(!['arrowleft','arrowright','arrowup','arrowdown',' ','v','a','d','w','s'].includes(key))return;event.preventDefault();if(!running||paused)return;keys.add(key);if(event.repeat)return;if(state.sport==='bowling'&&key==='arrowup')act('roll');if(key===' ')act(state.sport==='tennis'?'swing':state.sport==='basketball'?'shoot':'roll');if(key==='v'&&state.sport==='basketball')act('pass');},options);
 window.addEventListener('keyup',event=>keys.delete(keyName(event.key)),options);
 function clearInput(){keys.clear();swipe={x:0,y:0,time:0};pointer=null;}
 canvas.addEventListener('blur',clearInput,options);window.addEventListener('blur',clearInput,options);document.addEventListener('visibilitychange',clearInput,options);
 const point=event=>{const rect=canvas.getBoundingClientRect();return {x:(event.clientX-rect.left)*960/rect.width,y:(event.clientY-rect.top)*600/rect.height};};
 canvas.addEventListener('pointerdown',event=>{if(!running||paused||pointer)return;event.preventDefault();canvas.focus({preventScroll:true});canvas.setPointerCapture?.(event.pointerId);pointer={...point(event),id:event.pointerId,time:state.time};},options);
 canvas.addEventListener('pointerup',event=>{
  if(!pointer||pointer.id!==event.pointerId)return;event.preventDefault();const start=pointer,end=point(event);pointer=null;const dx=end.x-start.x,dy=end.y-start.y,distance=Math.hypot(dx,dy);if(!running||paused)return;
  if(state.sport==='bowling'){if(dy<-35&&Math.abs(dy)>Math.abs(dx))act('roll');else if(Math.abs(dx)>20&&!state.ball&&state.cooldown<=0)state.player.x=Math.max(315,Math.min(645,state.player.x+dx*.65));}
  else if(state.sport==='tennis'){if(Math.abs(dx)>25){state.player.x=Math.max(230,Math.min(730,state.player.x+dx));}else if(distance<25)act('swing');}
  else if(distance>30){swipe={x:dx/distance,y:dy/distance,time:.55};}
  else if(state.time-start.time>=.35)act('shoot');
  else{const next=state.team.findIndex((p,i)=>i!==state.active&&Math.hypot(p.x-end.x,p.y-35-end.y)<65);if(next>=0)act('pass',next);}
 },options);
 canvas.addEventListener('pointercancel',clearInput,options);canvas.addEventListener('lostpointercapture',()=>{pointer=null;},options);
 function render(){drawSports(ctx,state,settings,running&&!paused);const text=`${SPORTS_ARENAS[state.sport]} · ${state.score} ${state.sport==='bowling'?'pins':'points'} · ${state.message}`;if(text!==lastHud){lastHud=text;onHud({text});}}
 function loop(now){const dt=Math.min(.04,Math.max(0,(now-last)/1000||0));last=now;if(running&&!paused&&!document.hidden){const x=Number(keys.has('arrowright')||keys.has('d'))-Number(keys.has('arrowleft')||keys.has('a')),y=Number(keys.has('arrowdown')||keys.has('s'))-Number(keys.has('arrowup')||keys.has('w'));tickSports(state,dt,{x:x+(swipe.time>0?swipe.x:0),y:y+(swipe.time>0?swipe.y:0)});swipe.time=Math.max(0,swipe.time-dt);if(state.done&&!finished){finished=true;running=false;clearInput();sync();onFinish(sportsReward(state),{title:state.message,detail:`${SPORTS_ARENAS[state.sport]} · ${state.score} ${state.sport==='bowling'?'pins':'points'}`,score:state.score});}}render();if(!destroyed)frame=requestAnimationFrame(loop);}
 const unsubscribe=wallet?.subscribe?.(()=>{sync();render();});sync();render();frame=requestAnimationFrame(loop);
 return {start(){clearInput();state=createSportsState(settings.arena);running=true;paused=false;finished=false;controls.querySelector('details').open=false;sync();canvas.focus({preventScroll:true});},pause(value){paused=value;clearInput();sync();},destroy(){destroyed=true;abort.abort();cancelAnimationFrame(frame);unsubscribe?.();controls.remove();actions.remove();}};
}
