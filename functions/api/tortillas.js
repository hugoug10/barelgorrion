// Votación de la degustación de tortillas.
// Cada dispositivo vota con un id aleatorio guardado en su navegador; el voto se
// guarda en su propia clave (tvoto:<id>) para que dos votos simultáneos nunca se
// pisen, y volver a votar desde el mismo dispositivo sustituye el voto anterior.

export const TORTILLAS = [
  { id: 'pimientos', nombre: 'Tortilla de pimientos' },
  { id: 'chorizo',   nombre: 'Tortilla de chorizo' },
  { id: 'oreja',     nombre: 'Tortilla de oreja' },
];

export const VOTE_PREFIX = 'tvoto:';

// Máximo de dispositivos nuevos que pueden votar desde una misma conexión al día.
// Generoso porque en el bar mucha gente puede compartir la misma wifi.
const MAX_VOTANTES_POR_IP = 100;

export async function onRequestGet() {
  return json({ tortillas: TORTILLAS });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'JSON inválido' }, 400); }

  const voterId = String(body.voterId || '');
  const tortilla = TORTILLAS.find(t => t.id === body.tortilla);

  if (!/^[a-zA-Z0-9-]{16,64}$/.test(voterId)) {
    return json({ error: 'Identificador de voto inválido, recarga la página' }, 400);
  }
  if (!tortilla) {
    return json({ error: 'Esa tortilla no está en la degustación' }, 400);
  }
  if (!env.MENU_KV) {
    return json({ error: 'No se pudo guardar el voto — avisa al personal del bar' }, 500);
  }

  const key = VOTE_PREFIX + voterId;
  const previo = await env.MENU_KV.get(key);

  if (!previo) {
    const ip = request.headers.get('CF-Connecting-IP') || 'desconocida';
    const ipKey = `tvip:${await sha256(ip)}:${new Date().toISOString().slice(0, 10)}`;
    const usados = parseInt(await env.MENU_KV.get(ipKey) || '0', 10);
    if (usados >= MAX_VOTANTES_POR_IP) {
      return json({ error: 'Se han recibido demasiados votos desde esta conexión' }, 429);
    }
    await env.MENU_KV.put(ipKey, String(usados + 1), { expirationTtl: 60 * 60 * 48 });
  }

  await env.MENU_KV.put(key, tortilla.id, {
    metadata: { t: tortilla.id, at: Date.now() },
  });

  return json({ ok: true, cambiado: Boolean(previo && previo !== tortilla.id), tortilla });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors() });
}

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
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
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
