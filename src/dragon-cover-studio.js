import * as T from './vendor/three/three.module.min.js';
import {nurseryMaterials} from './dragon-nursery-materials.js';
import {nurseryDragon} from './dragon-nursery-models.js';
import {keeperLightEnvironment} from './dragon-keeper-surface.js';

const canvas=document.querySelector('#dragons');
const renderer=new T.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setSize(960,650,false);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;
const scene=new T.Scene();scene.background=new T.Color('#68775a');scene.fog=new T.Fog('#68775a',7,18);
const camera=new T.PerspectiveCamera(39,960/650,.1,60),kit=nurseryMaterials(),disposeLight=keeperLightEnvironment(renderer,scene);
scene.add(new T.HemisphereLight('#e2ecf4','#74764c',1.5));
const sun=new T.DirectionalLight('#fff0ce',2.7);sun.position.set(-3,7,6);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{left:-6,right:6,top:5,bottom:-5});sun.shadow.normalBias=.025;scene.add(sun);
const rim=new T.DirectionalLight('#ffe2ad',1.5);rim.position.set(2,4,-3);scene.add(rim);
kit.box(scene,0,-.08,0,30,.1,30,'#8c9b70');
const baby=nurseryDragon(scene,kit),adult=nurseryDragon(scene,kit),third=nurseryDragon(scene,kit);
let element='river',motion='idle',angle=-.12,framing=new URLSearchParams(location.search).get('view')||'trio';
if(!['face','full','trio'].includes(framing))framing='trio';

function sync(){
 document.querySelector('.labels').hidden=framing!=='full';
 canvas.setAttribute('aria-label',framing==='face'?'Animated close-up of the actual baby dragon face':framing==='trio'?'The actual green, blue and red game dragons, shown head to tail':'Animated baby and adult dragons from the game');
 for(const [selector,value]of [['framing',framing],['element',element],['motion',motion]])for(const button of document.querySelectorAll('[data-'+selector+']'))button.setAttribute('aria-pressed',String(button.dataset[selector]===value));
}
for(const button of document.querySelectorAll('[data-element]'))button.onclick=()=>{element=button.dataset.element;if(framing==='trio')framing='full';sync();};
for(const button of document.querySelectorAll('[data-motion]'))button.onclick=()=>{motion=button.dataset.motion;sync();};
for(const button of document.querySelectorAll('[data-framing]'))button.onclick=()=>{framing=button.dataset.framing;sync();};
document.querySelector('#turn').onclick=()=>angle+=Math.PI/2;

function render(time){
 const close=framing==='face',trio=framing==='trio';adult.group.visible=!close;third.group.visible=trio;
 camera.fov=close?34:39;
 if(close){camera.position.set(.50,1.2,1.65);camera.lookAt(0,.92,.36);}
 else if(trio){camera.position.set(1.3,1.8,5.1);camera.lookAt(0,.77,.1);}
 else{camera.position.set(2,1.9,5.4);camera.lookAt(0,.85,0);}
 camera.updateProjectionMatrix();
 const subjects=trio?[[baby,2,'fern',-1.42,.58],[adult,2,'river',0,.58],[third,2,'ember',1.42,.58]]:[[baby,2,element,close?0:-1.15,.48],[adult,7,element,1.1,.65]];
 for(const [dragon,day,color,x,scale]of subjects){
  dragon.group.position.x=x;dragon.group.scale.setScalar(scale);
  const mood=motion==='play'?['look','pant','circle','hop','chase'][Math.floor(time/4)%5]:'look';
  dragon.group.rotation.y=angle+(mood==='chase'||mood==='circle'?time*.8:0);
  const jump=mood==='hop'?Math.max(0,Math.sin(time*5))*.28:0;dragon.group.position.y=motion==='fly'?.35:jump;
  dragon.animate(time,motion==='walk'||mood==='chase'||mood==='circle',motion==='fly',color,day,false,{mood,lookYaw:Math.sin(time+x)*.25,jump});
  const saddle=dragon.group.children.find(o=>o.visible)?.getObjectByName('DragonSaddle');if(saddle)saddle.visible=false;
 }
 renderer.render(scene,camera);
}
sync();
Promise.all([kit.ready,baby.ready,adult.ready,third.ready]).then(()=>{
 document.querySelector('#ready').textContent='Ready · These are the actual animated game models. Turn them to inspect every side.';
 window.dragonCoverStudio={render,set(value){if(value.element&&framing==='trio'&&!value.framing)framing='full';element=value.element||element;motion=value.motion||motion;angle=value.angle??angle;framing=value.framing||framing;sync();}};
}).catch(error=>{document.querySelector('#ready').textContent='Could not load the preview.';console.error(error);});
function frame(ms){render(ms/1000);requestAnimationFrame(frame);}requestAnimationFrame(frame);
window.addEventListener('pagehide',()=>{disposeLight();baby.dispose();adult.dispose();third.dispose();kit.dispose(scene);renderer.dispose();},{once:true});
