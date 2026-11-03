export const JUMP_FACIAL_HAIR=[
 'None','Brown curled handlebar','Black fine handlebar','Golden curled moustache',
 'Black pencil pair','Brown classic moustache','Auburn drooping moustache',
 'Golden wavy handlebar','Black silver classic','Auburn chevron','Black long tendrils',
 'Black curled moustache','Tiny golden moustache','Auburn winged moustache','Golden horseshoe'
];
let atlas;
export function facialHairAtlas(){
 if(!atlas&&typeof Image!=='undefined'){atlas=new Image();atlas.src=new URL('../assets/platform-jump-facial-hair.png',import.meta.url).href;}
 return atlas;
}
// Each silhouette has a different center part; align that point below the nose.
const NOSE_ANCHORS=[.4,.45,.33,.45,.4,.2,.3,.4,.2,.15,.45,.28,.3,.05];
export function facialHairCell(style){
 const index=JUMP_FACIAL_HAIR.indexOf(style)-1;if(index<0)return null;
 return {column:index%4,row:Math.floor(index/4),anchor:NOSE_ANCHORS[index],top:index===13?-.1:0,bottom:index===9?.8:1};
}
export function drawJumpFacialHair(c,style){
 const cell=facialHairCell(style);if(!cell)return false;
 const image=facialHairAtlas();if(!image?.complete||!image.naturalWidth)return false;
 const w=image.naturalWidth/4,h=image.naturalHeight/4;
 // Position the moustache at the upper lip in the head's own coordinate space.
 const width=34,height=18,top=-59-height*cell.anchor;
 c.drawImage(image,cell.column*w,(cell.row+cell.top)*h,w,(cell.bottom-cell.top)*h,-width/2,top+height*cell.top,width,height*(cell.bottom-cell.top));
 return true;
}
