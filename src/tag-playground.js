export const TAG_PLAY_STRUCTURES=[
 {id:'tunnel',name:'Fox den',meaning:'Run through · hop on the roof',x:85,y:465,w:170,color:'#d88e4c'},
 {id:'rainbow',name:'Rainbow dash fort',meaning:'Run faster across the color deck',x:330,y:335,w:240,color:'#cd6482'},
 {id:'treehouse',name:'Canopy lookout',meaning:'Climb high and choose your escape',x:645,y:240,w:190,color:'#64885a'},
 {id:'wall',name:'Boulder scramble',meaning:'Hold Jump on the colored holds',x:1000,y:430,w:180,color:'#d19354'},
 {id:'net',name:'Spiderweb climb',meaning:'Hold Jump anywhere on the net',x:1230,y:335,w:240,color:'#668fbc'},
 {id:'rocket',name:'Moonshot tower',meaning:'Jump from the top for a sky boost',x:1545,y:240,w:190,color:'#8b78c1'},
 {id:'bridge',name:'Skyline rope bridge',meaning:'A high shortcut over the chase',x:1770,y:350,w:230,color:'#b59362'},
 {id:'pirate',name:'Captain’s escape',meaning:'Take the fast blue escape slide',x:2130,y:335,w:240,color:'#b56a4c'},
 {id:'music',name:'Melody steps',meaning:'Land on the keys to ring a chime',x:2420,y:430,w:180,color:'#ad719e'},
];
export function tagPlayFeatureAt(layout,p){return (layout.structures||[]).find(t=>Math.abs(p.y-t.y)<1&&p.x>=t.x&&p.x<=t.x+t.w);}
export function tagClimbAt(layout,p){return (layout.structures||[]).find(t=>{if(p.y<=t.y||p.y>540||['tunnel','bridge','music'].includes(t.id))return false;if(t.id==='net')return p.x>t.x+30&&p.x<t.x+t.w-25;if(t.id==='wall')return p.x>t.x+12&&p.x<t.x+t.w-12;return Math.abs(p.x-(t.x+26))<20;});}
export function drawTagPlayStructure(c,t,time=0){
 const {x,y,w,id}=t,bottom=540,wood='#986a46',cream='#fff0ce',ink='#30475b';
 const round=(xx,yy,ww,hh,r,color)=>{c.fillStyle=color;c.beginPath();c.roundRect(xx,yy,ww,hh,r);c.fill();};
 const oval=(xx,yy,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(xx,yy,rx,ry,0,0,Math.PI*2);c.fill();};
 const line=(points,color,width=3)=>{c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.beginPath();points.forEach(([xx,yy],i)=>i?c.lineTo(xx,yy):c.moveTo(xx,yy));c.stroke();};
 const poly=(points,color)=>{c.fillStyle=color;c.beginPath();points.forEach(([xx,yy],i)=>i?c.lineTo(xx,yy):c.moveTo(xx,yy));c.closePath();c.fill();};
 const ladder=(xx,top)=>{round(xx-6,top,6,bottom-top,3,'#657f86');round(xx+32,top,6,bottom-top,3,'#657f86');for(let yy=top+15;yy<bottom;yy+=23)round(xx-6,yy,44,5,2,'#e0c398');};
 const label=(yy)=>{yy=Math.max(64,yy);round(x-2,yy,w+4,39,7,cream);c.textAlign='center';c.fillStyle=ink;c.font='700 12px system-ui';c.fillText(t.name.toUpperCase(),x+w/2,yy+15);c.font='10px system-ui';c.fillText(t.meaning,x+w/2,yy+30);};
 c.save();
 if(id==='tunnel'){
  round(x,bottom-75,w,75,34,'#9d6943');round(x+12,bottom-63,w-24,64,25,'#dfaa70');round(x+29,bottom-48,w-58,56,22,'#453d38');poly([[x+15,y+10],[x+30,y-22],[x+49,y+6]],'#b57745');poly([[x+w-49,y+6],[x+w-30,y-22],[x+w-15,y+10]],'#b57745');oval(x+43,y+28,5,5,'#392f2a');oval(x+w-43,y+28,5,5,'#392f2a');label(y-70);
 }else if(id==='rainbow'){
  for(const xx of [x+7,x+w-19])round(xx,y-70,12,bottom-y+70,5,'#b68b63');
  const colors=['#e86b70','#efa35e','#e7cf67','#83b67b','#69b8c8','#9b80c2'];for(let i=0;i<6;i++){round(x+i*w/6,y-61,w/6-3,62,3,colors[i]);poly([[x+i*w/6,y-76],[x+(i+.5)*w/6,y-122],[x+(i+1)*w/6,y-76]],colors[i]);}line([[x-8,y-74],[x+w+8,y-74]],'#efdbaa',5);for(let i=0;i<5;i++)poly([[x+50+i*35,y+35],[x+65+i*35,y+42],[x+50+i*35,y+49]],colors[i]);ladder(x+14,y);label(y-174);
 }else if(id==='treehouse'){
  round(x+w*.6,y-90,30,bottom-y+90,10,'#785c3e');line([[x+w*.65,y-20],[x+w*.25,y-116]],'#785c3e',18);for(let i=0;i<7;i++)oval(x+20+i*25,y-99-Math.sin(i)*15,38,27,i%2?'#668a59':'#7e9e65');round(x,y-64,w,65,8,'#ba9369');round(x+55,y-54,70,45,18,'#5f7969');oval(x+90,y-32,15,15,'#bcddd0');line([[x+90,y-46],[x+90,y-18]],cream,3);line([[x+77,y-32],[x+103,y-32]],cream,3);ladder(x+14,y);label(y-164);
 }else if(id==='wall'){
  poly([[x,y],[x+w,y],[x+w-12,bottom],[x+9,bottom]],'#ae967e');poly([[x+8,y+8],[x+w-8,y+8],[x+w-18,bottom],[x+15,bottom]],'#d8c2a0');const colors=['#ec8b62','#7baacf','#b47cb8','#8eac63'];for(let row=0;row<4;row++)for(let col=0;col<5;col++){const xx=x+24+col*32+(row%2?8:0),yy=y+17+row*23;poly([[xx-7,yy+4],[xx-4,yy-5],[xx+6,yy-4],[xx+8,yy+4]],colors[(row+col)%4]);oval(xx,yy,1.5,1.5,'#665443');}label(y-55);
 }else if(id==='net'){
  for(const xx of [x+9,x+w-9])round(xx,y-50,12,bottom-y+50,5,'#5d819d');line([[x+15,y],[x+w-5,y]],'#adc7cd',8);line([[x+15,bottom-3],[x+w-5,bottom-3]],'#94b0b9',7);
  c.save();c.beginPath();c.rect(x+20,y+4,w-30,bottom-y-4);c.clip();for(let yy=y-220;yy<bottom+220;yy+=26){line([[x+20,yy],[x+w-8,yy+w-28]],'#dccca5',2);line([[x+20,yy],[x+w-8,yy-w+28]],'#f1dfb4',2);}c.restore();for(let i=0;i<6;i++)oval(x+34+i*34,y-29,10,10,['#e9bf67','#e98088','#8dbbaf'][i%3]);label(y-103);
 }else if(id==='rocket'){
  round(x+67,y-104,72,bottom-y+101,30,'#cad4dd');poly([[x+65,y-93],[x+103,y-147],[x+141,y-93]],'#bd6f8c');poly([[x+67,bottom-80],[x+35,bottom-14],[x+70,bottom-30]],'#8878b4');poly([[x+137,bottom-80],[x+169,bottom-14],[x+135,bottom-30]],'#8878b4');oval(x+103,y-49,23,23,'#657d9a');oval(x+103,y-49,16,16,'#a9d8dc');line([[x+92,y-56],[x+107,y-65]],'#e2f6ed',3);ladder(x+14,y);for(let j=0;j<3;j++)poly([[x+89+j*10,bottom-9],[x+94+j*10,bottom-30],[x+99+j*10,bottom-9]],['#edbc69','#e98b64','#dfb65c'][j]);label(y-199);
 }else if(id==='bridge'){
  for(const xx of [x+2,x+w-8])round(xx,y-90,8,bottom-y+90,4,wood);for(let i=0;i<=12;i++){const xx=x+i*w/12,drop=Math.sin(i*Math.PI/12)*27;line([[xx,y-85+drop],[xx,y-4]],'#c6b386',2);if(i<12)round(xx,y-2,w/12-2,12,2,i%2?'#b38c62':'#ceb08a');}c.strokeStyle='#8f7857';c.lineWidth=5;c.beginPath();c.moveTo(x,y-85);c.quadraticCurveTo(x+w/2,y-30,x+w,y-85);c.stroke();label(y-140);
 }else if(id==='pirate'){
  poly([[x-15,y-15],[x+w+18,y-15],[x+w-17,y+75],[x+35,y+75]],'#936043');poly([[x+4,y],[x+w-1,y],[x+w-22,y+58],[x+40,y+58]],'#be8b5a');for(let i=0;i<4;i++){oval(x+58+i*43,y+25,12,12,'#edc682');oval(x+58+i*43,y+25,8,8,'#4f7180');}round(x+111,y-153,8,145,3,wood);poly([[x+122,y-144],[x+202,y-58],[x+122,y-58]],'#f0dfba');poly([[x+108,y-142],[x+59,y-65],[x+108,y-65]],'#d88b7e');round(x+120,y-174,51,24,3,'#3c4b58');c.fillStyle=cream;c.font='18px system-ui';c.textAlign='center';c.fillText('★',x+144,y-155);for(const xx of [x+38,x+w-40])round(xx,y+68,11,bottom-y-68,3,wood);ladder(x+14,y);label(y-227);
 }else if(id==='music'){
  const colors=['#e68e9d','#e9ae6e','#ddcd77','#83b7a7','#85a5cd','#b18bc0'];for(let i=0;i<6;i++){round(x+i*w/6,y,w/6-2,bottom-y,5,colors[i]);round(x+i*w/6+5,y+10,w/6-12,26,4,cream);c.fillStyle='#5a526d';c.textAlign='center';c.font='20px serif';c.fillText('♪',x+(i+.5)*w/6,y+64+Math.sin(time*3+i)*3);}label(y-55);
 }
 c.restore();
}
