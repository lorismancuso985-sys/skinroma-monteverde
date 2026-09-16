const { json, envReady, supabase } = require('./_shared');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Metodo non consentito' }, { Allow: 'GET' });
  if (!envReady()) return json(200, { products: [] }, { 'cache-control': 'public, max-age=60' });

  try {
    const products = await supabase('/rest/v1/products?select=id,title,description,price,image_url,sort_order&published=eq.true&order=sort_order.asc,created_at.desc');
    return json(200, { products: Array.isArray(products) ? products : [] }, { 'cache-control': 'public, max-age=60, stale-while-revalidate=300' });
  } catch (error) {
    console.error('products', error);
    return json(200, { products: [] }, { 'cache-control': 'no-store' });
  }
};
