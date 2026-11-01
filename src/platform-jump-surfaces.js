// Every prop's flat top is the same surface used by the landing physics.
export const JUMP_SURFACES=['barrels','food cart','wagon','wheelbarrow','boards','platform'];
export function jumpSurface(number){return number===0?'ground':number===48?'finish':JUMP_SURFACES[(number-1)%JUMP_SURFACES.length];}
function rect(c,x,y,w,h,color,r=2){c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();}
function line(c,x,y,x2,y2,color,width=2){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.stroke();}
function wheel(c,x,y,r=12){c.fillStyle='#303843';c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();c.strokeStyle='#adb9bd';c.lineWidth=2;for(let i=0;i<6;i++){const a=i*Math.PI/3;line(c,x,y,x+Math.cos(a)*(r-3),y+Math.sin(a)*(r-3),'#adb9bd');}c.fillStyle='#e4c28b';c.beginPath();c.arc(x,y,3,0,Math.PI*2);c.fill();}
function wood(c,x,y,w,h){rect(c,x,y,w,h,'#af713b');for(let j=0;5+j*7<h-1;j++){line(c,x+4,y+5+j*7,x+w-4,y+6+j*7,'#d59c5a',1); }for(const xx of [x+7,x+w-7])rect(c,xx,y+3,3,3,'#4c4945',1);}
export function drawJumpSurface(c,p,number,y){const kind=jumpSurface(number),x=p.x-p.w/2,w=p.w;c.save();
 if(kind==='barrels'){
  const count=3,bw=w/count;for(let j=0;j<count;j++){const bx=x+j*bw;rect(c,bx+1,y,bw-2,54,'#a56b38',9);for(let k=1;k<5;k++)line(c,bx+k*bw/5,y+5,bx+k*bw/5,y+49,'#d09552',2);for(const yy of [y+10,y+39])rect(c,bx+1,yy,bw-2,7,'#53616a',2);rect(c,bx,y,bw,5,'#ead0a0');}
 }else if(kind==='food cart'){
  for(const xx of [x+23,x+w-23])wheel(c,xx,y+66,11);rect(c,x+12,y+27,w-24,34,'#51a9a4',4);wood(c,x+7,y+22,w-14,6);for(const xx of [x+10,x+w-13])rect(c,xx,y+8,3,25,'#475564');
  // The striped canopy is the landing surface; food sits below it.
  for(let j=0;j<8;j++)rect(c,x+j*w/8,y,w/8+.5,14,j%2?'#fff2d5':'#df675b',2);
  for(let j=0;j<5;j++){c.fillStyle=['#e8b55c','#df6e44','#83b450'][j%3];c.beginPath();c.ellipse(x+30+j*15,y+20,6,4,0,0,Math.PI*2);c.fill();}
 }else if(kind==='wagon'){
  for(const xx of [x+22,x+w-22])wheel(c,xx,y+46,16);rect(c,x+8,y+5,w-16,31,'#9b5037',3);for(let j=0;j<3;j++)wood(c,x+4,y+j*10,w-8,8);for(const xx of [x+12,x+w-17])rect(c,xx,y+3,5,30,'#634936');rect(c,x,y,w,5,'#e6b779');line(c,x+w-15,y+30,x+w+13,y+19,'#534536',4);
 }else if(kind==='wheelbarrow'){
  wheel(c,x+28,y+46,14);line(c,x+w-30,y+28,x+w-21,y+49,'#51636a',4);line(c,x+29,y+40,x+w-14,y+20,'#51636a',4);rect(c,x,y,w,6,'#a7d1ab',3);c.fillStyle='#509475';c.beginPath();c.moveTo(x+3,y+6);c.lineTo(x+w-4,y+6);c.lineTo(x+w-25,y+31);c.lineTo(x+22,y+31);c.closePath();c.fill();line(c,x+w-17,y+20,x+w+12,y+15,'#966038',5);
 }else if(kind==='boards'){
  wood(c,x,y,w,12);wood(c,x+5,y+13,w-10,9);for(const xx of [x+23,x+w-31])rect(c,xx,y+2,8,24,'#856548',2);
 }else{
  rect(c,x,y,w,19,kind==='ground'?'#68a877':kind==='finish'?'#f1c45e':'#f7f5ec',7);rect(c,x,y+13,w,12,kind==='finish'?'#ac7e36':'#8bb9c1',5);
 }
 if(number>0){rect(c,p.x-16,y+6,32,23,'#fff8e5',5);c.fillStyle='#34414c';c.font='800 15px system-ui';c.textAlign='center';c.fillText(String(number),p.x,y+23);}
 c.restore();
}
