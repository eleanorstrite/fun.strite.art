let observer;
// Illustrated layers animate without starting the game or a canvas render loop.
export function mountFourSquareCover(parent){
 if(!parent||typeof globalThis.document?.createElement!=='function')return;
 if(parent.querySelector('.four-square-cover'))return;
 parent.classList.add('animated-game-cover');
 const art=document.createElement('div');art.className='four-square-cover';art.setAttribute('aria-hidden','true');
 const background=document.createElement('img');background.src=new URL('../assets/four-square/cover-background.webp',import.meta.url).href;background.alt='';background.decoding='async';art.append(background);
 for(const [i,rank] of ['king','queen','knight','peasant'].entries()){
  const shadow=document.createElement('i');shadow.className='fs-cover-shadow '+rank;art.append(shadow);
  const kid=document.createElement('i');kid.className='fs-cover-kid '+rank;kid.style.backgroundPosition=(i*100/3)+'% 0';art.append(kid);
 }
 const ball=document.createElement('i');ball.className='fs-cover-ball';art.append(ball);
 for(const [kind,text] of [['popcorn','🍿 Popcorn!'],['story','📖 Story Time!']]){const badge=document.createElement('span');badge.className='fs-cover-badge '+kind;badge.textContent=text;art.append(badge);}
 for(let i=0;i<10;i++){const star=document.createElement('i');star.className='fs-cover-star';star.textContent='✦';star.style.cssText=`left:${5+i*10}%;top:${35+(i*17)%60}%;animation-delay:${-i*.31}s`;art.append(star);}
 // If an illustration fails, reveal the complete static cover underneath.
 background.addEventListener('error',()=>{art.remove();parent.classList.remove('animated-game-cover');},{once:true});
 parent.append(art);
 if(typeof globalThis.IntersectionObserver==='function'){
  observer??=new IntersectionObserver(entries=>{for(const entry of entries){entry.target.classList.toggle('cover-in-view',entry.isIntersecting);if(!entry.target.isConnected)observer.unobserve(entry.target);}},{threshold:.05});observer.observe(parent);
 }else parent.classList.add('cover-in-view');
}
