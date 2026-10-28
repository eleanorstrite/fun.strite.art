export const DRAGON_INTRO_SECONDS=9.5;
export const DRAGON_INVITATION='Are you ready to play some memory?';
const ease=v=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t);};
export function dragonIntroPose(time,reduced=false){
 const phase=time<2.7?'fly-in':time<3.2?'turn':time<7.2?'greeting':'fly-away';
 const arrive=ease(time/2.7),exit=Math.max(0,(time-7.2)/2.3);
 return {phase,x:reduced?480:phase==='fly-away'?480+exit*exit*1400:-360+arrive*840,y:reduced?295:295+Math.sin(time*2.3)*9-exit*exit*90,face:phase==='turn'?ease((time-2.7)/.5):phase==='greeting'?1:phase==='fly-away'?1-ease(exit*5):0,wing:reduced?0:Math.floor(time*(phase==='fly-away'?5:2.5))%2,scale:reduced?1:.85+arrive*.15,done:time>=DRAGON_INTRO_SECONDS};
}
export function createDragonIntro(wrap,{onDone=()=>{}}={}){
 const section=document.createElement('section');section.className='dragon-intro';section.setAttribute('aria-label','Rainbow dragon welcome');
 const canvas=document.createElement('canvas');canvas.width=960;canvas.height=620;canvas.setAttribute('aria-hidden','true');
 const bubble=document.createElement('p');bubble.className='dragon-intro-speech';bubble.textContent=DRAGON_INVITATION;bubble.hidden=true;bubble.setAttribute('role','status');
 const bar=document.createElement('div');bar.className='dragon-intro-actions';const skip=document.createElement('button');skip.type='button';skip.className='button outline';skip.textContent='Skip intro · Choose a level';bar.append(skip);
 const voice=document.createElement('button');voice.type='button';voice.className='button outline';voice.textContent='Hear the dragon';voice.hidden=typeof window.speechSynthesis==='undefined';bar.prepend(voice);section.append(canvas,bubble,bar);wrap.prepend(section);wrap.classList.add('dragon-intro-playing');
 const start=wrap.querySelector('#restart-game'),wasDisabled=start?.disabled;if(start)start.disabled=true;
 const c=canvas.getContext('2d'),art=new Image(),reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;let elapsed=0,loadingTime=0,ready=false,destroyed=false,ended=false,spoke=false,lastPose=null;
 function speak(){if(!window.speechSynthesis||typeof window.SpeechSynthesisUtterance==='undefined')return;if(spoke)window.speechSynthesis.cancel();const line=new SpeechSynthesisUtterance(DRAGON_INVITATION);line.rate=.94;line.pitch=1.2;spoke=true;window.speechSynthesis.speak(line);}
 voice.addEventListener('click',speak);skip.addEventListener('click',finish);
 function finish(){if(ended||destroyed)return;ended=true;dispose();onDone();}
 function dispose(){if(destroyed)return;destroyed=true;art.onload=null;art.onerror=null;if(spoke)window.speechSynthesis?.cancel();section.remove();wrap.classList.remove('dragon-intro-playing');if(start)start.disabled=wasDisabled;}
 art.onload=()=>{ready=true;};art.onerror=finish;art.src='./assets/dragon-memory-intro.png';
 function draw(time){const pose=dragonIntroPose(time,reduced);section.dataset.phase=pose.phase;bubble.hidden=pose.phase!=='greeting';if(pose.phase==='greeting'&&lastPose!=='greeting'&&!spoke)speak();lastPose=pose.phase;if(!c)return;
  const sky=c.createLinearGradient(0,0,0,620);sky.addColorStop(0,'#3b82b4');sky.addColorStop(.65,'#a0d5e8');sky.addColorStop(1,'#f6dde3');c.fillStyle=sky;c.fillRect(0,0,960,620);
  const light=c.createRadialGradient(760,90,0,760,90,230);light.addColorStop(0,'#fff7d9bb');light.addColorStop(1,'#fff7d900');c.fillStyle=light;c.fillRect(530,0,430,320);
  for(let i=0;i<14;i++){const speed=pose.phase==='fly-away'?80:15,offset=reduced?0:time*speed;const x=((i*211-offset)%1250+1250)%1250-140,y=85+(i*127)%500;c.save();c.globalAlpha=i%2?.35:.7;for(let puff=0;puff<4;puff++){c.fillStyle='#fffaf5';c.beginPath();c.ellipse(x+puff*30,y+Math.sin(puff)*10,45,20+((i+puff)%3)*8,0,0,Math.PI*2);c.fill();}c.restore();}
  if(ready){const sw=art.naturalWidth/2,sh=art.naturalHeight/2,width=560*pose.scale,height=width*sh/sw;c.save();c.translate(pose.x,pose.y);c.rotate(reduced?0:Math.sin(time*1.6)*.015);for(let row=0;row<2;row++){c.globalAlpha=row?pose.face:1-pose.face;if(c.globalAlpha>0)c.drawImage(art,pose.wing*sw,row*sh,sw,sh,-width/2,-height/2,width,height);}c.restore();}
  if(pose.phase==='fly-away'&&!reduced){for(let i=0;i<16;i++){const x=pose.x-180-i*28,y=pose.y+30+Math.sin(i*2)*55;c.strokeStyle=['#ffe7a6aa','#f9b9e799','#a5edec88'][i%3];c.lineWidth=2;c.beginPath();c.moveTo(x,y);c.lineTo(x-40-(time-7.2)*30,y);c.stroke();}}
 }
 draw(0);queueMicrotask(()=>{if(!destroyed)skip.focus({preventScroll:true});});
 return {tick(dt){if(destroyed)return;dt=Math.max(0,dt||0);loadingTime+=dt;if(!ready){if(loadingTime>8)finish();return;}elapsed+=dt;draw(elapsed);if(elapsed>=DRAGON_INTRO_SECONDS)finish();},destroy:dispose};
}
