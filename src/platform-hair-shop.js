export const STARTER_HAIR='Sunset blossom waves';
export const SHOP_HAIR=[
 {id:'jump-hair-candy',name:'Candy pink braided buns',column:0,description:'Hot pink double buns, flowing lengths, twin braids and colorful beads.'},
 {id:'jump-hair-golden',name:'Golden ribbon braids',column:1,description:'Long honey blonde hair with slender braids and gold ornaments. No cat ears.'},
 {id:'jump-hair-sunset',name:'Sunset blossom waves',column:2,description:'Red-to-peach flowing waves with delicate golden leaf ornaments.'},
 {id:'jump-hair-moon',name:'Ivory moon braids',column:3,description:'Creamy ivory waves, a braided crown and dangling moon and star ornaments.'}
];
export const HAIR_SHOP_ITEMS=SHOP_HAIR.map(h=>({...h,hairstyle:h.name,group:'appearance',category:'PLATFORM JUMP · HAIRSTYLE',icon:'🎀',cost:h.name===STARTER_HAIR?0:50,description:(h.name===STARTER_HAIR?'Included free with the starter character. ':'')+h.description+' Permanently unlock in Platform Jump → Design your character & pet. Reference colors are part of this style.'}));
export const hairUnlocked=(style,owned=[])=>{const item=SHOP_HAIR.find(h=>h.name===style);return style===STARTER_HAIR||!item||owned.includes(item.id);};
let atlas;
export function hairAtlas(){if(!atlas&&typeof Image!=='undefined'){atlas=new Image();atlas.src=new URL('../assets/reference-hairstyles.png',import.meta.url).href;}return atlas;}
// Stronger gusts bend the lengths and send a delayed ripple toward the tips.
export function hairBreezeOffset(y,time=0){
 const length=Math.max(0,Math.min(1,(y+78)/57));
 if(length===0)return 0;
 return Math.pow(length,1.5)*(5+Math.sin(time*2.1-length*1.8)*11+Math.sin(time*4.2-length*3)*3);
}
export function drawShopHair(c,style,layer,time=0){
 const item=SHOP_HAIR.find(h=>h.name===style);if(!item)return false;
 const image=hairAtlas();if(!image?.complete||!image.naturalWidth)return false;
 const w=image.naturalWidth/4,h=image.naturalHeight/2;
 // Fit the 40 × 46 head: crown just above the scalp, lengths ending above the legs.
 const width=72,height=80,left=-width/2,top=-101;
 c.save();
 if(layer==='front'){
  // Fit an opaque, textured crown directly over the scalp. The atlas alone
  // has a narrow opening that cannot match our wider head at this scale.
  c.save();c.beginPath();c.moveTo(-20,-63);
  c.bezierCurveTo(-27,-80,-16,-93,0,-92);
  c.bezierCurveTo(16,-93,27,-80,20,-63);
  c.lineTo(17,-71);c.quadraticCurveTo(13,-78,3,-78);
  c.quadraticCurveTo(-2,-82,-8,-77);
  c.quadraticCurveTo(-15,-75,-17,-68);
  c.closePath();c.clip();
  // Sample the solid center of the matching back hair for a seamless color.
  c.drawImage(image,item.column*w+w*.3,h*.15,w*.4,h*.4,-24,-94,48,33);
  c.restore();
  // Only the hair around the head goes in front of the person.
  c.beginPath();c.rect(left-1,top-1,width+2,-51-top+1);c.clip();
  // Leave space for the face below the hairline, rather than cutting out
  // the entire round head. The crown and bangs overlap the forehead;
  // the sides overlap the temples without crowding the eyes or cheeks.
  c.beginPath();c.rect(-100,-150,200,200);
  c.moveTo(0,-77);
  c.bezierCurveTo(-7,-80,-13,-77,-16,-72);
  c.bezierCurveTo(-19,-68,-20,-60,-16,-53);
  c.bezierCurveTo(-12,-46,-5,-43,0,-43);
  c.bezierCurveTo(5,-43,12,-46,16,-53);
  c.bezierCurveTo(20,-60,19,-68,16,-72);
  c.bezierCurveTo(13,-77,7,-80,0,-77);
  c.closePath();c.clip('evenodd');
 }
 // Connected bands bend the hair rather than sliding the whole hairstyle.
 const bands=32,bandHeight=height/bands;
 for(let band=0;band<bands;band++){
  const y=top+band*bandHeight,shift=hairBreezeOffset(y,time);
  const shear=(hairBreezeOffset(y+bandHeight,time)-shift)/bandHeight;
  c.save();c.transform(1,0,shear,1,shift-shear*y,0);
  const overlap=band===bands-1?0:.15;
  c.drawImage(image,item.column*w,(layer==='back'?0:h)+band*h/bands,w,h/bands+overlap*h/height,left,y,width,bandHeight+overlap);
  c.restore();
 }
 c.restore();return true;
}
