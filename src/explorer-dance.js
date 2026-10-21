// Wait for the forest explorer to be visible so the celebration isn't missed.
export function createExplorerDance(explorer, Observer = globalThis.IntersectionObserver) {
  let pending=false,visible=!Observer;
  function play(){
    if(!pending||!visible)return;
    pending=false;explorer.classList.remove('explorer-dancing');
    void explorer.offsetWidth; // Restart the animation on another explicit save.
    explorer.classList.add('explorer-dancing');
  }
  const observer=Observer?new Observer(entries=>{
    for(const entry of entries){
      if(entry.target!==explorer)continue;
      visible=entry.isIntersecting&&entry.intersectionRatio>=.5;
      explorer.style.animationPlayState=visible?'running':'paused';
      play();
    }
  },{threshold:[0,.5]}):null;
  observer?.observe(explorer);
  explorer.addEventListener('animationend',event=>{if(event.target===explorer)explorer.classList.remove('explorer-dancing');});
  return { request(){pending=true;play();} };
}
