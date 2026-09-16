const crypto = require('crypto');
const { json, cookieName, cookieValue, sessionReady } = require('./_shared');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Metodo non consentito' }, { Allow: 'POST' });
  if (!sessionReady()) return json(503, { error: 'Configurazione server incompleta' });

  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Richiesta non valida' }); }

  const digest = value => crypto.createHash('sha256').update(String(value || '')).digest();
  const ok = crypto.timingSafeEqual(digest(body.password), digest(process.env.ADMIN_PASSWORD));
  if (!ok) return json(401, { error: 'Password non corretta' });

  return json(200, { ok: true }, {
    'set-cookie': `${cookieName}=${cookieValue()}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=43200`,
  });
};
