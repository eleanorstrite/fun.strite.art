export const HEDGEHOG_BREEDS=['Salt and pepper','Black','Cream','Rainbow','Pink skirt','Tuxedo'];
export const HEDGEHOG_UNLOCKS={'Rainbow':'jump-rainbow-hedgehog','Pink skirt':'jump-skirt-hedgehog','Tuxedo':'jump-tuxedo-hedgehog'};
export const HEDGEHOG_SHOP_ITEMS=Object.entries(HEDGEHOG_UNLOCKS).map(([breed,id])=>({id,name:breed+' hedgehog',group:'appearance',category:'PLATFORM JUMP PETS',icon:'🐾',cost:50,hedgehog:breed,description:'Permanently unlock this lifelike hedgehog look. Choose Hedgehog in the Platform Jump pet editor after buying.'}));
export function hedgehogUnlocked(breed,owned=[]){return !Object.hasOwn(HEDGEHOG_UNLOCKS,breed)||owned.includes(HEDGEHOG_UNLOCKS[breed]);}
let atlas,bounds;
export function hedgehogAtlas(){if(!atlas&&typeof Image!=='undefined'){atlas=new Image();atlas.src=new URL('../assets/platform-hedgehogs.png',import.meta.url).href;}return atlas;}
export function hedgehogSprite(breed){const image=hedgehogAtlas(),index=HEDGEHOG_BREEDS.indexOf(breed);if(index<0||!image?.complete||!image.naturalWidth)return null;
 if(!bounds){
  const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;const c=canvas.getContext('2d',{willReadFrequently:true});c.drawImage(image,0,0);const pixels=c.getImageData(0,0,canvas.width,canvas.height),w=canvas.width,h=canvas.height,labels=new Int32Array(w*h),queue=new Int32Array(w*h),parts=[];let label=0;
  // Separate silhouettes before cropping: tails and noses can cross a grid boundary.
  for(let start=0;start<w*h;start++){if(labels[start]||pixels.data[start*4+3]<10)continue;label++;let head=0,tail=1,x1=w,y1=h,x2=0,y2=0;queue[0]=start;labels[start]=label;
   while(head<tail){const p=queue[head++],x=p%w,y=Math.floor(p/w);x1=Math.min(x1,x);x2=Math.max(x2,x);y1=Math.min(y1,y);y2=Math.max(y2,y);for(const n of [x>0?p-1:-1,x<w-1?p+1:-1,y>0?p-w:-1,y<h-1?p+w:-1])if(n>=0&&!labels[n]&&pixels.data[n*4+3]>=10){labels[n]=label;queue[tail++]=n;}}
   if(tail>500)parts.push({label,count:tail,x:x1,y:y1,w:x2-x1+1,h:y2-y1+1});
  }
  const ordered=parts.sort((a,b)=>b.count-a.count).slice(0,6).sort((a,b)=>Math.floor((a.y+a.h/2)/(h/3))-Math.floor((b.y+b.h/2)/(h/3))||a.x-b.x);
  bounds=ordered.map(b=>{const cut=document.createElement('canvas');cut.width=b.w;cut.height=b.h;const ctx=cut.getContext('2d'),data=ctx.createImageData(b.w,b.h);for(let y=0;y<b.h;y++)for(let x=0;x<b.w;x++){const source=(b.y+y)*w+b.x+x;if(labels[source]===b.label)data.data.set(pixels.data.subarray(source*4,source*4+4),(y*b.w+x)*4);}ctx.putImageData(data,0,0);return {image:cut,bounds:{x:0,y:0,w:b.w,h:b.h}};});
 }
 return bounds[index]||null;
}
