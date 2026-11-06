export const WIZARD_POWERS=[
 {id:'island',name:'Floating Island',type:'Helping',detail:'Create a floating support above your tower.',column:0,row:0},
 {id:'lightning',name:'Lightning',type:'Helping',detail:'Undo the last piece you placed.',column:1,row:0},
 {id:'ultra',name:'Ultra Blocks',type:'Attack',detail:'Make your opponent’s next three pieces twice as large.',column:2,row:0},
 {id:'ice',name:'Ice Blocks',type:'Attack',detail:'Give your opponent slippery blocks and icy landings.',column:0,row:1},
 {id:'twist',name:'Twisty Blocks',type:'Attack',detail:'Your opponent’s next pieces flip by themselves; rotation is locked.',column:1,row:1},
 {id:'balloon',name:'Balloon Blocks',type:'Attack',detail:'Your opponent’s next pieces float and cannot drop fast.',column:2,row:1}
];
export const WIZARD_LEVEL_STEP=4;
export const wizardPower=id=>WIZARD_POWERS.find(power=>power.id===id);
let atlas;
export function wizardPowerAtlas(){if(typeof Image==='undefined')return null;if(!atlas){atlas=new Image();atlas.src=new URL('../assets/wizard-power-icons.png',import.meta.url).href;}return atlas;}
export function drawWizardPowerIcon(c,id,x,y,size){const image=wizardPowerAtlas(),power=wizardPower(id);if(!power)return;if(image?.complete&&image.naturalWidth){const sw=image.naturalWidth/3,sh=image.naturalHeight/2;c.save();c.beginPath();c.arc(x+size/2,y+size/2,size/2,0,Math.PI*2);c.clip();c.drawImage(image,power.column*sw,power.row*sh,sw,sh,x,y,size,size);c.restore();}else{c.fillStyle=power.type==='Attack'?'#da7b9e':'#85d3c0';c.beginPath();c.arc(x+size/2,y+size/2,size*.42,0,Math.PI*2);c.fill();}}
export function wizardChoicePosition(player,slot,height=650){return height>850?{x:350+player*480,y:245+slot*235,radius:55}:{x:400+player*480,y:190+slot*120,radius:31};}
