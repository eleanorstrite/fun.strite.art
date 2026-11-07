import * as T from './vendor/three/three.module.min.js';
// Sculpted face geometry stays on one head joint, including eyes, ears and hair.
export function createCityFace(parent,{skinColor,hairColor,ball,mesh,geo,solid,texture}){
 const group=new T.Group();group.name='city-sculpted-head';parent.add(group);
 const skin=solid(skinColor,.62),hair=texture('city-hair:'+hairColor,c=>{c.fillStyle=hairColor;c.fillRect(0,0,256,256);for(let i=0;i<420;i++){c.strokeStyle=i%2?'#ffffff18':'#00000022';c.lineWidth=.6;c.beginPath();const x=(i*71)%256,y=(i*113)%256;c.moveTo(x,y);c.bezierCurveTo(x-12,y+10,x+10,y+20,x-3,y+35);c.stroke();}});hair.bumpScale=.003;hair.roughness=.72;
 const faceGeo=geo('cozy-sculpted-face',()=>{const g=new T.SphereGeometry(1,48,36),p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),jaw=1-Math.max(0,-y)*.25;p.setXYZ(i,x*.153*jaw,y*.2,z*.145+(z>0?Math.max(0,-y)*.014:0));}g.computeVertexNormals();return g;});mesh(group,faceGeo,skin);
 for(const side of [-1,1]){ball(group,side*.151,-.012,0,.023,.047,.027,skin);ball(group,side*.163,-.014,.012,.008,.028,.014,solid(skinColor,.78));}
 const iris=texture('city-natural-iris',c=>{c.fillStyle='#766044';c.fillRect(0,0,256,256);for(let i=0;i<180;i++){const a=i*Math.PI/90;c.strokeStyle=i%3?'#9d8958':'#3a493c';c.lineWidth=1.5;c.beginPath();c.moveTo(128+Math.sin(a)*35,128+Math.cos(a)*35);c.lineTo(128+Math.sin(a)*122,128+Math.cos(a)*122);c.stroke();}});iris.roughness=.23;iris.bumpScale=.001;
 const eyes=[];
 for(const side of [-1,1]){const x=side*.057;ball(group,x,.035,.137,.028,.017,.019,'#eee7d9');ball(group,x,.034,.156,.014,.014,.005,iris);const pupil=ball(group,x,.034,.162,.0065,.008,.003,'#28332b');eyes.push(pupil);ball(group,x-.004,.039,.166,.0028,.0028,.0015,'#ffffff');ball(group,x,.054,.14,.032,.004,.016,skin);
  const path=new T.CatmullRomCurve3([new T.Vector3(x-side*.027,.071,.137),new T.Vector3(x,.081,.144),new T.Vector3(x+side*.025,.073,.13)]);mesh(group,geo('cozy-brow-'+side,()=>new T.TubeGeometry(path,10,.0045,5,false)),hair);
 }
 ball(group,0,.005,.145,.022,.052,.025,skin);ball(group,0,-.025,.171,.019,.016,.019,skin);for(const side of [-1,1])ball(group,side*.011,-.036,.182,.004,.0025,.003,'#865b4d');
 const lips=new T.CatmullRomCurve3([new T.Vector3(-.027,-.085,.13),new T.Vector3(0,-.088,.143),new T.Vector3(.027,-.085,.13)]);mesh(group,geo('cozy-smile',()=>new T.TubeGeometry(lips,14,.002,6,false)),solid('#a97464',.6));ball(group,0,-.094,.137,.022,.003,.006,'#c08d7b');
 const mouth=ball(group,0,-.095,.15,.045,.065,.02,'#512c2e');mouth.visible=false;
 ball(group,0,.13,-.02,.16,.097,.151,hair);for(let i=0;i<16;i++){const a=i*2.399;const curl=ball(group,Math.sin(a)*.132,.1+(i%4)*.022,Math.cos(a)*.126,.03,.032,.032,hair);curl.rotation.set(a*.2,a,a*.1);}for(let i=0;i<6;i++)ball(group,-.115+i*.046,.105+Math.sin(i)*.016,.119,.03,.028,.025,hair);
 // Keep the detailed head inexpensive: stationary parts share instanced draws.
 const batches=new Map();for(const object of [...group.children]){if(!object.isMesh||object===mouth||eyes.includes(object))continue;object.updateMatrix();const key=object.geometry.uuid+':'+object.material.uuid;if(!batches.has(key))batches.set(key,[]);batches.get(key).push(object);}for(const parts of batches.values()){const batch=new T.InstancedMesh(parts[0].geometry,parts[0].material,parts.length);parts.forEach((part,i)=>{batch.setMatrixAt(i,part.matrix);part.removeFromParent();});batch.castShadow=true;batch.receiveShadow=true;batch.computeBoundingSphere();group.add(batch);}
 return {group,eyes,mouth};
}
