const { json, supabase, requireAdmin, validUuid } = require('./_shared');

const clean = (value, max) => String(value || '').trim().slice(0, max);
const validImageUrl = (value) => {
  try {
    const image = new URL(String(value || ''));
    const base = new URL(process.env.SUPABASE_URL);
    return image.protocol === 'https:' && image.origin === base.origin && image.pathname.startsWith('/storage/v1/object/public/products/');
  } catch { return false; }
};

exports.handler = async (event) => {
  const denied = requireAdmin(event);
  if (denied) return denied;

  let body = {};
  if (event.body) {
    try { body = JSON.parse(event.body); } catch { return json(400, { error: 'Richiesta non valida' }); }
  }

  if (event.httpMethod === 'DELETE') {
    if (!validUuid(body.id)) return json(400, { error: 'ID non valido' });
    try {
      await supabase(`/rest/v1/products?id=eq.${encodeURIComponent(body.id)}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
      return json(200, { ok: true });
    } catch (error) {
      console.error('admin-products delete', error);
      return json(500, { error: 'Eliminazione non riuscita' });
    }
  }

  if (event.httpMethod === 'POST') {
    const title = clean(body.title, 120);
    const description = clean(body.description, 500);
    const imageUrl = clean(body.image_url, 700);
    if (!title || !imageUrl) return json(400, { error: 'Titolo e foto sono obbligatori' });
    if (!validImageUrl(imageUrl)) return json(400, { error: 'URL immagine non valido' });

    const price = body.price === null || body.price === '' || body.price === undefined ? null : Number(body.price);
    if (price !== null && (!Number.isFinite(price) || price < 0 || price > 999999.99)) return json(400, { error: 'Prezzo non valido' });

    const sortRaw = Number(body.sort_order ?? 0);
    const sortOrder = Number.isFinite(sortRaw) ? Math.trunc(sortRaw) : 0;
    if (sortOrder < 0 || sortOrder > 999999) return json(400, { error: 'Ordine non valido' });

    const data = {
      title,
      description,
      price,
      image_url: imageUrl,
      published: Boolean(body.published),
      sort_order: sortOrder,
      updated_at: new Date().toISOString(),
    };

    try {
      let rows;
      if (body.id) {
        if (!validUuid(body.id)) return json(400, { error: 'ID non valido' });
        rows = await supabase(`/rest/v1/products?id=eq.${encodeURIComponent(body.id)}`, { method: 'PATCH', body: data, headers: { Prefer: 'return=representation' } });
        if (!Array.isArray(rows) || !rows[0]) return json(404, { error: 'Prodotto non trovato' });
      } else {
        rows = await supabase('/rest/v1/products', { method: 'POST', body: data, headers: { Prefer: 'return=representation' } });
      }
      const product = Array.isArray(rows) ? rows[0] : rows;
      if (!product) return json(500, { error: 'Salvataggio non riuscito' });
      return json(200, { product });
    } catch (error) {
      console.error('admin-products save', error);
      return json(500, { error: 'Salvataggio non riuscito' });
    }
  }

  return json(405, { error: 'Metodo non consentito' }, { Allow: 'POST, DELETE' });
};
