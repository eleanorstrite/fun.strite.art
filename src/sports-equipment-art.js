// One shared atlas keeps the customizer and the equipment on court identical.
export const EQUIPMENT_FINISHES={bowling:['classic','galaxy','sunset','emerald','pearl'],tennis:['classic','comet','sunrise','ocean','royal'],basketball:['classic','gold','street','neon','ruby']};
export const EQUIPMENT_ROWS={bowling:0,racket:1,basketball:2,tennis:3};
const ROW_EDGES=[0,.21,.55,.76,1];
let atlas,bounds;
export function equipmentAtlas(){
 if(!atlas&&typeof Image!=='undefined'){atlas=new Image();atlas.src=new URL('../assets/sports-equipment-atlas.png',import.meta.url).href;}
 return atlas;
}
export function drawEquipmentSprite(c,type,finish,x,y,width,height=width,rotation=0){
 const image=equipmentAtlas();if(!image?.complete||!image.naturalWidth)return false;
 if(!bounds){
  // Trim transparent padding per cell so balls stay round and racket proportions
  // remain intact even when the source sheet has rectangular cells.
  const surface=document.createElement('canvas');surface.width=image.naturalWidth;surface.height=image.naturalHeight;const context=surface.getContext('2d',{willReadFrequently:true});context.drawImage(image,0,0);const pixels=context.getImageData(0,0,surface.width,surface.height).data;bounds=[];
  for(let row=0;row<4;row++)for(let col=0;col<5;col++){const left=Math.round(col*surface.width/5),right=Math.round((col+1)*surface.width/5),top=Math.round(ROW_EDGES[row]*surface.height),bottom=Math.round(ROW_EDGES[row+1]*surface.height);let x1=right,y1=bottom,x2=left,y2=top;for(let y=top;y<bottom;y++)for(let x=left;x<right;x++)if(pixels[(y*surface.width+x)*4+3]>100){x1=Math.min(x1,x);x2=Math.max(x2,x);y1=Math.min(y1,y);y2=Math.max(y2,y);}bounds.push({x:x1,y:y1,w:Math.max(1,x2-x1+1),h:Math.max(1,y2-y1+1)});}
 }
 const sport=type==='racket'?'tennis':type,choices=EQUIPMENT_FINISHES[sport],column=Math.max(0,choices.indexOf(finish)),row=EQUIPMENT_ROWS[type];
 c.save();c.translate(x,y);c.rotate(rotation);c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';const b=bounds[row*5+column],scale=Math.min(width/b.w,height/b.h),w=b.w*scale,h=b.h*scale;c.drawImage(image,b.x,b.y,b.w,b.h,-w/2,-h/2,w,h);c.restore();return true;
}
