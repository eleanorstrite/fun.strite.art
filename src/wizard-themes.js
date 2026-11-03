export const WIZARD_BACKGROUNDS=[
 {id:'galaxy',name:'Milky Way',top:'#061129',bottom:'#644079'},
 {id:'aurora',name:'Aurora forest',top:'#061b38',bottom:'#237c72'},
 {id:'sunset',name:'Sunset sea',top:'#8c214f',bottom:'#ffb23e'},
 {id:'sunshine',name:'Sunlit clouds',top:'#3e9ed9',bottom:'#cdeefe'},
 {id:'city',name:'City at dusk',top:'#768cc3',bottom:'#efb5c8'},
 {id:'moonlight',name:'Moonlit ocean',top:'#071d40',bottom:'#275d8d'},
 {id:'lightning',name:'Lightning night',top:'#12253e',bottom:'#4b587b'},
 {id:'islands',name:'Enchanted islands',top:'#69bbd1',bottom:'#d9b9e8'}
];
export const WIZARD_BLOCKS=[{id:'galaxy',name:'Galaxy'},{id:'gold',name:'Golden'},{id:'lightning',name:'Lightning'},{id:'rainbow',name:'Rainbow'},{id:'crystal',name:'Ice crystal'},{id:'jewel',name:'Enchanted jewels'}];
const COLORS=['#70dce8','#f9d65c','#bc8bea','#8fce73','#f092b4','#789ee5','#f6a465'];
export const wizardBackground=index=>WIZARD_BACKGROUNDS[((Number.isInteger(index)?index:0)%8+8)%8];
export const wizardBlock=id=>WIZARD_BLOCKS.find(b=>b.id===id)||WIZARD_BLOCKS[0];
export function loadWizardSetting(key,fallback,storage){try{return (storage??globalThis.localStorage)?.getItem('sidequest.wizard.'+key)??fallback;}catch{return fallback;}}
export function saveWizardSetting(key,value,storage){try{(storage??globalThis.localStorage)?.setItem('sidequest.wizard.'+key,String(value));}catch{}}
let backgrounds;
export function wizardBackgroundAtlas(){if(typeof Image==='undefined')return null;if(!backgrounds){backgrounds=new Image();backgrounds.src=new URL('../assets/wizard-backgrounds.png',import.meta.url).href;}return backgrounds;}
export function drawWizardBackground(c,index,time=0,reduced=false){
 const theme=wizardBackground(index),image=wizardBackgroundAtlas(),gradient=c.createLinearGradient(0,0,0,650);gradient.addColorStop(0,theme.top);gradient.addColorStop(1,theme.bottom);c.fillStyle=gradient;c.fillRect(0,0,960,650);
 if(image?.complete&&image.naturalWidth){const i=WIZARD_BACKGROUNDS.indexOf(theme),sw=image.naturalWidth/4,sh=image.naturalHeight/2;c.drawImage(image,(i%4)*sw,Math.floor(i/4)*sh,sw,sh,0,0,960,650);}
 c.fillStyle='#09152f45';c.fillRect(0,0,960,650);
 if(theme.id==='lightning'&&!reduced&&time%9<.12){c.fillStyle='#d1e9ff36';c.fillRect(0,0,960,650);}
}
const MATERIAL_STYLES=['galaxy','gold','lightning','rainbow'];
let blockMaterials;
export function wizardBlockTextureCell(style){const index=MATERIAL_STYLES.indexOf(style);return index<0?null:{column:index%2,row:Math.floor(index/2),columns:2,rows:2};}
export function wizardBlockAtlas(){if(typeof Image==='undefined')return null;if(!blockMaterials){blockMaterials=new Image();blockMaterials.src=new URL('../assets/wizard-block-materials.png',import.meta.url).href;}return blockMaterials;}
export function drawWizardBlock(c,x,y,size,kind=0,style='galaxy',time=0){
 const id=wizardBlock(style).id,cell=wizardBlockTextureCell(id),image=cell?wizardBlockAtlas():null;
 if(image?.complete&&image.naturalWidth&&image.naturalHeight){
  const sw=image.naturalWidth/2,sh=image.naturalHeight/2,inset=Math.max(.65,size*.035),edge=size-inset*2;
  c.save();c.beginPath();c.roundRect(x+inset,y+inset,edge,edge,Math.max(1.5,size*.1));c.clip();c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
  c.drawImage(image,cell.column*sw,cell.row*sh,sw,sh,x+inset,y+inset,edge,edge);
  // A restrained gloss pass keeps the material's highlights readable at game size.
  const gloss=c.createLinearGradient(x,y,x+size,y+size);gloss.addColorStop(0,'#ffffff25');gloss.addColorStop(.4,'#ffffff00');gloss.addColorStop(1,'#00000030');c.fillStyle=gloss;c.fillRect(x,y,size,size);
  c.strokeStyle='#ffffff40';c.lineWidth=Math.max(.6,size*.025);c.stroke();c.restore();return;
 }
 let color=COLORS[kind%7];
 if(id==='galaxy')color='#423375';if(id==='gold')color='#e5ad31';if(id==='lightning')color='#214b8f';if(id==='rainbow')color=`hsl(${(kind*53+x*2+y)%360} 80% 67%)`;if(id==='crystal')color='#88e5ed';
 c.fillStyle=color;c.beginPath();c.roundRect(x+1,y+1,size-2,size-2,Math.max(2,size*.13));c.fill();
 c.fillStyle='#ffffff65';c.fillRect(x+3,y+3,size-6,Math.max(2,size*.12));c.fillStyle='#00000028';c.fillRect(x+3,y+size-5,size-6,2);
 if(id==='galaxy'){c.fillStyle='#b08eff88';c.beginPath();c.ellipse(x+size*.5,y+size*.55,size*.38,size*.13,-.7,0,Math.PI*2);c.fill();c.fillStyle='#fff3dd';for(let i=0;i<3;i++)c.fillRect(x+size*(.22+i*.23),y+size*(.35+(i%2)*.3),1.5,1.5);}
 if(id==='gold'){c.fillStyle='#fff2a1';c.beginPath();c.moveTo(x+size*.3,y+size*.35);c.lineTo(x+size*.53,y+size*.18);c.lineTo(x+size*.7,y+size*.4);c.lineTo(x+size*.47,y+size*.6);c.fill();}
 if(id==='lightning'){c.strokeStyle='#c5f4ff';c.lineWidth=Math.max(1.5,size*.07);c.beginPath();c.moveTo(x+size*.62,y+size*.18);c.lineTo(x+size*.34,y+size*.52);c.lineTo(x+size*.65,y+size*.46);c.lineTo(x+size*.4,y+size*.85);c.stroke();}
 if(id==='crystal'){c.fillStyle='#e4ffff88';c.beginPath();c.moveTo(x+size*.5,y+3);c.lineTo(x+size-3,y+size*.5);c.lineTo(x+size*.5,y+size-3);c.lineTo(x+3,y+size*.5);c.fill();}
}
export function mountWizardBlocks(container,selected,onSelect){
 const group=document.createElement('fieldset');group.className='wizard-blocks';const legend=document.createElement('legend');legend.textContent='Choose your blocks · All free';group.append(legend);const buttons=[];
 for(const style of WIZARD_BLOCKS){const button=document.createElement('button');button.type='button';button.className='wizard-block-choice';button.setAttribute?.('data-block',style.id);const sample=document.createElement('canvas');sample.width=100;sample.height=52;sample.setAttribute?.('aria-hidden','true');const c=sample.getContext?.('2d');const paint=()=>{if(!c)return;c.clearRect(0,0,100,52);for(const [x,y]of [[20,0],[20,24],[44,24],[68,24]])drawWizardBlock(c,x,y,24,2,style.id);};paint();wizardBlockAtlas()?.addEventListener?.('load',paint,{once:true});const name=document.createElement('span');name.textContent=style.name;button.append(sample,name);button.setAttribute?.('aria-pressed',String(selected===style.id));button.onclick=()=>{if(button.disabled)return;onSelect(style.id);for(const [id,b]of buttons)b.setAttribute?.('aria-pressed',String(id===style.id));};group.append(button);buttons.push([style.id,button]);}
 container.append(group);return {setDisabled(value){for(const [,button]of buttons)button.disabled=value;}};
}
