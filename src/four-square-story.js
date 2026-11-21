export const STORY_WORDS=['Once','a','happy','dog','found','tiny','dragon','under','sparkling','tree','and','jumped','over','moon','while','friends','laughed','together','purple','popcorn','flew','across','playground','because','rainbow','cat','wanted','cookies','then','everyone','danced','beside','castle','silly','robot','carried','banana','through','clouds','today'];
export const isFourSquareStory=s=>s.phase==='story';
export function fourSquareHuddlePoint(index){return [{x:-.88,z:-.88},{x:.88,z:-.88},{x:.88,z:.88},{x:-.88,z:.88}][index];}
export function cleanFourSquareStoryWord(value){if(typeof value!=='string')return null;const word=value.trim();return word&&Array.from(word).length<=24&&!/\s|[\u0000-\u001f\u007f]/u.test(word)?word:null;}
function beginTurn(s){const story=s.story;story.actor=story.participants[story.index];story.stage=story.actor===0?'waiting':'thinking';story.elapsed=0;story.turnSerial++;story.speech=null;story.error='';story.thinkFor=.85+s.random()*.55;}
export function startFourSquareStory(s){if(s.phase!=='serve'||s.cooldown>0)return false;s.phase='story';s.ball=null;s.command={name:'Story Time',king:s.order[0]};s.cooldown=13;s.story={king:s.order[0],participants:[...s.order],index:0,actor:s.order[0],stage:'huddle',elapsed:0,totalElapsed:0,words:[],totalWords:0,wordSerial:0,turnSerial:0,speech:null,error:''};s.notice='Story Time! Everyone comes into the middle.';s.noticeTime=3;return true;}
function publishWord(s,word){const story=s.story;story.wordSerial++;story.totalWords++;story.speech={actor:story.actor,text:word,serial:story.wordSerial,pending:false};story.words.push({actor:story.actor,word,serial:story.wordSerial});if(story.words.length>100)story.words.shift();story.stage='speaking';story.elapsed=0;story.error='';story.minimumSpeech=Math.max(1.6,Math.min(4,.9+Array.from(word).length*.14));}
export function submitFourSquareStoryWord(s,value){if(!isFourSquareStory(s)||s.story.stage!=='waiting'||s.story.actor!==0)return false;const word=cleanFourSquareStoryWord(value);if(!word){s.story.error='Type one word or made-up letters, up to 24 characters, without spaces.';return false;}publishWord(s,word);return true;}
export function finishFourSquareStory(s){if(!isFourSquareStory(s))return false;s.story=null;s.command=null;s.ball=null;s.phase='reset';s.phaseTime=0;s.notice='That was a great story! Back to Four Square.';s.noticeTime=3.5;return true;}
export function requestFourSquareStoryUp(s,caller=0){
 if(!isFourSquareStory(s)||s.story.king!==caller||['huddle','up'].includes(s.story.stage))return false;
 const story=s.story;story.stage='up';story.elapsed=0;story.speech=null;story.error='';story.up={elapsed:0,reaction:{},finished:[]};
 story.participants.forEach((id,index)=>{story.up.reaction[id]=id===story.king?0:id===0?Infinity:.3+s.random()*.85+index*.015;});return true;
}
export function standFourSquareStory(s,id=0){
 if(!isFourSquareStory(s)||s.story.stage!=='up'||!s.story.participants.includes(id))return false;
 if(s.story.up.reaction[id]!==Infinity)return false;s.story.up.reaction[id]=s.story.up.elapsed;return true;
}
function tickUp(s,dt,onOut){
 const story=s.story,up=story.up;up.elapsed+=dt;
 for(const id of story.participants){if(up.reaction[id]===Infinity&&up.elapsed>=2.6)up.reaction[id]=2.6;const since=up.elapsed-up.reaction[id];s.kids[id].kneel=1-Math.max(0,Math.min(1,since/.45));if(since>=.45&&!up.finished.includes(id))up.finished.push(id);}
 if(up.finished.length===story.participants.length){const losers=story.participants.filter(id=>id!==story.king).sort((a,b)=>up.reaction[b]-up.reaction[a]);onOut(s,losers[0],'Last to stand up for Story Time.');}
}
export function tickFourSquareStory(s,dt,onOut){if(!isFourSquareStory(s))return;const story=s.story;story.elapsed+=dt;story.totalElapsed+=dt;
 if(story.stage==='up'){tickUp(s,dt,onOut);return;}
 if(story.stage==='huddle'){let ready=true;story.participants.forEach((id,index)=>{const k=s.kids[id],p=fourSquareHuddlePoint(index),dx=p.x-k.x,dz=p.z-k.z,d=Math.hypot(dx,dz),step=Math.min(d,dt*3.1);if(d>.01){k.x+=dx/d*step;k.z+=dz/d*step;k.heading=Math.atan2(dx,dz);}const kneel=d<.08?1:0;k.kneel=Math.max(0,Math.min(kneel,(k.kneel||0)+dt*3.5));if(d>.08||k.kneel<.99)ready=false;else k.heading=Math.atan2(-k.x,-k.z);});if(ready&&story.elapsed>1)beginTurn(s);return;}
 if(story.king!==0&&(story.totalWords>=4&&story.stage!=='speaking'||story.totalElapsed>=22)){requestFourSquareStoryUp(s,story.king);return;}
 if(story.stage==='thinking'&&story.elapsed>=story.thinkFor){publishWord(s,STORY_WORDS[Math.min(STORY_WORDS.length-1,Math.floor(s.random()*STORY_WORDS.length))]);return;}
 if(story.stage==='speaking'&&story.elapsed>=story.minimumSpeech&&(!story.speech.pending||story.elapsed>10)){story.index=(story.index+1)%story.participants.length;beginTurn(s);}
}
