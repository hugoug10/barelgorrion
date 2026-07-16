export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'JSON inválido' }, 400); }

  if (!body.password || body.password !== env.ADMIN_PASSWORD) {
    return json({ error: 'Contraseña incorrecta' }, 401);
  }
  if (!env.MENU_KV) {
    return json({ error: 'KV no configurado — contacta con el administrador técnico' }, 500);
  }

  const stored = await env.MENU_KV.get('torneo_parejas');
  const parejas = stored ? JSON.parse(stored) : [];
  return json({ parejas });
}

export async function onRequestDelete(context) {
  const { request, env } = context;

  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'JSON inválido' }, 400); }

  if (!body.password || body.password !== env.ADMIN_PASSWORD) {
    return json({ error: 'Contraseña incorrecta' }, 401);
  }
  if (!body.id) {
    return json({ error: 'Falta el id de la pareja' }, 400);
  }
  if (!env.MENU_KV) {
    return json({ error: 'KV no configurado — contacta con el administrador técnico' }, 500);
  }

  const stored = await env.MENU_KV.get('torneo_parejas');
  const parejas = (stored ? JSON.parse(stored) : []).filter(p => p.id !== body.id);
  await env.MENU_KV.put('torneo_parejas', JSON.stringify(parejas));
  return json({ ok: true });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors() });
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
    'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
