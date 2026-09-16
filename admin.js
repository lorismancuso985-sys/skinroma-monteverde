(() => {
  'use strict';
  const $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];
  let subscribers=[],products=[],editingImage='';
  const esc=(v='')=>String(v).replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));
  const clearSensitive=()=>{subscribers=[];products=[];$('#subscribersList').innerHTML='';$('#productsList').innerHTML='';$('#subscriberCount').textContent='—';$('#productCount').textContent='—'};
  const showLogin=()=>{
  $('#loginView').hidden=false;
  $('#dashboard').hidden=true;
  $('#loginView').style.display='grid';
  $('#dashboard').style.display='none';
};

const showDash=()=>{
  $('#loginView').hidden=true;
  $('#dashboard').hidden=false;
  $('#loginView').style.display='none';
  $('#dashboard').style.display='block';
};
  const expireSession=()=>{clearSensitive();showLogin();$('#loginStatus').textContent='Sessione scaduta. Accedi di nuovo.'};
  const api=async(path,options={})=>{
    const res=await fetch(`/.netlify/functions/${path}`,{credentials:'same-origin',...options,headers:{'content-type':'application/json','accept':'application/json',...(options.headers||{})}});
    const data=await res.json().catch(()=>({}));
    if(!res.ok){
      const error=new Error(data.error||`Errore ${res.status}`);error.status=res.status;
      if(res.status===401 && path!=='admin-login')expireSession();
      throw error;
    }
    return data;
  };
  const fmtDate=v=>{const d=new Date(v);return Number.isNaN(d.getTime())?'':new Intl.DateTimeFormat('it-IT',{day:'2-digit',month:'short',year:'numeric'}).format(d)};
  const sortProducts=()=>products.sort((a,b)=>(Number(a.sort_order)||0)-(Number(b.sort_order)||0)||String(b.created_at||'').localeCompare(String(a.created_at||'')));

  async function load(){
    try{
      const d=await api('admin-data',{method:'GET'});
      subscribers=Array.isArray(d.subscribers)?d.subscribers:[];
      products=Array.isArray(d.products)?d.products:[];
      sortProducts();showDash();render();
    }catch(e){
      if(e.status!==401)showLogin();
      if(e.status===404||e.status===503)$('#loginStatus').textContent='Gestionale non ancora attivo. Completa la configurazione server.';
    }
  }

  $('#loginForm').addEventListener('submit',async e=>{
    e.preventDefault();const st=$('#loginStatus');st.textContent='Accesso…';
    try{await api('admin-login',{method:'POST',body:JSON.stringify({password:$('#password').value})});$('#password').value='';st.textContent='';await load()}
    catch(err){if(err.status===404||err.status===503)st.textContent='Gestionale non ancora attivo. Completa la configurazione server.';else if(err.status===401)st.textContent='Password non corretta.';else st.textContent=err.message||'Accesso non riuscito.'}
  });
  $('#logoutBtn').addEventListener('click',async()=>{try{await api('admin-logout',{method:'POST',body:'{}'})}catch{}clearSensitive();$('#loginStatus').textContent='';showLogin()});
  $$('.tabs button').forEach(btn=>btn.addEventListener('click',()=>{$$('.tabs button').forEach(b=>b.classList.toggle('is-active',b===btn));$$('.panel').forEach(p=>p.classList.toggle('is-active',p.dataset.panel===btn.dataset.tab))}));
  function render(){$('#subscriberCount').textContent=subscribers.length;$('#productCount').textContent=products.filter(p=>p.published).length;renderSubscribers();renderProducts()}
  function renderSubscribers(){
    const q=$('#subscriberSearch').value.trim().toLowerCase();
    const rows=subscribers.filter(s=>[s.first_name,s.last_name,s.email,s.phone].join(' ').toLowerCase().includes(q));
    const el=$('#subscribersList');
    if(!rows.length){el.innerHTML='<p class="empty">Nessun contatto trovato.</p>';return}
    el.innerHTML=rows.map(s=>`<article class="subscriber-row" data-id="${esc(s.id)}"><strong>${esc(`${s.first_name||''} ${s.last_name||''}`.trim()||'—')}</strong><span class="email">${esc(s.email||'')}</span><span class="phone">${esc(s.phone||'')}</span><time datetime="${esc(s.created_at||'')}">${fmtDate(s.created_at)}</time><button type="button" class="icon-btn" data-delete-subscriber>Elimina</button></article>`).join('');
    $$('[data-delete-subscriber]',el).forEach(b=>b.addEventListener('click',async()=>{const row=b.closest('[data-id]');if(!row||!confirm('Eliminare questo contatto?'))return;try{await api('admin-subscribers',{method:'DELETE',body:JSON.stringify({id:row.dataset.id})});subscribers=subscribers.filter(x=>x.id!==row.dataset.id);render()}catch(e){if(e.status!==401)alert(e.message)}}));
  }
  $('#subscriberSearch').addEventListener('input',renderSubscribers);
  $('#exportCsv').addEventListener('click',()=>{
    if(!subscribers.length){alert('Non ci sono contatti da esportare.');return}
    const cols=['Nome','Cognome','Email','Telefono','Lingua','Data iscrizione'];
    const safe=v=>{let s=String(v??'');if(/^[=+\-@]/.test(s))s=`'${s}`;return `"${s.replace(/"/g,'""')}"`};
    const csv=[cols.map(safe).join(','),...subscribers.map(s=>[s.first_name,s.last_name,s.email,s.phone,s.language,s.created_at].map(safe).join(','))].join('\r\n');
    const url=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download=`skinroma-iscritti-${new Date().toISOString().slice(0,10)}.csv`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),0);
  });

  function renderProducts(){
    const el=$('#productsList');if(!products.length){el.innerHTML='<p class="empty">Ancora nessun prodotto. Creane uno dal pannello a sinistra.</p>';return}
    el.innerHTML=products.map(p=>`<article class="admin-product" data-id="${esc(p.id)}"><img src="${esc(p.image_url||'')}" alt="" loading="lazy" decoding="async"><div class="admin-product__body"><h3>${esc(p.title||'')}</h3>${p.description?`<p>${esc(p.description)}</p>`:''}<div class="admin-product__meta"><span>${p.price!=null?`${Number(p.price).toLocaleString('it-IT',{maximumFractionDigits:2})} €`:'Senza prezzo'}</span><span>${p.published?'Pubblicato':'Nascosto'}</span></div><div class="admin-product__actions"><button type="button" data-edit>Modifica</button><button type="button" data-delete>Elimina</button></div></div></article>`).join('');
    $$('[data-edit]',el).forEach(b=>b.addEventListener('click',()=>editProduct(b.closest('[data-id]').dataset.id)));
    $$('[data-delete]',el).forEach(b=>b.addEventListener('click',()=>deleteProduct(b.closest('[data-id]').dataset.id)));
  }
  function resetEditor(){editingImage='';$('#productForm').reset();$('#productId').value='';$('#productSort').value='0';$('#productPreview').hidden=true;$('#productPreview').removeAttribute('src');$('#uploadLabel').textContent='Scegli una foto';$('#productStatus').textContent=''}
  $('#newProduct').addEventListener('click',resetEditor);$('#cancelEdit').addEventListener('click',resetEditor);
  function editProduct(id){const p=products.find(x=>x.id===id);if(!p)return;$('#productId').value=p.id;$('#productTitle').value=p.title||'';$('#productDescription').value=p.description||'';$('#productPrice').value=p.price??'';$('#productSort').value=p.sort_order??0;$('#productPublished').checked=!!p.published;editingImage=p.image_url||'';const prev=$('#productPreview');prev.src=editingImage;prev.hidden=!editingImage;$('#uploadLabel').textContent=editingImage?'Sostituisci foto':'Scegli una foto';$('#productStatus').textContent='';window.scrollTo({top:Math.max(0,$('#productForm').offsetTop-20),behavior:'smooth'})}
  async function deleteProduct(id){if(!confirm('Eliminare definitivamente questo prodotto?'))return;try{await api('admin-products',{method:'DELETE',body:JSON.stringify({id})});products=products.filter(x=>x.id!==id);render();resetEditor()}catch(e){if(e.status!==401)alert(e.message)}}

  async function compressImage(file){
    if(!file || !String(file.type||'').startsWith('image/'))throw new Error('Seleziona un file immagine.');
    if(file.size>25*1024*1024)throw new Error('La foto originale è troppo grande. Scegline una sotto 25 MB.');
    const objectUrl=URL.createObjectURL(file);
    try{
      const img=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(new Error('Formato foto non supportato dal browser.'));i.src=objectUrl});
      if(!img.naturalWidth||!img.naturalHeight)throw new Error('Immagine non valida.');
      const max=1600,scale=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight));
      const c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.naturalWidth*scale));c.height=Math.max(1,Math.round(img.naturalHeight*scale));
      const ctx=c.getContext('2d');if(!ctx)throw new Error('Impossibile elaborare la foto.');ctx.drawImage(img,0,0,c.width,c.height);
      let data=c.toDataURL('image/webp',.82);if(!data.startsWith('data:image/webp'))data=c.toDataURL('image/jpeg',.84);
      return data;
    }finally{URL.revokeObjectURL(objectUrl)}
  }
  $('#productImage').addEventListener('change',async e=>{
    const file=e.target.files?.[0];if(!file)return;const st=$('#productStatus');st.textContent='Ottimizzo la foto…';
    try{const dataUrl=await compressImage(file);const up=await api('admin-upload',{method:'POST',body:JSON.stringify({dataUrl})});editingImage=up.url;const prev=$('#productPreview');prev.src=editingImage;prev.hidden=false;$('#uploadLabel').textContent='Foto pronta · tocca per sostituire';st.textContent='Foto caricata.'}
    catch(err){e.target.value='';st.textContent=err.message||'Caricamento non riuscito.'}
  });
  $('#productForm').addEventListener('submit',async e=>{
    e.preventDefault();const st=$('#productStatus');if(!editingImage){st.textContent='Aggiungi una foto prima di salvare.';return}
    st.textContent='Salvataggio…';
    const payload={id:$('#productId').value||null,title:$('#productTitle').value.trim(),description:$('#productDescription').value.trim(),price:$('#productPrice').value===''?null:Number($('#productPrice').value),sort_order:Number($('#productSort').value||0),published:$('#productPublished').checked,image_url:editingImage};
    try{const d=await api('admin-products',{method:'POST',body:JSON.stringify(payload)});const i=products.findIndex(x=>x.id===d.product.id);if(i>=0)products[i]=d.product;else products.push(d.product);sortProducts();st.textContent='Salvato.';render();setTimeout(resetEditor,450)}
    catch(err){if(err.status!==401)st.textContent=err.message||'Salvataggio non riuscito.'}
  });
  load();
})();
