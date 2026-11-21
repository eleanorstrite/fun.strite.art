import {startFourSquareEnding,tickFourSquareEnding} from './four-square-ending.js';
import {isFourSquareStory,startFourSquareStory,tickFourSquareStory} from './four-square-story.js';
import {isFourSquarePopcorn,requestFourSquarePopcorn,endFourSquarePopcorn,tickFourSquarePopcorn,tickFourSquareClap,fourSquarePopcornBall} from './four-square-popcorn.js';
export const FOUR_SQUARE_ROLES=[
 {name:'King',symbol:'♛',x:-2,z:-2,color:'#315eaa'},
 {name:'Queen',symbol:'♕',x:2,z:-2,color:'#a83c64'},
 {name:'Knight',symbol:'♞',x:2,z:2,color:'#5e768e'},
 {name:'Peasant',symbol:'♟',x:-2,z:2,color:'#d2a133'}
];
export const FOUR_SQUARE_COMMANDS=['Cherry Bomb','King square','Queen square','Knight square','Peasant square','Popcorn','Story Time'];
export const fourSquareLinePoint=index=>({x:-4.95-index*.45,z:2+index*1.7});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const randomBetween=(s,a,b)=>a+s.random()*(b-a);
export function fourSquareRole(s,id=0){return s.order.indexOf(id);}
export function newFourSquare(random=Math.random){return {random,order:[0,1,2,3],queue:[4,5],kids:Array.from({length:6},(_,id)=>({id,x:id<4?FOUR_SQUARE_ROLES[id].x:fourSquareLinePoint(id-4).x,z:id<4?FOUR_SQUARE_ROLES[id].z:fourSquareLinePoint(id-4).z,jump:0,hit:0,heading:0})),phase:'serve',clock:0,remaining:180,phaseTime:0,serverDelay:1.5,aim:1,ball:null,command:null,cooldown:0,notice:'You are king! Press Space or 2–4, or tap another square to serve.',noticeTime:4,outs:0,hits:0,kingTime:0,score:0,history:[],lastOut:null,round:1};}
function notice(s,text){s.notice=text;s.noticeTime=3.5;}
export function fourSquareHome(s){s.order.forEach((id,rank)=>{const p=FOUR_SQUARE_ROLES[rank];s.kids[id].home={x:p.x,z:p.z};});s.queue.forEach((id,i)=>s.kids[id].home=fourSquareLinePoint(i));}
export function eliminateFourSquare(s,id,reason){if(!s.order.includes(id)||s.phase==='over'||s.phase==='ending')return false;endFourSquarePopcorn(s);s.story=null;const rank=fourSquareRole(s,id);s.order.splice(rank,1);s.queue.push(id);s.order.push(s.queue.shift());s.lastOut=id;s.history.push({id,reason,rank,time:s.clock});s.history=s.history.slice(-10);if(id===0)s.outs++;else s.score+=2;s.ball=null;s.command=null;s.phase='reset';s.phaseTime=0;s.round++;fourSquareHome(s);notice(s,`${id===0?'You are':kidName(id)+' is'} out! ${reason} Everyone below moves up; the next kid joins Peasant.`);return true;}
export function kidName(id){return ['You','Maya','Leo','Ava','Noah','Zoe'][id];}
function inSquare(k,rank){const p=FOUR_SQUARE_ROLES[rank];return Math.abs(k.x-p.x)<1.8&&Math.abs(k.z-p.z)<1.8;}
export function callFourSquare(s,name){if(s.phase!=='serve'||s.cooldown>0||!FOUR_SQUARE_COMMANDS.includes(name))return false;if(name==='Story Time')return startFourSquareStory(s);if(name==='Popcorn')return requestFourSquarePopcorn(s);const rank=name==='Cherry Bomb'?-1:FOUR_SQUARE_COMMANDS.indexOf(name)-1,king=s.order[0];s.command={name,king,target:rank,elapsed:0,arrived:[],react:{},started:{}};s.phase='command';s.phaseTime=0;s.cooldown=13;s.ball=null;for(const id of s.order){s.command.react[id]=id===0?Infinity:randomBetween(s,.45,1.45);if(rank>=0&&inSquare(s.kids[id],rank))s.command.arrived.push(id);}notice(s,name==='Cherry Bomb'?'Cherry Bomb! Jump OUT — press ↓ or swipe down!':`${name}! Run to the glowing square — arrows or swipes!`);return true;}
function targetRank(s,from){const choices=[0,1,2,3].filter(r=>s.order[r]!==from);return choices[Math.floor(s.random()*choices.length)];}
export function sendFourSquare(s,from,target,kind='bounce'){const rank=fourSquareRole(s,from);if(!['serve','rally'].includes(s.phase)||isFourSquareStory(s)||isFourSquarePopcorn(s)||rank<0||target===rank||!Number.isInteger(target)||target<0||target>3)return false;const p=FOUR_SQUARE_ROLES[target],k=s.kids[from],duration=kind==='scoop'?1.5:kind==='slow'?2.6:1.55;const start=s.phase==='rally'&&s.ball?.to===from?fourSquareBallPoint(s):{x:k.x,y:kind==='scoop'?.25:.95,z:k.z};s.ball={from,target,to:s.order[target],kind,elapsed:0,duration,start:{...start},end:{x:p.x+randomBetween(s,-.55,.55),z:p.z+randomBetween(s,-.5,.5)},botReaction:randomBetween(s,.12,.44),botMiss:s.random()<.16};k.hit=.4;s.phase='rally';s.phaseTime=0;s.noticeTime=0;return true;}
// Every serve and return must land in a different player's square.
export function serveFourSquare(s,target){if(s.phase!=='serve'||fourSquareRole(s)!==0||!Number.isInteger(target)||target<0||target>3||target===fourSquareRole(s))return false;s.aim=target;return sendFourSquare(s,0,target,'bounce');}
export function hitFourSquare(s,requestedTarget=s.aim){const rank=fourSquareRole(s);if(isFourSquareStory(s)||isFourSquarePopcorn(s)||rank<0||s.phase==='command'||s.phase==='reset'||s.phase==='over'||s.phase==='ending')return false;
 if(s.phase==='serve')return serveFourSquare(s,Number.isInteger(requestedTarget)&&requestedTarget>=0&&requestedTarget<4&&requestedTarget!==rank?requestedTarget:targetRank(s,0));
 const b=s.ball;if(!b||b.to!==0)return false;const bounceAt=b.duration*.6;
 if(b.kind==='scoop'){if(b.elapsed<b.duration*.5||b.elapsed>b.duration+.6){notice(s,'Wait until the lob is close, then tap to catch.');return false;}s.kids[0].hit=.5;eliminateFourSquare(s,b.from,'Their scoop was caught in the air.');return true;}
 if(b.elapsed<bounceAt){notice(s,'Let it bounce once — then hit!');return false;}
 if(b.elapsed>b.duration+.55)return false;
 const target=Number.isInteger(requestedTarget)&&requestedTarget>=0&&requestedTarget<4&&requestedTarget!==rank?requestedTarget:targetRank(s,0);if(!sendFourSquare(s,0,target,b.kind==='slow'?'scoop':s.random()<.16?'slow':'bounce'))return false;s.aim=target;s.hits++;s.score++;return true;
}
export function moveFourSquare(s,dx,dz,dt){const rank=fourSquareRole(s);if(rank<0||!['serve','rally','command'].includes(s.phase))return;const k=s.kids[0];if(s.phase==='command'&&s.command.target<0){if((dx||dz)&&!s.command.started[0]){s.command.started[0]=true;k.escape=dz>0?{x:k.x,z:FOUR_SQUARE_ROLES[rank].z<0?-5:5}:Math.abs(dx)>Math.abs(dz)?{x:k.x+Math.sign(dx)*3,z:k.z}:{x:k.x,z:k.z+Math.sign(dz)*3};k.jump=.65;}return;}
 const len=Math.hypot(dx,dz);if(!len)return;k.heading=Math.atan2(dx,dz);const amount=dt*5.5/Math.max(1,len);k.x+=dx*amount;k.z+=dz*amount;
 if(s.phase!=='command'){const p=FOUR_SQUARE_ROLES[rank];k.x=clamp(k.x,p.x-1.5,p.x+1.5);k.z=clamp(k.z,p.z-1.5,p.z+1.5);}else{k.x=clamp(k.x,-5,5);k.z=clamp(k.z,-5,5);}
}
function approach(k,p,speed,dt){const dx=p.x-k.x,dz=p.z-k.z,d=Math.hypot(dx,dz),step=Math.min(d,speed*dt);if(d>.02){k.x+=dx/d*step;k.z+=dz/d*step;k.heading=Math.atan2(dx,dz);}return d;}
export function tickFourSquare(s,dt){if(s.phase==='over')return;dt=clamp(dt,0,.08);s.clock+=dt;s.phaseTime+=dt;if(s.phase==='ending'){tickFourSquareEnding(s,dt);return;}s.remaining=Math.max(0,s.remaining-dt);s.cooldown=Math.max(0,s.cooldown-dt);s.noticeTime=Math.max(0,s.noticeTime-dt);if(fourSquareRole(s)===0)s.kingTime+=dt;s.kids.forEach(k=>{k.jump=Math.max(0,k.jump-dt);k.hit=Math.max(0,k.hit-dt);tickFourSquareClap(k,dt);if(s.phase!=='story')k.kneel=Math.max(0,(k.kneel||0)-dt*3.5);});
 if(!s.remaining){startFourSquareEnding(s);return;}
 if(isFourSquareStory(s)){tickFourSquareStory(s,dt,eliminateFourSquare);return;}
 if(isFourSquarePopcorn(s)){tickFourSquarePopcorn(s,dt,eliminateFourSquare);return;}
 if(s.phase==='reset'){fourSquareHome(s);s.kids.forEach(k=>approach(k,k.home,4,dt));if(s.phaseTime>2.8){s.phase='serve';s.phaseTime=0;s.serverDelay=randomBetween(s,1.2,2.1);s.aim=fourSquareRole(s)===1?2:1;notice(s,fourSquareRole(s)<0?'You are in line. Watch the rally — you will rejoin when a place opens.':`${kidName(s.order[0])}${s.order[0]===0?' are':' is'} king. ${s.order[0]===0?'Press Space or 2–4, or tap another square to serve.':'Get ready for the serve!'}`);}return;}
 if(s.phase==='command'){const c=s.command;c.elapsed+=dt;for(const id of s.order){const k=s.kids[id];if(c.arrived.includes(id))continue;
   if(c.target<0){if(id!==0&&c.elapsed>=c.react[id]&&!c.started[id]){c.started[id]=true;k.escape={x:k.x,z:FOUR_SQUARE_ROLES[fourSquareRole(s,id)].z<0?-5:5};k.jump=.65;}if(k.escape){approach(k,k.escape,7,dt);const home=FOUR_SQUARE_ROLES[fourSquareRole(s,id)];if(id===0?Math.abs(k.x-home.x)>2.2||Math.abs(k.z-home.z)>2.2:Math.abs(k.z)>4.3)c.arrived.push(id);}}
   else{if(id!==0&&c.elapsed>=c.react[id])approach(k,FOUR_SQUARE_ROLES[c.target],5.4,dt);if(inSquare(k,c.target))c.arrived.push(id);}
  }
  if(c.arrived.length>=3||c.elapsed>4.8){const missing=s.order.filter(id=>!c.arrived.includes(id)),loser=missing.length?missing[0]:c.arrived.at(-1);s.kids.forEach(k=>delete k.escape);eliminateFourSquare(s,loser,`Last to ${c.target<0?'jump outside':'reach '+FOUR_SQUARE_ROLES[c.target].name+' square'}.`);}return;
 }
 if(s.phase==='serve'){if(s.order[0]!==0&&s.phaseTime>s.serverDelay){if(s.cooldown===0&&s.random()<.32)callFourSquare(s,FOUR_SQUARE_COMMANDS[Math.floor(s.random()*FOUR_SQUARE_COMMANDS.length)]);else sendFourSquare(s,s.order[0],targetRank(s,s.order[0]),s.random()<.18?'slow':'bounce');}return;}
 const b=s.ball;if(!b)return;b.elapsed+=dt;const k=s.kids[b.to],bounceAt=b.duration*.6;
 if(b.to!==0){approach(k,b.end,2.4,dt);if(b.kind==='scoop'&&b.elapsed>b.duration*.7+b.botReaction&&!b.botMiss){k.hit=.5;eliminateFourSquare(s,b.from,'Their scoop was caught in the air.');return;}if(b.kind!=='scoop'&&b.elapsed>bounceAt+b.botReaction&&!b.botMiss){sendFourSquare(s,b.to,targetRank(s,b.to),b.kind==='slow'?'scoop':s.random()<.16?'slow':'bounce');return;}}
 if(b.elapsed>b.duration+.65)eliminateFourSquare(s,b.to,b.kind==='scoop'?'The lob landed without a return.':'The ball bounced out of their square.');
}
export function fourSquareBallPoint(s){const popcorn=fourSquarePopcornBall(s);if(popcorn)return popcorn;const b=s.ball;if(!b)return {x:s.kids[s.order[0]].x,y:1.13,z:s.kids[s.order[0]].z+.42};const t=b.elapsed/b.duration,travel=Math.min(1,t/.6);let y;if(b.kind==='scoop')y=b.start.y+Math.sin(Math.min(1,t)*Math.PI)*2.4;else if(t<.6)y=.12+Math.pow(1-t/.6,1.4)*Math.max(0,b.start.y-.12);else y=.12+Math.sin(Math.min(1,(t-.6)/.6)*Math.PI)*(b.kind==='slow'?.26:1.0);const spill=Math.max(0,b.elapsed-b.duration)*4.4;return {x:b.start.x+(b.end.x-b.start.x)*travel+(b.end.x>=0?spill:-spill),y:Math.max(.12,y),z:b.start.z+(b.end.z-b.start.z)*travel+(b.end.z>=0?spill:-spill)};}
