const REPO = 'hugoug10/barelgorrion';
const FILE_PATH = 'data/menu.json';
const GITHUB_API = 'https://api.github.com';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': 'https://barelgorrion.com',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'JSON inválido' }, 400);
  }

  const { password, menu } = body;

  if (!password || password !== env.ADMIN_PASSWORD) {
    return json({ error: 'Contraseña incorrecta' }, 401);
  }

  if (!menu || !menu.groups) {
    return json({ error: 'Datos del menú inválidos' }, 400);
  }

  const token = env.GITHUB_TOKEN;
  if (!token) {
    return json({ error: 'Servidor no configurado (token ausente)' }, 500);
  }

  const ghHeaders = {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'barelgorrion-admin',
    'Content-Type': 'application/json',
  };

  // Get current file SHA
  const getRes = await fetch(`${GITHUB_API}/repos/${REPO}/contents/${FILE_PATH}`, {
    headers: ghHeaders,
  });

  if (!getRes.ok) {
    const err = await getRes.text();
    return json({ error: `Error leyendo GitHub: ${err}` }, 500);
  }

  const fileData = await getRes.json();
  const sha = fileData.sha;

  // Encode new content as base64
  const newContent = JSON.stringify(menu, null, 2);
  const encoded = btoa(unescape(encodeURIComponent(newContent)));

  // Commit updated file
  const putRes = await fetch(`${GITHUB_API}/repos/${REPO}/contents/${FILE_PATH}`, {
    method: 'PUT',
    headers: ghHeaders,
    body: JSON.stringify({
      message: 'Actualizar carta desde panel de administración',
      content: encoded,
      sha,
    }),
  });

  if (!putRes.ok) {
    const err = await putRes.text();
    return json({ error: `Error guardando en GitHub: ${err}` }, 500);
  }

  return json({ ok: true, message: 'Carta actualizada. Los cambios aparecerán en 1-2 minutos.' });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  });
}
