// Comprueba la contraseña del panel /admin antes de dejar entrar.
// Tras demasiados fallos desde la misma conexión se bloquean los intentos un rato.

const MAX_FALLOS = 8;
const BLOQUEO_SEGUNDOS = 15 * 60;

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'JSON inválido' }, 400); }

  if (!env.ADMIN_PASSWORD) {
    return json({ error: 'Contraseña de admin no configurada — contacta con el administrador técnico' }, 500);
  }

  const ip = request.headers.get('CF-Connecting-IP') || 'desconocida';
  const failKey = `adminfail:${await sha256(ip)}`;
  const fallos = env.MENU_KV ? parseInt(await env.MENU_KV.get(failKey) || '0', 10) : 0;

  if (fallos >= MAX_FALLOS) {
    return json({ error: 'Demasiados intentos fallidos. Espera 15 minutos y vuelve a probar.' }, 429);
  }

  if (!body.password || body.password !== env.ADMIN_PASSWORD) {
    if (env.MENU_KV) {
      await env.MENU_KV.put(failKey, String(fallos + 1), { expirationTtl: BLOQUEO_SEGUNDOS });
    }
    return json({ error: 'Contraseña incorrecta' }, 401);
  }

  if (fallos && env.MENU_KV) await env.MENU_KV.delete(failKey);
  return json({ ok: true });
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
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
