export const FLIGHT_LEVELS = {
  sloth: { name:'Sloth', speed:105, gap:260, reward:1 },
  easy: { name:'Easy', speed:150, gap:215, reward:2 },
  medium: { name:'Medium', speed:205, gap:175, reward:3 },
  hard: { name:'Hard', speed:275, gap:135, reward:5 },
  expert: { name:'Expert', speed:340, gap:110, reward:10 },
};
export const FLIGHT_ANIMALS = { dragon:'Dragon', hummingbird:'Hummingbird', eagle:'Eagle', capybara:'Capybara with jetpack', cat:'Cat with jetpack', dog:'Dog with jetpack', hotdog:'Hot dog with jetpack', burger:'Flying burger', pizza:'Flying pizza', taco:'Flying taco' };
export const PIPE_STYLES = { classic:'Classic pipes', stone:'Castle pillars', vines:'Vine towers', crystal:'Crystal towers', coral:'Coral reefs' };
export const FLIGHT_BACKGROUNDS = {
  classic:{name:'Original skies'},
  sunset:{name:'Sunset peaks'},
  ocean:{name:'Ocean breeze'},
  underwater:{name:'Underwater reef'},
  meadow:{name:'Sunny meadow'},
  desert:{name:'Desert dunes'},
  snow:{name:'Snowy mountains'},
  city:{name:'City skyline',upgrade:'flight-city'},
  stars:{name:'Starlight valley',upgrade:'flight-stars'},
};
export const FLIGHT_DEFAULTS = { animal:'dragon', color:'#d36a40', pipe:'classic', pipeColor:'#599b78', difficulty:'easy', background:'classic' };
export function validateFlightSettings(value=FLIGHT_DEFAULTS){
  if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid flying game settings.');
  const settings={...FLIGHT_DEFAULTS,...value};
  if(!Object.hasOwn(FLIGHT_BACKGROUNDS,settings.background)||!Object.hasOwn(FLIGHT_ANIMALS,settings.animal)||!Object.hasOwn(PIPE_STYLES,settings.pipe)||!Object.hasOwn(FLIGHT_LEVELS,settings.difficulty)||![settings.color,settings.pipeColor].every(c=>typeof c==='string'&&/^#[0-9a-f]{6}$/i.test(c)))throw Error('Invalid flying game settings.');
  return {background:settings.background,animal:settings.animal,color:settings.color,pipe:settings.pipe,pipeColor:settings.pipeColor,difficulty:settings.difficulty};
}
