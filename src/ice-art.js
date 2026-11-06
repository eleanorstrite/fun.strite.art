import {ICE_ART} from './ice-art-bounds.js';
const images=new Map();
export function iceArtAtlas(kind){if(!ICE_ART[kind]||typeof Image==='undefined')return null;if(!images.has(kind)){const image=new Image();image.src=new URL('../assets/ice-ingredients/'+kind+'.png',import.meta.url).href;images.set(kind,image);}return images.get(kind);}
export function drawIceIngredient(c,kind,id,x,y,width,height,{stretch=false}={}){const data=ICE_ART[kind],index=data?.ids.indexOf(id),b=data?.bounds[index],image=iceArtAtlas(kind);if(!b||!image?.complete||!image.naturalWidth)return false;const scale=Math.min(width/b.w,height/b.h),w=stretch?width:b.w*scale,h=stretch?height:b.h*scale;c.drawImage(image,b.x,b.y,b.w,b.h,x+(width-w)/2,y+(height-h)/2,w,h);return true;}
export function iceArtReady(){return ['flavors','cones','toppings'].map(iceArtAtlas).every(im=>im?.complete&&im.naturalWidth);}
