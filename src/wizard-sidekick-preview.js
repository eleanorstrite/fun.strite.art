import {WIZARD_SIDEKICKS,WIZARD_SIDEKICK_TYPES,drawWizardSidekick} from './wizard-sidekicks.js';
export function drawSidekickGalleryFrame(canvas,time=0,{page=0}={}){
 const c=canvas.getContext('2d');if(!c)return;const logicalHeight=page?510:980;c.save();c.scale(canvas.width/1040,canvas.height/logicalHeight);c.fillStyle='#ede7f6';c.fillRect(0,0,1040,logicalHeight);c.fillStyle='#493763';c.font='700 28px system-ui';c.textAlign='center';c.fillText('Your Wizard Tetris sidekicks',520,36);const types=page?[WIZARD_SIDEKICK_TYPES[page-1]]:WIZARD_SIDEKICK_TYPES;
 for(let group=0;group<types.length;group++){const type=types[group],top=page?70:65+group*300;c.fillStyle='#655079';c.font='700 19px system-ui';c.fillText(type[0].toUpperCase()+type.slice(1)+'s · '+WIZARD_SIDEKICKS[type].length+' looks',520,top+12);
 for(let index=0;index<WIZARD_SIDEKICKS[type].length;index++){const col=index%4,row=Math.floor(index/4),x=15+col*258,y=top+25+row*(page?190:125),h=page?180:116;c.fillStyle='#fff';c.beginPath();c.roundRect(x,y,246,h,14);c.fill();const selection={type,variants:{cat:0,dog:0,dragon:0,[type]:index}};drawWizardSidekick(c,selection,x+123,y+h-24,time,{maxW:page?205:150,maxH:page?140:85});c.fillStyle='#59416d';c.font='600 12px system-ui';c.fillText(WIZARD_SIDEKICKS[type][index],x+123,y+h-7);}}
 c.restore();
}
