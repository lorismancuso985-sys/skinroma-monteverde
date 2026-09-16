(()=>{
  'use strict';
  const qs=(s,c=document)=>c?.querySelector(s)||null;
  const qsa=(s,c=document)=>c?[...c.querySelectorAll(s)]:[];
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pageEN=document.documentElement.lang.toLowerCase().startsWith('en');
  const ui=pageEN?{openMenu:'Open menu',closeMenu:'Close menu',pauseShow:'Pause slideshow',resumeShow:'Resume slideshow',pause:'PAUSE',play:'PLAY',playBeauty:'Play Beauty video',pauseBeauty:'Pause Beauty video'}:{openMenu:'Apri menu',closeMenu:'Chiudi menu',pauseShow:'Metti in pausa lo slideshow',resumeShow:'Riprendi lo slideshow',pause:'PAUSA',play:'PLAY',playBeauty:'Avvia video Beauty',pauseBeauty:'Metti in pausa video Beauty'};


  /* Intro: never trap the page, including bfcache restores. */
  const intro=qs('#intro');
  const hideIntro=()=>intro?.classList.add('hide');
  if(reduced) hideIntro(); else window.setTimeout(hideIntro,1250);
  window.addEventListener('pageshow',e=>{if(e.persisted)hideIntro()});

  /* Newsletter top banner: visible on fresh visits, dismissible for the current tab/session. */
  const newsletterBanner=qs('#newsletterBanner');
  const newsletterBannerClose=qs('#newsletterBannerClose');
  const bannerKey='skinroma-newsletter-banner-closed';
  let bannerClosed=false;
  try{bannerClosed=sessionStorage.getItem(bannerKey)==='1'}catch{}
  if(bannerClosed) newsletterBanner?.classList.add('is-hidden');
  const closeNewsletterBanner=(remember=true)=>{
    newsletterBanner?.classList.add('is-hidden');
    if(remember){try{sessionStorage.setItem(bannerKey,'1')}catch{}}
  };
  newsletterBannerClose?.addEventListener('click',()=>closeNewsletterBanner(true));
  qs('.newsletter-banner__link')?.addEventListener('click',()=>closeNewsletterBanner(true));

  /* Header state. */
  const header=qs('#header');
  const syncHeader=()=>header?.classList.toggle('scrolled',window.scrollY>24);
  syncHeader();
  window.addEventListener('scroll',syncHeader,{passive:true});

  /* Menu: semantics, focus trap, focus restore. */
  const menuBtn=qs('#menuBtn');
  const menuPanel=qs('#menuPanel');
  let menuReturnFocus=null;
  const menuFocusables=()=>[menuBtn,...qsa('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])',menuPanel)].filter(Boolean);
  const setMenu=(open)=>{
    if(!menuBtn||!menuPanel)return;
    document.body.classList.toggle('menu-open',open);
    menuPanel.classList.toggle('open',open);
    menuPanel.setAttribute('aria-hidden',String(!open));
    menuBtn.setAttribute('aria-expanded',String(open));
    menuBtn.setAttribute('aria-label',open?ui.closeMenu:ui.openMenu);
    if(open){
      menuReturnFocus=document.activeElement;
      menuPanel.removeAttribute('inert');
      qs('nav a',menuPanel)?.focus({preventScroll:true});
    }else{
      menuPanel.setAttribute('inert','');
      if(menuReturnFocus instanceof HTMLElement) menuReturnFocus.focus({preventScroll:true});
    }
  };
  menuBtn?.addEventListener('click',()=>setMenu(!document.body.classList.contains('menu-open')));
  qsa('.menu-panel a').forEach(a=>a.addEventListener('click',()=>setMenu(false)));

  /* Reveal progressively, with a deterministic fallback. */
  const revealEls=qsa('.reveal');
  if('IntersectionObserver' in window && !reduced){
    const revealObs=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){entry.target.classList.add('in');revealObs.unobserve(entry.target)}
      });
    },{threshold:.07,rootMargin:'0px 0px -4% 0px'});
    revealEls.forEach(el=>revealObs.observe(el));
    window.setTimeout(()=>revealEls.forEach(el=>el.classList.add('in')),2600);
  }else revealEls.forEach(el=>el.classList.add('in'));

  /* Hero slideshow: explicit pause control + correct aria state. */
  const hero=qs('.hero');
  const slides=qsa('.hero-slide');
  const dots=qsa('.hero-index button');
  const pauseBtn=qs('.hero-pause');
  let slide=0,timer=null,userPaused=false;
  const showSlide=(i)=>{
    if(!slides.length)return;
    slide=(i+slides.length)%slides.length;
    slides.forEach((s,n)=>s.classList.toggle('is-active',n===slide));
    dots.forEach((d,n)=>{
      const active=n===slide;
      d.classList.toggle('is-active',active);
      d.setAttribute('aria-current',active?'true':'false');
      const line=qs('i',d);
      if(line&&!reduced&&!userPaused){line.style.animation='none';void line.offsetWidth;line.style.animation=''}
    });
  };
  const stopHero=()=>{if(timer){clearInterval(timer);timer=null}};
  const startHero=()=>{
    stopHero();
    if(!reduced&&!userPaused&&!document.hidden&&slides.length>1)timer=setInterval(()=>showSlide(slide+1),5500);
  };
  dots.forEach((d,i)=>d.addEventListener('click',()=>{showSlide(i);startHero()}));
  pauseBtn?.addEventListener('click',()=>{
    userPaused=!userPaused;
    pauseBtn.setAttribute('aria-pressed',String(userPaused));
    pauseBtn.setAttribute('aria-label',userPaused?ui.resumeShow:ui.pauseShow);
    const label=qs('span',pauseBtn); if(label)label.textContent=userPaused?ui.play:ui.pause;
    userPaused?stopHero():startHero();
  });
  showSlide(0);startHero();
  document.addEventListener('visibilitychange',()=>document.hidden?stopHero():startHero());

  /* Defer process videos until they are actually visible. */
  const autoVideos=qsa('video[data-autoplay="true"]');
  if(!reduced&&'IntersectionObserver' in window){
    const videoObs=new IntersectionObserver(entries=>entries.forEach(async entry=>{
      const v=entry.target;
      if(entry.isIntersecting){try{await v.play()}catch{}}
      else v.pause();
    }),{threshold:.28,rootMargin:'180px 0px'});
    autoVideos.forEach(v=>videoObs.observe(v));
  }else autoVideos.forEach(v=>v.pause());

  /* Beauty editorial video: only plays in view and still has a manual toggle. */
  const beautyVideo=qs('#beautyVideo');
  const videoToggle=qs('.video-toggle');
  const syncVideoLabel=()=>{
    const s=qs('span',videoToggle);
    if(s)s.textContent=beautyVideo?.paused?ui.play:ui.pause;
    videoToggle?.setAttribute('aria-label',beautyVideo?.paused?ui.playBeauty:ui.pauseBeauty);
  };
  videoToggle?.addEventListener('click',async()=>{
    if(!beautyVideo)return;
    if(beautyVideo.paused){try{await beautyVideo.play()}catch{}}
    else beautyVideo.pause();
    syncVideoLabel();
  });
  if(beautyVideo&&'IntersectionObserver' in window&&!reduced){
    const beautyObs=new IntersectionObserver(async entries=>{
      for(const entry of entries){
        if(entry.isIntersecting){try{await beautyVideo.play()}catch{}}
        else beautyVideo.pause();
        syncVideoLabel();
      }
    },{threshold:.32,rootMargin:'120px 0px'});
    beautyObs.observe(beautyVideo);
  }else{beautyVideo?.pause();syncVideoLabel()}

  /* Price navigation: anchored categories actually open before scrolling. */
  const priceGroups=qsa('.price-group');
  const openPriceGroup=(id,scroll=true)=>{
    const target=document.getElementById(id);
    if(!(target instanceof HTMLDetailsElement))return false;
    priceGroups.forEach(group=>{if(group!==target)group.open=false});
    target.open=true;
    if(scroll)window.requestAnimationFrame(()=>target.scrollIntoView({behavior:reduced?'auto':'smooth',block:'start'}));
    return true;
  };
  qsa('a[href^="#price-"]').forEach(a=>a.addEventListener('click',e=>{
    const id=a.getAttribute('href')?.slice(1);if(!id)return;
    if(openPriceGroup(id,true)){e.preventDefault();history.replaceState(null,'',`#${id}`)}
  }));
  const syncPriceHash=()=>{const id=location.hash.slice(1);if(id.startsWith('price-'))openPriceGroup(id,false)};
  window.addEventListener('hashchange',syncPriceHash);syncPriceHash();

  /* Results lightbox: close, previous/next, keyboard and focus restore. */
  const lightbox=qs('#lightbox');
  const lbImg=qs('#lightbox img');
  const resultCards=qsa('.result-card');
  const closeBtn=qs('.lightbox-close');
  let lightboxIndex=0,lightboxReturnFocus=null;
  const renderLightbox=()=>{
    const card=resultCards[lightboxIndex];if(!card||!lbImg)return;
    lbImg.src=card.dataset.src||'';lbImg.alt=qs('img',card)?.alt||'';
  };
  const openLightbox=(index)=>{
    if(!lightbox||!lbImg||!resultCards.length)return;
    lightboxIndex=(index+resultCards.length)%resultCards.length;
    lightboxReturnFocus=document.activeElement;
    renderLightbox();
    lightbox.classList.add('open');lightbox.setAttribute('aria-hidden','false');
    document.body.classList.add('lightbox-open');
    closeBtn?.focus({preventScroll:true});
  };
  function closeLightbox(){
    if(!lightbox)return;
    lightbox.classList.remove('open');lightbox.setAttribute('aria-hidden','true');document.body.classList.remove('lightbox-open');
    if(lbImg)lbImg.src='';
    if(lightboxReturnFocus instanceof HTMLElement)lightboxReturnFocus.focus({preventScroll:true});
  }
  const shiftLightbox=dir=>{lightboxIndex=(lightboxIndex+dir+resultCards.length)%resultCards.length;renderLightbox()};
  resultCards.forEach((card,i)=>card.addEventListener('click',()=>openLightbox(i)));
  closeBtn?.addEventListener('click',closeLightbox);
  qs('.lightbox-prev')?.addEventListener('click',()=>shiftLightbox(-1));
  qs('.lightbox-next')?.addEventListener('click',()=>shiftLightbox(1));
  lightbox?.addEventListener('click',e=>{if(e.target===lightbox)closeLightbox()});

  /* Keep the newsletter form completely unobstructed on mobile.
     Use geometry instead of relying only on IntersectionObserver: this remains reliable
     on iOS Safari even when the section is taller than the viewport. */
  const newsletterSection=qs('#newsletter');
  const syncNewsletterUi=()=>{
    if(!newsletterSection)return;
    const r=newsletterSection.getBoundingClientRect();
    const vh=window.innerHeight||document.documentElement.clientHeight||0;
    const active=r.top < vh*.94 && r.bottom > vh*.08;
    document.body.classList.toggle('in-newsletter',active);
    newsletterBanner?.classList.toggle('is-section-hidden',active);
  };
  syncNewsletterUi();
  window.addEventListener('scroll',syncNewsletterUi,{passive:true});
  window.addEventListener('resize',syncNewsletterUi,{passive:true});
  window.addEventListener('pageshow',syncNewsletterUi);
  qsa('.newsletter-field input').forEach(input=>{
    input.addEventListener('focus',()=>document.body.classList.add('in-newsletter'));
    input.addEventListener('blur',syncNewsletterUi);
  });

  /* Sticky booking CTA appears only after hero exits the viewport. */
  if(hero&&'IntersectionObserver' in window){
    const heroCtaObs=new IntersectionObserver(([entry])=>document.body.classList.toggle('mobile-cta-ready',!entry.isIntersecting),{threshold:.02});
    heroCtaObs.observe(hero);
  }else if(hero){
    const syncMobileCta=()=>document.body.classList.toggle('mobile-cta-ready',window.scrollY>hero.offsetHeight*.92);
    syncMobileCta();window.addEventListener('scroll',syncMobileCta,{passive:true});
  }

  /* Salon gallery: native swipe, robust centering, keyboard arrows, dot sync. */
  const salonGallery=qs('#salonGallery');
  const salonSlides=qsa('.wg-slide',salonGallery);
  const salonDots=qsa('.wide-gallery-dots button');
  if(salonGallery&&salonSlides.length){
    const setGalleryDot=index=>salonDots.forEach((dot,i)=>{
      const active=i===index;dot.classList.toggle('is-active',active);dot.setAttribute('aria-current',active?'true':'false');
    });
    const nearestIndex=()=>{
      const center=salonGallery.scrollLeft+salonGallery.clientWidth/2;
      let best=0,bestDist=Infinity;
      salonSlides.forEach((s,i)=>{const dist=Math.abs((s.offsetLeft+s.offsetWidth/2)-center);if(dist<bestDist){bestDist=dist;best=i}});
      return best;
    };
    const goGallery=index=>{
      const target=salonSlides[index];if(!target)return;
      const left=target.offsetLeft-(salonGallery.clientWidth-target.offsetWidth)/2;
      salonGallery.scrollTo({left:Math.max(0,left),behavior:reduced?'auto':'smooth'});setGalleryDot(index);
    };
    salonDots.forEach((dot,i)=>dot.addEventListener('click',()=>goGallery(i)));
    let raf=0;
    salonGallery.addEventListener('scroll',()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>setGalleryDot(nearestIndex()))},{passive:true});
    salonGallery.addEventListener('keydown',e=>{
      if(e.key==='ArrowRight'){e.preventDefault();goGallery(Math.min(salonSlides.length-1,nearestIndex()+1))}
      if(e.key==='ArrowLeft'){e.preventDefault();goGallery(Math.max(0,nearestIndex()-1))}
    });
  }

  /* Global keyboard handling. */
  document.addEventListener('keydown',e=>{
    if(document.body.classList.contains('menu-open')){
      if(e.key==='Escape'){e.preventDefault();setMenu(false);return}
      if(e.key==='Tab'){
        const items=menuFocusables();if(!items.length)return;
        const first=items[0],last=items[items.length-1];
        if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
        else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
      }
    }
    if(lightbox?.classList.contains('open')){
      if(e.key==='Escape'){e.preventDefault();closeLightbox()}
      else if(e.key==='ArrowRight'){e.preventDefault();shiftLightbox(1)}
      else if(e.key==='ArrowLeft'){e.preventDefault();shiftLightbox(-1)}
    }
  });

  const year=qs('#year');if(year)year.textContent=String(new Date().getFullYear());
})();
