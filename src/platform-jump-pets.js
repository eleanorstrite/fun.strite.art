import {hedgehogSprite} from './platform-hedgehogs.js';
import {ferretSprite} from './platform-ferrets.js';
import {dogMotionSprite} from './platform-dog-motion.js';
import {PET_BREEDS} from './platform-jump-rules.js';
export const PET_ROWS=['cat','dog','capybara','dragon','guinea pig','rabbit'];
export function petSpriteCell(pet,breed){const row=PET_ROWS.indexOf(pet),column=PET_BREEDS[pet]?.indexOf(breed);return row>=0&&column>=0?{row,column}:null;}
const ROW_EDGES=[0,222/1254,435/1254,635/1254,850/1254,1020/1254,1];
let atlas,bounds;
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
export function drawRealJumpPet(c,x,y,settings,time,moving,facing=1,pose='idle'){
 const ferret=settings.pet==='ferret'?ferretSprite(settings.breed):settings.pet==='hedgehog'?hedgehogSprite(settings.breed):null;const image=ferret?.image||jumpPetAtlas(),cell=ferret?{row:0,column:0}:petSpriteCell(settings.pet,settings.breed);if(!cell||(!ferret&&(!image?.complete||!image.naturalWidth)))return false;if(!ferret&&!bounds)bounds=spriteBounds(image);const motion=settings.pet==='dog'&&(moving||pose!=='idle')?dogMotionSprite(settings.breed,pose==='idle'&&moving?'walk':pose,time):null,b=ferret?.bounds||motion?.bounds||bounds[cell.row*4+cell.column],maxW=['hedgehog','guinea pig'].includes(settings.pet)?70:settings.pet==='dragon'?105:90,maxH=['hedgehog','guinea pig'].includes(settings.pet)?49:75,scale=Math.min(maxW/(motion?.maxW||b.w),maxH/(motion?.maxH||b.h)),w=b.w*scale,h=b.h*scale,bob=0;
 c.save();c.translate(x,y-bob);c.scale(facing<0?-1:1,1+Math.sin(time*3)*.007);c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(motion?.image||image,b.x,b.y,b.w,b.h,-w/2,-h,w,h);c.restore();
 if(settings.petName){c.save();c.font='700 14px system-ui';c.textAlign='center';const width=c.measureText(settings.petName).width;c.fillStyle='#ffffffe6';c.beginPath();c.roundRect(x-width/2-7,y-h-bob-29,width+14,23,8);c.fill();c.fillStyle='#000';c.fillText(settings.petName,x,y-h-bob-12);c.restore();}return true;
}
