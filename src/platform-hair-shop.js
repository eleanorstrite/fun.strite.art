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
export function drawShopHair(c,style,layer,time=0){const item=SHOP_HAIR.find(h=>h.name===style);if(!item)return false;const image=hairAtlas();if(!image?.complete||!image.naturalWidth)return false;const w=image.naturalWidth/4,h=image.naturalHeight/2;c.save();if(layer==='front'){// Keep only the hair around the head in front; long lengths stay behind the body.
 c.beginPath();c.rect(-64,-130,128,79);c.clip();}c.translate(Math.sin(time*2.5)*.45,0);c.drawImage(image,item.column*w,layer==='back'?0:h,w,h,-58,-117,116,116);c.restore();return true;}
