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
export function drawJumpOutfit(c,style,time=0,moving=false,waving=false){
 const index=JUMP_OUTFITS.indexOf(style)-1,image=outfitAtlas();
 if(index<0||!image?.complete||!image.naturalWidth)return false;
 const w=image.naturalWidth/3,h=image.naturalHeight/3,col=index%3,row=Math.floor(index/3);
 // The reference garments fit the existing body; the head and legs keep their proportions.
 const width=62,height=58,left=-31,top=-55;
 if(!waving){c.drawImage(image,col*w,row*h,w,h,left,top,width,height);return true;}
 // Separate sleeve strips follow the same raised arms used by the character.
 for(const side of [-1,1]){
  const wave=waving==='clap'||(waving&&side===1),stride=moving?Math.sin(time*13)*2:0;
  c.save();c.translate(side*17,-45);
  if(wave)c.rotate(-side*(waving==='clap'?2.3:2));else c.rotate(side*stride*.02);
  const sx=side<0?0:.8;
  c.drawImage(image,(col+sx)*w,row*h,w*.2,h*.72,left+sx*width-side*17,top+45,width*.2,height*.72);
  c.restore();
 }
 // Center strip includes the collar, bodice, skirt or shorts, and hanging straps.
 c.drawImage(image,(col+.2)*w,row*h,w*.6,h,left+width*.2,top,width*.6,height);
 return true;
}
