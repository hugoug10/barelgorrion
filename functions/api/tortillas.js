// Votación de la degustación de tortillas.
// Cada dispositivo vota con un id aleatorio; el voto se guarda en su propia clave
// (tvoto:<id>) para que dos votos simultáneos nunca se pisen, y volver a votar desde
// el mismo dispositivo sustituye el voto anterior.
//
// El dispositivo se reconoce por el id guardado en el navegador (localStorage) y por
// una cookie HttpOnly con ese mismo id, que manda sobre lo que diga la página: borrar
// solo uno de los dos no da un voto nuevo.
//
// Además cada voto guarda una huella (IP + navegador + pantalla, idioma...). La huella
// NO bloquea ni cambia ningún voto, porque varios móviles iguales en la wifi del bar
// dan la misma huella y no queremos perder votos de verdad: solo sirve para que el
// admin vea cuántos votos comparten huella con otro (posibles repetidos en incógnito).

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
// Muy generoso porque en el bar todo el mundo puede compartir la misma wifi.
const MAX_VOTANTES_POR_IP = 300;

export const RESET_KEY = 'tvoto_reset_at';

const COOKIE = 'tvid';
const ID_RE = /^[a-zA-Z0-9-]{16,64}$/;

// Con ?voter=<id> devuelve también el voto actual de ese dispositivo (o null), para
// que el navegador no se fíe de lo que tenga guardado de otra cata o de antes de un reinicio.
// Si el navegador tiene la cookie, manda la cookie, y se devuelve el id para que la página lo adopte.
export async function onRequestGet({ request, env }) {
  const voterId = leerCookie(request) || new URL(request.url).searchParams.get('voter') || '';
  let voto = null;
  if (env.MENU_KV && ID_RE.test(voterId)) {
    voto = await votoVigente(env, voterId);
  }
  // faltan: milisegundos hasta que se abra (0 si ya está abierta); así el navegador
  // cuenta con el reloj del servidor y no con el del móvil
  return json({
    tortillas: TORTILLAS,
    voto,
    voterId: ID_RE.test(voterId) ? voterId : null,
    faltan: Math.max(0, ABRE_VOTACION - Date.now()),
  });
}

async function votoVigente(env, voterId) {
  const { value, metadata } = await env.MENU_KV.getWithMetadata(VOTE_PREFIX + voterId);
  const resetAt = parseInt(await env.MENU_KV.get(RESET_KEY) || '0', 10);
  if (value && TORTILLAS.some(t => t.id === value) && (!resetAt || (metadata?.at && metadata.at > resetAt))) {
    return value;
  }
  return null;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (Date.now() < ABRE_VOTACION) {
    return json({ error: 'La votación se abre el viernes 30 a las 20:00' }, 403);
  }

  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'JSON inválido' }, 400); }

  const voterId = leerCookie(request) || String(body.voterId || '');
  const tortilla = TORTILLAS.find(t => t.id === body.tortilla);

  if (!ID_RE.test(voterId)) {
    return json({ error: 'Identificador de voto inválido, recarga la página' }, 400);
  }
  if (!tortilla) {
    return json({ error: 'Esa tortilla no está en la degustación' }, 400);
  }
  if (!env.MENU_KV) {
    return json({ error: 'No se pudo guardar el voto — avisa al personal del bar' }, 500);
  }

  const ip = request.headers.get('CF-Connecting-IP') || 'desconocida';
  const previo = await votoVigente(env, voterId);
  const key = VOTE_PREFIX + voterId;

  // Al cambiar de voto se conservan la huella y la hora del primer voto
  const meta = previo ? ((await env.MENU_KV.getWithMetadata(key)).metadata || {}) : {};
  const huella = meta.h || await sha256([
    ip,
    request.headers.get('User-Agent') || '',
    request.headers.get('Accept-Language') || '',
    String(body.huella || '').slice(0, 300),
  ].join('|'));

  if (!previo) {
    const ipKey = `tvip:${await sha256(ip)}:${new Date().toISOString().slice(0, 10)}`;
    const usados = parseInt(await env.MENU_KV.get(ipKey) || '0', 10);
    if (usados >= MAX_VOTANTES_POR_IP) {
      return json({ error: 'Se han recibido demasiados votos desde esta conexión' }, 429);
    }
    await env.MENU_KV.put(ipKey, String(usados + 1), { expirationTtl: 60 * 60 * 48 });
  }

  await env.MENU_KV.put(key, tortilla.id, {
    metadata: { t: tortilla.id, at: Date.now(), c: meta.c || Date.now(), h: huella },
  });

  return json(
    { ok: true, cambiado: Boolean(previo && previo !== tortilla.id), tortilla, voterId },
    200,
    { 'Set-Cookie': `${COOKIE}=${voterId}; Path=/api/tortillas; Max-Age=${60 * 60 * 24 * 30}; HttpOnly; Secure; SameSite=Strict` }
  );
}

function leerCookie(request) {
  const m = (request.headers.get('Cookie') || '').match(new RegExp(`(?:^|;\\s*)${COOKIE}=([a-zA-Z0-9-]{16,64})`));
  return m ? m[1] : null;
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors() });
}

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...cors(), ...extra }
  });
}

function cors() {
  return {
    'Access-Control-Allow-Origin': 'https://barelgorrion.com',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
