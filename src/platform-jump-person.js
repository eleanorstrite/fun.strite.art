import {drawJumpHair} from './platform-jump-hair.js';
export function jumperPose(time=0,moving=false,action={}){
 const pose=action.pose|| (moving?'walk':'stand'),phase=time*9,walk=pose==='walk',jump=pose==='jump',land=pose==='land',direction=action.facing===-1?-1:1;
 return {pose,lean:walk?direction*.035:jump?direction*.07:land?-direction*.035:0,bob:walk?Math.cos(phase*2)*.6:0,
 legs:[-1,1].map(side=>{const swing=walk?Math.sin(phase)*side:0;return {side,knee:[side*8+swing*5,-21+(jump?12:land?6:0)],foot:[side*9+swing*11,-2-(jump?10:land?2:Math.max(0,swing)*6)]};}),
 arms:[-1,1].map(side=>{const swing=walk?Math.sin(phase)*-side:0;return {side,elbow:[side*22+swing*4,-45+(jump?-15:land?-5:0)],hand:[side*20+swing*8,-31+(jump?-38:land?-6:0)]};})};
}
function tint(hex,amount){const n=parseInt(hex.slice(1),16);return '#'+[n>>16,(n>>8)&255,n&255].map(v=>Math.max(0,Math.min(255,v+amount)).toString(16).padStart(2,'0')).join('');}
function shade(c,color,x=-20,y=-80,w=40,h=40){const g=c.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,tint(color,32));g.addColorStop(.48,color);g.addColorStop(1,tint(color,-36));return g;}
function oval(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
function bone(c,points,width,color){c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();}
export function drawJumper(c,x,y,s,time=0,moving=false,waving=false,action={}){
 const p=jumperPose(time,moving,action);c.save();c.translate(x,y+p.bob);c.rotate(p.lean);
 for(const leg of p.legs){bone(c,[[leg.side*7,-39],leg.knee,[leg.foot[0],leg.foot[1]-4]],11,shade(c,s.pants,-15,-39,30,40));bone(c,[[leg.side*8,-36],[leg.knee[0]-2,leg.knee[1]]],1,'#ffffff22');const [fx,fy]=leg.foot;oval(c,fx+2,fy,9,4.5,'#ecebe4');bone(c,[[fx-6,fy+2],[fx+9,fy+2]],2,'#abb5b9');bone(c,[[fx-2,fy-2],[fx+3,fy-2]],1,'#6b7a83');}
 for(const arm of p.arms){let {side,elbow,hand}=arm;if(waving==='clap'){elbow=[side*24,-87];hand=[side*(4+Math.abs(Math.sin(time*7))*9),-119];}else if(waving&&side===1){elbow=[28,-77];hand=[32+Math.sin(time*5)*4,-101];}bone(c,[[side*13,-63],elbow],10,shade(c,s.shirt));bone(c,[elbow,hand],9,shade(c,s.shirt));const cuff=[elbow[0]*.12+hand[0]*.88,elbow[1]*.12+hand[1]*.88];bone(c,[cuff,hand],9,tint(s.shirt,-20));oval(c,hand[0],hand[1],4.5,6,shade(c,s.skin));for(let finger=0;finger<3;finger++)bone(c,[[hand[0]-2+finger*2,hand[1]+1],[hand[0]-2+finger*2,hand[1]+4]],.6,'#5b393433');}
 c.fillStyle=shade(c,s.shirt);c.beginPath();c.moveTo(-13,-66);c.quadraticCurveTo(0,-71,13,-66);c.lineTo(17,-38);c.quadraticCurveTo(0,-33,-17,-38);c.closePath();c.fill();
 // Moss-green overall bib, straps, stitched pockets and a tiny frog badge.
 c.fillStyle=shade(c,s.pants);c.beginPath();c.moveTo(-12,-54);c.lineTo(12,-54);c.lineTo(15,-36);c.quadraticCurveTo(0,-32,-15,-36);c.closePath();c.fill();
 for(const side of [-1,1]){bone(c,[[side*11,-66],[side*8,-50]],4.5,shade(c,s.pants));oval(c,side*8,-52,1.6,1.6,'#f3d18a');}
 c.strokeStyle=tint(s.pants,-25);c.lineWidth=.8;c.strokeRect(-7,-49,14,10);bone(c,[[-13,-38],[13,-38]],1,tint(s.pants,-25));
 oval(c,2,-44,3,2.3,'#b7d17b');oval(c,.3,-46,1.1,1.2,'#b7d17b');oval(c,3.7,-46,1.1,1.2,'#b7d17b');oval(c,.3,-46,.35,.4,'#354436');oval(c,3.7,-46,.35,.4,'#354436');
 oval(c,0,-71,5,7,shade(c,s.skin));bone(c,[[-8,-68],[0,-64],[8,-68]],3,tint(s.shirt,-20));
 c.save();c.translate(0,-33);c.scale(.85,.85);drawJumpHair(c,s.hairstyle,s.hair,'back',time);c.restore();
 for(const side of [-1,1]){oval(c,side*14,-88,3.5,5,shade(c,s.skin));oval(c,side*14,-88,1.5,2.7,tint(s.skin,-20));}
 oval(c,0,-89,14,18,shade(c,s.skin,-14,-104,28,30));
 for(const side of [-1,1]){const ex=side*5.7;oval(c,ex,-90,3.6,3.6,'#fffdf4');oval(c,ex,-89.7,2.1,2.8,'#78462c');oval(c,ex,-89.6,1.1,1.9,'#282124');oval(c,ex-.6,-90.9,.7,.8,'#ffffff');c.strokeStyle='#563a32';c.lineWidth=.8;c.beginPath();c.moveTo(ex-3.6,-90.5);c.quadraticCurveTo(ex,-94.7,ex+3.6,-90.5);c.stroke();c.strokeStyle=tint(s.hair,-15);c.lineWidth=1.5;c.beginPath();c.moveTo(ex-3,-96);c.quadraticCurveTo(ex,-97.5,ex+3,-96);c.stroke();oval(c,side*9,-83,2.8,1.7,'#e88d7a40');}
 bone(c,[[.2,-88],[1.7,-84],[-.5,-83]],1.3,tint(s.skin,-28));c.fillStyle='#9a4e42';c.beginPath();c.moveTo(-4.5,-79);c.quadraticCurveTo(0,-77.5,4.5,-79);c.quadraticCurveTo(0,-72,-4.5,-79);c.fill();bone(c,[[-2.7,-78.5],[2.7,-78.5]],1.3,'#fff6e8');
 c.save();c.translate(0,-33);c.scale(.85,.85);drawJumpHair(c,s.hairstyle,s.hair,'front',time);c.restore();c.restore();
}
