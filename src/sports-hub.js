export const SPORTS_BUILDINGS=[{sport:'bowling',name:'BOWLING',x:480,y:245,color:'#29c5db'},{sport:'tennis',name:'TENNIS',x:220,y:475,color:'#4c88d0'},{sport:'basketball',name:'BASKETBALL',x:740,y:475,color:'#d96b50'}];
export function drawSportsHub(c){
 c.save();c.scale(c.canvas.width/960,c.canvas.height/600);const g=c.createLinearGradient(0,0,0,600);g.addColorStop(0,'#aedfe4');g.addColorStop(.28,'#90be70');g.addColorStop(1,'#3d8b59');c.fillStyle=g;c.fillRect(0,0,960,600);
 for(let i=0;i<850;i++){const x=(i*137)%960,y=135+(i*79)%465;c.strokeStyle=i%2?'#add38270':'#306a4735';c.beginPath();c.moveTo(x,y);c.lineTo(x+2,y-5);c.stroke();}
 c.strokeStyle='#dfceb0';c.lineWidth=30;c.lineJoin='round';c.beginPath();c.moveTo(480,245);c.lineTo(220,500);c.lineTo(740,500);c.closePath();c.stroke();c.beginPath();c.moveTo(480,600);c.lineTo(480,500);c.stroke();
 c.fillStyle='#1d5141';c.font='bold 29px system-ui';c.textAlign='center';c.fillText('ANIMAL CHAMPIONSHIP PARK',480,38);
 for(const b of SPORTS_BUILDINGS){c.save();c.translate(b.x,b.y);c.fillStyle='#173d343a';c.beginPath();c.ellipse(0,18,155,28,0,0,Math.PI*2);c.fill();c.fillStyle='#d6e7e2';c.fillRect(-140,-125,280,130);c.fillStyle='#243d56';c.beginPath();c.moveTo(-158,-125);c.lineTo(-120,-173);c.lineTo(120,-173);c.lineTo(158,-125);c.closePath();c.fill();c.fillStyle=b.color;c.fillRect(-145,-133,290,15);
  for(let i=0;i<8;i++){c.fillStyle=i%2?'#8bd5e7':'#4b809b';c.fillRect(-126+i*32,-113,26,39);}c.fillStyle=b.sport==='bowling'?'#263768':'#aa474b';c.fillRect(-128,-63,256,39);for(let i=0;i<3;i++){c.fillStyle=b.sport==='bowling'?['#d878d6','#56cdea','#b6ed70'][i]:'#dc7774';c.fillRect(-128,-61+i*12,256,3);}
  c.fillStyle='#122c40';c.fillRect(-40,-46,80,52);c.fillStyle='#a6ddeb';c.fillRect(-34,-39,29,43);c.fillRect(5,-39,29,43);c.strokeStyle='#eef7ee';c.lineWidth=3;c.strokeRect(-40,-46,80,52);
  c.fillStyle='#142c45';c.fillRect(-130,-156,260,34);c.fillStyle='#fff2c4';c.font='bold 24px system-ui';c.fillText(b.name,0,-131);
  // Championship flags, floodlights and a court apron echo each reference arena.
  for(const side of [-1,1]){c.strokeStyle='#dae8e8';c.lineWidth=4;c.beginPath();c.moveTo(side*146,5);c.lineTo(side*146,-188);c.stroke();c.fillStyle=b.color;c.beginPath();c.moveTo(side*146,-186);c.lineTo(side*146+31,-177);c.lineTo(side*146,-165);c.fill();c.fillStyle='#fffbd0';c.fillRect(side*146-12,-146,24,7);}
  c.fillStyle=b.sport==='tennis'?'#588bd2':b.sport==='basketball'?'#e9b16b':'#bf8b55';c.fillRect(-110,12,220,30);c.strokeStyle='#ffffdf';c.lineWidth=1;c.strokeRect(-100,16,200,22);c.beginPath();c.moveTo(0,16);c.lineTo(0,38);c.stroke();c.restore();
 }
 c.restore();
}
