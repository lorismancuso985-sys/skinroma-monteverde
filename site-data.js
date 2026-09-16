(() => {
  'use strict';
  const qs=(s,c=document)=>c.querySelector(s);
  const escapeHtml=(v='')=>String(v).replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));
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
        const head=qs('.products-showcase__head',section);
        if(head)head.classList.add('in');
      })
      .catch(()=>{});
  }
})();