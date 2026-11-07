import {ICE_FLAVORS,ICE_TOPPINGS,ICE_SYRUPS} from './ice-settings.js';
import {drawIceIngredient} from './ice-art.js';
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
function liquidPath(c){shape(c,[[-57,-245],[57,-245],[43,-22],[-43,-22]]);}
function bits(c,r,{top=-235,bottom=-26,time=0,swirl=false,progress=1}={}){
 for(let kind=0;kind<r.toppings.length;kind++)for(let i=0;i<9;i++){
  const id=r.toppings[kind],seed=i+kind*11,depth=((i*.113+kind*.17+(swirl?time*.25:0))%1),angle=time*(swirl?9:0)+seed*2.4,radius=swirl?40*(.3+.7*depth):46;
  const x=Math.sin(angle)*radius,y=top+(bottom-top)*depth,size=swirl?25*(1-progress)+7:6+seed%5;
  c.save();c.translate(x,y);c.rotate(swirl?angle*.6:seed);if(!drawIceIngredient(c,'toppings',id,-size/2,-size/2,size,size)){oval(c,0,0,size*.3,size*.23,toppingColors[id]||'#e9b1bd');}c.restore();
 }
}
function sparkle(c,x,y,size,alpha=1){c.save();c.globalAlpha=alpha;c.strokeStyle='#fff6b5';c.lineWidth=2;c.shadowColor='#fff2af';c.shadowBlur=12;c.beginPath();c.moveTo(x-size,y);c.lineTo(x+size,y);c.moveTo(x,y-size);c.lineTo(x,y+size);c.stroke();c.restore();}
export function drawMilkshakeStraw(c,points,{width=10,color='#e7658f'}={}){c.save();c.lineCap='round';c.lineJoin='round';c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle='#fff7f2';c.lineWidth=width+2;c.stroke();c.strokeStyle=color;c.lineWidth=width;c.setLineDash?.([width,width]);c.stroke();c.restore();}
export function drawMilkshakeGlass(c,r,x,y,{scale=1,remaining=1,time=0,reduced=false,straw=true}={}){
 c.save();c.translate(x,y);c.scale(scale,scale);const view=milkshakeBlendView(r),blended=view.phase==='ready',top=-245+219*(1-clamp(remaining));
 // A reusable, ribbed glass encloses both the liquid and the topping fragments.
 oval(c,0,1,69,11,'#71596b22');c.save();liquidPath(c);c.clip();c.fillStyle=gradient(c,-60,-220,60,-20,[[0,'#e3f4f534'],[.45,'#ffffff18'],[1,'#a1c1d44d']]);c.fillRect(-65,-250,130,235);
 if(remaining>0){
  if(blended){c.fillStyle=gradient(c,-55,top,55,-26,[[0,'#fff3e2'],[.22,milkshakeColor(r)],[.8,milkshakeColor(r)],[1,'#a37a7166']]);c.fillRect(-65,top,130,-22-top);bits(c,r,{top:top+8,bottom:-28});for(const id of r.toppings.filter(id=>ICE_SYRUPS[id])){c.strokeStyle=ICE_SYRUPS[id].color+'8c';c.lineWidth=5;c.beginPath();c.moveTo(-43,top+3);c.bezierCurveTo(47,top+26,-48,top+57,41,Math.min(-28,top+95));c.stroke();}}
  else{const ids=(Array.isArray(r.flavors)?r.flavors:[r.flavor]).filter(id=>ICE_FLAVORS[id]);if(ids.length){c.fillStyle=milkshakeColor(r);c.fillRect(-65,-115,130,94);}ids.forEach((id,i)=>{const sy=-150-i*43;if(!drawIceIngredient(c,'flavors',id,-49,sy,98,85,{stretch:true}))oval(c,0,sy+42,49,40,ICE_FLAVORS[id]?.color||'#ffe5c0');});if(ids.length)bits(c,r,{top:-228,bottom:-54,progress:0});}
 }
 c.restore();
 c.fillStyle=gradient(c,-67,-200,67,-200,[[0,'#f3ffffa6'],[.12,'#b5cede36'],[.45,'#ffffff00'],[.85,'#c9e3ef22'],[1,'#faffffc2']]);shape(c,[[-65,-250],[65,-250],[48,-16],[35,-8],[-35,-8],[-48,-16]]);c.fill();c.strokeStyle='#9eb4c5';c.lineWidth=2;c.stroke();
 for(const xx of [-44,-24,24,44]){c.strokeStyle='#ffffff70';c.lineWidth=3;c.beginPath();c.moveTo(xx,-227);c.lineTo(xx*.7,-28);c.stroke();}
 c.strokeStyle='#faffffdd';c.lineWidth=5;c.beginPath();c.moveTo(-53,-225);c.lineTo(-39,-33);c.stroke();oval(c,0,-249,65,10,'#effcff5e');c.strokeStyle='#f9ffff';c.lineWidth=3;c.beginPath();c.ellipse(0,-249,65,10,0,0,Math.PI*2);c.stroke();oval(c,0,-9,51,9,'#b0c3d49e');oval(c,0,-13,45,5,'#f9ffffa6');
 if(blended&&remaining>.94){oval(c,0,-247,54,8,'#fff2df');if(r.toppings.includes('cream'))drawIceIngredient(c,'toppings','cream',-40,-318,80,78);if(r.toppings.includes('cherry'))drawIceIngredient(c,'toppings','cherry',14,-329,43,43);}
 if(straw)drawMilkshakeStraw(c,[[13,-24],[39,-261],[72,-331]],{width:9});
 if(view.sparkle>0&&remaining>.95)for(let i=0;i<9;i++){const angle=i*2.4,xx=Math.cos(angle)*(77+i%3*7),yy=-290+i*31;const a=reduced?view.sparkle:view.sparkle*(.55+.45*Math.sin(time*5+i));sparkle(c,xx,yy,5+i%3*2,a);}
 c.restore();
}
export function drawMilkshakeBlender(c,r,x=450,y=505,{reduced=false}={}){
 const v=milkshakeBlendView(r),moving=v.phase==='blending',t=reduced?0:v.time,shake=moving&&!reduced?Math.sin(t*70)*2:0;c.save();c.translate(x+shake,y);
 // Rounded chrome motor, clear tapered jug, and separate handle and lid.
 c.strokeStyle='#c5d2dc';c.lineWidth=15;c.beginPath();c.moveTo(99,-297);c.bezierCurveTo(170,-310,169,-119,89,-132);c.stroke();c.strokeStyle='#ffffffbb';c.lineWidth=5;c.stroke();
 c.save();shape(c,[[-105,-317],[105,-317],[78,-91],[-78,-91]]);c.clip();c.fillStyle='#d5ecf440';c.fillRect(-110,-325,220,240);
 if(moving){c.fillStyle=gradient(c,-95,-280,95,-100,[[0,'#fff3e1'],[.25,milkshakeColor(r)],[1,milkshakeColor(r)]]);c.fillRect(-110,-297,220,210);c.save();c.translate(0,-62);c.scale(1.9,.86);bits(c,r,{top:-250,bottom:-40,time:t,swirl:true,progress:v.progress});c.restore();for(let i=0;i<9;i++){c.strokeStyle=(ICE_FLAVORS[(r.flavors||[r.flavor])[i%(r.flavors?.length||1)]]?.color||'#fff7e3')+'a6';c.lineWidth=6-i*.35;c.beginPath();c.ellipse(Math.sin(t*8+i)*12,-272+i*20,82-i*4,9+i*.2,Math.sin(t*4+i)*.12,0,Math.PI*2);c.stroke();}}
 else{const ids=r.flavors?.length?r.flavors:[r.flavor];ids.forEach((id,i)=>drawIceIngredient(c,'flavors',id,-78,-182-i*43,156,108,{stretch:true}));r.toppings.forEach((id,i)=>drawIceIngredient(c,'toppings',id,-64+i*44,-291+i%2*28,65,60));}
 c.restore();c.strokeStyle='#99b4c8';c.lineWidth=3;shape(c,[[-105,-317],[105,-317],[78,-91],[-78,-91]]);c.stroke();c.strokeStyle='#f7ffffb3';c.lineWidth=9;c.beginPath();c.moveTo(-91,-300);c.lineTo(-68,-111);c.stroke();
 for(let i=0;i<5;i++){c.strokeStyle='#7e95a0';c.lineWidth=2;c.beginPath();c.moveTo(70,-145-i*28);c.lineTo(90,-145-i*28);c.stroke();}
 c.fillStyle='#384254';c.beginPath();c.roundRect(-115,-335,230,23,10);c.fill();c.fillStyle='#a7b8c6';c.beginPath();c.roundRect(-29,-354,58,21,6);c.fill();c.fillStyle='#3e4857';c.beginPath();c.roundRect(-85,-98,170,20,8);c.fill();
 c.fillStyle=gradient(c,-122,-83,122,-5,[[0,'#e7eff3'],[.36,'#8c9aa9'],[.65,'#e4eaf1'],[1,'#798494']]);c.beginPath();c.roundRect(-123,-83,246,90,[24,24,32,32]);c.fill();oval(c,0,-38,29,29,'#465269');oval(c,0,-38,21,21,moving?'#d8bfef':'#d9e4ea');c.strokeStyle=moving?'#ae71c4':'#667c8b';c.lineWidth=4;c.beginPath();c.arc(0,-38,13,-Math.PI/2,-Math.PI/2+(moving?v.progress:0)*Math.PI*2);c.stroke();
 if(v.count){c.fillStyle='#15223cd9';c.beginPath();c.roundRect(-70,-269,140,115,24);c.fill();c.fillStyle='#fff2bb';c.textAlign='center';c.font='800 84px system-ui';c.fillText(String(v.count),0,-182);}
 c.restore();c.textAlign='center';c.fillStyle='#553b52';c.font='800 25px system-ui';c.fillText(v.count?'Ready to blend · '+v.count:'Blending your toppings! '+Math.round(v.progress*100)+'%',450,554);c.font='17px system-ui';c.fillText(v.count?'Watch your ingredients go into the blender':'Watch the pieces swirl into your ice cream',450,583);
}
export function milkshakeMouthPoint(x,y,time=0,open=false){const b=PLAY_ART.objects.bounds[open?15:14],s=Math.min(245/b.w,260/b.h),w=b.w*s,h=b.h*s,angle=Math.sin(time*3)*.015,rx=(.16-.5)*w,ry=(.29-1)*h;return {x:x+28+Math.cos(angle)*rx-Math.sin(angle)*ry,y:y+197+Math.sin(angle)*rx+Math.cos(angle)*ry};}
export function drawMilkshakeDrink(c,r,time,drawDragon,reduced=false){const v=milkshakeDrinkView(time),x=900-v.arrive*300,y=277,open=!!r.funny&&v.drinking&&Math.sin(time*9)>.2;drawDragon(c,x,y,reduced?0:time,open?.45:.1);drawMilkshakeGlass(c,r,380,500,{scale:.72,remaining:1-v.consumed,time,reduced,straw:false});const mouth=milkshakeMouthPoint(x,y,reduced?0:time,open),connect=clamp((time-1)/.5),tip={x:432+(mouth.x-432)*connect,y:261+(mouth.y-261)*connect};drawMilkshakeStraw(c,[[389,480],[411,292],[432,261],[tip.x,tip.y]],{width:7});
 c.fillStyle='#533e4a';c.textAlign='center';c.font='22px system-ui';c.fillText(v.drinking?(r.funny?'Slurp! Gulp!':'Your dragon is drinking through the straw.'):'A delicious milkshake for your dragon.',450,566);
 if(v.thanks){c.fillStyle='#fff8e8';c.beginPath();c.roundRect(194,160,292,95,22);c.fill();c.fillStyle='#533e4a';c.font='800 32px system-ui';c.fillText('Yum! Thank you!',340,219);c.font='22px system-ui';c.fillText('One very happy dragon.',450,566);}
}
