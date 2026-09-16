const crypto = require('crypto');
const { json, supabase, requireAdmin } = require('./_shared');

const looksLikeImage = (buffer, mime) => {
  if (mime === 'image/jpeg') return buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mime === 'image/png') return buffer.length > 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]));
  if (mime === 'image/webp') return buffer.length > 12 && buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP';
  return false;
};

exports.handler = async (event) => {
  const denied = requireAdmin(event);
  if (denied) return denied;
  if (event.httpMethod !== 'POST') return json(405, { error: 'Metodo non consentito' }, { Allow: 'POST' });

  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Richiesta non valida' }); }
  const match = String(body.dataUrl || '').match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\s]+)$/);
  if (!match) return json(400, { error: 'Formato immagine non valido' });

  const buffer = Buffer.from(match[2].replace(/\s/g, ''), 'base64');
  if (!buffer.length || !looksLikeImage(buffer, match[1])) return json(400, { error: 'File immagine non valido' });
  if (buffer.length > 3 * 1024 * 1024) return json(413, { error: 'Immagine troppo grande' });

  const ext = match[1] === 'image/jpeg' ? 'jpg' : match[1].split('/')[1];
  const key = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;

  try {
    await supabase(`/storage/v1/object/products/${key}`, {
      method: 'POST',
      body: buffer,
      headers: { 'content-type': match[1], 'x-upsert': 'false' },
    });
    const base = process.env.SUPABASE_URL.replace(/\/$/, '');
    return json(200, { url: `${base}/storage/v1/object/public/products/${key}` });
  } catch (error) {
    console.error('admin-upload', error);
    return json(500, { error: 'Caricamento immagine non riuscito' });
  }
};
