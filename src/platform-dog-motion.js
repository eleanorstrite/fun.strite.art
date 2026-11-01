export const DOG_MOTION_BREEDS=['Brindle','Dachshund','Black Labrador','Golden Retriever'];
export function dogPoseFrame(pose,time=0){return pose==='walk'?Math.floor(time*9)%4:({idle:4,crouch:5,jump:6,land:7}[pose]??4);}
const ROW_EDGES=[0,217/1448,427/1448,596/1448,805/1448,980/1448,1173/1448,1322/1448,1];
let image,frames;
export function dogMotionAtlas(){if(!image&&typeof Image!=='undefined'){image=new Image();image.src=new URL('../assets/platform-dog-motion.png',import.meta.url).href;}return image;}
export function dogMotionSprite(breed,pose,time){const sheet=dogMotionAtlas(),breedIndex=DOG_MOTION_BREEDS.indexOf(breed);if(breedIndex<0||!sheet?.complete||!sheet.naturalWidth)return null;
 if(!frames){const canvas=document.createElement('canvas');canvas.width=sheet.naturalWidth;canvas.height=sheet.naturalHeight;const c=canvas.getContext('2d',{willReadFrequently:true});c.drawImage(sheet,0,0);const pixels=c.getImageData(0,0,canvas.width,canvas.height).data;frames=[];
  for(let row=0;row<8;row++)for(let col=0;col<4;col++){const left=Math.round(col*canvas.width/4),right=Math.round((col+1)*canvas.width/4),top=Math.round(ROW_EDGES[row]*canvas.height),bottom=Math.round(ROW_EDGES[row+1]*canvas.height);let x1=right,y1=bottom,x2=left,y2=top;for(let y=top;y<bottom;y++)for(let x=left;x<right;x++)if(pixels[(y*canvas.width+x)*4+3]>110){x1=Math.min(x1,x);x2=Math.max(x2,x);y1=Math.min(y1,y);y2=Math.max(y2,y);}frames.push({x:x1,y:y1,w:Math.max(1,x2-x1+1),h:Math.max(1,y2-y1+1)});}
 }
 const poses=frames.slice(breedIndex*8,breedIndex*8+8);return {image:sheet,bounds:poses[dogPoseFrame(pose,time)],maxW:Math.max(...poses.map(f=>f.w)),maxH:Math.max(...poses.map(f=>f.h))};
}
