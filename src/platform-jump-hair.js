export const JUMP_HAIR=['Short','Short waves','Side swept','Spikes','Tousled','Center part','Curls','Afro','Bob with bangs','Long','Long waves','Ponytail','High ponytail','Pigtails','Braids','Bun','Double buns','Half-up bun','Bald'];
// Continuous silhouettes and directional strands keep the hair readable at game scale.
function shape(c,commands){c.beginPath();for(const [method,...args] of commands)c[method](...args);c.closePath();c.fill();}
function strand(c,x,y,endX,endY,bend=0){c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+bend,y+8,endX-bend,endY-9,endX,endY);c.stroke();}
export function drawJumpHair(c,style,color,layer,time=0){
 if(style==='Bald')return;
 c.save();
 const shade=c.createLinearGradient(-25,-90,28,-35);shade.addColorStop(0,color);shade.addColorStop(.42,color);shade.addColorStop(1,'#171321');c.fillStyle=shade;
 const long=['Long','Long waves','Half-up bun'].includes(style),bob=style==='Bob with bangs';
 const sway=Math.sin(time*2.5)*1.3;
 if(layer==='back'){
  if(long||bob){const bottom=bob?-48:-25;shape(c,[['moveTo',-18,-83],['bezierCurveTo',-34,-70,-23,-58,-29+sway,bottom-12],['bezierCurveTo',-34+sway,bottom+3,-17,bottom+7,-10,bottom-3],['lineTo',12,bottom-3],['bezierCurveTo',30,bottom+6,36,bottom-5,28+sway,bottom-19],['bezierCurveTo',22,-66,32,-73,17,-85]]);
   if(style==='Long waves'){for(const side of [-1,1]){c.save();c.scale(side,1);shape(c,[['moveTo',17,-80],['bezierCurveTo',40,-65,17,-59,29,-47],['bezierCurveTo',43,-31,19,-28,25,-16],['bezierCurveTo',8,-24,30,-33,18,-43],['bezierCurveTo',5,-58,29,-65,17,-80]]);c.restore();}}
   c.strokeStyle='#ffffff28';c.lineWidth=.7;for(const side of [-1,1])for(let j=0;j<4;j++)strand(c,side*(16+j*2),-78,side*(14+j*3)+sway,bottom,side*5);
  }
  const braid=style==='Braids';
  if(['Ponytail','High ponytail','Pigtails','Braids'].includes(style))for(const side of (['Pigtails','Braids'].includes(style)?[-1,1]:[1])){c.save();c.translate(side*22,style==='High ponytail'?-86:-72);c.rotate(side*.13+Math.sin(time*2.5)*.035);
   if(braid){for(let j=0;j<7;j++){shape(c,[['moveTo',-2,-2+j*6],['bezierCurveTo',-12+j*.6,j*6,7-j*.4,10+j*6,3,10+j*6],['bezierCurveTo',13-j*.8,6+j*6,-2,1+j*6,-2,-2+j*6]]);}shape(c,[['moveTo',0,43],['lineTo',-3,51],['quadraticCurveTo',7,49,4,43]]);}
   else shape(c,[['moveTo',-3,0],['bezierCurveTo',21,-8,23,16,12,26],['bezierCurveTo',5,34,14,39,5,43],['bezierCurveTo',9,29,-8,26,-6,14],['quadraticCurveTo',-8,5,-3,0]]);
   c.strokeStyle='#ffffff30';c.lineWidth=.8;for(let j=0;j<3;j++)strand(c,j*3,2,3+j,braid?42:32,6);c.restore();}
  if(['Bun','Half-up bun','Double buns'].includes(style))for(const x of (style==='Double buns'?[-21,21]:[style==='Half-up bun'?7:0])){shape(c,[['moveTo',x-11,-91],['bezierCurveTo',x-21,-111,x+16,-114,x+13,-97],['quadraticCurveTo',x+10,-86,x-11,-91]]);c.strokeStyle='#ffffff35';c.lineWidth=.8;for(let j=0;j<4;j++){c.beginPath();c.ellipse(x,-101,5+j*2,3+j, -.3, .2,Math.PI*1.7);c.stroke();}}
  if(style==='Afro'){c.beginPath();for(let i=0;i<64;i++){const a=i*Math.PI/32,r=29+Math.sin(i*2.5)*2;c.lineTo(Math.cos(a)*r,-77+Math.sin(a)*r);}c.closePath();c.fill();}
 }else{
  const part=['Center part','Long waves','Braids','Pigtails','Half-up bun','Long'].includes(style);
  shape(c,[['moveTo',-21,-65],['bezierCurveTo',-28,-89,-9,-98,5,-92],['bezierCurveTo',25,-94,28,-78,21,-64],['lineTo',17,-77],['quadraticCurveTo',8,-78,part?1:12,part?-87:-81],['quadraticCurveTo',-9,-75,-18,-76]]);
  if(bob){shape(c,[['moveTo',-19,-84],['quadraticCurveTo',1,-94,19,-84],['lineTo',18,-73],['lineTo',12,-72],['lineTo',10,-77],['lineTo',8,-72],['lineTo',2,-73],['lineTo',0,-78],['lineTo',-2,-73],['lineTo',-17,-73]]);}
  if(['Spikes','Tousled','Side swept','Short waves'].includes(style)){shape(c,[['moveTo',-22,-79],['quadraticCurveTo',-28,-90,-23,-94],['lineTo',-17,-91],['quadraticCurveTo',-9,-100,-4,-99],['lineTo',-7,-94],['quadraticCurveTo',10,-103,21,-96],['lineTo',15,-92],['quadraticCurveTo',29,-94,25,-87],['quadraticCurveTo',14,-78,-4,-80]]);}
  c.strokeStyle='#ffffff38';c.lineWidth=.65;
  for(let j=0;j<9;j++){const x=-17+j*4;strand(c,part?(x<0?-1:2):14,-90+Math.abs(x)*.09,x,-77,part?(x<0?-8:8):-12);}
  if(['Curls','Short waves','Afro'].includes(style)){c.strokeStyle='#ffffff24';for(let j=0;j<10;j++){c.beginPath();c.arc(-20+j*4.4,-84+Math.sin(j*2)*3,3.5,.3,Math.PI*1.8);c.stroke();}}
 }
 c.restore();
}
