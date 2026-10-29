# Degustación de tortillas

Página de evento con votación: la gente prueba las tortillas en la cena, escanea el QR
de la mesa y vota su favorita. La ganadora entra en la carta.

- Página: `degustacion-tortilla/index.html` → https://barelgorrion.com/degustacion-tortilla/
- QR de las mesas: `https://barelgorrion.com/degustacion-tortilla/#votar`
- API de votos: `functions/api/tortillas.js`
- Recuento y borrado (admin): `functions/api/tortillas-admin.js` + pestaña "Votos tortillas" en `/admin`
- Los votos se guardan en Cloudflare KV (`MENU_KV`, ver `wrangler.toml`), claves `tvoto:<id>`

## Preparar una nueva cata

1. **Tortillas**: lista `TORTILLAS` en `functions/api/tortillas.js`. La página y el admin la leen
   de ahí. Si cambia el número, revisar el texto del paso "Pruébalas" en la página.
2. **Fecha**: buscar la fecha en `degustacion-tortilla/index.html` (descripción, cabecera y paso
   "Ven a cenar") y en `index.html` (aviso de la portada).
3. **Hora de apertura de la votación**: `ABRE_VOTACION` en `functions/api/tortillas.js`, en UTC.
   España es UTC+1 en invierno y UTC+2 en verano (20:00 en invierno = 19:00 UTC). Antes de esa
   hora el servidor rechaza los votos y la página dice cuándo se abre; se abre sola. El texto
   "viernes 30 a las 20:00" aparece en el mensaje de error del servidor y en la página
   (`votar-cerrada` y el botón): cambiarlo también.
4. **Votos a cero**: admin → "Borrar todos los votos". Hacerlo antes del evento si alguien ha
   probado a votar.

## Mostrar u ocultar el evento

La pestaña "TORTILLAS" del menú, el punto del menú móvil y el aviso de la portada se ocultan
añadiendo al final de `styles.css`:

```css
.nav-links li:has(.nav-tortilla-badge),
.tortilla-band,
.hamburger::after {
    display: none;
}
```

Tras tocar `styles.css`, subir la versión `styles.css?v=` en todos los HTML para que los
navegadores no usen la copia antigua.

## Cómo se evita votar varias veces

- Cada móvil tiene un id aleatorio guardado en el navegador (localStorage) y en una cookie
  HttpOnly que pone el servidor. Votar otra vez desde el mismo móvil **cambia** el voto, no suma.
- Si la página tiene guardado un voto pero el servidor no (otra cata, o votos borrados), manda
  el servidor: la página vuelve a dejar votar.
- Cada voto guarda una **huella** (IP + navegador + pantalla, idioma…). La huella no bloquea ni
  cambia votos, porque varios móviles iguales en la wifi del bar dan la misma huella y se
  perderían votos reales. Solo sirve para señalar en el admin los votos "sospechosos": los de un
  móvil idéntico a otro que ya había votado (puede ser gente distinta o alguien en incógnito).
- Límite de seguridad: 300 móviles nuevos por conexión y día (`MAX_VOTANTES_POR_IP`).

Sin registro no se puede impedir del todo que alguien vote con otro móvil o en incógnito
cambiando de conexión; para una cata en el bar es suficiente.

## Comandos útiles (wrangler)

```sh
# Ver los votos guardados
npx wrangler kv key list --namespace-id 5504e3b54df74765a8dcc4a60152b9e5 --prefix tvoto --remote
```
