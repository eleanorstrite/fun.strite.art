import {drawHockeyAthlete} from './hockey-art.js';
import {HOCKEY_DEFAULTS} from './hockey-rules.js';
import {drawFittedHockeyJersey,drawFittedSportsHeadwear,hockeyKitPose} from './sports-kit.js';
import {drawSportsAnimal} from './animal-sports-art.js';
import {SPORTS_DEFAULTS} from './animal-sports-settings.js';
const colors=['#1684b5','#bb5485','#387e6b','#b8852e','#6c60ac','#d36d40','#478b94'];
function text(c,value,x,y,size=18,color='#254457'){c.fillStyle=color;c.font=`700 ${size}px system-ui`;c.textAlign='center';c.fillText(value,x,y);}
function panel(c,x,y,w,h){c.fillStyle='#ffffff';c.beginPath();c.roundRect(x,y,w,h,18);c.fill();}
export function drawSportsKitPreview(canvas,time=0,native=false){const c=canvas.getContext('2d');c.clearRect(0,0,canvas.width,canvas.height);c.save();c.scale(canvas.width/1080,canvas.height/(native?355:720));const g=c.createLinearGradient(0,0,0,720);g.addColorStop(0,'#edf3f2');g.addColorStop(1,'#cbdfe8');c.fillStyle=g;c.fillRect(0,0,1080,720);
 if(native){text(c,'THE SAME FIT ON YOUR OTHER ANIMAL ATHLETES',540,35,22);for(const[i,animal]of ['dog','fox','rabbit','cat','dragon','capybara','bird'].entries()){const x=80+i*153;panel(c,x-70,60,140,270);drawSportsAnimal(c,x,285,120,{...SPORTS_DEFAULTS,animal,jersey:colors[i],accessory:i%2?'headband':'cap'},time,true);text(c,animal[0].toUpperCase()+animal.slice(1),x,315,16);}c.restore();return;}
 text(c,'HATS, BANDANAS & JERSEYS THAT FIT',540,35,25);text(c,'The kit on its own, then worn by the players in motion',540,64,17,'#587384');
 for(let i=0;i<6;i++){const x=105+i*174,accessory=['cap','bandana','helmet'][i%3],species=['human','human','dragon','rabbit','dog','cat'][i],look={...HOCKEY_DEFAULTS[i===1?'p2':'p1'],species,jersey:colors[i],accessory,style:i%2?'chevron':'stripes',material:['mesh','satin','knit'][i%3]},cheer=time%6>=4,action=time%6>2&&time%6<2.6?.3:0,pose=hockeyKitPose(Math.sin(time*9),1,action,cheer);panel(c,x-78,86,156,228);c.save();c.translate(x,300);c.scale(2.15,2.15);drawFittedSportsHeadwear(c,look,{x:0,y:-55,w:28,h:30},time,'back');drawFittedSportsHeadwear(c,look,{x:0,y:-55,w:28,h:30},time);drawFittedHockeyJersey(c,look,pose,time,i+1);c.restore();text(c,accessory[0].toUpperCase()+accessory.slice(1),x,111,15);text(c,look.material+' jersey',x,300,14,'#587384');panel(c,x-78,369,156,329);drawHockeyAthlete(c,{x,y:650,look,role:'offense',human:0,slot:i,facing:1,stride:time*9,vx:cheer?0:100,vy:0,action},time,{size:3.1,celebrating:cheer});text(c,['Boy','Girl','Dragon','Bunny','Dog','Cat'][i],x,682,17);}
 text(c,'WORN IN THE GAME',540,348,20);c.restore();}
