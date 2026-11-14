import * as T from './vendor/three/three.module.min.js';

// Original 3D scenery following the cover palette, outside all playable activity areas.
export function createDragonCoverScenery(world,kit){
 const {mesh,ball,solid,geo,rand}=kit,group=new T.Group();group.name='Cover valley';group.userData.dailyAnimated=true;world.add(group);
 const glow=kit.texture('cover-sun',c=>{const g=c.createRadialGradient(128,128,2,128,128,127);g.addColorStop(0,'#fff7d9');g.addColorStop(.16,'#ffe8b4ee');g.addColorStop(.42,'#ffc58a55');g.addColorStop(1,'#ffc58a00');c.fillStyle=g;c.fillRect(0,0,256,256);});
 const sun=new T.Sprite(new T.SpriteMaterial({map:glow.map,transparent:true,depthWrite:false,toneMapped:false,fog:false}));sun.position.set(-58,43,-185);sun.scale.set(58,58,1);group.add(sun);
 const cloud=kit.texture('cover-cloud',c=>{for(let i=0;i<9;i++){const x=35+i*23,y=110+Math.sin(i*2)*22,r=40+rand()*14,g=c.createRadialGradient(x,y,4,x,y,r);g.addColorStop(0,'#ffe5e6a0');g.addColorStop(.6,'#f3dae670');g.addColorStop(1,'#eddae300');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}});
 for(let i=0;i<12;i++){const sprite=new T.Sprite(new T.SpriteMaterial({map:cloud.map,transparent:true,depthWrite:false,toneMapped:false,fog:false}));sprite.position.set(-150+i*29,40+Math.sin(i)*12,-210-i%3*13);sprite.scale.set(68,28,1);group.add(sprite);}
 // The playable falls are built by dragon-nursery-swimming-scene.js.
 // Many petals share two instanced draws, so a fuller meadow remains inexpensive.
 const count=240,stem=new T.InstancedMesh(geo('cover-stem',()=>new T.CylinderGeometry(.012,.016,.34,5)),solid('#597a42'),count),petals=new T.InstancedMesh(geo('cover-petal',()=>new T.SphereGeometry(1,7,5)),solid('#ffffff'),count*5),dummy=new T.Object3D(),color=new T.Color();
 for(let i=0;i<count;i++){const side=i%2?1:-1,x=side*(3+rand()*8),z=2+rand()*12,sy=.6+rand()*.8;dummy.position.set(x,.17*sy,z);dummy.scale.set(1,sy,1);dummy.updateMatrix();stem.setMatrixAt(i,dummy.matrix);for(let j=0;j<5;j++){const a=j*Math.PI*2/5;dummy.position.set(x+Math.cos(a)*.08,.35*sy,z+Math.sin(a)*.08);dummy.scale.set(.075,.028,.055);dummy.rotation.y=-a;dummy.updateMatrix();petals.setMatrixAt(i*5+j,dummy.matrix);petals.setColorAt(i*5+j,color.set(['#fff1ce','#cab0df','#f3d47e'][i%3]));}}
 stem.castShadow=petals.castShadow=false;stem.receiveShadow=petals.receiveShadow=true;group.add(stem,petals);
 return {render(){}};
}
