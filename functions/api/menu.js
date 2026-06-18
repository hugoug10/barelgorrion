export async function onRequestGet(context) {
  const { env, request } = context;

  // Try KV first (only if binding is configured)
  if (env.MENU_KV) {
    try {
      const stored = await env.MENU_KV.get('menu');
      if (stored) return respond(stored);
    } catch {}
  }

  // Fall back to static data/menu.json
  try {
    const url   = new URL('/data/menu.json', request.url);
    const asset = env.ASSETS ? await env.ASSETS.fetch(url) : await fetch(url);
    if (!asset.ok) throw new Error('asset ' + asset.status);
    return respond(await asset.text());
  } catch (e) {
    return json({ error: 'No se pudo cargar el menú: ' + e.message }, 500);
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
  if (!env.MENU_KV) {
    return json({ error: 'KV no configurado — contacta con el administrador técnico' }, 500);
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
