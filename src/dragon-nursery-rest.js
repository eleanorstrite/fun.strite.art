import {WALK_ROUTE} from './dragon-nursery-daily.js';
import {nurseryMorningTasks,nurseryFlightRings,TARGETS,SPEED_TRACK} from './dragon-nursery-training.js';

export function nurseryDayComplete(s){const tasks=nurseryMorningTasks(s);return tasks.length>0&&tasks.every(t=>t.done);}
export function nurseryKeeperEnergy(s){
 const tasks=nurseryMorningTasks(s);if(!tasks.length)return 100;if(tasks.every(t=>t.done))return 0;
 const complete=tasks.filter(t=>t.done).length;let partial=0;
 for(const task of tasks.filter(t=>!t.done)){
  if(s.careEffect?.action===task.id)partial=Math.max(partial,s.careEffect.elapsed/s.careEffect.duration);
  if(task.id==='walk'&&s.walking)partial=Math.max(partial,(s.walkIndex||0)/WALK_ROUTE.length);
  if(task.id==='teeth'&&s.activity?.kind==='teeth')partial=Math.max(partial,s.activity.dirt.filter(d=>d.clean).length/s.activity.dirt.length);
  if(task.id==='training'&&s.training&&!s.training.intro){const r=s.training;partial=Math.max(partial,r.kind==='target'?r.hits.length/TARGETS.length:r.kind==='flying'?r.ring/nurseryFlightRings(s).length:(r.checkpoint-1)/(SPEED_TRACK.length-1));}
 }
 return Math.max(1,Math.round(100*(1-(complete+Math.min(.95,partial))/tasks.length)));
}
export function nurseryKeeperMood(s){const energy=nurseryKeeperEnergy(s);return {energy,tone:nurseryDayComplete(s)?'red':energy<=60?'yellow':'green',sleepy:nurseryDayComplete(s)};}
export function ignoreNurseryTiredness(s){s.tiredPromptIgnored=true;}

export function createNurseryRestUI(wrap,{onShow=()=>{},onBed=()=>{},onIgnore=()=>{}}={}){
 const hud=document.createElement('aside');hud.className='nursery-keeper-energy';hud.hidden=true;hud.innerHTML='<small>Your energy</small><div><span aria-hidden="true">☹️</span><div class="nursery-keeper-energy-track" role="progressbar" aria-label="Your energy" aria-valuemin="0" aria-valuemax="100"><span data-keeper-energy-fill></span></div><span aria-hidden="true">🙂</span></div>';wrap.append(hud);
 const root=document.createElement('section');root.className='nursery-tired-prompt';root.hidden=true;root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-labelledby','nursery-tired-title');root.innerHTML='<div><span class="nursery-eyebrow">A FULL DAY TOGETHER</span><div class="nursery-rest-question"><img data-tired-portrait alt="Your keeper with sleepy eyes"><h3 id="nursery-tired-title">I’m tired. I think I should go to bed. Do you?</h3></div><div class="nursery-rest-actions"><button type="button" class="button dark" data-go-to-bed>Go to Bed</button><button type="button" class="button outline" data-ignore-tired>Ignore</button></div></div>';wrap.append(root);
 const bed=root.querySelector('[data-go-to-bed]'),ignore=root.querySelector('[data-ignore-tired]'),track=hud.querySelector('[role=progressbar]');bed.onclick=()=>{root.hidden=true;onBed();};ignore.onclick=()=>{root.hidden=true;onIgnore();};root.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape'){e.preventDefault();ignore.click();}else if(e.key==='Tab'){e.preventDefault();(document.activeElement===bed?ignore:bed).focus();}});
 return {setPortrait(data){root.querySelector('[data-tired-portrait]').src=data;},get isOpen(){return !root.hidden;},close(){root.hidden=true;wrap.classList.remove('keeper-rest-open');},sync(s,{visible,canPrompt}){const mood=nurseryKeeperMood(s);hud.hidden=!visible;hud.dataset.tone=mood.tone;track.setAttribute('aria-valuenow',String(mood.energy));track.setAttribute('aria-valuetext',mood.sleepy?'All daily tasks complete. Time for bed.':mood.energy+' percent energy');hud.querySelector('[data-keeper-energy-fill]').style.width=Math.max(3,mood.energy)+'%';if(!visible||!mood.sleepy||s.tiredPromptIgnored)root.hidden=true;else if(canPrompt&&root.hidden){root.hidden=false;onShow();bed.focus({preventScroll:true});}wrap.classList.toggle('keeper-rest-open',!root.hidden);},destroy(){wrap.classList.remove('keeper-rest-open');hud.remove();root.remove();}};
}
