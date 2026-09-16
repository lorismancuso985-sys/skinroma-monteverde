const crypto = require('crypto');

const json = (statusCode, body, headers = {}) => ({
  statusCode,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    ...headers,
  },
  body: JSON.stringify(body),
});

const envReady = () => Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);
const sessionReady = () => Boolean(process.env.ADMIN_PASSWORD && process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32);

const supabase = async (path, { method = 'GET', body, headers = {} } = {}) => {
  if (!envReady()) throw Object.assign(new Error('Backend non configurato'), { code: 'NOT_CONFIGURED' });
  const base = process.env.SUPABASE_URL.replace(/\/$/, '');
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      apikey: process.env.SUPABASE_SECRET_KEY,
      'content-type': 'application/json',
      ...headers,
    },
    body: body === undefined ? undefined : (typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body)),
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const e = new Error(data?.message || data?.error || `Supabase ${res.status}`);
    e.status = res.status;
    e.data = data;
    throw e;
  }
  return data;
};

const cookieName = '__Host-skin_admin';
const cookieValue = () => {
  const ts = Date.now().toString();
  const sig = crypto.createHmac('sha256', process.env.SESSION_SECRET).update(ts).digest('hex');
  return `${ts}.${sig}`;
};

const validSession = (event) => {
  if (!sessionReady()) return false;
  const cookieHeader = event.headers.cookie || event.headers.Cookie || '';
  const raw = cookieHeader.split(';').map(x => x.trim()).find(x => x.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
  if (!raw) return false;
  const [ts, sig] = raw.split('.');
  if (!ts || !sig || !/^\d+$/.test(ts) || !/^[a-f0-9]{64}$/i.test(sig)) return false;
  const issued = Number(ts);
  const now = Date.now();
  if (!Number.isFinite(issued) || now - issued > 12 * 60 * 60 * 1000 || issued > now + 60_000) return false;
  const expected = crypto.createHmac('sha256', process.env.SESSION_SECRET).update(ts).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'));
};

const requireAdmin = (event) => validSession(event) ? null : json(401, { error: 'Non autorizzato' });
const validUuid = value => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));

module.exports = { json, envReady, sessionReady, supabase, cookieName, cookieValue, validSession, requireAdmin, validUuid };
