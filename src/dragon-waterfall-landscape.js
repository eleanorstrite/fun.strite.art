import * as T from './vendor/three/three.module.min.js';
import {WATERFALL,waterfallPoint,inNurseryWater} from './dragon-nursery-swimming.js';

// Keep the rocky shelves, pool lips and falling water joined along the same irregular edge.
export function waterfallBankOffset(height,u){
 const t=height/WATERFALL.height;
 return {y:(.2*(Math.sin(u*23+t*1.2)-Math.sin(11.5+t*1.2))+.09*(Math.sin(u*53)-Math.sin(26.5)))*Math.sin(Math.PI*t),z:Math.pow(Math.abs(u-.5)*2,2)*2.2+(Math.sin(u*9)-Math.sin(4.5))*.55+(Math.sin(u*31)-Math.sin(15.5))*.15};
}

// Limestone shelves and densely wooded banks frame the three broad water curtains.
export function createWaterfallLandscape(group,kit){
 const {mesh,solid,texture}=kit;
 const stone=texture('waterfall-limestone',c=>{
  c.fillStyle='#7a8172';c.fillRect(0,0,256,256);
  for(let i=0;i<2600;i++){const x=(i*73.37)%256,y=(i*19.43)%256;c.fillStyle=i%3?'#bfc0a321':'#333b3129';c.fillRect(x,y,1+i%6,1+i%3);}
  for(let i=0;i<24;i++){c.beginPath();for(let x=0;x<=256;x+=4){const y=i*12+Math.sin(x*.04+i)*3+Math.sin(x*.14)*.8;x?c.lineTo(x,y):c.moveTo(x,y);}c.strokeStyle=i%4?'#d4d1af44':'#38463b88';c.lineWidth=i%4?1:2;c.stroke();}
 });stone.map.wrapS=stone.map.wrapT=T.RepeatWrapping;stone.map.repeat.set(4,2);stone.bumpMap=stone.map;stone.bumpScale=.16;stone.roughness=.96;
 const rockGeometry=new T.IcosahedronGeometry(1,3),p=rockGeometry.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),r=1+.07*Math.sin(x*17+y*11+z*13)+.035*Math.cos(z*29+x*9);p.setXYZ(i,x*r,y*r,z*r);}const rockNormals=rockGeometry.attributes.normal;for(let i=0;i<p.count;i++){const n=new T.Vector3().fromBufferAttribute(p,i).normalize();rockNormals.setXYZ(i,n.x,n.y,n.z);}
 const dummy=new T.Object3D(),tint=new T.Color();
 const stones=new T.InstancedMesh(rockGeometry,stone,128);stones.name='Layered limestone waterfall banks';let n=0;
 function rock(x,y,z,sx,sy,sz,i){dummy.position.set(x,y,z);dummy.scale.set(sx,sy,sz);dummy.rotation.set(.1*Math.sin(i),i*.72,.13*Math.cos(i));dummy.updateMatrix();stones.setMatrixAt(n,dummy.matrix);stones.setColorAt(n++,tint.set(['#b1b29a','#8c9787','#c0bda5','#899580'][i%4]));}
 // Horizontal shelves recede upward, instead of forming a single pile of round boulders.
 for(const [i,h]of [3.8,8.4,13.5].entries()){
  const at=waterfallPoint(h),half=10.5-i*1.8;
  for(let j=0;j<13;j++){const x=WATERFALL.x-half+j*half/6;
   rock(x,WATERFALL.surface+h*.45,at.z-1.6,1.45,h*.47,1.0,j+i*13);
  }
 }
 for(let j=0;j<30;j++){const a=j*Math.PI*2/30,x=WATERFALL.x+Math.cos(a)*(WATERFALL.rx+.5),z=WATERFALL.z+Math.sin(a)*(WATERFALL.rz+.4);
  if(z< -61)continue;rock(x,-.03,z,.7+(j%3)*.17,.35,.66,j);
 }
 for(let i=0;i<25;i++){const side=i%2?-1:1,z=-61-(i/2)*1.8;
  rock(WATERFALL.x+side*(11.8+Math.sin(i)*1.1),1.4+(i%5)*1.35,z,2.2,2.7,2.4,i);
 }
 stones.count=n;stones.castShadow=stones.receiveShadow=true;group.add(stones);
 // A continuous, irregular rock wall sits behind the flowing water, visible between ribbons.
 const wallPositions=[],wallUv=[],wallIndices=[],rows=80,columns=48;
 for(let i=0;i<=rows;i++){const h=i/rows*WATERFALL.height,at=waterfallPoint(h),half=10.5-h*.26;
  for(let j=0;j<=columns;j++){const u=j/columns,x=WATERFALL.x+(u-.5)*half*2;const offset=waterfallBankOffset(h,u);wallPositions.push(x,at.y-.13+offset.y,at.z-.24+.1*Math.sin(x*3+h)+offset.z);wallUv.push(u,h/3);}
 }
 for(let i=0;i<rows;i++)for(let j=0;j<columns;j++){const a=i*(columns+1)+j;wallIndices.push(a,a+1,a+columns+2,a,a+columns+2,a+columns+1);}
 const wall=new T.BufferGeometry();wall.setAttribute('position',new T.Float32BufferAttribute(wallPositions,3));wall.setAttribute('uv',new T.Float32BufferAttribute(wallUv,2));wall.setIndex(wallIndices);wall.computeVertexNormals();mesh(group,wall,stone);
 const moss=solid('#577443',.98),ledgeGeometry=new T.SphereGeometry(1,14,8);
 const ledges=new T.InstancedMesh(ledgeGeometry,moss,28);let ledge=0;
 for(const [i,h]of [3.8,8.4,13.5].entries())for(const side of [-1,1])for(let k=0;k<4;k++){
  const at=waterfallPoint(h),half=10.5-i*1.8;dummy.position.set(WATERFALL.x+side*(half-.15+k*.32),at.y+.13,at.z-.75-k*.25);dummy.scale.set(.8,.13,.8);dummy.rotation.set(0,k,0);dummy.updateMatrix();ledges.setMatrixAt(ledge++,dummy.matrix);
 }ledges.count=ledge;ledges.castShadow=true;group.add(ledges);
 // Organic karst peaks behind the falls echo the lush, steep mountains in the reference.
 const peakGeometry=new T.SphereGeometry(1,28,22),peakPositions=peakGeometry.attributes.position,colors=[];
 for(let i=0;i<peakPositions.count;i++){
  const x=peakPositions.getX(i),y=peakPositions.getY(i),z=peakPositions.getZ(i),r=1+.09*Math.sin(x*15+z*9+y*8)+.035*Math.cos(z*29-y*11);
  peakPositions.setXYZ(i,x*r,y*r,z*r);const green=new T.Color('#48694e').lerp(new T.Color('#7b8e62'),Math.max(0,y)*.6);if(Math.sin(x*33+z*19+y*15)>.65)green.lerp(new T.Color('#7e8774'),.6);colors.push(...green.toArray());
 }peakGeometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));peakGeometry.computeVertexNormals();
 const peaks=new T.InstancedMesh(peakGeometry,new T.MeshStandardMaterial({vertexColors:true,roughness:1}),9);
 for(let i=0;i<9;i++){const height=12+(i%4)*4;dummy.position.set(-57+i*8.8,height*.48,-103-(i%3)*9);dummy.scale.set(6.4+(i%3)*1.7,height*.72,7.5);dummy.rotation.set(.04,i*.7,.08*Math.sin(i));dummy.updateMatrix();peaks.setMatrixAt(i,dummy.matrix);}peaks.castShadow=peaks.receiveShadow=true;peaks.name='Forested limestone peaks';group.add(peaks);
 for(const side of [-1,1]){const bank=mesh(group,new T.SphereGeometry(1,28,20),solid('#607a4b',1),WATERFALL.x+side*17.5,-.3,-74);bank.scale.set(8,3.5,18);}
 // Tree canopies and shrubs stay on dry banks, never in the swimming pool or its climb channel.
 const foliageGeometry=new T.IcosahedronGeometry(1,2),leaves=new T.InstancedMesh(foliageGeometry,solid('#ffffff',.95),240),trunks=new T.InstancedMesh(new T.CylinderGeometry(.12,.2,1,7),solid('#625b43'),80);let leafCount=0,trunkCount=0;
 let seed=908;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<80;i++){
  const side=i%2?-1:1,x=WATERFALL.x+side*(12.4+random()*8),z=-54-random()*36;if(inNurseryWater(x,z,1.8))continue;
  const bankRadius=((Math.abs(x-WATERFALL.x)-17.5)/8)**2+((z+74)/18)**2,hill=bankRadius<1?Math.max(0,-.3+3.5*Math.sqrt(1-bankRadius)):0,height=2.3+random()*2.4;
  if(trunkCount<80){dummy.position.set(x,hill+height*.45,z);dummy.scale.set(1,height,1);dummy.rotation.set(0,0,0);dummy.updateMatrix();trunks.setMatrixAt(trunkCount++,dummy.matrix);}
  for(let j=0;j<3;j++){dummy.position.set(x+Math.sin(j*2.4)*.7,hill+height+.35*j,z+Math.cos(j*2.4)*.65);dummy.scale.set(1.3+random()*.8,.9+random()*.8,1.3+random()*.7);dummy.rotation.set(.1,j,.15);dummy.updateMatrix();leaves.setMatrixAt(leafCount,dummy.matrix);leaves.setColorAt(leafCount++,tint.set(['#355d3f','#4d774b','#628950','#759552'][i%4]));}
 }
 leaves.count=leafCount;trunks.count=trunkCount;leaves.castShadow=leaves.receiveShadow=true;group.add(leaves,trunks);leaves.name='Dry-bank waterfall greenery';
 const bankLeaves=new T.InstancedMesh(foliageGeometry,solid('#ffffff',.96),64);bankLeaves.name='Mossy forest on dry cascade ledges';
 for(let i=0;i<64;i++){const h=.3+(i%32)/31*13.2,at=waterfallPoint(h),side=i<32?-1:1;
  dummy.position.set(WATERFALL.x+side*(11-h*.26),at.y+.2,at.z-.8);dummy.scale.set(1.3,.7+(i%3)*.15,1.2);dummy.rotation.set(.1,i*.8,.1);dummy.updateMatrix();bankLeaves.setMatrixAt(i,dummy.matrix);bankLeaves.setColorAt(i,tint.set(['#476e39','#65864c','#567b42','#779752'][i%4]));
 }bankLeaves.castShadow=bankLeaves.receiveShadow=true;group.add(bankLeaves);
 for(const [x,h,z]of [[-25,4.6,-64.5],[-13.5,4.6,-64],[-24.4,9.2,-68.3]]){
  const island=mesh(group,rockGeometry,stone,x,h+.05,z);island.scale.set(1.35,.65,1.05);
  const cap=mesh(group,ledgeGeometry,moss,x,h+.57,z-.08);cap.scale.set(1.15,.22,.85);
 }
 return {stone};
}
