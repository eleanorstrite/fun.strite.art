import {DEFAULT_LOOK,sanitizeKeeperLook} from './dragon-nursery-training.js';
export const NURSERY_KEY='sidequest-dragon-nursery-v1';
export const EGGS=[{id:'ember',name:'Ember',color:'#dc8459',element:'Fire'},{id:'river',name:'River',color:'#65adca',element:'Water'},{id:'fern',name:'Fern',color:'#80a67c',element:'Forest'}];
export function newNursery(){return {version:1,day:1,heading:Math.PI,appearance:{...DEFAULT_LOOK},routeActive:false,riding:null,egg:null,warmth:0,hatched:false,bond:0,flight:0,magic:0,care:[],inside:false,energy:100,sleep:0,player:{x:0,z:7},message:'Welcome home. Choose an egg from the nursery nests.'};}
export function nurseryStage(s){return !s.hatched?'Egg':s.flight>=3&&s.magic>=3?'Ready for dragon school':s.bond>=6?'Young dragon':'Baby dragon';}
export function nurseryAction(s,action){
 if(s.sleep>0||s.riding)return false;
 if(action.startsWith('egg:')){const id=action.slice(4);if(s.egg||!EGGS.some(e=>e.id===id))return false;s.egg=id;s.message='Your '+EGGS.find(e=>e.id===id).name+' egg is home! Warm, turn and sing to it.';return true;}
 if(action==='house'){s.inside=true;s.player={x:0,z:2};s.heading=Math.PI;s.message='Home sweet home. Click the bed to sleep, or the door to go outside.';return true;}
 if(action==='exit'){s.inside=false;s.player={x:0,z:-1};s.heading=0;s.message='A new adventure awaits in the garden.';return true;}
 if(action==='sleep'){if(!s.inside){s.message='Enter your house and click the bed to sleep.';return false;}s.sleep=3;s.message='Sleeping peacefully…';return true;}
 if(!s.egg){s.message='Choose your dragon egg first.';return false;}
 const valid=s.hatched?['feed','wash','pet','fly','magic']:['warm','turn','sing'];
 if(!valid.includes(action))return false;
 if(s.care.includes(action)){s.message='Already done today. Try another activity, or sleep in your house.';return false;}
 if((action==='fly'||action==='magic')&&s.bond<3){s.message='Build trust with feeding, washing and petting before training.';return false;}
 if(s.energy<10){s.message='You need rest. Go inside and click your bed.';return false;}
 s.care.push(action);s.energy-=10;
 if(!s.hatched){s.warmth++;s.message=({warm:'You tuck a warm blanket around the egg.',turn:'You gently turn the egg in its nest.',sing:'Your song makes the shell wobble!'})[action];if(s.warmth>=3){s.hatched=true;s.care=[];s.message='Crack… your baby dragon has hatched! Feed, wash and pet your new friend.';}}
 else {s.bond++;if(action==='fly')s.flight=Math.min(3,s.flight+1);if(action==='magic')s.magic=Math.min(3,s.magic+1);s.message=({feed:'Crunch! Your dragon enjoys fresh berries.',wash:'Sparkling clean! Your dragon splashes in the bath.',pet:'Your dragon leans into your hand with a happy purr.',fly:'Wings up! Another flying lesson complete.',magic:'A swirl of elemental magic! Another lesson complete.'})[action];if(s.flight>=3&&s.magic>=3)s.message='Your dragon is ready for dragon school! Keep caring for your friend and exploring together.';}
 return true;
}
export function tickNursery(s,dt){if(s.sleep>0){s.sleep=Math.max(0,s.sleep-dt);if(!s.sleep){s.day++;s.care=[];s.energy=100;s.routeActive=false;s.message='Good morning! Day '+s.day+'. Your morning tasks are ready: breakfast, a bath and training beyond the forest.';}}}
export function saveNursery(s,storage){try{storage?.setItem(NURSERY_KEY,JSON.stringify(s));return !!storage;}catch{return false;}}
export function loadNursery(storage){try{const s=JSON.parse(storage?.getItem(NURSERY_KEY));if(!s||s.version!==1||!Number.isInteger(s.day)||s.day<1||!(s.egg===null||EGGS.some(e=>e.id===s.egg))||!Array.isArray(s.care)||!s.care.every(x=>['warm','turn','sing','feed','wash','pet','fly','magic','training'].includes(x))||![s.warmth,s.bond,s.flight,s.magic,s.energy].every(x=>Number.isFinite(x)&&x>=0)||typeof s.hatched!=='boolean')return null;return {...newNursery(),...s,appearance:sanitizeKeeperLook(s.appearance),heading:Math.PI,routeActive:false,riding:null,sleep:0,inside:false,player:{x:0,z:7}};}catch{return null;}}
