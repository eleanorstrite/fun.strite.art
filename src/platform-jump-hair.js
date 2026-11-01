export const JUMP_HAIR=['Short','Short waves','Side swept','Spikes','Tousled','Center part','Curls','Afro','Bob with bangs','Long','Long waves','Ponytail','High ponytail','Pigtails','Braids','Bun','Double buns','Half-up bun','Bald'];
function oval(c,x,y,rx,ry){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();c.save();c.clip();c.strokeStyle='#ffffff14';c.lineWidth=.7;for(let i=-3;i<=3;i++){c.beginPath();c.moveTo(x+i*rx/4,y-ry);c.quadraticCurveTo(x+i*rx/3-rx*.25,y,x+i*rx/4,y+ry);c.stroke();}c.restore();}
function lock(c,x,y,w,h,angle=0){c.save();c.translate(x,y);c.rotate(angle);oval(c,0,0,w,h);c.restore();}
export function drawJumpHair(c,style,color,layer,time=0){if(style==='Bald')return;c.save();const shade=c.createLinearGradient(-25,-100,24,-45);shade.addColorStop(0,'#'+[1,3,5].map(i=>Math.min(255,parseInt(color.slice(i,i+2),16)+24).toString(16).padStart(2,'0')).join(''));shade.addColorStop(.4,color);shade.addColorStop(.65,'#'+[1,3,5].map(i=>Math.max(0,parseInt(color.slice(i,i+2),16)-30).toString(16).padStart(2,'0')).join(''));shade.addColorStop(1,color);c.fillStyle=shade;const sway=Math.sin(time*2.5)*.035;
 if(layer==='back'){
  if(['Long','Long waves','Half-up bun'].includes(style)){for(const side of [-1,1]){lock(c,side*19,-61,11,31,side*sway);if(style==='Long waves')for(let j=0;j<4;j++)oval(c,side*(21+j%2*3),-77+j*12,9,10);}}
  if(style==='Bob with bangs')for(const side of [-1,1])lock(c,side*19,-67,9,23);
  if(['Ponytail','High ponytail'].includes(style))lock(c,28,style==='Ponytail'?-63:-78,12,25,sway-.2);
  if(['Pigtails','Braids'].includes(style))for(const side of [-1,1]){if(style==='Pigtails')lock(c,side*28,-61,11,24,side*.15+sway);else{for(let j=0;j<6;j++)oval(c,side*(22+j%2*2),-73+j*7,6-j*.35,6);c.fillStyle='#ed99b9';oval(c,side*23,-33,5,3);c.fillStyle=color;}}
  if(['Bun','Half-up bun'].includes(style))oval(c,style==='Half-up bun'?8:0,-98,13,12);
  if(style==='Double buns')for(const side of [-1,1])oval(c,side*22,-91,12,12);
  if(style==='Afro'){for(let i=0;i<16;i++){const a=i*Math.PI*2/16;oval(c,Math.cos(a)*22,-77+Math.sin(a)*20,10,10);}}
 }else{
  // A fitted cap and curved hairline replace the floating oval fringe.
  c.beginPath();c.moveTo(-20,-66);c.bezierCurveTo(-27,-90,-12,-99,4,-96);c.bezierCurveTo(25,-98,25,-80,20,-65);c.lineTo(17,-78);c.bezierCurveTo(8,-80,-4,-87,-16,-77);c.closePath();c.fill();
  if(['Short','Short waves','Side swept'].includes(style)){
   c.beginPath();c.moveTo(-21,-82);c.bezierCurveTo(-26,-89,-23,-90,-27,-92);c.bezierCurveTo(-15,-89,-13,-104,2,-97);c.bezierCurveTo(12,-102,26,-92,21,-85);c.bezierCurveTo(14,-76,8,-81,1,-84);c.bezierCurveTo(-7,-77,-16,-79,-21,-82);c.fill();
   c.strokeStyle='#ffffff38';c.lineWidth=.8;for(let i=0;i<5;i++){c.beginPath();c.moveTo(-20+i*2,-90+i);c.bezierCurveTo(-7,-98+i,4,-85+i,17,-88+i*.5);c.stroke();}
   if(style==='Short waves'){c.strokeStyle='#21150f55';for(let i=0;i<3;i++){c.beginPath();c.moveTo(-17+i*9,-87);c.bezierCurveTo(-14+i*9,-93,-8+i*9,-85,-4+i*9,-88);c.stroke();}}
  }
  if(['Side swept','Tousled','Ponytail','High ponytail'].includes(style)){lock(c,-6,-81,16,8,-.35);lock(c,12,-76,8,13,-.65);}
  if(['Center part','Long waves','Braids','Pigtails','Half-up bun'].includes(style)){lock(c,-11,-80,13,8,-.5);lock(c,11,-80,13,8,.5);}
  if(['Bob with bangs','Long'].includes(style)){for(let i=0;i<5;i++)lock(c,-16+i*8,-77,5,10,i===4?-.15:0);}
  if(style==='Curls'||style==='Afro')for(let i=0;i<8;i++)oval(c,(i-3.5)*6,-84+Math.abs(i-3.5)*2,style==='Afro'?9:7,8);
  if(style==='Spikes'||style==='Tousled')for(let i=0;i<6;i++){c.beginPath();c.moveTo(-23+i*8,-81);c.lineTo(-20+i*8+(style==='Tousled'?8:0),-99+(i%3)*4);c.lineTo(-12+i*8,-79);c.fill();}
  // Fine highlights distinguish partings and swept strands even on dark hair.
  if(!['Short','Spikes','Curls','Afro'].includes(style)){c.strokeStyle='#ffffff35';c.lineWidth=1;for(const side of [-1,1]){c.beginPath();c.moveTo(side*2,-87);c.quadraticCurveTo(side*14,-89,side*19,-77);c.stroke();}}
 }
 c.restore();}
