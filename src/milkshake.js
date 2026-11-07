import {drawIceToppingScatter} from './ice-topping-scatter.js';
import {ICE_FLAVORS,ICE_TOPPINGS,ICE_SYRUPS} from './ice-settings.js';
import {drawIceIngredient} from './ice-art.js';
import {playSprite} from './play-art.js';
import {PLAY_ART} from './play-art-bounds.js';
export const MILKSHAKE_COUNTDOWN=3,MILKSHAKE_BLEND_SECONDS=5,MILKSHAKE_DRINK_SECONDS=8.5,MILKSHAKE_THANKS=6.7;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export const isMilkshake=r=>r.drink==='milkshake';
export function selectMilkshake(r){r.drink='milkshake';r.toppings=r.toppings.slice(0,3);r.blend={phase:'choosing',time:0};for(const key of ['sauceDrops','sauceFalling','saucePuddles'])r[key]=[];return r;}
export function resetMilkshakeBlend(r){if(isMilkshake(r))r.blend={phase:'choosing',time:0};}
export function chooseMilkshakeTopping(r,id){if(!isMilkshake(r)||!Object.hasOwn(ICE_TOPPINGS,id)||['countdown','blending'].includes(r.blend?.phase))return false;const exists=r.toppings.includes(id);if(!exists&&r.toppings.length>=3)return false;r.toppings=exists?r.toppings.filter(t=>t!==id):[...r.toppings,id];resetMilkshakeBlend(r);return true;}
export function startMilkshakeBlend(r){if(!isMilkshake(r)||!(Array.isArray(r.flavors)?r.flavors.some(id=>ICE_FLAVORS[id]):ICE_FLAVORS[r.flavor])||r.toppings.length>3||['countdown','blending'].includes(r.blend?.phase))return false;r.blend={phase:'countdown',time:0};return true;}
export function tickMilkshakeBlend(r,seconds){if(!isMilkshake(r)||!r.blend||r.blend.phase==='choosing'||!Number.isFinite(seconds)||seconds<=0)return;r.blend.time+=seconds;r.blend.phase=r.blend.time<3?'countdown':r.blend.time<8?'blending':'ready';}
export function milkshakeBlendView(r){const phase=r.blend?.phase||'choosing',time=r.blend?.time||0;return {phase,time,count:phase==='countdown'?Math.max(1,3-Math.floor(time)):0,progress:phase==='ready'?1:clamp((time-3)/5),sparkle:phase==='ready'?clamp(1-(time-8)/3):0};}
export function milkshakeDrinkView(time){return {arrive:clamp(time/1.4),drinking:time>=1.5&&time<6,consumed:clamp((time-1.5)/4.5),thanks:time>=MILKSHAKE_THANKS,finished:time>=MILKSHAKE_DRINK_SECONDS};}
export function milkshakeEndingSounds(r,from,to){if(!r.funny)return [];const cues=[];for(const at of [1.65,2.35,3.15,4.05,4.8,5.5])if(from<at&&to>=at)cues.push('iceSlurp');if(from<5.9&&to>=5.9)cues.push('gulp');return cues;}
const toppingColors={pinkSprinkles:'#e8a1c5',chocolateSprinkles:'#79503b',pearlSprinkles:'#d2c6d8',waferRolls:'#ab8357',redVelvetWhip:'#e5a5b2',chips:'#694032',sauce:'#613b2d',caramel:'#c78e3e',strawberrySyrup:'#dd5c7a',butterscotch:'#d69d36',blueberrySauce:'#78629d',sprinkles:'#d898ac',stars:'#e7c477',marshmallows:'#fff6eb',cream:'#fff7ec',cherry:'#cc4360',berries:'#a65d9b',mms:'#bc8c94',truFru:'#9d6452',banana:'#f0d497',strawberries:'#dd7892',chocolatePieces:'#81533d',oreo:'#53484b',brownie:'#79513f',goldfish:'#dda958',cookieCrumbs:'#b59b73',almonds:'#caaa7c',walnuts:'#bd9860',raspberries:'#c85c85',orangeSlice:'#f3b453'};
function rgb(hex){return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));}
export function milkshakeColor(r){const flavors=(r.flavors?.length?r.flavors:[r.flavor]).map(id=>ICE_FLAVORS[id]?.color).filter(Boolean);if(!flavors.length)flavors.push(ICE_FLAVORS.vanilla.color);const colors=flavors.map(rgb),base=[0,1,2].map(i=>colors.reduce((n,c)=>n+c[i],0)/colors.length*.84+[255,246,232][i]*.16);const toppings=r.toppings.map(id=>toppingColors[id]).filter(Boolean).map(rgb);if(toppings.length)for(let i=0;i<3;i++)base[i]=base[i]*.86+toppings.reduce((n,c)=>n+c[i],0)/toppings.length*.14;return '#'+base.map(v=>Math.round(v).toString(16).padStart(2,'0')).join('');}
function oval(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
function shape(c,points){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();}
function gradient(c,x1,y1,x2,y2,stops){const g=c.createLinearGradient(x1,y1,x2,y2);stops.forEach(([at,color])=>g.addColorStop(at,color));return g;}
function liquidPath(c){c.beginPath();c.moveTo(-57,-245);c.lineTo(57,-245);c.bezierCurveTo(53,-146,48,-73,19,-40);c.quadraticCurveTo(0,-28,-19,-40);c.bezierCurveTo(-48,-73,-53,-146,-57,-245);c.closePath();}
const flavorChunks={cookies:['oreo'],mint:['chips'],rockyroad:['chocolatePieces','marshmallows','almonds'],vanillaalmond:['almonds'],maplewalnut:['walnuts'],orangechocolate:['chocolatePieces'],chocolatealmond:['almonds'],chocolateraspberry:['raspberries'],pannacotta:['strawberries','raspberries']};
export function milkshakeChunkKinds(r){return [...new Set([...(r.flavors??[r.flavor]).flatMap(id=>flavorChunks[id]||[]),...r.toppings.filter(id=>!ICE_SYRUPS[id]&&!['cream','redVelvetWhip'].includes(id))])];}
// Irregular, partly submerged tumbling inside the jug, with progressively chopped pieces.
export function milkshakeParticles(r,time=0,progress=0){return milkshakeChunkKinds(r).flatMap((id,kind)=>Array.from({length:12},(_,i)=>{const seed=i+kind*17,phase=time*(2.7+seed%5*.21)+seed*2.399,depth=(Math.sin(phase*.73+seed)*.5+.5),front=Math.sin(phase+seed*.61);return {id,x:Math.sin(phase)*68*(.55+.35*depth),y:-288+depth*177,rotation:phase*(seed%2?1:-1),size:(id==='oreo'?42:30)*(1-progress)**1.7+2.5+seed%3,opacity:clamp((front+.2)*1.3)*(.85-.32*progress)};}));}
function bits(c,r,{top=-235,bottom=-26,time=0,swirl=false,progress=1}={}){
 if(swirl){for(const p of milkshakeParticles(r,time,progress)){if(p.opacity<.04)continue;c.save();c.globalAlpha=p.opacity;c.translate(p.x,p.y);c.rotate(p.rotation);if(!drawIceIngredient(c,'toppings',p.id,-p.size/2,-p.size/2,p.size,p.size))oval(c,0,0,p.size*.42,p.size*.3,toppingColors[p.id]||'#735044');c.restore();}return;}
 const ids=milkshakeChunkKinds(r);for(let k=0;k<ids.length;k++)for(let i=0;i<32;i++){const seed=i+k*37,x=Math.sin(seed*12.37)*49,y=top+(bottom-top)*((seed*.618)%1),size=1.2+seed%4*.6;oval(c,x,y,size,size*.65,toppingColors[ids[k]]||'#765348');}
}
export function drawMilkshakeBowl(c,r,x=450,y=440){
 c.save();c.translate(x,y);oval(c,0,56,139,15,'#75546b28');
 const ids=(r.flavors??[r.flavor]).filter(id=>ICE_FLAVORS[id]);ids.forEach((id,i)=>{const xx=ids.length===1?0:(i-(ids.length-1)/2)*65,yy=-110-(i%2)*28;if(!drawIceIngredient(c,'flavors',id,xx-64,yy,128,107))oval(c,xx,yy+52,60,49,ICE_FLAVORS[id].color);});
 drawIceToppingScatter(c,r.toppings,ids.map((id,i)=>({x:ids.length===1?0:(i-(ids.length-1)/2)*65,y:-64-(i%2)*28,rx:47,ry:30})));
 for(const id of r.toppings.filter(id=>['cream','redVelvetWhip','cherry','waferRolls'].includes(id))){const cherry=id==='cherry',size=cherry?32:65;drawIceIngredient(c,'toppings',id,-size/2,cherry?-151:-155,size,size);}
 c.save();c.beginPath();c.ellipse(0,-56,119,63,0,0,Math.PI*2);c.clip();for(const drop of r.sauceDrops||[]){const syrup=ICE_SYRUPS[drop.kind||'sauce'];if(!syrup)continue;const xx=drop.x*1.15,yy=377+drop.y*1.15-y;c.strokeStyle=syrup.color;c.lineWidth=4+Math.min(4,drop.amount*3);c.lineCap='round';c.beginPath();c.moveTo(xx-6,yy);c.quadraticCurveTo(xx+9,yy+9,xx-3,yy+20);c.stroke();}c.restore();
 c.fillStyle=gradient(c,-120,0,120,40,[[0,'#b8cbd5'],[.22,'#ffffff'],[.55,'#e6edf0'],[1,'#96aeba']]);c.beginPath();c.moveTo(-124,-52);c.bezierCurveTo(-117,80,117,80,124,-52);c.quadraticCurveTo(0,-24,-124,-52);c.fill();c.strokeStyle='#8fa8b5';c.lineWidth=2;c.stroke();c.strokeStyle='#fff';c.lineWidth=5;c.beginPath();c.ellipse(0,-52,124,13,0,0,Math.PI);c.stroke();oval(c,0,49,57,8,'#bfced6');c.restore();
}
function sparkle(c,x,y,size,alpha=1){c.save();c.globalAlpha=alpha;c.strokeStyle='#fff6b5';c.lineWidth=2;c.shadowColor='#fff2af';c.shadowBlur=12;c.beginPath();c.moveTo(x-size,y);c.lineTo(x+size,y);c.moveTo(x,y-size);c.lineTo(x,y+size);c.stroke();c.restore();}
export function drawMilkshakeStraw(c,points,{width=10,color='#e7658f'}={}){c.save();c.lineCap='round';c.lineJoin='round';c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle='#fff7f2';c.lineWidth=width+2;c.stroke();c.strokeStyle=color;c.lineWidth=width;c.setLineDash?.([width,width]);c.stroke();c.restore();}
export function drawMilkshakeGlass(c,r,x,y,{scale=1,remaining=1,time=0,reduced=false,straw=true}={}){
 c.save();c.translate(x,y);c.scale(scale,scale);const view=milkshakeBlendView(r),blended=view.phase==='ready',top=-245+219*(1-clamp(remaining));
 // A reusable, ribbed glass encloses both the liquid and the topping fragments.
 oval(c,0,1,69,11,'#71596b22');c.save();liquidPath(c);c.clip();c.fillStyle=gradient(c,-60,-220,60,-20,[[0,'#e3f4f534'],[.45,'#ffffff18'],[1,'#a1c1d44d']]);c.fillRect(-65,-250,130,235);
 if(remaining>0){
  if(blended){c.fillStyle=gradient(c,-55,top,55,-26,[[0,milkshakeColor(r)],[.3,milkshakeColor(r)],[.8,milkshakeColor(r)],[1,'#927267']]);c.fillRect(-65,top,130,-22-top);c.fillStyle=gradient(c,-58,0,58,0,[[0,'#42261966'],[.22,'#ffffff00'],[.45,'#fff6e32e'],[.75,'#ffffff00'],[1,'#42261955']]);c.fillRect(-65,top,130,-22-top);bits(c,r,{top:top+8,bottom:-38});for(const id of [...new Set([...r.toppings.filter(id=>ICE_SYRUPS[id]),...(r.flavors?.includes('chocolate')?['sauce']:[])])]){const color=ICE_SYRUPS[id].color;for(let i=0;i<5;i++){const xx=-44+i*22;c.strokeStyle=color+'cc';c.lineWidth=4+i%3;c.lineCap='round';c.beginPath();c.moveTo(xx,top+3);c.bezierCurveTo(xx+5,top+30,xx-8,top+40+i*15,xx-3,Math.min(-28,top+55+i*24));c.stroke();}oval(c,0,-27,43,8,color+'99');}}

  else{const ids=(Array.isArray(r.flavors)?r.flavors:[r.flavor]).filter(id=>ICE_FLAVORS[id]);if(ids.length){c.fillStyle=milkshakeColor(r);c.fillRect(-65,-115,130,94);}ids.forEach((id,i)=>{const sy=-150-i*43;if(!drawIceIngredient(c,'flavors',id,-49,sy,98,85,{stretch:true}))oval(c,0,sy+42,49,40,ICE_FLAVORS[id]?.color||'#ffe5c0');});if(ids.length)bits(c,r,{top:-228,bottom:-54,progress:0});}
 }
 c.restore();
 c.fillStyle=gradient(c,-67,-200,67,-200,[[0,'#f3ffffa6'],[.12,'#b5cede36'],[.45,'#ffffff00'],[.85,'#c9e3ef22'],[1,'#faffffc2']]);c.beginPath();c.moveTo(-65,-250);c.lineTo(65,-250);c.bezierCurveTo(61,-147,53,-61,24,-32);c.quadraticCurveTo(12,-20,7,-18);c.lineTo(7,-3);c.lineTo(-7,-3);c.lineTo(-7,-18);c.quadraticCurveTo(-12,-20,-24,-32);c.bezierCurveTo(-53,-61,-61,-147,-65,-250);c.closePath();c.fill();c.strokeStyle='#9eb4c5';c.lineWidth=2;c.stroke();
 for(const xx of [-44,-24,24,44]){c.strokeStyle='#ffffff70';c.lineWidth=3;c.beginPath();c.moveTo(xx,-227);c.bezierCurveTo(xx*.96,-139,xx*.65,-61,xx*.3,-35);c.stroke();}
 c.strokeStyle='#faffffdd';c.lineWidth=5;c.beginPath();c.moveTo(-53,-225);c.lineTo(-39,-33);c.stroke();oval(c,0,-249,65,10,'#effcff5e');c.strokeStyle='#f9ffff';c.lineWidth=3;c.beginPath();c.ellipse(0,-249,65,10,0,0,Math.PI*2);c.stroke();oval(c,0,0,51,9,'#b0c3d49e');oval(c,0,-3,45,5,'#f9ffffa6');
 if(blended&&remaining>.94){
  oval(c,0,-247,54,9,'#fff5e6');
  // Piped whipped cream, shaded folds, and a chocolate garnish like a parlor sundae glass.
  for(let i=0;i<7;i++){const w=47-i*6,yy=-252-i*8;c.fillStyle=gradient(c,-w,yy-8,w,yy+5,[[0,'#d9c7b2'],[.35,'#fffdf5'],[.65,'#fff8ea'],[1,'#e1d0ba']]);c.beginPath();c.ellipse((i%2?3:-2),yy,w,9,0,0,Math.PI*2);c.fill();}
  c.fillStyle='#fff9ed';c.beginPath();c.moveTo(-7,-296);c.quadraticCurveTo(12,-311,6,-319);c.quadraticCurveTo(25,-298,9,-292);c.fill();
  if(r.flavors?.includes('chocolate')||milkshakeChunkKinds(r).some(id=>['oreo','chocolatePieces','chips'].includes(id))){c.save();c.translate(-27,-294);c.rotate(-.4);c.fillStyle='#4f2a1d';c.fillRect(-24,-42,48,45);c.strokeStyle='#a67252';c.lineWidth=2;for(let i=0;i<2;i++)for(let j=0;j<2;j++)c.strokeRect(-20+i*22,-38+j*20,18,16);c.restore();}
  if(r.toppings.includes('cherry'))drawIceIngredient(c,'toppings','cherry',14,-329,43,43);
 }

 if(straw)drawMilkshakeStraw(c,[[13,-24],[39,-261],[72,-331]],{width:9});
 if(view.sparkle>0&&remaining>.95)for(let i=0;i<9;i++){const angle=i*2.4,xx=Math.cos(angle)*(77+i%3*7),yy=-290+i*31;const a=reduced?view.sparkle:view.sparkle*(.55+.45*Math.sin(time*5+i));sparkle(c,xx,yy,5+i%3*2,a);}
 c.restore();
}
export function drawMilkshakeBlender(c,r,x=450,y=505,{reduced=false}={}){
 const v=milkshakeBlendView(r),moving=v.phase==='blending',t=reduced?0:v.time,shake=moving&&!reduced?Math.sin(t*70)*2:0;c.save();c.translate(x+shake,y);
 // Rounded chrome motor, clear tapered jug, and separate handle and lid.
 c.strokeStyle='#c5d2dc';c.lineWidth=15;c.beginPath();c.moveTo(99,-297);c.bezierCurveTo(170,-310,169,-119,89,-132);c.stroke();c.strokeStyle='#ffffffbb';c.lineWidth=5;c.stroke();
 c.save();shape(c,[[-105,-317],[105,-317],[78,-91],[-78,-91]]);c.clip();c.fillStyle='#d5ecf440';c.fillRect(-110,-325,220,240);
 if(moving){c.fillStyle=gradient(c,-95,-280,95,-100,[[0,milkshakeColor(r)],[.5,milkshakeColor(r)],[1,'#967568']]);c.fillRect(-110,-297,220,210);bits(c,r,{time:t,swirl:true,progress:v.progress});
 // Opaque ice cream conceals pieces at the back; only small surface ripples and bubbles remain.
 oval(c,0,-293,96,8,milkshakeColor(r));for(let i=0;i<13;i++){const xx=Math.sin(i*13.7+t*1.2)*78,yy=-286+(i*29+t*17)%178;oval(c,xx,yy,1.2+i%3,.8+i%2,'#ffffff28');}}

 else{const ids=r.flavors?.length?r.flavors:[r.flavor];ids.forEach((id,i)=>drawIceIngredient(c,'flavors',id,-78,-182-i*43,156,108,{stretch:true}));r.toppings.forEach((id,i)=>drawIceIngredient(c,'toppings',id,-64+i*44,-291+i%2*28,65,60));}
 c.restore();c.strokeStyle='#99b4c8';c.lineWidth=3;shape(c,[[-105,-317],[105,-317],[78,-91],[-78,-91]]);c.stroke();c.strokeStyle='#f7ffffb3';c.lineWidth=9;c.beginPath();c.moveTo(-91,-300);c.lineTo(-68,-111);c.stroke();
 for(let i=0;i<5;i++){c.strokeStyle='#7e95a0';c.lineWidth=2;c.beginPath();c.moveTo(70,-145-i*28);c.lineTo(90,-145-i*28);c.stroke();}
 c.fillStyle='#384254';c.beginPath();c.roundRect(-115,-335,230,23,10);c.fill();c.fillStyle='#a7b8c6';c.beginPath();c.roundRect(-29,-354,58,21,6);c.fill();c.fillStyle='#3e4857';c.beginPath();c.roundRect(-85,-98,170,20,8);c.fill();
 c.fillStyle=gradient(c,-122,-83,122,-5,[[0,'#e7eff3'],[.36,'#8c9aa9'],[.65,'#e4eaf1'],[1,'#798494']]);c.beginPath();c.roundRect(-123,-83,246,90,[24,24,32,32]);c.fill();oval(c,0,-38,29,29,'#465269');oval(c,0,-38,21,21,moving?'#d8bfef':'#d9e4ea');c.strokeStyle=moving?'#ae71c4':'#667c8b';c.lineWidth=4;c.beginPath();c.arc(0,-38,13,-Math.PI/2,-Math.PI/2+(moving?v.progress:0)*Math.PI*2);c.stroke();
 if(v.count){c.fillStyle='#15223cd9';c.beginPath();c.roundRect(-70,-269,140,115,24);c.fill();c.fillStyle='#fff2bb';c.textAlign='center';c.font='800 84px system-ui';c.fillText(String(v.count),0,-182);}
 c.restore();c.textAlign='center';c.fillStyle='#553b52';c.font='800 25px system-ui';c.fillText(v.count?'Ready to blend · '+v.count:'Blending your toppings! '+Math.round(v.progress*100)+'%',450,554);c.font='17px system-ui';c.fillText(v.count?'Watch your ingredients go into the blender':'Blending and chopping your mix-ins into a creamy shake',450,583);
}
export function milkshakeMouthPoint(x,y,time=0,open=false){const b=PLAY_ART.objects.bounds[open?15:14],s=Math.min(245/b.w,260/b.h),w=b.w*s,h=b.h*s,angle=Math.sin(time*3)*.015,rx=(.16-.5)*w,ry=(.29-1)*h;return {x:x+28+Math.cos(angle)*rx-Math.sin(angle)*ry,y:y+197+Math.sin(angle)*rx+Math.cos(angle)*ry};}
export const MILKSHAKE_STRAW_TIP={x:460,y:293};
const ease=v=>{v=clamp(v);return v*v*(3-2*v);};
export function milkshakeDragonPose(time,{reduced=false}={}){
 const v=milkshakeDrinkView(time),approach=ease(time/1.5),retreat=ease((time-6)/.6),talk=time-MILKSHAKE_THANKS;
 const syllables=[[0,.2],[.33,.59],[.76,1.06]],speaking=syllables.some(([a,b])=>talk>=a&&talk<b);
 const open=(time>=1.05&&time<1.5)||speaking,mouth={x:850+(MILKSHAKE_STRAW_TIP.x-850)*approach+retreat*95,y:MILKSHAKE_STRAW_TIP.y},offset=milkshakeMouthPoint(0,0,0,open),x=mouth.x-offset.x,y=mouth.y-offset.y;
 const swallows=[];
 if(v.drinking&&!reduced)for(let i=0;i<7;i++){const age=time-(1.65+i*.6);if(age>=0&&age<.52)swallows.push({progress:age/.52,strength:Math.sin(Math.PI*age/.52)});}
 return {...v,x,y,mouth,open,sealed:v.drinking,retreat,speaking,swallows};
}
function drawMilkshakeSwallow(c,pose){
 const sprite=playSprite('objects',14),b=PLAY_ART.objects.bounds[14],scale=Math.min(245/b.w,260/b.h),left=pose.x+28-b.w*scale/2,top=pose.y+197-b.h*scale;
 for(const swallow of pose.swallows){const p=swallow.progress,sy=b.h*(.36+p*.27),cx=b.w*(.25+p*.07),width=b.w*.17,height=15,amount=swallow.strength;
  // Magnify the dragon's own neck scales into a traveling bulge, keeping the skin attached.
  if(sprite){c.save();c.beginPath();c.ellipse(left+cx*scale,top+sy*scale,width*scale*.63,height*scale*.72,0,0,Math.PI*2);c.clip();c.drawImage(sprite.image,b.x+cx-width/2,b.y+sy-height/2,width,height,left+(cx-width/2)*scale-9*amount,top+(sy-height/2)*scale,width*scale+14*amount,height*scale);c.restore();}
  const xx=left+cx*scale-8,yy=top+sy*scale;c.save();c.globalAlpha=amount*.75;c.strokeStyle='#b08ab6';c.lineWidth=1.5;c.beginPath();c.ellipse(xx,yy,9+amount*3,6,-.2,.18,Math.PI*.9);c.stroke();c.strokeStyle='#fff4da';c.lineWidth=2;c.beginPath();c.ellipse(xx,yy-3,8,4,-.2,Math.PI*1.05,Math.PI*1.8);c.stroke();c.restore();
 }
}
export function drawMilkshakeDrink(c,r,time,drawDragon,reduced=false){
 const pose=milkshakeDragonPose(time,{reduced}),{x,y}=pose;
 // The straw stays fixed: the dragon walks to its tip, then backs away after drinking.
 drawDragon(c,x,y,0,pose.open?.65:.1);drawMilkshakeSwallow(c,pose);
 drawMilkshakeGlass(c,r,380,500,{scale:.72,remaining:1-pose.consumed,time,reduced,straw:false});
 drawMilkshakeStraw(c,[[389,480],[408,329],[440,293],[MILKSHAKE_STRAW_TIP.x,MILKSHAKE_STRAW_TIP.y]],{width:7});
 if(pose.sealed){const {x:mx,y:my}=pose.mouth;
  // Front lip overlaps the inserted tip, while the cheek gently tightens with each sip.
  const sip=reduced?0:Math.sin(time*12)*.6;c.save();c.strokeStyle='#9d70b4';c.lineWidth=3.8;c.lineCap='round';c.beginPath();c.ellipse(mx+2,my,5+ sip,6,0,-Math.PI*.45,Math.PI*.45);c.stroke();c.strokeStyle='#e1c2ec';c.lineWidth=1.2;c.beginPath();c.ellipse(mx+2,my,5+sip,6,0,-Math.PI*.45,.1);c.stroke();c.restore();
 }
 c.fillStyle='#533e4a';c.textAlign='center';c.font='22px system-ui';if(!pose.thanks)c.fillText(pose.drinking?(r.funny?'Slurp! Gulp!':'Your dragon is drinking through the straw.'):time>=6?'One delicious milkshake, all finished.':'Your dragon is coming over for a milkshake.',450,566);
 if(pose.thanks){c.fillStyle='#fff8e8';c.beginPath();c.roundRect(194,160,292,95,22);c.fill();c.fillStyle='#533e4a';c.font='800 32px system-ui';c.fillText('Yum! Thank you!',340,219);c.font='22px system-ui';c.fillText('One very happy dragon.',450,566);}
}
