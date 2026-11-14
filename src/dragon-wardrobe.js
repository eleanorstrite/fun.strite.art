export function keeperOutfitThumbnail(outfit){return new URL('../assets/dragon-adventures/wardrobe/'+outfit+'.png',import.meta.url).href;}
export function keeperOutfitChoice(outfit){return `<button type="button" data-outfit="${outfit.id}" aria-label="${outfit.name}" aria-pressed="false"><img src="${keeperOutfitThumbnail(outfit.id)}" width="144" height="184" alt="" loading="lazy" draggable="false"></button>`;}
export function keeperHairThumbnail(style){return new URL('../assets/dragon-adventures/hairstyles/'+style+'.png?v=solid-roots-1',import.meta.url).href;}
export function keeperHairChoice(style){return `<button type="button" data-hairstyle="${style.id}" aria-label="${style.name}" aria-pressed="false"><img src="${keeperHairThumbnail(style.id)}" width="160" height="176" alt="" loading="lazy" draggable="false"></button>`;}
export function selectKeeperHairPictures(root,id){
 let selected;for(const button of root.querySelectorAll('[data-hairstyle]')){const active=button.dataset.hairstyle===id;button.setAttribute('aria-pressed',String(active));if(active)selected=button;}
 const grid=root.querySelector('.keeper-hair-pictures');if(!grid||grid.dataset.selectedHair===id)return;grid.dataset.selectedHair=id;
 requestAnimationFrame(()=>{if(!grid.isConnected||!selected)return;const area=grid.getBoundingClientRect(),item=selected.getBoundingClientRect();if(item.top<area.top+4)grid.scrollTop+=item.top-area.top-4;else if(item.bottom>area.bottom-4)grid.scrollTop+=item.bottom-area.bottom+4;});
}
