import { TORTILLAS, VOTE_PREFIX } from './tortillas.js';

const RESET_KEY = 'tvoto_reset_at';

// POST: recuento de votos. DELETE: borra todos los votos (para empezar de cero).
export async function onRequestPost(context) {
  const { env } = context;
  const fallo = await checkAuth(context);
  if (fallo) return fallo;

  // El listado de KV puede tardar en reflejar un borrado, así que además se
  // descartan los votos anteriores al último "Borrar todos los votos".
  const resetAt = parseInt(await env.MENU_KV.get(RESET_KEY) || '0', 10);
  const votos = (await listarVotos(env)).filter(v => !resetAt || (v.at && v.at > resetAt));
  const recuento = Object.fromEntries(TORTILLAS.map(t => [t.id, 0]));
  let ultimo = null;

  for (const v of votos) {
    if (v.t in recuento) recuento[v.t]++;
    if (v.at && (!ultimo || v.at > ultimo)) ultimo = v.at;
  }

  return json({
    total: votos.length,
    ultimoVoto: ultimo ? new Date(ultimo).toISOString() : null,
    tortillas: TORTILLAS.map(t => ({ ...t, votos: recuento[t.id] })),
  });
}

export async function onRequestDelete(context) {
  const { env } = context;
  const fallo = await checkAuth(context);
  if (fallo) return fallo;

  await env.MENU_KV.put(RESET_KEY, String(Date.now()));
  const votos = await listarVotos(env);
  for (let i = 0; i < votos.length; i += 50) {
    await Promise.all(votos.slice(i, i + 50).map(v => env.MENU_KV.delete(v.key)));
  }
  return json({ ok: true, borrados: votos.length });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors() });
}

async function checkAuth({ request, env }) {
  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'JSON inválido' }, 400); }

  if (!body.password || body.password !== env.ADMIN_PASSWORD) {
    return json({ error: 'Contraseña incorrecta' }, 401);
  }
  if (!env.MENU_KV) {
    return json({ error: 'KV no configurado — contacta con el administrador técnico' }, 500);
  }
  return null;
}

async function listarVotos(env) {
  const votos = [];
  let cursor;
  do {
    const page = await env.MENU_KV.list({ prefix: VOTE_PREFIX, cursor });
    for (const k of page.keys) {
      votos.push({ key: k.name, t: k.metadata?.t, at: k.metadata?.at });
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return votos;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...cors() }
  });
}

function cors() {
  return {
    'Access-Control-Allow-Origin': 'https://barelgorrion.com',
    'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
