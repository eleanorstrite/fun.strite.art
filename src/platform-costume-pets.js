import {COSTUME_PET_BOUNDS} from './platform-costume-pet-bounds.js';
export const COSTUME_PET_BREEDS=['Rainbow','Pink tutu and bow','Tuxedo'];
export const COSTUME_PET_TYPES=['cat','dog','bird'];
export function costumePetCell(pet,breed){const column=COSTUME_PET_BREEDS.indexOf(breed);return COSTUME_PET_TYPES.includes(pet)&&column>=0?{file:'platform-costume-'+pet+'.png',row:0,column,columns:3,rows:3}:null;}
export function costumePetUpgrade(pet,breed){const cell=costumePetCell(pet,breed);return cell?'jump-'+['rainbow','tutu','tuxedo'][cell.column]+'-'+pet:null;}
export const COSTUME_PET_SHOP_ITEMS=COSTUME_PET_TYPES.flatMap(pet=>COSTUME_PET_BREEDS.map(breed=>({id:costumePetUpgrade(pet,breed),name:breed+' '+pet,group:'appearance',category:'PLATFORM JUMP PETS',icon:pet==='bird'?'🐦':pet==='cat'?'🐱':'🐶',cost:50,petCostume:{pet,breed},description:'Permanently unlock this animated '+pet+' look. Choose it in the Platform Jump pet editor. Includes idle, walking and jumping poses.'})));
export function costumePetUnlocked(pet,breed,owned=[]){const id=costumePetUpgrade(pet,breed);return !id||owned.includes(id);}
const images=new Map();
export function costumePetAtlas(pet){if(!COSTUME_PET_TYPES.includes(pet)||typeof Image==='undefined')return null;if(!images.has(pet)){const image=new Image();image.src=new URL('../assets/platform-costume-'+pet+'.png',import.meta.url).href;images.set(pet,image);}return images.get(pet);}
export function costumePetPose(pet,pose='idle',time=0,moving=false){if(pose==='jump')return 2;if(pose==='land'||pose==='crouch')return 1;if(moving||pose==='walk')return pet==='bird'?1+Math.floor(Math.max(0,time)*6)%2:Math.floor(Math.max(0,time)*6)%2;return 0;}
export function costumePetSprite(pet,breed,pose='idle',time=0,moving=false){const cell=costumePetCell(pet,breed);if(!cell)return null;const image=costumePetAtlas(pet);if(!image?.complete||!image.naturalWidth)return null;const frames=COSTUME_PET_BOUNDS[pet],poses=[0,1,2].map(row=>frames[row*3+cell.column]),row=costumePetPose(pet,pose,time,moving);return {image,bounds:poses[row],maxW:Math.max(...poses.map(p=>p.w)),maxH:Math.max(...poses.map(p=>p.h)),displayW:pet==='bird'?76:90,displayH:pet==='bird'?72:75};}
