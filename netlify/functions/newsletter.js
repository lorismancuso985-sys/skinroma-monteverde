const { json, envReady, supabase } = require('./_shared');

const clean = (value, max = 160) => String(value || '').trim().slice(0, max);
const emailOk = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const phoneOk = value => {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length >= 6 && digits.length <= 15;
};
const normalizePhone = value => {
  let phone = String(value || '').replace(/[^\d+]/g, '');
  if (phone.startsWith('00')) phone = `+${phone.slice(2)}`;
  if (!phone.startsWith('+')) phone = phone.startsWith('39') ? `+${phone}` : `+39${phone}`;
  return /^\+\d{8,15}$/.test(phone) ? phone : null;
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Metodo non consentito' }, { Allow: 'POST' });
  if (!envReady()) return json(503, { error: 'Backend non configurato', fallback: 'netlify' });

  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Richiesta non valida' }); }
  if (clean(body['bot-field'])) return json(200, { ok: true });

  const firstName = clean(body.first_name, 80);
  const lastName = clean(body.last_name, 80);
  const email = clean(body.email).toLowerCase();
  const phone = clean(body.phone, 32);
  const language = body.language === 'en' ? 'en' : 'it';

  if (!firstName || !lastName || !emailOk(email) || !phoneOk(phone) || body.marketing_consent !== 'yes') {
    return json(400, { error: 'Compila correttamente tutti i campi e accetta il consenso' });
  }

  const now = new Date().toISOString();
  const row = {
    first_name: firstName,
    last_name: lastName,
    email,
    phone,
    language,
    marketing_consent: true,
    consent_at: now,
    updated_at: now,
  };

  try {
    await supabase('/rest/v1/subscribers?on_conflict=email', {
      method: 'POST',
      body: row,
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    });
  } catch (error) {
    console.error('newsletter supabase', error);
    return json(500, { error: 'Non è stato possibile registrare l’iscrizione' });
  }

  if (process.env.BREVO_API_KEY && process.env.BREVO_LIST_ID) {
    try {
      const sms = normalizePhone(phone);
      const attributes = { FIRSTNAME: firstName, LASTNAME: lastName };
      if (sms) attributes.SMS = sms;
      const brevo = await fetch('https://api.brevo.com/v3/contacts', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'api-key': process.env.BREVO_API_KEY },
        body: JSON.stringify({
          email,
          attributes,
          listIds: [Number(process.env.BREVO_LIST_ID)],
          updateEnabled: true,
        }),
      });
      if (!brevo.ok) console.error('newsletter brevo', brevo.status, await brevo.text());
    } catch (error) {
      console.error('newsletter brevo', error);
    }
  }

  return json(200, { ok: true });
};
