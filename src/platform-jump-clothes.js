export const SCIENCE_TOPS=['Cosmos Explorer hoodie','Atomic Energy tee','Bio-Logic DNA tee'];
export const outfitUsesPants=style=>SCIENCE_TOPS.includes(style);
export const JUMP_OUTFITS=[
 'Classic colors','Charcoal bomber & skirt','Lilac harness dress','Strappy top & shorts',
 'Fur-collar parka','Lace collar & skirt','Lilac bell sleeves','Corset & lace-up shorts',
 'Lilac shirt & shorts','Oversized black coat',
 'Peach tie-waist dress','Sunset sleeves & olive shorts','Daisy denim overalls',
 'Cocoa heart overalls','Sage jacket & pleated skirt','Duck bag & denim shorts',
 'Orange monarch butterfly dress','Stained-glass butterfly dress','Green monarch butterfly dress','Butterfly blouse & brown skirt',...SCIENCE_TOPS
];
export const CLOTHING_SHOP_ITEMS=JUMP_OUTFITS.slice(16,20).map((outfit,index)=>({
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
 if(index<19)return {file:'platform-jump-butterfly-outfits.png',columns:2,rows:2,index:index-15};
 return {file:'platform-jump-science-shirts.png',columns:3,rows:1,index:index-19};
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
 {cuffX:25,cuffY:-5,chest:true,midriff:true,boots:true,bootColor:'#e9e1d0',legX:6,legWidth:5,shoeRadius:3.8,shoeHeight:2.3},
 {cuffX:24,cuffY:-18,shirtOnly:true,pants:true,legTop:-22},
 {cuffX:18,cuffY:-13,armTop:-37,shirtOnly:true,pants:true,legTop:-22},
 {cuffX:18,cuffY:-13,armTop:-37,shirtOnly:true,pants:true,legTop:-22}
];
export const outfitHeadOffset=style=>JUMP_OUTFITS.indexOf(style)>0?-3:0;
function armPose(side,time,moving,waving){
 const raised=waving==='clap'||(waving&&side===1);
 return {x:side*15,y:-43,raised,angle:raised?-side*(waving==='clap'?2.3:1.85+Math.sin(time*5)*.12):0};
}
function sleeveFit(fit,side){return fit.arms?.[side]??fit;}
function hasSleeve(fit){return !(fit.chest&&fit.armTop===-44);}
function sleevePath(c,side,endY){
 // Include the shoulder cap and inner seam, not just the outer edge of the atlas.
 c.moveTo(side*9,-47);c.lineTo(side*18,-50);c.lineTo(side*31,-40);
 c.lineTo(side*34,endY);c.lineTo(side*20,endY);
 c.lineTo(side*14,Math.min(-27,endY-3));c.lineTo(side*11,-35);c.closePath();
}
const SLEEVE_COLORS=['#444950','#b4a7bb','#45454a','#4e5656','#51545b','#b8a8bd','#b6a8bb','#b5a7b8','#303c3b','#f2ce92','#edb17c','#e9d492','#eee1c5','#a1a375','#f1cf91','#22222a','#22222a','#29342b','#eee2cf','#172b51','#18bdb4','#20212a'];
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
  c.fillStyle=fit.pants?s.pants:s.skin;c.beginPath();c.roundRect(side*legX-legWidth/2,legTop,legWidth,1-legTop+step,Math.min(4,legWidth/2));c.fill();
  if(fit.boots){c.fillStyle=fit.bootColor||'#79543c';c.beginPath();c.roundRect(side*legX-legWidth/2,-11+step,legWidth,13,Math.min(3,legWidth/2));c.fill();}
  c.fillStyle=fit.boots?(fit.bootColor||'#6b4635'):'#f6f1e8';c.beginPath();c.ellipse(side*legX,step+1,fit.shoeRadius??6,fit.shoeHeight??4,0,0,Math.PI*2);c.fill();
  const pose=armPose(side,time,moving,waving);
  c.save();c.translate(pose.x,pose.y);c.rotate(pose.angle);
  const sleeve=sleeveFit(fit,side);
  const handX=side*sleeve.cuffX-pose.x,handY=sleeve.cuffY-pose.y;
  if(sleeve.armTop!==undefined||pose.raised){c.strokeStyle=s.skin;c.lineWidth=3.8;c.lineCap='round';c.beginPath();if(pose.raised)c.moveTo(0,0);else c.moveTo(handX,sleeve.armTop-pose.y);c.lineTo(handX,handY);c.stroke();}
  // Oversized cuffs cover the hands; only short sleeves expose the forearms.
  if(sleeve.armTop!==undefined||pose.raised){c.fillStyle=s.skin;c.beginPath();c.ellipse(handX,handY,2.5,3.5,0,0,Math.PI*2);c.fill();}
  c.restore();
 }
}
export function drawJumpOutfit(c,style,time=0,moving=false,waving=false){
 const cell=outfitCell(style),image=outfitAtlas(style);
 if(!cell||!image?.complete||!image.naturalWidth)return false;
 const w=image.naturalWidth/cell.columns,h=image.naturalHeight/cell.rows,col=cell.index%cell.columns,row=Math.floor(cell.index/cell.columns);
 const fit=OUTFIT_FITS[JUMP_OUTFITS.indexOf(style)-1];
 // Garment proportions define the fitted body, neckline, and cuff positions.
 const width=62,height=fit.shirtOnly?36:58,left=-31,top=-55;
 // Keep the shared atlas gutters out of each garment, including raised sleeves.
 const inset=cell.columns===2?.025:0,xInset=cell.columns===3&&cell.rows===3?.035:0;
 function part(sx,sy,sw,sh,dx,dy,dw,dh){
  const x0=Math.max(sx,(col+xInset)*w),y0=Math.max(sy,(row+inset)*h);
  const x1=Math.min(sx+sw,(col+1-xInset)*w),y1=Math.min(sy+sh,(row+1-inset)*h);
  if(x1<=x0||y1<=y0)return;
  c.drawImage(image,x0,y0,x1-x0,y1-y0,dx+(x0-sx)/sw*dw,dy+(y0-sy)/sh*dh,dw*(x1-x0)/sw,dh*(y1-y0)/sh);
 }

 const raised=[-1,1].filter(side=>armPose(side,time,moving,waving).raised&&hasSleeve(fit));
 if(!raised.length){part(col*w,row*h,w,h,left,top,width,height);return true;}
 // Draw the complete outfit, removing only the sleeves that actually move.
 // Skirts, the resting sleeve, and accessories retain their original artwork.
 const ends=new Map(raised.map(side=>[side,sleeveFit(fit,side).armTop??sleeveFit(fit,side).cuffY-2]));
 c.save();c.beginPath();c.rect(-100,-150,200,200);
 for(const side of raised)sleevePath(c,side,ends.get(side));
 c.clip('evenodd');part(col*w,row*h,w,h,left,top,width,height);c.restore();
 for(const side of raised){
  const pose=armPose(side,time,moving,waving);
  // A small textured shoulder cap joins the bodice and rotated sleeve.
  c.save();c.beginPath();c.ellipse(pose.x,pose.y,5,5,0,0,Math.PI*2);c.clip();
  c.fillStyle=SLEEVE_COLORS[JUMP_OUTFITS.indexOf(style)-1];c.fill();
  part(col*w,row*h,w,h,left,top,width,height);c.restore();
  c.save();c.translate(pose.x,pose.y);c.rotate(pose.angle);c.translate(-pose.x,-pose.y);
  c.beginPath();sleevePath(c,side,ends.get(side));c.clip();
  part(col*w,row*h,w,h,left,top,width,height);c.restore();
 }
 return true;
}
