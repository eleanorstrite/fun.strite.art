export function gameViews(game){return game.views||[game.dimension];}
export function gameHasBothViews(game){const views=gameViews(game);return views.includes('2D')&&views.includes('3D');}
export function gameMatchesFilter(game,filter){return filter==='all'||(filter==='both'?gameHasBothViews(game):gameViews(game).includes(filter));}
export function gameWorldLabel(game){return gameHasBothViews(game)?'2D + 3D':game.dimension;}
