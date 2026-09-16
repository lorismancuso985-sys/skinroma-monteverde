const { json, supabase, requireAdmin, validUuid } = require('./_shared');

exports.handler = async (event) => {
  const denied = requireAdmin(event);
  if (denied) return denied;
  if (event.httpMethod !== 'DELETE') return json(405, { error: 'Metodo non consentito' }, { Allow: 'DELETE' });

  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Richiesta non valida' }); }
  if (!validUuid(body.id)) return json(400, { error: 'ID non valido' });

  try {
    await supabase(`/rest/v1/subscribers?id=eq.${encodeURIComponent(body.id)}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
    return json(200, { ok: true });
  } catch (error) {
    console.error('admin-subscribers', error);
    return json(500, { error: 'Eliminazione non riuscita' });
  }
};
