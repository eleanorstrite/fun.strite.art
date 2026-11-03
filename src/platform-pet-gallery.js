import {costumePetUnlocked,costumePetAtlas} from './platform-costume-pets.js';
import {PET_BREEDS} from './platform-jump-rules.js';
import {jumpPetAtlas,petPreviewSprite,petArtworkCell} from './platform-jump-pets.js';
import {ferretAtlas,ferretUnlocked} from './platform-ferrets.js';
import {hedgehogAtlas,hedgehogUnlocked} from './platform-hedgehogs.js';
import {referencePetAtlas} from './platform-reference-pets.js';
const TYPE_BREEDS={cat:'Ginger Maine Coon',dog:'Brindle',bird:'Rainbow lorikeet'};
export const petBreedUnlocked=(pet,breed,owned=[])=>!costumePetUnlocked(pet,breed,owned)?false:pet==='ferret'?ferretUnlocked(breed,owned):pet==='hedgehog'?hedgehogUnlocked(breed,owned):true;
export const petTypeBreed=pet=>TYPE_BREEDS[pet]||PET_BREEDS[pet]?.[0];
export function petCatalog(){return Object.entries(PET_BREEDS).map(([pet,breeds])=>({pet,label:pet[0].toUpperCase()+pet.slice(1),breed:petTypeBreed(pet),breeds:breeds.map(breed=>({breed,artwork:petArtworkCell(pet,breed)}))}));}
export function petPhotoSources(){return [jumpPetAtlas(),ferretAtlas(),hedgehogAtlas(),referencePetAtlas('cat'),referencePetAtlas('bird'),...['cat','dog','bird'].map(costumePetAtlas)];}
export function mountPetGallery({parent,petField,getSettings,getUpgrades,onSelect,signal,isOpen=()=>true,photoSprite=petPreviewSprite,photoSources=petPhotoSources}){
 const types=document.createElement('div');types.className='jump-pet-types';types.setAttribute('role','group');types.setAttribute('aria-label','Choose an animal with photo previews');petField.parentElement.after(types);
 const catalog=document.createElement('section');catalog.className='jump-pet-catalog';const heading=document.createElement('h3');heading.textContent='All animals & breeds';catalog.append(heading);const note=document.createElement('p');note.textContent='Compare every look below. Each picture shows the pet artwork used in the game.';catalog.append(note);const motionLink=document.createElement('a');motionLink.href=new URL('../previews/platform-pet-costumes.html',import.meta.url).href;motionLink.textContent='See the rainbow, tutu & tuxedo pets in motion';catalog.append(motionLink);parent.append(catalog);
 const tiles=[],typeTiles=[],groups=petCatalog();
 function tile(parent,pet,breed,isType=false){
  const button=document.createElement('button');button.type='button';button.className='jump-pet-choice';
  const picture=document.createElement('canvas');picture.width=220;picture.height=170;picture.setAttribute('aria-hidden','true');
  const caption=document.createElement('span'),name=document.createElement('strong'),status=document.createElement('small');caption.append(name,status);button.append(picture,caption);parent.append(button);
  const entry={pet,breed,isType,button,picture,name,status};button.addEventListener('click',()=>onSelect(entry.pet,entry.breed),{signal});(isType?typeTiles:tiles).push(entry);return entry;
 }
 for(const group of groups){
  tile(types,group.pet,group.breed,true);
  const section=document.createElement('section');section.className='jump-pet-breed-group';const title=document.createElement('h4');title.textContent=group.label;const grid=document.createElement('div');grid.className='jump-pet-breed-photos';grid.setAttribute('role','group');grid.setAttribute('aria-label',group.label+' breeds with photo previews');section.append(title,grid);catalog.append(section);
  for(const {breed} of group.breeds)tile(grid,group.pet,breed);
 }
 let revision=0,lastKey='',lastRunning=false;const watched=new WeakSet();
 function watchSources(){for(const image of photoSources()){
  if(!image||watched.has(image))continue;watched.add(image);image.addEventListener('load',()=>{revision++;paint(lastRunning);},{signal});
 }}
 function paint(running=false){
  lastRunning=running;if(!isOpen())return;
  watchSources();const settings=getSettings(),owned=getUpgrades(),key=[settings.pet,settings.breed,running,owned.join(','),revision].join(':');if(key===lastKey)return;lastKey=key;
  for(const entry of [...typeTiles,...tiles]){
   if(entry.isType)entry.breed=settings.pet===entry.pet?settings.breed:petTypeBreed(entry.pet);
   const locked=!petBreedUnlocked(entry.pet,entry.breed,owned),selected=settings.pet===entry.pet&&(entry.isType||settings.breed===entry.breed);
   entry.button.disabled=running||locked;entry.button.setAttribute('aria-pressed',String(selected));entry.name.textContent=entry.isType?entry.pet[0].toUpperCase()+entry.pet.slice(1):entry.breed;entry.status.textContent=locked?'Shop · 50 coins':entry.isType?entry.breed:selected?'Selected':'Free';entry.button.setAttribute('aria-label',(entry.isType?entry.pet+' · ':'')+entry.breed+(locked?' · Shop: 50 coins':''));
   const c=entry.picture.getContext('2d');c.clearRect(0,0,220,170);c.fillStyle='#f5f4e9';c.fillRect(0,0,220,170);const sprite=photoSprite(entry.pet,entry.breed);
   if(!sprite){c.fillStyle='#796e60';c.font='14px system-ui';c.textAlign='center';c.fillText('Loading photo…',110,88);continue;}
   const b=sprite.bounds,scale=Math.min(200/b.w,150/b.h);c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(sprite.image,b.x,b.y,b.w,b.h,110-b.w*scale/2,85-b.h*scale/2,b.w*scale,b.h*scale);
  }
 }
 return {paint};
}
