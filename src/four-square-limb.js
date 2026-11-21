import * as T from './vendor/three/three.module.min.js';
// A continuous skinned surface bends across the joint instead of separating pieces.
export function createFourSquareLimb(parent,{upper,lower,radius,materials}){
 const length=upper+lower,radial=16,rows=24,geometry=new T.CylinderGeometry(1,1,length,radial,rows,false);geometry.translate(0,-length/2,0);
 const positions=geometry.attributes.position,indices=[],weights=[];
 for(let i=0;i<positions.count;i++){
  const y=positions.getY(i),t=Math.max(0,Math.min(1,-y/length)),r=radius*(1-.29*t+.04*Math.sin(t*Math.PI));positions.setXYZ(i,positions.getX(i)*r,y,positions.getZ(i)*r);
  const blend=Math.max(0,Math.min(1,(-y-upper+.055)/.11)),smooth=blend*blend*(3-2*blend);indices.push(0,1,0,0);weights.push(1-smooth,smooth,0,0);
 }
 geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(indices,4));geometry.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));geometry.computeVertexNormals();geometry.clearGroups();
 const split=Math.round(upper/length*rows)*radial*6,sideCount=radial*rows*6;geometry.addGroup(0,split,0);geometry.addGroup(split,sideCount-split,1);geometry.addGroup(sideCount,radial*3,0);geometry.addGroup(sideCount+radial*3,radial*3,1);
 const root=new T.Bone(),hinge=new T.Bone();hinge.position.y=-upper;root.add(hinge);const mesh=new T.SkinnedMesh(geometry,materials);mesh.name='continuous-limb';mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);mesh.add(root);mesh.bind(new T.Skeleton([root,hinge]));mesh.frustumCulled=false;
 return {mesh,hinge};
}
