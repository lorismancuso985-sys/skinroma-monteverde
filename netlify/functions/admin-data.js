const { json, envReady, sessionReady, supabase, requireAdmin } = require('./_shared');

const fetchAll = async (path, pageSize = 1000, maxRows = 10000) => {
  const all = [];
  for (let offset = 0; offset < maxRows; offset += pageSize) {
    const joiner = path.includes('?') ? '&' : '?';
    const rows = await supabase(`${path}${joiner}limit=${pageSize}&offset=${offset}`);
    if (!Array.isArray(rows)) break;
    all.push(...rows);
    if (rows.length < pageSize) break;
  }
  return all;
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Metodo non consentito' }, { Allow: 'GET' });
  if (!envReady() || !sessionReady()) return json(503, { error: 'Configurazione server incompleta' });
  const denied = requireAdmin(event);
  if (denied) return denied;

  try {
    const [subscribers, products] = await Promise.all([
      fetchAll('/rest/v1/subscribers?select=*&order=created_at.desc'),
      fetchAll('/rest/v1/products?select=*&order=sort_order.asc,created_at.desc'),
    ]);
    return json(200, { subscribers, products });
  } catch (error) {
    console.error('admin-data', error);
    return json(500, { error: 'Errore caricamento dati' });
  }
};
