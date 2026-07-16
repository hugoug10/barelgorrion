export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'JSON inválido' }, 400); }

  const pareja = (body.pareja || '').trim();
  const jugador1 = (body.jugador1 || '').trim();
  const jugador2 = (body.jugador2 || '').trim();

  if (!pareja || !jugador1 || !jugador2) {
    return json({ error: 'Faltan datos: nombre de la pareja y los dos jugadores' }, 400);
  }
  if (!env.MENU_KV) {
    return json({ error: 'No se pudo guardar la inscripción — contacta con el administrador técnico' }, 500);
  }

  const stored = await env.MENU_KV.get('torneo_parejas');
  const parejas = stored ? JSON.parse(stored) : [];

  parejas.push({
    id: crypto.randomUUID(),
    pareja,
    jugador1,
    jugador2,
    fecha: new Date().toISOString(),
  });

  await env.MENU_KV.put('torneo_parejas', JSON.stringify(parejas));
  return json({ ok: true, message: '¡Pareja inscrita correctamente!' });
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
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
