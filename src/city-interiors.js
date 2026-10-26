// Plot coordinates make a home's personality stable across reloads and map resizing.
const HOME_THEMES=['cinema','cat','dog','artist','reader','gardener'];
const HOME_COLORS=['#527e9a','#a36b96','#c0854f','#4c9990','#8275aa','#649359'];
export function cityHomeStyle(size,index){
  const x=index%size,z=Math.floor(index/size),seed=(Math.imul(x+1,73856093)^Math.imul(z+1,19349663))>>>0;
  return {theme:HOME_THEMES[(x+z*3)%HOME_THEMES.length],color:HOME_COLORS[seed%HOME_COLORS.length],accent:['#ead4bb','#d3e3df','#e8d6e6','#f0dfb2'][seed%4],phase:(seed%100)/10,address:`${x+1} · ${z+1}`};
}
export function cityActivityPose(activity,time,phase=0){
  const t=time+phase,slow=Math.sin(t*1.5),tap=Math.sin(t*7);
  const pose={left:-.25,right:-.25,head:Math.sin(t*.7)*.09,lean:slow*.015};
  if(activity==='eat'||activity==='drink'){pose.right=-.65-(.5+.5*Math.sin(t*1.8))*1.25;pose.head=slow*.06;}
  else if(activity==='type'){pose.left=-1.05+tap*.12;pose.right=-1.05-tap*.12;pose.head=-.13;}
  else if(activity==='write'||activity==='paint'){pose.right=-1.1+Math.sin(t*4)*.22;pose.left=-.65;pose.head=-.1;}
  else if(activity==='serve'){pose.left=-.8+slow*.3;pose.right=-.8-slow*.3;}
  else if(activity==='read'){pose.left=pose.right=-1.05;pose.right+=Math.sin(t*.8)*.12;pose.head=-.16;}
  else if(activity==='water'){pose.right=-.9+slow*.25;pose.head=.15;}
  else {pose.right=-.65+slow*.12;}
  return pose;
}
export function cityPetPose(time,phase=0){
  const t=(time+phase)*.45;
  return {x:.25+Math.sin(t)*.45,z:Math.cos(t)*1.7,angle:Math.atan2(.45*Math.cos(t),-1.7*Math.sin(t)),stride:Math.sin((time+phase)*9)*.32,tail:Math.sin((time+phase)*5)*.3};
}

// Only a deliberate step into an available piece of furniture starts resting.
export function cityFurnitureAt(obstacles,from,to){
  return obstacles?.find(item=>item.use&&!item.use.occupied&&
    Math.abs(to.x-item.x)<item.w/2+.22&&Math.abs(to.z-item.z)<item.d/2+.22&&
    !(Math.abs(from.x-item.x)<item.w/2+.22&&Math.abs(from.z-item.z)<item.d/2+.22))?.use??null;
}
