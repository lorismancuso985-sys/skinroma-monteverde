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
  if(ghdBrand){
    ghdBrand.setAttribute('aria-label','ghd');
    ghdBrand.innerHTML='<img alt="ghd" loading="lazy" decoding="async" style="display:block;width:min(86px,78%);height:auto;margin:auto;mix-blend-mode:screen" src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAkGBwgHBgkIBwgKCgkLDRYPDQwMDRsUFRAWIB0i