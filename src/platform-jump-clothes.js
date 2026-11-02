export const JUMP_OUTFITS=[
 'Classic colors','Charcoal bomber & skirt','Lilac harness dress','Strappy top & shorts',
 'Fur-collar parka','Lace collar & skirt','Lilac bell sleeves','Corset & lace-up shorts',
 'Lilac shirt & shorts','Oversized black coat',
 'Peach tie-waist dress','Sunset sleeves & olive shorts','Daisy denim overalls',
 'Cocoa heart overalls','Sage jacket & pleated skirt','Duck bag & denim shorts',
 'Orange monarch butterfly dress','Stained-glass butterfly dress','Green monarch butterfly dress','Butterfly blouse & brown skirt'
];
export const CLOTHING_SHOP_ITEMS=JUMP_OUTFITS.slice(16).map((outfit,index)=>({
 id:['jump-outfit-monarch','jump-outfit-stained-glass','jump-outfit-green-monarch','jump-outfit-butterfly-blouse'][index],
 name:outfit,outfit,group:'appearance',category:'PLATFORM JUMP · BUTTERFLY CLOTHING',icon:'🦋',cost:50,
 description:[
  'A black corset bodice and orange monarch wing skirt with scalloped, spotted edges.',
  'A black corset bodice with a rainbow stained-glass butterfly overskirt.',
  'A black corset bodice and sage-green butterfly wing overskirt.',
  'A black butterfly top, sheer cream sleeves, brown ruffled skirt and ivory lace-up boots.'
 ][index]+' Permanently unlock in Platform Jump → Design your character & pet → Clothing.'
}));
export function outfitUnlocked(style,owned=[]){const item=CLOTHING_SHOP_ITEMS.find(item=>item.outfit===style);return !item||owned.includes(item.id);}
const atlases=new Map();
export function outfitCell(style){
 const index=JUMP_OUTFITS.indexOf(style)-1;if(index<0)return null;
 if(index<9)return {file:'platform-jump-outfits.png',columns:3,rows:3,index};
 if(index<15)return {file:'platform-jump-pastel-outfits.png',columns:2,rows:3,index:index-9};
 return {file:'platform-jump-butterfly-outfits.png',columns:2,rows:2,index:index-15};
}
export function outfitAtlas(style=JUMP_OUTFITS[1]){
 const cell=outfitCell(style);if(!cell)return;
 if(!atlases.has(cell.file)&&typeof Image!=='undefined'){const image=new Image();image.src=new URL('../assets/'+cell.file,import.meta.url).href;atlases.set(cell.file,image);}
 return atlases.get(cell.file);
}
export function outfitReady(style){const image=outfitAtlas(style);return Boolean(image?.complete&&image.naturalWidth);}
// Body landmarks follow each reference garment's cuffs and exposed areas.
const OUTFIT_FITS=[
 {cuffX:24,cuffY:-3},{cuffX:24,cuffY:-18},{cuffX:25,cuffY:-5,midriff:true},
 {cuffX:25,cuffY:-6},{cuffX:18,cuffY:-13,armTop:-33},
 {cuffX:25,cuffY:0},{cuffX:25,cuffY:-3},{cuffX:18,cuffY:-12,armTop:-33},
 {cuffX:25,cuffY:-3},
 {cuffX:18,cuffY:-13,armTop:-35},{cuffX:25,cuffY:-5},
 {cuffX:25,cuffY:-3,arms:{'-1':{cuffX:18,cuffY:-13,armTop:-34}}},
 {cuffX:25,cuffY:-3,arms:{'-1':{cuffX:18,cuffY:-13,armTop:-34}}},
 {cuffX:25,cuffY:-3,boots:true,shoulder:true},{cuffX:18,cuffY:-13,armTop:-34,boots:true},
 {cuffX:18,cuffY:-14,armTop:-44,chest:true,legTop:-28},
 {cuffX:18,cuffY:-14,armTop:-44,chest:true,legTop:-28},
 {cuffX:18,cuffY:-14,armTop:-44,chest:true,legTop:-28},
 {cuffX:25,cuffY:-5,chest:true,midriff:true,boots:true,bootColor:'#e9e1d0',legX:6,legWidth:5,shoeRadius:3.8,shoeHeight:2.3}
];
export const outfitHeadOffset=style=>JUMP_OUTFITS.indexOf(style)>0?-3:0;
function armPose(side,time,moving,waving){
 const raised=waving==='clap'||(waving&&side===1);
 return {x:side*19,y:-42,angle:raised?-side*(waving==='clap'?2.3:2):0};
}
export function drawOutfitBody(c,s,time=0,moving=false,waving=false){
 const fit=OUTFIT_FITS[JUMP_OUTFITS.indexOf(s.outfit)-1];if(!fit)return;
 const stride=moving?Math.sin(time*13)*4:0;
 // Fully covered torsos have no skin rectangle underneath the artwork.
 c.fillStyle=s.skin;c.beginPath();c.roundRect(-4,-52,8,7,2);c.fill();
 if(fit.chest){c.beginPath();c.moveTo(-4,-51);c.lineTo(4,-51);c.quadraticCurveTo(9,-47,15,-45);c.lineTo(12,-36);c.lineTo(-12,-36);c.lineTo(-15,-45);c.quadraticCurveTo(-9,-47,-4,-51);c.fill();}
 if(fit.shoulder){c.beginPath();c.ellipse(10,-46,3.8,6,0,0,Math.PI*2);c.fill();}
 if(fit.midriff){c.beginPath();c.roundRect(-8,-30,16,8,2);c.fill();}
 for(const side of [-1,1]){
  const step=side*stride*.5,legTop=fit.legTop??-18,legX=fit.legX??8,legWidth=fit.legWidth??8;
  c.fillStyle=s.skin;c.beginPath();c.roundRect(side*legX-legWidth/2,legTop,legWidth,1-legTop+step,Math.min(4,legWidth/2));c.fill();
  if(fit.boots){c.fillStyle=fit.bootColor||'#79543c';c.beginPath();c.roundRect(side*legX-legWidth/2,-11+step,legWidth,13,Math.min(3,legWidth/2));c.fill();}
  c.fillStyle=fit.boots?(fit.bootColor||'#6b4635'):'#f6f1e8';c.beginPath();c.ellipse(side*legX,step+1,fit.shoeRadius??6,fit.shoeHeight??4,0,0,Math.PI*2);c.fill();
  const pose=armPose(side,time,moving,waving);
  c.save();c.translate(pose.x,pose.y);c.rotate(pose.angle);
  const sleeve=fit.arms?.[side]??fit;
  const handX=side*(sleeve.cuffX-19),handY=sleeve.cuffY+42;
  if(sleeve.armTop!==undefined){c.strokeStyle=s.skin;c.lineWidth=3.8;c.lineCap='round';c.beginPath();c.moveTo(handX,sleeve.armTop+42);c.lineTo(handX,handY);c.stroke();}
  // Oversized cuffs cover the hands; only short sleeves expose the forearms.
  if(sleeve.armTop!==undefined){c.fillStyle=s.skin;c.beginPath();c.ellipse(handX,handY,2.5,3.5,0,0,Math.PI*2);c.fill();}
  c.restore();
 }
}
export function drawJumpOutfit(c,style,time=0,moving=false,waving=false){
 const cell=outfitCell(style),image=outfitAtlas(style);
 if(!cell||!image?.complete||!image.naturalWidth)return false;
 const w=image.naturalWidth/cell.columns,h=image.naturalHeight/cell.rows,col=cell.index%cell.columns,row=Math.floor(cell.index/cell.columns);
 // Garment proportions define the fitted body, neckline, and cuff positions.
 const width=62,height=58,left=-31,top=-55;
 // Keep the shared atlas gutters out of each garment, including raised sleeves.
 const inset=cell.columns===2?.025:0;
 function part(sx,sy,sw,sh,dx,dy,dw,dh){
  const x0=Math.max(sx,col*w),y0=Math.max(sy,(row+inset)*h);
  const x1=Math.min(sx+sw,(col+1)*w),y1=Math.min(sy+sh,(row+1-inset)*h);
  if(x1<=x0||y1<=y0)return;
  c.drawImage(image,x0,y0,x1-x0,y1-y0,dx+(x0-sx)/sw*dw,dy+(y0-sy)/sh*dh,dw*(x1-x0)/sw,dh*(y1-y0)/sh);
 }

 if(!waving){part(col*w,row*h,w,h,left,top,width,height);return true;}
 // Separate sleeve strips follow the same raised arms used by the character.
 for(const side of [-1,1]){
  const pose=armPose(side,time,moving,waving);
  c.save();c.translate(pose.x,pose.y);c.rotate(pose.angle);
  const sx=side<0?0:.8;
  part((col+sx)*w,row*h,w*.2,h*.72,left+sx*width-pose.x,top-pose.y,width*.2,height*.72);
  c.restore();
 }
 // Center strip includes the collar, bodice, skirt or shorts, and hanging straps.
 part((col+.2)*w,row*h,w*.6,h,left+width*.2,top,width*.6,height);
 return true;
}
