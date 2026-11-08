let observer;
// The animated illustration is a DOM layer: no game engine or canvas render loop.
export function mountAnimatedGameCover(parent,src){
 if(!parent||typeof globalThis.document?.createElement!=='function')return;
 parent.classList.add('animated-game-cover');
 if(parent.querySelector('.animated-game-cover-art'))return;
 const art=document.createElement('div');art.className='animated-game-cover-art';art.setAttribute('aria-hidden','true');
 const picture=document.createElement('img');picture.className='animated-cover-image';picture.src=src;picture.alt='';picture.decoding='async';picture.loading='lazy';picture.draggable=false;art.append(picture);
 const glow=document.createElement('div');glow.className='animated-cover-glow';art.append(glow);
 for(let i=0;i<18;i++){const spark=document.createElement('i');spark.className='animated-cover-spark';spark.style.setProperty('--spark-x',(8+(i*47)%85)+'%');spark.style.setProperty('--spark-y',(38+(i*23)%55)+'%');spark.style.setProperty('--spark-delay',(-i*.43)+'s');spark.style.setProperty('--spark-time',(3.4+i%4*.6)+'s');if(i%3===0)spark.classList.add('blue');art.append(spark);}
 parent.append(art);
 if(typeof globalThis.IntersectionObserver==='function'){
  observer??=new IntersectionObserver(entries=>{for(const entry of entries){entry.target.classList.toggle('cover-in-view',entry.isIntersecting);if(!entry.target.isConnected)observer.unobserve(entry.target);}},{threshold:.05});observer.observe(parent);
 }else parent.classList.add('cover-in-view');
}
