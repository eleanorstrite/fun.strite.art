import {REFERENCE_PET_BOUNDS} from './platform-reference-pet-bounds.js';
export const REFERENCE_PET_BREEDS={
 cat:['Ginger Maine Coon','Black longhair','Flame-point cat','Black-and-white cat','Bengal (spotted)'],
 bird:['Golden songbird','White songbird','Green-and-yellow songbird','Blue songbird','Rainbow lorikeet']
};
const FILES={cat:'platform-reference-cats.png',bird:'platform-reference-birds.png'},images=new Map();
export function referencePetCell(pet,breed){const column=Object.hasOwn(REFERENCE_PET_BREEDS,pet)?REFERENCE_PET_BREEDS[pet].indexOf(breed):-1;return column>=0?{file:FILES[pet],column,row:0,columns:5,rows:3}:null;}
export function referencePetAtlas(pet){if(!Object.hasOwn(FILES,pet)||typeof Image==='undefined')return null;if(!images.has(pet)){const image=new Image();image.src=new URL('../assets/'+FILES[pet],import.meta.url).href;images.set(pet,image);}return images.get(pet);}
export function referencePetPose(pet,pose='idle',time=0,moving=false){
 if(pet==='bird')return moving||['walk','jump','land'].includes(pose)?1+Math.floor(Math.max(0,time)*7)%2:0;
 if(pose==='jump')return 2;if(pose==='crouch'||pose==='land')return 1;
 return pose==='walk'||moving?Math.floor(Math.max(0,time)*6)%2:0;
}
export function referencePetSprite(pet,breed,pose='idle',time=0,moving=false){
 const cell=referencePetCell(pet,breed);if(!cell)return null;
 const image=referencePetAtlas(pet);if(!image?.complete||!image.naturalWidth)return null;
 const frames=REFERENCE_PET_BOUNDS[pet],row=referencePetPose(pet,pose,time,moving);
 const fallback=r=>({x:cell.column*image.naturalWidth/5,y:r*image.naturalHeight/3,w:image.naturalWidth/5,h:image.naturalHeight/3});
 const poses=[0,1,2].map(r=>frames?.[r*5+cell.column]||fallback(r));
 return {image,bounds:poses[row],maxW:Math.max(...poses.map(p=>p.w)),maxH:Math.max(...poses.map(p=>p.h)),displayW:pet==='bird'?70:breed==='Ginger Maine Coon'?105:90,displayH:pet==='bird'?62:75};
}
