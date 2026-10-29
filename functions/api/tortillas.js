// Votación de la degustación de tortillas.
// Cada dispositivo vota con un id aleatorio guardado en su navegador; el voto se
// guarda en su propia clave (tvoto:<id>) para que dos votos simultáneos nunca se
// pisen, y volver a votar desde el mismo dispositivo sustituye el voto anterior.

export const TORTILLAS = [
  { id: 'cabra',     nombre: 'Tortilla de queso de cabra y cebolla caramelizada al Oporto' },
  { id: 'morcilla',  nombre: 'Tortilla de morcilla y manzana caramelizada' },
  { id: 'ajo',       nombre: 'Tortilla de ajo y perejil' },
  { id: 'azul',      nombre: 'Tortilla de queso azul' },
  { id: 'oreja',     nombre: 'Tortilla de oreja en salsa' },
  { id: 'original',  nombre: 'Tortilla original de patata y cebolla' },
  { id: 'barbacoa',  nombre: 'Tortilla de barbacoa' },
  { id: 'chorizo',   nombre: 'Tortilla de chorizo' },
  { id: 'sobrasada', nombre: 'Tortilla de sobrasada con queso brie y miel' },
];

// La votación se abre sola a esta hora: viernes 30 de octubre de 2026, 20:00 en
// España (horario de invierno, UTC+1 → 19:00 UTC). Antes de eso no se aceptan votos.
export const ABRE_VOTACION = Date.UTC(2026, 9, 30, 19, 0);

export const VOTE_PREFIX = 'tvoto:';

// Máximo de dispositivos nuevos que pueden votar desde una misma conexión al día.
// Generoso porque en el bar mucha gente puede compartir la misma wifi.
const MAX_VOTANTES_POR_IP = 100;

export const RESET_KEY = 'tvoto_reset_at';

// Con ?voter=<id> devuelve también el voto actual de ese dispositivo (o null), para
// que el navegador no se fíe de lo que tenga guardado de otra cata o de antes de un reinicio.
export async function onRequestGet({ request, env }) {
  const voterId = new URL(request.url).searchParams.get('voter') || '';
  let voto = null;
  if (env.MENU_KV && /^[a-zA-Z0-9-]{16,64}$/.test(voterId)) {
    const { value, metadata } = await env.MENU_KV.getWithMetadata(VOTE_PREFIX + voterId);
    const resetAt = parseInt(await env.MENU_KV.get(RESET_KEY) || '0', 10);
    if (value && TORTILLAS.some(t => t.id === value) && (!resetAt || (metadata?.at && metadata.at > resetAt))) {
      voto = value;
    }
  }
  // faltan: milisegundos hasta que se abra (0 si ya está abierta); así el navegador
  // cuenta con el reloj del servidor y no con el del móvil
  return json({ tortillas: TORTILLAS, voto, faltan: Math.max(0, ABRE_VOTACION - Date.now()) });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (Date.now() < ABRE_VOTACION) {
    return json({ error: 'La votación se abre el viernes 30 a las 20:00' }, 403);
  }

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
