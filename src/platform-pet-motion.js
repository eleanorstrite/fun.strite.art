export const PET_MOTION={cat:{file:'cat',breeds:['Tabby','Calico','Black cat','White cat'],rate:7},capybara:{file:'capybara',breeds:['Classic','Chocolate','Cream'],rate:5},dragon:{file:'dragon',breeds:['Emerald','Fire','Frost','Rainbow'],rate:6},'guinea pig':{file:'guinea-pig',breeds:['Tricolor','White','Black and white','Chocolate'],rate:10},rabbit:{file:'rabbit',breeds:['Tan lop','White','Black'],rate:6},ferret:{file:'ferret',breeds:['Sable','Black','Albino','Chocolate','Rainbow','Pink tutu and bow','Tuxedo'],rate:9},hedgehog:{file:'hedgehog',breeds:['Salt and pepper','Black','Cream','Rainbow','Pink skirt','Tuxedo'],rate:9}};
export function petMotionFrame(kind,pose,time=0){if(pose==='walk')return Math.floor(Math.max(0,time)*(PET_MOTION[kind]?.rate||7))%4===0?0:Math.floor(Math.max(0,time)*(PET_MOTION[kind]?.rate||7))%4===2?1:2;return ({idle:2,stand:2,sit:3,crouch:4,jump:5,land:4}[pose]??2);}
const sheets=new Map(),frames=new Map();
export function petMotionAtlas(kind){if(!PET_MOTION[kind]||typeof Image==='undefined')return null;if(!sheets.has(kind)){const image=new Image();image.src=new URL('../assets/platform-motion-'+PET_MOTION[kind].file+'.png',import.meta.url).href;sheets.set(kind,image);}return sheets.get(kind);}
export function petMotionSprite(kind,breed,pose,time=0){const spec=PET_MOTION[kind],col=spec?.breeds.indexOf(breed),image=petMotionAtlas(kind);if(col==null||col<0||!image?.complete||!image.naturalWidth)return null;
 if(!frames.has(kind)){
  const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;const c=canvas.getContext('2d',{willReadFrequently:true});c.drawImage(image,0,0);const pixels=c.getImageData(0,0,canvas.width,canvas.height),w=canvas.width,h=canvas.height,labels=new Int32Array(w*h),queue=new Int32Array(w*h),parts=[];let label=0;
  for(let start=0;start<w*h;start++){if(labels[start]||pixels.data[start*4+3]<20)continue;label++;let head=0,tail=1,x1=w,y1=h,x2=0,y2=0;queue[0]=start;labels[start]=label;
   while(head<tail){const p=queue[head++],x=p%w,y=Math.floor(p/w);x1=Math.min(x1,x);x2=Math.max(x2,x);y1=Math.min(y1,y);y2=Math.max(y2,y);for(const n of [x>0?p-1:-1,x<w-1?p+1:-1,y>0?p-w:-1,y<h-1?p+w:-1])if(n>=0&&!(kind==='hedgehog'&&Math.floor(x/w*6)!==Math.floor((n%w)/w*6))&&!(kind==='hedgehog'&&((y<h*1040/1283)!==(Math.floor(n/w)<h*1040/1283)))&&!labels[n]&&pixels.data[n*4+3]>=20){labels[n]=label;queue[tail++]=n;}}
   if(tail>150)parts.push({label,count:tail,x:x1,y:y1,w:x2-x1+1,h:y2-y1+1});
  }
  // Find the main silhouette in each cell, discarding isolated edge flecks.
  const result=[];for(let row=0;row<6;row++)for(let column=0;column<spec.breeds.length;column++){
   const b=parts.filter(p=>Math.floor((p.x+p.w/2)/w*spec.breeds.length)===column&&Math.floor((p.y+p.h/2)/h*6)===row).sort((a,b)=>b.count-a.count)[0];if(!b){result.push(null);continue;}
   const cut=document.createElement('canvas');cut.width=b.w;cut.height=b.h;const ctx=cut.getContext('2d'),data=ctx.createImageData(b.w,b.h);for(let y=0;y<b.h;y++)for(let x=0;x<b.w;x++){const source=(b.y+y)*w+b.x+x;if(labels[source]===b.label)data.data.set(pixels.data.subarray(source*4,source*4+4),(y*b.w+x)*4);}ctx.putImageData(data,0,0);result.push({image:cut,bounds:{x:0,y:0,w:b.w,h:b.h}});
  }
  frames.set(kind,result);
 }
 const all=frames.get(kind),poses=all.filter((_,i)=>i%spec.breeds.length===col).filter(Boolean),sprite=all[petMotionFrame(kind,pose,time)*spec.breeds.length+col];if(!sprite||!poses.length)return null;
 return {...sprite,maxW:Math.max(...poses.map(p=>p.bounds.w)),maxH:Math.max(...poses.map(p=>p.bounds.h))};
}
