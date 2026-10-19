export const BACKGROUND_KEY = 'sidequest.background.v1';
export const BACKGROUNDS = [
  { id: 'country', name: 'Countryside' },
  { id: 'city', name: 'City' },
  { id: 'sunset', name: 'Sunset' },
  { id: 'night', name: 'Starry night' },
  { id: 'classic', name: 'Classic' },
];
export function loadBackground(storage) {
  try { const value=storage.getItem(BACKGROUND_KEY);return BACKGROUNDS.some(scene=>scene.id===value)?value:'country'; }
  catch { return 'country'; }
}
export function saveBackground(storage,id) {
  if(!BACKGROUNDS.some(scene=>scene.id===id))throw new Error('Unknown background.');
  try { storage.setItem(BACKGROUND_KEY,id);return true; } catch { return false; }
}
export function initBackgroundPicker(storage) {
  const root=document.documentElement,options=document.querySelector('#background-options'),status=document.querySelector('#background-status');
  let selected=loadBackground(storage);
  function apply(id){root.dataset.background=id;selected=id;for(const button of options.children)button.setAttribute('aria-pressed',String(button.dataset.background===id));}
  for(const scene of BACKGROUNDS){
    const button=document.createElement('button');button.type='button';button.className='background-choice';button.dataset.background=scene.id;
    const preview=document.createElement('span');preview.className='background-thumbnail';preview.setAttribute('aria-hidden','true');
    if(scene.id!=='classic')preview.style.backgroundImage=`url('./assets/backgrounds/${scene.id}.svg')`;
    const label=document.createElement('span');label.textContent=scene.name;button.append(preview,label);
    button.onclick=()=>{apply(scene.id);const saved=saveBackground(storage,scene.id);status.textContent=saved?`${scene.name} background saved.`:`${scene.name} selected for this visit. Browser saving is unavailable.`;};
    options.append(button);
  }
  apply(selected);
}
