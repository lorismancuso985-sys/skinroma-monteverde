const { json, cookieName } = require('./_shared');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Metodo non consentito' }, { Allow: 'POST' });
  return json(200, { ok: true }, {
    'set-cookie': `${cookieName}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`,
  });
};
