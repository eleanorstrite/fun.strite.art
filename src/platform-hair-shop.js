export const SHOP_HAIR=[
 {id:'jump-hair-candy',name:'Candy pink braided buns',column:0,description:'Hot pink double buns, flowing lengths, twin braids and colorful beads.'},
 {id:'jump-hair-golden',name:'Golden ribbon braids',column:1,description:'Long honey blonde hair with slender braids and gold ornaments. No cat ears.'},
 {id:'jump-hair-sunset',name:'Sunset blossom waves',column:2,description:'Red-to-peach flowing waves with delicate golden leaf ornaments.'},
 {id:'jump-hair-moon',name:'Ivory moon braids',column:3,description:'Creamy ivory waves, a braided crown and dangling moon and star ornaments.'}
];
export const HAIR_SHOP_ITEMS=SHOP_HAIR.map(h=>({...h,hairstyle:h.name,group:'appearance',category:'PLATFORM JUMP · HAIRSTYLE',icon:'🎀',cost:50,description:h.description+' Permanently unlock in Platform Jump → Design your character & pet. Reference colors are part of this style.'}));
export const hairUnlocked=(style,owned=[])=>{const item=SHOP_HAIR.find(h=>h.name===style);return !item||owned.includes(item.id);};
let atlas;
export function hairAtlas(){if(!atlas&&typeof Image!=='undefined'){atlas=new Image();atlas.src=new URL('../assets/reference-hairstyles.png',import.meta.url).href;}return atlas;}
// Wind builds below the crown, with a delayed ripple toward the tips.
export function hairBreezeOffset(y,time=0){
 const length=Math.max(0,Math.min(1,(y+78)/57));
 if(length===0)return 0;
 return length*length*(3+Math.sin(time*1.7-length*1.8)*4+Math.sin(time*3.1-length*3)*1.2);
}
export function drawShopHair(c,style,layer,time=0){
 const item=SHOP_HAIR.find(h=>h.name===style);if(!item)return false;
 const image=hairAtlas();if(!image?.complete||!image.naturalWidth)return false;
 const w=image.naturalWidth/4,h=image.naturalHeight/2;
 // Fit the 40 × 46 head: crown just above the scalp, lengths ending above the legs.
 const width=72,height=80,left=-width/2,top=-101;
 c.save();
 if(layer==='front'){
  // Only the hair around the head goes in front of the person.
  c.beginPath();c.rect(left-1,top-1,width+2,-51-top+1);c.clip();
  // The atlas openings are narrower than the game's face. Keep a full-size
  // face opening fixed to the head, including while the hair blows sideways.
  c.beginPath();c.rect(-100,-150,200,200);
  c.moveTo(19,-65);c.ellipse(0,-65,19,21,0,0,Math.PI*2);
  c.clip('evenodd');
 }
 // Connected bands bend the hair rather than sliding the whole hairstyle.
 const bands=32,bandHeight=height/bands;
 for(let band=0;band<bands;band++){
  const y=top+band*bandHeight,shift=hairBreezeOffset(y,time);
  const shear=(hairBreezeOffset(y+bandHeight,time)-shift)/bandHeight;
  c.save();c.transform(1,0,shear,1,shift-shear*y,0);
  c.drawImage(image,item.column*w,(layer==='back'?0:h)+band*h/bands,w,h/bands,left,y,width,bandHeight);
  c.restore();
 }
 c.restore();return true;
}
