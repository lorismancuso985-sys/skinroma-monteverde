(() => {
  'use strict';
  const qs=(s,c=document)=>c.querySelector(s);
  const escapeHtml=(v='')=>String(v).replace(/[&<>'\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[m]));
  const lang=document.documentElement.lang==='en'?'en':'it';
  const text=lang==='en'?{
    sending:'Sending…',ok:'Subscription received. Welcome to the Skin world.',error:'Something went wrong. Please try again.',invalid:'Please check the information entered.',cta:'Ask availability'
  }:{
    sending:'Invio in corso…',ok:'Iscrizione ricevuta. Benvenuti nel mondo Skin.',error:'Qualcosa non ha funzionato. Riprova tra poco.',invalid:'Controlla i dati inseriti.',cta:'Chiedi disponibilità'
  };

  const reviewScore=qs('.reviews-score');
  if(reviewScore){
    const value=qs('strong',reviewScore);
    if(value)value.innerHTML='4,<span style="font-size:.62em;line-height:1;vertical-align:.28em;display:inline-block;margin-left:.015em">9</span>';
    reviewScore.setAttribute('aria-label',lang==='en'?'4.9 out of 5 on Treatwell, over 980 verified reviews':'Valutazione 4,9 su 5 su Treatwell, oltre 980 recensioni verificate');
  }

  const contactEmail='info@skinroma.it';
  const menuMeta=qs('.menu-meta');
  if(menuMeta&&!menuMeta.querySelector(`a[href="mailto:${contactEmail}"]`)){
    const link=document.createElement('a');
    link.href=`mailto:${contactEmail}`;
    link.textContent=contactEmail;
    menuMeta.appendChild(link);
  }
  const contactButtons=qs('.contact-buttons');
  if(contactButtons&&!contactButtons.querySelector(`a[href="mailto:${contactEmail}"]`)){
    const link=document.createElement('a');
    link.href=`mailto:${contactEmail}`;
    link.className='btn btn-outline';
    link.textContent=contactEmail;
    contactButtons.appendChild(link);
  }

  const productGallery=qs('.product-gallery');
  if(productGallery){
    const duplicatedCard=[...productGallery.querySelectorAll('figure')].find(card=>card.querySelector('img[src$="product_farmaca_wall.webp"]'));
    if(duplicatedCard)duplicatedCard.remove();
  }

  const ghdBrand=[...document.querySelectorAll('.partner-logos span')].find(el=>el.textContent.trim().toLowerCase()==='ghd');
  if(ghdBrand)ghdBrand.textContent='GHD';

  const menuTypeStyle=document.createElement('style');
  menuTypeStyle.textContent='@media(max-width:680px){.menu-inner{padding-top:96px}.menu-inner nav a{font-size:2.72rem!important;line-height:.96!important;padding:4px 0!important;gap:17px!important}.menu-inner nav span{font-size:.5rem!important}}';
  document.head.appendChild(menuTypeStyle);

  const footer=qs('.footer');
  if(footer){
    const oldPrivacy=qs('.footer-top nav a[href="privacy.html"]',footer);
    if(oldPrivacy)oldPrivacy.remove();
    const footerBottom=qs('.footer-bottom',footer);
    if(footerBottom&&!qs('.footer-legal-strip',footer)){
      const legal=document.createElement('div');
      legal.className='footer-legal-strip';
      const info=document.createElement('p');
      info.innerHTML='<strong>Beauty Chic S.r.l.</strong> – P. IVA/C.F. 10769531004 – REA RM-1254506<br>Circonvallazione Gianicolense 250/A – 00152 Roma (RM)<br>PEC: beautychic@mypec.eu';
      const nav=document.createElement('nav');
      nav.className='footer-legal-links';
      nav.setAttribute('aria-label',lang==='en'?'Legal information':'Informazioni legali');
      const links=lang==='en'?
        [['privacy-en.html','Privacy Policy'],['cookie-policy.html','Cookie Policy'],['termini-condizioni.html','Terms & Conditions'],['note-legali.html','Legal Notice']]:
        [['privacy.html','Privacy Policy'],['cookie-policy.html','Cookie Policy'],['termini-condizioni.html','Termini e condizioni'],['note-legali.html','Note legali']];
      links.forEach(([href,label])=>{const a=document.createElement('a');a.href=href;a.textContent=label;nav.appendChild(a)});
      legal.append(info,nav);
      footer.insertBefore(legal,footerBottom);
    }
  }
  const legalFooterStyle=document.createElement('style');
  legalFooterStyle.textContent='.footer-legal-strip{padding:22px 0;border-top:1px solid rgba(255,255,255,.12);display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr);gap:34px;align-items:start}.footer-legal-strip p{margin:0!important;color:#776e68!important;font-size:.62rem!important;line-height:1.75!important;letter-spacing:.025em}.footer-legal-strip p strong{color:#a79d97;font-weight:600}.footer-legal-links{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:10px 18px}.footer-legal-links a{font-size:.58rem;letter-spacing:.1em;text-transform:uppercase;color:#9b918b;transition:color .2s}.footer-legal-links a:hover{color:#fff}@media(max-width:680px){.footer-legal-strip{grid-template-columns:1fr;gap:18px;padding:20px 0}.footer-legal-links{justify-content:flex-start;gap:10px 14px}.footer-legal-strip p{font-size:.6rem!important}.footer-legal-links a{font-size:.55rem}}';
  document.head.appendChild(legalFooterStyle);

  const bindProductsLink=link=>{
    if(!link||link.dataset.productsBound==='1')return;
    link.dataset.productsBound='1';
    link.addEventListener('click',e=>{
      const target=qs('#shop');
      if(!target)return;
      e.preventDefault();
      target.hidden=false;
      const menuBtn=qs('#menuBtn');
      if(document.body.classList.contains('menu-open'))menuBtn?.click();
      window.requestAnimationFrame(()=>window.requestAnimationFrame(()=>{
        target.scrollIntoView({behavior:'smooth',block:'start'});
        try{history.replaceState(null,'','#shop')}catch{}
      }));
    });
  };

  const exposeProductsNav=()=>{
    const menuNav=qs('.menu-inner nav');
    let menuLink=menuNav?.querySelector('a[href="#shop"]')||null;
    if(menuNav&&!menuLink){
      menuLink=document.createElement('a');
      menuLink.href='#shop';
      menuLink.innerHTML=`<span></span>${lang==='en'?'Products':'Prodotti'}`;
      const before=menuNav.querySelector('a[href="#recensioni"],a[href="#reviews"]');
      if(before)menuNav.insertBefore(menuLink,before); else menuNav.appendChild(menuLink);
      [...menuNav.querySelectorAll('a')].forEach((item,i)=>{
        const n=item.querySelector('span');
        if(n)n.textContent=String(i+1).padStart(2,'0');
      });
    }
    bindProductsLink(menuLink);

    const footerNav=qs('.footer nav');
    let footerLink=footerNav?.querySelector('a[href="#shop"]')||null;
    if(footerNav&&!footerLink){
      footerLink=document.createElement('a');
      footerLink.href='#shop';
      footerLink.textContent=lang==='en'?'Products':'Prodotti';
      const before=footerNav.querySelector('a[href="#recensioni"],a[href="#reviews"]');
      if(before)footerNav.insertBefore(footerLink,before); else footerNav.appendChild(footerLink);
    }
    bindProductsLink(footerLink);
  };

  const form=qs('form[data-newsletter-enhanced="true"]');
  if(form){
    const status=qs('.newsletter-status',form), button=qs('button[type="submit"]',form);
    form.addEventListener('submit',async e=>{
      if(!form.reportValidity())return;
      e.preventDefault();
      const fd=new FormData(form);
      if(fd.get('bot-field'))return;
      const payload=Object.fromEntries(fd.entries());
      form.classList.add('is-sending');
      if(button)button.disabled=true;
      if(status){status.className='newsletter-status';status.textContent=text.sending}
      try{
        const res=await fetch('/.netlify/functions/newsletter',{method:'POST',headers:{'content-type':'application/json','accept':'application/json'},body:JSON.stringify(payload)});
        const data=await res.json().catch(()=>({}));
        if(!res.ok){
          if(res.status===404 || res.status===503 || res.status>=500){
            HTMLFormElement.prototype.submit.call(form);
            return;
          }
          if(status){status.classList.add('is-error');status.textContent=data.error||text.invalid}
          return;
        }
        form.reset();
        if(status){status.classList.add('is-success');status.textContent=text.ok}
      }catch{
        try{HTMLFormElement.prototype.submit.call(form);return}catch{}
        if(status){status.classList.add('is-error');status.textContent=text.error}
      }finally{
        form.classList.remove('is-sending');
        if(button)button.disabled=false;
      }
    });
  }

  const section=qs('.products-showcase'), grid=qs('[data-products-grid]');
  if(section&&grid){
    fetch('/.netlify/functions/products',{headers:{accept:'application/json'}})
      .then(r=>r.ok?r.json():Promise.reject(new Error(`HTTP ${r.status}`)))
      .then(({products=[]})=>{
        if(!Array.isArray(products)||!products.length)return;
        grid.innerHTML=products.map(p=>{
          const title=String(p.title||'').trim();
          if(!title)return '';
          const numericPrice=Number(p.price);
          const price=p.price!==null&&p.price!==undefined&&p.price!==''&&Number.isFinite(numericPrice)
            ?`${numericPrice.toLocaleString(lang==='it'?'it-IT':'en-GB',{minimumFractionDigits:0,maximumFractionDigits:2})} €`:'';
          const wa=`https://wa.me/393388797250?text=${encodeURIComponent((lang==='it'?'Ciao Skin Roma! Vorrei informazioni e disponibilità per: ':'Hi Skin Roma! I would like information and availability for: ')+title)}`;
          return `<article class="product-card-live"><div class="product-card-live__media"><img src="${escapeHtml(p.image_url||'')}" alt="${escapeHtml(title||'Prodotto Skin Roma')}" loading="lazy" decoding="async"></div><div class="product-card-live__body"><div class="product-card-live__meta"><h3>${escapeHtml(title)}</h3>${price?`<span class="product-card-live__price">${price}</span>`:''}</div>${p.description?`<p>${escapeHtml(p.description)}</p>`:''}<a class="product-card-live__cta" href="${wa}" target="_blank" rel="noopener noreferrer">${text.cta}<span aria-hidden="true">↗</span></a></div></article>`;
        }).join('');
        if(!grid.children.length)return;
        section.hidden=false;
        exposeProductsNav();
        const head=qs('.products-showcase__head',section);
        if(head)head.classList.add('in');
      })
      .catch(()=>{});
  }
})();