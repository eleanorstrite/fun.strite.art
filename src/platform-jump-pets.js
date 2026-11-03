import {costumePetCell,costumePetSprite} from './platform-costume-pets.js';
import {referencePetCell,referencePetSprite} from './platform-reference-pets.js';
import {FERRET_BREEDS,ferretSprite} from './platform-ferrets.js';
import {HEDGEHOG_BREEDS,hedgehogSprite} from './platform-hedgehogs.js';
import {petMotionSprite} from './platform-pet-motion.js';
import {dogMotionSprite} from './platform-dog-motion.js';
import {PET_BREEDS} from './platform-jump-rules.js';
export const PET_ROWS=['cat','dog','capybara','dragon','guinea pig','rabbit'];
export function petSpriteCell(pet,breed){const row=PET_ROWS.indexOf(pet),column=row>=0?PET_BREEDS[pet].indexOf(breed):-1;return row>=0&&column>=0&&column<4?{row,column}:null;}
export function petArtworkCell(pet,breed){
 const costume=costumePetCell(pet,breed);if(costume)return costume;
 const reference=referencePetCell(pet,breed);if(reference)return reference;
 const standard=petSpriteCell(pet,breed);if(standard)return {...standard,file:'platform-jump-pets.png',columns:4,rows:6};
 const breeds=pet==='ferret'?FERRET_BREEDS:pet==='hedgehog'?HEDGEHOG_BREEDS:[],index=breeds.indexOf(breed);
 return index>=0?{file:pet==='ferret'?'platform-ferrets.png':'platform-hedgehogs.png',row:Math.floor(index/2),column:index%2,columns:2,rows:pet==='ferret'?4:3}:null;
}
const ROW_EDGES=[0,222/1254,435/1254,635/1254,850/1254,1020/1254,1];
let atlas,bounds;
const poseTransitions=new WeakMap();
export function jumpPetAtlas(){if(!atlas&&typeof Image!=='undefined'){atlas=new Image();atlas.src=new URL('../assets/platform-jump-pets.png',import.meta.url).href;}return atlas;}
function spriteBounds(image){
 const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);const data=ctx.getImageData(0,0,canvas.width,canvas.height).data,result=[];
 const seen=new Uint8Array(canvas.width*canvas.height);
 for(let row=0;row<6;row++)for(let col=0;col<4;col++){
  const edges=(row===2||row===5)?[0,.26,.51,.76,1]:[0,.25,.5,.75,1],left=Math.round(edges[col]*canvas.width),right=Math.round(edges[col+1]*canvas.width),top=Math.round(ROW_EDGES[row]*canvas.height),bottom=Math.round(ROW_EDGES[row+1]*canvas.height),queue=new Int32Array((right-left)*(bottom-top));let best={count:0,x:left,y:top,w:1,h:1};
  // Ignore isolated flecks from adjacent cells; use the animal's main silhouette.
  for(let y=top;y<bottom;y++)for(let x=left;x<right;x++){const index=y*canvas.width+x;if(seen[index]||data[index*4+3]<=100)continue;let head=0,tail=1,x1=x,x2=x,y1=y,y2=y;queue[0]=index;seen[index]=1;
   while(head<tail){const current=queue[head++],cx=current%canvas.width,cy=Math.floor(current/canvas.width);x1=Math.min(x1,cx);x2=Math.max(x2,cx);y1=Math.min(y1,cy);y2=Math.max(y2,cy);for(const next of [current-1,current+1,current-canvas.width,current+canvas.width]){const nx=next%canvas.width,ny=Math.floor(next/canvas.width);if(nx<left||nx>=right||ny<top||ny>=bottom||seen[next]||data[next*4+3]<=100)continue;seen[next]=1;queue[tail++]=next;}}
   if(tail>best.count)best={count:tail,x:x1,y:y1,w:x2-x1+1,h:y2-y1+1};
  }result.push(best);
 }return result;
}
export function petPreviewSprite(pet,breed){
 if(costumePetCell(pet,breed))return costumePetSprite(pet,breed);
 const reference=referencePetSprite(pet,breed);if(reference)return reference;
 if(referencePetCell(pet,breed))return null;
 const special=pet==='ferret'?ferretSprite(breed):pet==='hedgehog'?hedgehogSprite(breed):null;if(special)return special;
 const image=jumpPetAtlas(),cell=petSpriteCell(pet,breed);if(!cell||!image?.complete||!image.naturalWidth)return null;
 if(!bounds)bounds=spriteBounds(image);return {image,bounds:bounds[cell.row*4+cell.column]};
}
export function drawRealJumpPet(c,x,y,settings,time,moving,facing=1,pose='idle'){
 const reference=costumePetSprite(settings.pet,settings.breed,pose,time,moving)||referencePetSprite(settings.pet,settings.breed,pose,time,moving);const ferret=settings.pet==='ferret'?ferretSprite(settings.breed):settings.pet==='hedgehog'?hedgehogSprite(settings.breed):null;const image=reference?.image||ferret?.image||jumpPetAtlas(),cell=reference||ferret?{row:0,column:0}:petSpriteCell(settings.pet,settings.breed);if(!cell||(!reference&&!ferret&&(!image?.complete||!image.naturalWidth)))return false;if(!reference&&!ferret&&!bounds)bounds=spriteBounds(image);const motion=reference||(settings.pet==='dog'&&(moving||pose!=='idle')?dogMotionSprite(settings.breed,pose==='idle'&&moving?'walk':pose,time):petMotionSprite(settings.pet,settings.breed,pose==='idle'&&moving?'walk':pose,time)),b=motion?.bounds||ferret?.bounds||bounds[cell.row*4+cell.column],maxW=reference?.displayW||(['hedgehog','guinea pig'].includes(settings.pet)?70:settings.pet==='dragon'?105:90),maxH=reference?.displayH||(['hedgehog','guinea pig'].includes(settings.pet)?49:75),scale=Math.min(maxW/(motion?.maxW||b.w),maxH/(motion?.maxH||b.h)),w=b.w*scale,h=b.h*scale,bob=settings.pet==='bird'&&(moving||pose==='jump'||pose==='walk')?12+Math.sin(time*5)*3:0;
 c.save();c.translate(x,y-bob);c.scale(facing<0?-1:1,1+Math.sin(time*3)*.007);c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';if(motion&&settings.pet!=='dog'){
  const key=settings.pet+':'+settings.breed;let blend=poseTransitions.get(c);
  if(!blend||blend.key!==key||time<blend.time)blend={key,current:motion,previous:null,time};
  else if(blend.current.image!==motion.image)blend={key,current:motion,previous:blend.current,time};
  poseTransitions.set(c,blend);const alpha=Math.min(1,Math.max(0,(time-blend.time)/.065));
  if(blend.previous&&alpha<1){const old=blend.previous.bounds;c.globalAlpha=1-alpha;c.drawImage(blend.previous.image,old.x,old.y,old.w,old.h,-old.w*scale/2,-old.h*scale,old.w*scale,old.h*scale);c.globalAlpha=alpha;}
  c.drawImage(motion.image,b.x,b.y,b.w,b.h,-w/2,-h,w,h);
 }else c.drawImage(motion?.image||image,b.x,b.y,b.w,b.h,-w/2,-h,w,h);c.restore();
 if(settings.petName){c.save();c.font='700 14px system-ui';c.textAlign='center';const width=c.measureText(settings.petName).width;c.fillStyle='#ffffffe6';c.beginPath();c.roundRect(x-width/2-7,y-h-bob-29,width+14,23,8);c.fill();c.fillStyle='#000';c.fillText(settings.petName,x,y-h-bob-12);c.restore();}return true;
}
