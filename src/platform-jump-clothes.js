export const JUMP_OUTFITS=[
 'Classic colors','Charcoal bomber & skirt','Lilac harness dress','Strappy top & shorts',
 'Fur-collar parka','Lace collar & skirt','Lilac bell sleeves','Corset & lace-up shorts',
 'Lilac shirt & shorts','Oversized black coat'
];
let atlas;
export function outfitAtlas(){
 if(!atlas&&typeof Image!=='undefined'){atlas=new Image();atlas.src=new URL('../assets/platform-jump-outfits.png',import.meta.url).href;}
 return atlas;
}
export function outfitReady(style){const image=outfitAtlas();return JUMP_OUTFITS.indexOf(style)>0&&Boolean(image?.complete&&image.naturalWidth);}
// Body landmarks follow each reference garment's cuffs and exposed areas.
const OUTFIT_FITS=[
 {cuffX:24,cuffY:-3},{cuffX:24,cuffY:-18},{cuffX:25,cuffY:-5,midriff:true},
 {cuffX:25,cuffY:-6},{cuffX:18,cuffY:-13,armTop:-33},
 {cuffX:25,cuffY:0},{cuffX:25,cuffY:-3},{cuffX:18,cuffY:-12,armTop:-33},
 {cuffX:25,cuffY:-3}
];
export const outfitHeadOffset=style=>JUMP_OUTFITS.indexOf(style)>0?-9:0;
function armPose(side,time,moving,waving){
 const raised=waving==='clap'||(waving&&side===1);
 return {x:side*19,y:-42,angle:raised?-side*(waving==='clap'?2.3:2):0};
}
export function drawOutfitBody(c,s,time=0,moving=false,waving=false){
 const fit=OUTFIT_FITS[JUMP_OUTFITS.indexOf(s.outfit)-1];if(!fit)return;
 const stride=moving?Math.sin(time*13)*4:0;
 // Fully covered torsos have no skin rectangle underneath the artwork.
 c.fillStyle=s.skin;c.beginPath();c.roundRect(-5,-59,10,13,3);c.fill();
 if(fit.midriff){c.beginPath();c.roundRect(-8,-30,16,8,2);c.fill();}
 for(const side of [-1,1]){
  const step=side*stride*.5;
  c.fillStyle=s.skin;c.beginPath();c.roundRect(side*8-4,-18,8,19+step,4);c.fill();
  c.fillStyle='#f6f1e8';c.beginPath();c.ellipse(side*8,step+1,6,4,0,0,Math.PI*2);c.fill();
  const pose=armPose(side,time,moving,waving);
  c.save();c.translate(pose.x,pose.y);c.rotate(pose.angle);
  const handX=side*(fit.cuffX-19),handY=fit.cuffY+42;
  if(fit.armTop!==undefined){c.strokeStyle=s.skin;c.lineWidth=6;c.lineCap='round';c.beginPath();c.moveTo(handX,fit.armTop+42);c.lineTo(handX,handY);c.stroke();}
  // Oversized cuffs cover the hands; only short sleeves expose the forearms.
  if(fit.armTop!==undefined){c.fillStyle=s.skin;c.beginPath();c.ellipse(handX,handY,3.5,4.5,0,0,Math.PI*2);c.fill();}
  c.restore();
 }
}
export function drawJumpOutfit(c,style,time=0,moving=false,waving=false){
 const index=JUMP_OUTFITS.indexOf(style)-1,image=outfitAtlas();
 if(index<0||!image?.complete||!image.naturalWidth)return false;
 const w=image.naturalWidth/3,h=image.naturalHeight/3,col=index%3,row=Math.floor(index/3);
 // Garment proportions define the fitted body, neckline, and cuff positions.
 const width=62,height=58,left=-31,top=-55;
 if(!waving){c.drawImage(image,col*w,row*h,w,h,left,top,width,height);return true;}
 // Separate sleeve strips follow the same raised arms used by the character.
 for(const side of [-1,1]){
  const pose=armPose(side,time,moving,waving);
  c.save();c.translate(pose.x,pose.y);c.rotate(pose.angle);
  const sx=side<0?0:.8;
  c.drawImage(image,(col+sx)*w,row*h,w*.2,h*.72,left+sx*width-pose.x,top-pose.y,width*.2,height*.72);
  c.restore();
 }
 // Center strip includes the collar, bodice, skirt or shorts, and hanging straps.
 c.drawImage(image,(col+.2)*w,row*h,w*.6,h,left+width*.2,top,width*.6,height);
 return true;
}
