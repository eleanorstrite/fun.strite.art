import {createWaterfallLandscape,waterfallBankOffset} from './dragon-waterfall-landscape.js';
import * as T from './vendor/three/three.module.min.js';
import {WATERFALL,SWIM_HOOPS,waterfallPoint} from './dragon-nursery-swimming.js';
export function createNurserySwimmingScene(world,kit){
 const group=new T.Group();group.name='Magical swimming waterfall';group.userData.dailyAnimated=true;world.add(group);const {mesh,solid,label,geo}=kit,clock={value:0};
 const flow=kit.texture('swimming-waterfall-flow',c=>{const g=c.createLinearGradient(0,0,256,0);g.addColorStop(0,'#9ac9b8');g.addColorStop(.3,'#eafff9');g.addColorStop(.55,'#6fae9a');g.addColorStop(.8,'#f3fffc');g.addColorStop(1,'#87b6a0');c.fillStyle=g;c.fillRect(0,0,256,256);for(let i=0;i<180;i++){c.fillStyle=i%3?'#ffffff70':'#3a94ac30';c.fillRect((i*67)%256,(i*43)%256,.5+(i%4)*.5,12+(i%9)*12);}});
 flow.map.wrapS=flow.map.wrapT=T.RepeatWrapping;flow.map.repeat.set(2.5,3);flow.roughness=.16;flow.metalness=.1;flow.emissive.set('#79ded7');flow.emissiveIntensity=.07;flow.side=T.DoubleSide;flow.onBeforeCompile=shader=>{shader.uniforms.waterTime=clock;shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nuniform float waterTime;').replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.x+=sin(position.y*2.+waterTime*3.2)*.035;transformed.z+=sin(position.x*2.+waterTime*2.)*.025;');};const compileFlow=flow.onBeforeCompile;flow.onBeforeCompile=shader=>{compileFlow(shader);shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec2 vCascadeUv;').replace('#include <begin_vertex>','#include <begin_vertex>\nvCascadeUv=uv;');shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform float waterTime; varying vec2 vCascadeUv;').replace('#include <color_fragment>',`#include <color_fragment>
  float height=vCascadeUv.y*13.5;if((height>3.8&&height<4.6)||(height>8.4&&height<9.2))discard;
  float tier=height<4.2?0.:height<8.8?1.:2.;float edge=abs(vCascadeUv.x-.5);
  if(edge>.075&&sin(vCascadeUv.x*(35.+tier*7.)+tier*1.9+sin(vCascadeUv.x*17.)*2.3)+sin(height*2.+vCascadeUv.x*38.)*.13>.4)discard;
  float whitewater=.3+.22*sin(vCascadeUv.x*230.+sin(vCascadeUv.y*16.)*1.4);
  diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.91,.98,.94),whitewater);diffuseColor.rgb*=.9+.1*sin(vCascadeUv.x*330.+vCascadeUv.y*120.+waterTime*6.);
 `);};flow.customProgramCacheKey=()=>'terraced-limestone-waterfall-2';
 const water=new T.MeshPhysicalMaterial({color:'#319879',roughness:.22,metalness:.08,clearcoat:.3,clearcoatRoughness:.22,envMapIntensity:.65});
 const ripples=kit.texture('swimming-ripple-bump',c=>{c.fillStyle='#888888';c.fillRect(0,0,256,256);for(let j=0;j<48;j++){c.beginPath();for(let x=0;x<=256;x+=3){const y=j*6+Math.sin(x*.08+j)*3;x?c.lineTo(x,y):c.moveTo(x,y);}c.strokeStyle=j%2?'#a0a0a0':'#707070';c.lineWidth=1;c.stroke();}}).map;ripples.colorSpace=T.NoColorSpace;ripples.wrapS=ripples.wrapT=T.RepeatWrapping;ripples.repeat.set(2,2);water.bumpMap=ripples;water.bumpScale=.045;
 water.onBeforeCompile=shader=>{shader.uniforms.waterTime=clock;shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nuniform float waterTime; varying vec2 vWaterUv;').replace('#include <begin_vertex>','#include <begin_vertex>\nvWaterUv=uv; transformed.z+=sin(position.x*1.6+waterTime*1.8)*.022+sin(position.y*1.9-waterTime*1.5)*.018;');shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform float waterTime; varying vec2 vWaterUv;').replace('#include <color_fragment>',`#include <color_fragment>
  vec2 lake=vWaterUv*2.-1.;if(dot(lake,lake)>1.)discard;
  float ripple=sin(vWaterUv.x*135.+sin(vWaterUv.y*61.+waterTime)*2.5+waterTime*1.6)*sin(vWaterUv.y*120.-waterTime*2.);
  float glimmer=pow(max(0.,ripple),12.);float shore=smoothstep(.82,1.,length(lake));
  diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.09,.27,.19),.05+shore*.19);diffuseColor.rgb+=glimmer*.16+shore*.055;
 `);};water.customProgramCacheKey=()=>'magical-swim-water-1';
 const pool=mesh(group,new T.PlaneGeometry(WATERFALL.rx*2,WATERFALL.rz*2,40,48),water,WATERFALL.x,WATERFALL.surface,WATERFALL.z);pool.rotation.x=-Math.PI/2;pool.receiveShadow=false;pool.userData={action:'swim-water',x:WATERFALL.entry.x,z:WATERFALL.entry.z};
 const summit=mesh(group,new T.PlaneGeometry(8,8,20,20),water,WATERFALL.x,WATERFALL.surface+WATERFALL.height,-76);summit.rotation.x=-Math.PI/2;summit.receiveShadow=false;summit.userData={action:'waterfall',...WATERFALL.base};
 createWaterfallLandscape(group,kit);
 // Wide jade pools nest between the three white-water drops.
 for(const [low,high]of [[3.8,4.6],[8.4,9.2]]){
  const positions=[],uvs=[],faces=[],rows=12,cols=50;
  for(let i=0;i<=rows;i++){const h=low+(high-low)*i/rows,p=waterfallPoint(h),width=9.85-h/WATERFALL.height*3.6;for(let j=0;j<=cols;j++){const u=j/cols,offset=waterfallBankOffset(h,u);positions.push(p.x+(u-.5)*width*2,p.y+.025+offset.y,p.z+offset.z);uvs.push(u,i/rows);}}
  for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){const a=i*(cols+1)+j;faces.push(a,a+1,a+cols+2,a,a+cols+2,a+cols+1);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));g.setIndex(faces);g.computeVertexNormals();const basin=mesh(group,g,water);basin.receiveShadow=false;basin.userData={action:'waterfall',...WATERFALL.base};
 }
 // A curved, rippling water curtain follows the same climb/slide channel as the players.
 const vertices=[],uv=[],indices=[],rows=110,columns=80;
 for(let i=0;i<=rows;i++){const t=i/rows,p=waterfallPoint(WATERFALL.height*t);for(let j=0;j<=columns;j++){const u=j/columns,width=9.85-t*3.6,offset=waterfallBankOffset(WATERFALL.height*t,u);vertices.push(p.x+(u-.5)*width*2,p.y+offset.y,p.z+.04*Math.cos(u*Math.PI*29)+offset.z);uv.push(u,t);}}
 for(let i=0;i<rows;i++)for(let j=0;j<columns;j++){const a=i*(columns+1)+j;indices.push(a,a+1,a+columns+2,a,a+columns+2,a+columns+1);}
 const curtain=new T.BufferGeometry();curtain.setAttribute('position',new T.Float32BufferAttribute(vertices,3));curtain.setAttribute('uv',new T.Float32BufferAttribute(uv,2));curtain.setIndex(indices);curtain.computeVertexNormals();const falls=mesh(group,curtain,flow);falls.castShadow=false;falls.userData={action:'waterfall',...WATERFALL.base};
 const foamMap=kit.texture('swimming-foam',c=>{for(let i=0;i<140;i++){const x=(i*73)%256,y=(i*47)%256,r=2+i%8;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=i%3?'#ffffff88':'#dcfff0bb';c.fill();}}).map;const foamMaterial=new T.MeshBasicMaterial({color:'#dbfff5',map:foamMap,transparent:true,opacity:.65,depthWrite:false,side:T.DoubleSide});
 const foams=[{height:0,z:-61.8,width:10},{height:4.6,z:-65.8,width:8.5},{height:9.2,z:-69.8,width:7}].map(f=>{const foam=mesh(group,new T.PlaneGeometry(f.width*2,1.8,1,1),foamMaterial,WATERFALL.x,WATERFALL.surface+f.height+.07,f.z);foam.rotation.x=-Math.PI/2;foam.userData.width=f.width;return foam;});
 const mistMap=kit.texture('waterfall-soft-mist',c=>{const g=c.createRadialGradient(128,128,0,128,128,128);g.addColorStop(0,'#eafff288');g.addColorStop(.4,'#eafff233');g.addColorStop(1,'#eafff200');c.fillStyle=g;c.fillRect(0,0,256,256);}).map;
 const mists=Array.from({length:12},(_,i)=>{const mist=new T.Sprite(new T.SpriteMaterial({map:mistMap,color:'#e9fff6',transparent:true,opacity:.24,depthWrite:false}));const tier=i%3;mist.position.set(-20+(Math.floor(i/3)-1.5)*4,1+[0,4.6,9.2][tier],[-61.6,-65.6,-69.6][tier]);mist.scale.set(5,2.5,1);group.add(mist);return mist;});
 const spray=new T.InstancedMesh(new T.SphereGeometry(.07,5,4),new T.MeshBasicMaterial({color:'#d5fff7',transparent:true,opacity:.46,depthWrite:false}),100);spray.frustumCulled=false;group.add(spray);
 const sparkles=new T.InstancedMesh(new T.OctahedronGeometry(.045),new T.MeshBasicMaterial({color:'#d4ffe4',transparent:true,opacity:.9}),80);sparkles.frustumCulled=false;group.add(sparkles);
 const dummy=new T.Object3D();
 const rings=SWIM_HOOPS.map((p,i)=>{const material=new T.MeshStandardMaterial({color:'#f8d67e',emissive:'#dfab2a',emissiveIntensity:.8,metalness:.45,roughness:.25}),ring=mesh(group,geo('swimming-hoop',()=>new T.TorusGeometry(1.12,.065,10,56)),material,p.x,.84,p.z),before=SWIM_HOOPS[i-1]||WATERFALL.entry;ring.rotation.y=Math.atan2(p.x-before.x,p.z-before.z);ring.userData={action:'swim-hoop',...p};return ring;});
 label(group,'STARFALL SPRINGS',-10.3,2.1,-46,4);label(group,'SWIM THROUGH THE GOLDEN HOOPS',-17,2.3,-44.2,4.6);label(group,'JUMP UP · SLIDE DOWN',-26,15.2,-73,4.5);
 for(const side of [-1,1]){const crystal=mesh(group,new T.OctahedronGeometry(.55,0),new T.MeshStandardMaterial({color:'#92e7de',emissive:'#31a7b8',emissiveIntensity:.6,metalness:.3,roughness:.2}),-20+side*4,13.8,-70);crystal.scale.set(.6,1.8,.6);}
 return {group,targets:[pool,summit,falls,...rings],render(s,time){clock.value=time;ripples.offset.set(time*.015,time*.009);flow.map.offset.y=time*.8;foams.forEach((foam,i)=>{foam.material.opacity=.46+Math.sin(time*2+i)*.06;foam.scale.y=1+Math.sin(time*1.7+i)*.08;});mists.forEach((mist,i)=>{mist.material.opacity=.18+Math.sin(time*.7+i)*.055;mist.scale.x=5+Math.sin(time*.4+i)*.5;});
  for(let i=0;i<100;i++){const t=(time*.46+i/100)%1,a=i*2.399;const tier=i%3;dummy.position.set(-20+Math.sin(a)*[9,7.7,6.3][tier],.35+[0,4.6,9.2][tier]+Math.sin(t*Math.PI)*.8,[-61.6,-65.6,-69.6][tier]+Math.cos(a)*t*.8);dummy.scale.setScalar(.5+(1-t)*1.3);dummy.updateMatrix();spray.setMatrixAt(i,dummy.matrix);}spray.instanceMatrix.needsUpdate=true;
  for(let i=0;i<80;i++){const t=(time*.08+i/80)%1;dummy.position.set(-20+Math.sin(i*2.4+time*.15)*4,.7+t*14,-65-Math.cos(i*1.7)*3);dummy.rotation.set(time,i,time);dummy.scale.setScalar(.4+Math.pow(Math.sin(time*2+i),8)*1.3);dummy.updateMatrix();sparkles.setMatrixAt(i,dummy.matrix);}sparkles.instanceMatrix.needsUpdate=true;
  rings.forEach((ring,i)=>{ring.visible=!!s.hatched;const done=i<(s.swimRings||0);ring.material.color.set(done?'#76cfbd':i===(s.swimRings||0)?'#ffe7a1':'#d1b275');ring.material.emissiveIntensity=done?.15:i===(s.swimRings||0)?1.2+Math.sin(time*3)*.3:.25;ring.position.y=.84+Math.sin(time*1.5+i)*.035;});
 }};
}
