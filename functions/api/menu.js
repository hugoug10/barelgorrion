export async function onRequestGet(context) {
  const { env, request } = context;

  // KV is source of truth; fall back to static file on first run
  const stored = await env.MENU_KV.get('menu');
  if (stored) {
    return respond(stored);
  }

  try {
    const asset = await env.ASSETS.fetch(new URL('/data/menu.json', request.url));
    const text  = await asset.text();
    return respond(text);
  } catch {
    return json({ error: 'Menú no encontrado' }, 404);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'JSON inválido' }, 400); }

  const { password, menu } = body;

  if (!password || password !== env.ADMIN_PASSWORD) {
    return json({ error: 'Contraseña incorrecta' }, 401);
  }

  if (!menu?.groups) {
    return json({ error: 'Datos del menú inválidos' }, 400);
  }

  await env.MENU_KV.put('menu', JSON.stringify(menu));

  return json({ ok: true, message: '¡Carta actualizada correctamente!' });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors() });
}

function respond(text) {
  return new Response(text, {
    headers: { 'Content-Type': 'application/json', ...cors() }
  });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors() }
  });
}

function cors() {
  return {
    'Access-Control-Allow-Origin': 'https://barelgorrion.com',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
