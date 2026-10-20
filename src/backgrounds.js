export const BACKGROUND_KEY = 'sidequest.background.v1';
export const BACKGROUNDS = [
  { id: 'country', name: 'Countryside' },
  { id: 'city', name: 'City' },
  { id: 'sunset', name: 'Sunset' },
  { id: 'night', name: 'Starry night' },
  { id: 'aurora', name: 'Northern lights', upgrade: 'aurora-background' },
  { id: 'forest', name: 'Enchanted forest', upgrade: 'forest-background' },
  { id: 'classic', name: 'Classic' },
];
export function loadBackground(storage,owned=[]) {
  try { const value=storage.getItem(BACKGROUND_KEY);return BACKGROUNDS.some(scene=>scene.id===value&&(!scene.upgrade||owned.includes(scene.upgrade)))?value:'country'; }
  catch { return 'country'; }
}
export function saveBackground(storage,id,owned=[]) {
  if(!BACKGROUNDS.some(scene=>scene.id===id))throw new Error('Unknown background.');
  const scene=BACKGROUNDS.find(scene=>scene.id===id);if(scene.upgrade&&!owned.includes(scene.upgrade))throw new Error('Unlock this background in the shop first.');
  try { storage.setItem(BACKGROUND_KEY,id);return true; } catch { return false; }
}
export function initBackgroundPicker(storage,system) {
  const root=document.documentElement,options=document.querySelector('#background-options'),status=document.querySelector('#background-status');
  let selected=loadBackground(storage,system.snapshot().upgrades);
  function apply(id){root.dataset.background=id;selected=id;for(const button of options.children)button.setAttribute('aria-pressed',String(button.dataset.background===id));}
  for(const scene of BACKGROUNDS){
    const button=document.createElement('button');button.type='button';button.className='background-choice';button.dataset.background=scene.id;
    const preview=document.createElement('span');preview.className='background-thumbnail';preview.setAttribute('aria-hidden','true');
    if(scene.id!=='classic')preview.style.backgroundImage=`url('./assets/backgrounds/${scene.id}.svg')`;
    const label=document.createElement('span');label.textContent=scene.name;button.append(preview,label);
    button.onclick=()=>{if(scene.upgrade&&!system.snapshot().upgrades.includes(scene.upgrade))return;apply(scene.id);const saved=saveBackground(storage,scene.id,system.snapshot().upgrades);status.textContent=saved?`${scene.name} background saved.`:`${scene.name} selected for this visit. Browser saving is unavailable.`;};
    options.append(button);
  }
  function refresh(){
    const owned=system.snapshot().upgrades;
    for(const button of options.children){const scene=BACKGROUNDS.find(scene=>scene.id===button.dataset.background),locked=Boolean(scene.upgrade&&!owned.includes(scene.upgrade));button.disabled=locked;button.setAttribute('aria-label',scene.name+(locked?' — unlock in shop':''));button.children[1].textContent=scene.name+(locked?' 🔒':'');}
    const scene=BACKGROUNDS.find(scene=>scene.id===selected);if(scene.upgrade&&!owned.includes(scene.upgrade))selected='country';apply(selected);
  }
  system.subscribe(refresh);refresh();
}
