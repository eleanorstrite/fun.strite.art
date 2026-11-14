import {playSprite,drawPlaySprite} from './play-art.js';
const cache=new Map();
// Keep the original eyes readable while coloring feathers, fur and scales.
const eyes={
 'flyers-detailed:0':[[.70,.427,.044,.052]],'flyers-detailed:1':[[.821,.391,.036,.047]],
 'flyers-detailed:2':[[.758,.314,.043,.054]],'flyers-detailed:3':[[.718,.13,.045,.065]],
 'flyers-detailed:4':[[.789,.247,.046,.055],[.905,.238,.036,.048]],'flyers-detailed:5':[[.80,.156,.04,.053]],
 'flyers-detailed:6':[[.845,.256,.045,.062],[.971,.239,.032,.058]],'flyers-detailed:7':[[.675,.301,.062,.078],[.845,.306,.062,.078]],
 'objects:8':[[.81,.528,.037,.045]],'objects:9':[[.78,.10,.035,.055]],
 'details:15':[[.773,.386,.055,.085],[.929,.386,.036,.075]],
 'objects:10':[[.818,.259,.055,.071],[.92,.235,.03,.05]],'objects:11':[[.90,.26,.05,.068]],
};
export function recolorFlightPixels(pixels,width,height,color,group,index){
 const rgb=[1,3,5].map(start=>parseInt(color.slice(start,start+2),16)),features=eyes[group+':'+index]||[],histogram=new Uint32Array(256);let count=0;
 for(let i=0;i<pixels.length;i+=4)if(pixels[i+3]>180){const l=Math.round(pixels[i]*.2126+pixels[i+1]*.7152+pixels[i+2]*.0722);if(l>=16){histogram[l]++;count++;}}
 let reference=1,total=0;for(let l=0;l<256;l++){total+=histogram[l];if(total>=count*.55){reference=Math.max(1,l);break;}}
 const black=rgb.every(channel=>channel===0);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=(y*width+x)*4;if(!pixels[i+3])continue;const u=x/width,v=y/height,r=pixels[i],g=pixels[i+1],b=pixels[i+2];
  if(features.some(([cx,cy,rx,ry])=>((u-cx)/rx)**2+((v-cy)/ry)**2<1))continue;
  const jetpack=group==='flyers-detailed'&&index>=3&&index<=6;
  if(jetpack&&((u<.2&&v>.2&&v<.7)||((u-.34)/.23)**2+((v-.33)/.25)**2<1&&Math.max(r,g,b)-Math.min(r,g,b)<50))continue;
  // Normalize the original coat's brightness so a dark eagle can be white,
  // then apply the picked RGB directly. Black gets only a faint surface sheen.
  const luminance=r*.2126+g*.7152+b*.0722,shade=Math.min(1,Math.max(.18,luminance/reference)),gloss=black?Math.max(0,(luminance-180)/75)*18:0;
  for(let channel=0;channel<3;channel++)pixels[i+channel]=Math.round(rgb[channel]*shade+gloss);
 }
 return pixels;
}
export function drawFlightSprite(c,group,index,x,y,maxW,maxH,{anchor=.5,angle=0,tint}={}){
 const original=playSprite(group,index);if(!original)return false;
 if(!globalThis.document?.createElement||!/^#[0-9a-f]{6}$/i.test(tint||''))return drawPlaySprite(c,group,index,x,y,maxW,maxH,{anchor,angle});
 const key=group+':'+index+':'+tint.toLowerCase();let image=cache.get(key);
 if(!image){const b=original.bounds;image=document.createElement('canvas');image.width=b.w;image.height=b.h;const paint=image.getContext('2d');paint.drawImage(original.image,b.x,b.y,b.w,b.h,0,0,b.w,b.h);const pixels=paint.getImageData(0,0,b.w,b.h);recolorFlightPixels(pixels.data,b.w,b.h,tint,group,index);paint.putImageData(pixels,0,0);if(cache.size>=48)cache.delete(cache.keys().next().value);cache.set(key,image);}
 const scale=Math.min(maxW/image.width,maxH/image.height),width=image.width*scale,height=image.height*scale;c.save();c.translate(x,y);if(angle)c.rotate(angle);c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(image,-width/2,-height*anchor,width,height);c.restore();return true;
}
