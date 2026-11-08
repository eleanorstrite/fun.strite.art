const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const near=(a,b,r=75)=>Math.hypot(a.x-b.x,a.z-b.z)<r;
function message(s,text){s.message=text;s.messageTime=5;return false;}
function complete(s){const task=s.activity.task;s.care[task]=true;s.activity=null;s.walking=false;s.bond=(s.bond||0)+1;s.action=task;s.actionTime=2;message(s,{warm:'The sunstones keep your egg warm. A heartbeat answers!',feed:'Your dragon catches the fresh fruit and crunches happily!',walk:'Trail complete! Your dragon discovered every marker with you.',turn:'Perfect! Every side of the egg is gently warmed.',love:'Your dragon recognizes your song and nuzzles your hand.'}[task]);return true;}
export function startDragonActivity(s,task,stage){
 const kind=task==='warm'||task==='feed'?'gather':task==='walk'?'trail':task==='turn'?'turn':stage==='egg'?'rhythm':'pet';
 const offsets=kind==='trail'?[[190,-90],[370,35],[210,150],[-30,60]]:[[210,-100],[390,85],[-150,140]],shift=(s.day%3-1)*35;
 s.activity={task,kind,progress:0,total:kind==='rhythm'||kind==='trail'?4:3,angle:0,preview:kind==='rhythm'?2.8:0,notes:[s.day%3+1,(s.day+1)%3+1,(s.day+2)%3+1,s.day%3+1],points:offsets.map(([x,z])=>({x:clamp(s.dragon.x+x+shift,80,3050),z:clamp(s.dragon.z+z-shift,325,800)}))};s.walking=kind==='trail';s.walkDistance=0;
 message(s,dragonActivityHint(s));return true;
}
export function dragonTurnTarget(s){return ((s.day*37+(s.activity?.progress||0)*120+45)%360);}
export function dragonPetTarget(s){return ((s.day+(s.activity?.progress||0)*2)%3)+1;}
export function dragonActivityHint(s){const a=s.activity;if(!a)return '';
 if(a.kind==='gather')return a.progress<a.total?(a.task==='warm'?'Gather three glowing sunstones.':'Find three fresh fruit bushes.')+' Walk to a marker and press Space or tap Collect.':a.task==='warm'?'Bring the sunstones back to the egg. Press Space to warm the nest.':'Return to your dragon. Press Space to offer the fruit.';
 if(a.kind==='trail')return 'Lead your dragon through the glowing trail markers · '+a.progress+'/'+a.total+'.';
 if(a.kind==='turn')return 'Rotate gently with ← / → or the slider. Match the golden mark, then press Space · '+a.progress+'/3.';
 if(a.kind==='rhythm')return a.preview>0?'Listen to the four-note song, then repeat it with 1, 2, 3.':'Repeat the song: tap the notes or use 1, 2, 3 · '+a.progress+'/4.';
 return 'Stroke the glowing spot: '+['','chin','shoulder','forehead'][dragonPetTarget(s)]+' · tap it or press '+dragonPetTarget(s)+' · '+a.progress+'/3.';
}
export function collectDragonActivity(s){const a=s.activity;if(!a)return false;
 if(a.kind!=='gather')return dragonActivityInput(s,'confirm');
 if(a.progress<a.total){if(!near(s.player,a.points[a.progress]))return message(s,'Walk closer to the glowing '+(a.task==='warm'?'sunstone':'fruit bush')+'.');a.progress++;s.action='collect';s.actionTime=.7;message(s,dragonActivityHint(s));return true;}
 if(!near(s.player,s.dragon,150))return message(s,'Bring your finds back to your dragon first.');return complete(s);
}
export function dragonActivityInput(s,value){const a=s.activity;if(!a||!near(s.player,s.dragon,170))return false;
 if(a.kind==='turn'){
  if(value==='left'||value==='right'){a.angle=(a.angle+(value==='left'?-15:15)+360)%360;return true;}
  if(typeof value==='object'&&Number.isFinite(value.angle)){a.angle=clamp(value.angle,0,360);return true;}
  if(value!=='confirm')return false;const error=Math.abs(((a.angle-dragonTurnTarget(s)+540)%360)-180);if(error>18)return message(s,'Gently line up the golden marks before turning.');a.progress++;s.action='turn';s.actionTime=.7;
 }else if(a.kind==='rhythm'){
  if(a.preview>0||![1,2,3].includes(value))return false;
  if(value!==a.notes[a.progress]){a.progress=0;a.preview=2.8;return message(s,'Almost! Listen once more and try the melody again.');}a.progress++;
 }else if(a.kind==='pet'){
  if(value!==dragonPetTarget(s))return false;a.progress++;s.action='love';s.actionTime=.8;
 }else return false;
 if(a.progress>=a.total)return complete(s);message(s,dragonActivityHint(s));return true;
}
export function tickDragonActivity(s,dt,moved=0){const a=s.activity;if(!a)return;a.preview=Math.max(0,a.preview-dt);
 if(a.kind==='trail'&&moved>0){s.walkDistance+=moved;if(near(s.player,a.points[a.progress],60)&&near(s.player,s.dragon,210)){a.progress++;s.action='discover';s.actionTime=1;if(a.progress>=a.total)complete(s);else message(s,dragonActivityHint(s));}}
}
export function restoreDragonActivity(s,raw,stage){if(!raw||!['warm','feed','turn','love','walk'].includes(raw.task)||s.care[raw.task]||!(stage==='egg'?['warm','turn','love']:['feed','walk','love']).includes(raw.task))return;
 startDragonActivity(s,raw.task,stage);const a=s.activity;if(raw.kind!==a.kind){s.activity=null;s.walking=false;return;}a.progress=clamp(Math.floor(Number(raw.progress)||0),0,a.kind==='gather'?a.total:a.total-1);a.angle=clamp(Number(raw.angle)||0,0,360);if(Array.isArray(raw.points)&&raw.points.length===a.points.length&&raw.points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.z)))a.points=raw.points.map(p=>({x:clamp(p.x,80,3050),z:clamp(p.z,325,800)}));
}
