import {COSTUME_PET_SHOP_ITEMS,COSTUME_PET_BREEDS} from '../src/platform-costume-pets.js';
import {REFERENCE_PET_BOUNDS} from '../src/platform-reference-pet-bounds.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {PET_BREEDS,validateJumpSettings} from '../src/platform-jump-rules.js';
import {petCatalog,petBreedUnlocked,mountPetGallery} from '../src/platform-pet-gallery.js';
import {referencePetCell,referencePetPose,referencePetSprite} from '../src/platform-reference-pets.js';
import {petArtworkCell,petSpriteCell,drawRealJumpPet} from '../src/platform-jump-pets.js';
test('all 54 looks have unique artwork, including the five new cats and five birds',()=>{
 const catalog=petCatalog();assert.equal(catalog.length,9);assert.equal(catalog.reduce((n,g)=>n+g.breeds.length,0),54);
 const cells=new Set();for(const group of catalog){assert.ok(group.breeds.some(b=>b.breed===group.breed));for(const {breed,artwork} of group.breeds){assert.ok(artwork);assert.equal(validateJumpSettings({pet:group.pet,breed},[...COSTUME_PET_SHOP_ITEMS.map(item=>item.id),'jump-rainbow-ferret','jump-tutu-ferret','jump-tuxedo-ferret','jump-rainbow-hedgehog','jump-skirt-hedgehog','jump-tuxedo-hedgehog']).breed,breed);cells.add(artwork.file+':'+artwork.row+':'+artwork.column);}}
 assert.equal(cells.size,54);assert.equal(referencePetCell('cat','Ginger Maine Coon').column,0);assert.equal(referencePetCell('bird','Rainbow lorikeet').column,4);assert.equal(petSpriteCell('cat','Ginger Maine Coon'),null);assert.equal(petArtworkCell('__proto__','bad'),null);
 assert.equal(petBreedUnlocked('ferret','Rainbow'),false);assert.equal(petBreedUnlocked('hedgehog','Tuxedo'),false);assert.equal(petBreedUnlocked('ferret','Rainbow',[...COSTUME_PET_SHOP_ITEMS.map(item=>item.id),'jump-rainbow-ferret']),true);
 for(const breed of PET_BREEDS.bird.filter(b=>!COSTUME_PET_BREEDS.includes(b)))assert.equal(petBreedUnlocked('bird',breed),true);
});
test('reference pets have movement poses and birds alternate wing positions in flight',()=>{
 assert.equal(referencePetPose('cat','idle',0),0);assert.equal(referencePetPose('cat','jump',0),2);
 assert.equal(referencePetPose('bird','idle',0),0);assert.equal(referencePetPose('bird','walk',0),1);assert.equal(referencePetPose('bird','walk',.15),2);
});
test('the picker shows a photo for every type and breed before selection and keeps purchases locked',t=>{
 const previous=globalThis.document;t.after(()=>{globalThis.document=previous;});const photos=[];
 class Element{
  constructor(tag){this.tag=tag;this.children=[];this.attributes={};this.listeners={};this.disabled=false;}
  append(...nodes){for(const node of nodes){node.parentElement=this;this.children.push(node);}}
  after(...nodes){const parent=this.parentElement,index=parent.children.indexOf(this);for(const node of nodes)node.parentElement=parent;parent.children.splice(index+1,0,...nodes);}
  setAttribute(k,v){this.attributes[k]=v;}getAttribute(k){return this.attributes[k];}
  addEventListener(type,fn){this.listeners[type]=fn;}
  getContext(){return {clearRect(){},fillRect(){},fillText(){},drawImage(...a){photos.push(a);}};}
  click(){if(!this.disabled)this.listeners.click?.();}
 }
 globalThis.document={createElement:tag=>new Element(tag)};
 const parent=new Element('fieldset'),label=new Element('label'),field=new Element('select');label.append(field);parent.append(label);let settings={pet:'dog',breed:'Brindle'},selected=[],owned=[];
 const gallery=mountPetGallery({parent,petField:field,getSettings:()=>settings,getUpgrades:()=>owned,signal:new AbortController().signal,onSelect:(pet,breed)=>{selected.push([pet,breed]);settings={pet,breed};},photoSources:()=>[],photoSprite:()=>({image:{},bounds:{x:0,y:0,w:200,h:100}})});
 gallery.paint();assert.equal(photos.length,63,'Nine animal pictures and 54 breed pictures must all be visible');
 function descendants(el){return el.children.flatMap(child=>[child,...descendants(child)]);}
 const buttons=descendants(parent).filter(el=>el.tag==='button');assert.equal(buttons.length,63);
 const bengal=buttons.find(b=>b.getAttribute('aria-label')==='Bengal (spotted)');bengal.click();assert.equal(selected[0][0],'cat');assert.equal(selected[0][1],'Bengal (spotted)');gallery.paint();assert.equal(bengal.getAttribute('aria-pressed'),'true');
 const locked=buttons.find(b=>b.getAttribute('aria-label')==='Rainbow · Shop: 50 coins');assert.ok(locked);assert.equal(locked.disabled,true);assert.equal(locked.getAttribute('data-locked'),'true');assert.equal(bengal.getAttribute('data-locked'),'false');
 owned=['jump-rainbow-cat'];gallery.paint();assert.equal(locked.disabled,false);assert.equal(locked.getAttribute('data-locked'),'false');assert.equal(locked.children[1].children[1].textContent,'Unlocked');
 gallery.paint(true);assert.ok(buttons.every(b=>b.disabled));assert.equal(locked.getAttribute('data-locked'),'false');
});

test('new reference pets have complete, transparent pose frames with safe atlas bounds',t=>{
 const previous=globalThis.Image;t.after(()=>{globalThis.Image=previous;});globalThis.Image=class{constructor(){this.complete=true;this.naturalWidth=1620;this.naturalHeight=971;}};
 for(const pet of ['cat','bird']){
  assert.equal(REFERENCE_PET_BOUNDS[pet].length,15);
  for(const bounds of REFERENCE_PET_BOUNDS[pet]){assert.ok(bounds.w>0&&bounds.h>0);assert.ok(bounds.x>=0&&bounds.y>=0);assert.ok(bounds.x+bounds.w<=1620&&bounds.y+bounds.h<=971);}
  for(const breed of PET_BREEDS[pet].filter(b=>referencePetCell(pet,b)))for(const pose of ['idle','walk','jump','land']){const sprite=referencePetSprite(pet,breed,pose,.15,true);assert.ok(sprite);assert.ok(sprite.maxW>=sprite.bounds.w&&sprite.maxH>=sprite.bounds.h);}
 }
});

test('all ten new pets render their reference photos during idle, movement and jumping',t=>{
 const previous=globalThis.Image;t.after(()=>{globalThis.Image=previous;});globalThis.Image=class{constructor(){this.complete=true;this.naturalWidth=1620;this.naturalHeight=971;}};
 const photos=[];const c=new Proxy({drawImage:(...a)=>photos.push(a)},{get:(o,k)=>k in o?o[k]:()=>{}});
 for(const pet of ['cat','bird'])for(const breed of PET_BREEDS[pet].filter(b=>referencePetCell(pet,b)))for(const pose of ['idle','walk','jump']){
  photos.length=0;assert.equal(drawRealJumpPet(c,100,100,{pet,breed,petName:''},.15,pose==='walk',1,pose),true);assert.equal(photos.length,1);assert.ok(photos[0][0].src.includes('platform-reference-'));assert.ok(photos[0].slice(1).every(Number.isFinite));
 }
});
