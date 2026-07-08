// ============================================================
//  Links cortos con vista previa (Open Graph) — Edge Function
//  Ruta: /r/:slug   (ej. /r/kefir)
//  Lee el link guardado en Netlify Blobs, arma una página con
//  og:title / og:description / og:image YA escritas en el
//  servidor (WhatsApp/Facebook/LinkedIn la leen sin JavaScript)
//  y luego abre la app / redirige al destino.
// ============================================================
import { getStore } from "@netlify/blobs";

export default async (request, context) => {
  const url = new URL(request.url);
  const slug = decodeURIComponent(
    url.pathname.replace(/^\/r\//, "").replace(/\/+$/, "")
  ).toLowerCase().trim();

  if (!slug) {
    return Response.redirect(url.origin + "/", 302);
  }

  const store = getStore("links");
  let rec = null;
  try {
    rec = await store.get(slug, { type: "json" });
  } catch (_e) {
    rec = null;
  }

  if (!rec || !rec.target) {
    return new Response(notFoundHtml(slug, url.origin), {
      status: 404,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  const html = pageHtml(rec, url.origin);
  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      // 5 min de cache: rápido y fresco
      "cache-control": "public, max-age=300",
    },
  });
};

export const config = { path: "/r/*" };

// ---------- utilidades ----------
function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// arma el "scheme" para abrir la app instalada (YouTube, IG, etc.)
function appScheme(target) {
  let u;
  try {
    u = new URL(target);
  } catch (_e) {
    return null;
  }
  const host = u.host;
  const noProto = target.replace(/^https?:\/\//, "");
  if (/youtube\.com|youtu\.be/.test(host)) return "youtube://" + noProto;
  if (/instagram\.com/.test(host))
    return "instagram://" + u.pathname.replace(/^\//, "").replace(/\/$/, "");
  if (/tiktok\.com/.test(host)) return "snssdk1233://" + noProto;
  if (/spotify\.com/.test(host))
    return "spotify:" + u.pathname.split("/").filter(Boolean).join(":");
  if (/facebook\.com|fb\.com|fb\.watch/.test(host))
    return "fb://facewebmodal/f?href=" + encodeURIComponent(target);
  if (/amazon\./.test(host))
    return "com.amazon.mobile.shopping.web://" + noProto;
  if (/twitter\.com|x\.com/.test(host)) return "twitter://" + noProto;
  if (/pinterest\./.test(host)) return "pinterest://" + noProto;
  return null;
}

function pageHtml(rec, origin) {
  const title = rec.title || "Cocina en Fácil y Sin Culpas";
  const desc =
    rec.description ||
    "Recetas antiinflamatorias fáciles y sin culpas. Toca para ver.";
  const image = rec.image || "";
  const target = rec.target;
  const scheme = appScheme(target) || "";

  const ogImageTags = image
    ? `<meta property="og:image" content="${esc(image)}">
  <meta property="og:image:width" content="1280">
  <meta property="og:image:height" content="720">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="${esc(image)}">`
    : `<meta name="twitter:card" content="summary">`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>

  <!-- ===== Open Graph (lo que ve WhatsApp / Facebook / LinkedIn) ===== -->
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Cocina en Fácil y Sin Culpas">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:url" content="${esc(target)}">
  ${ogImageTags}
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(desc)}">

  <!-- Respaldo: si el JS no corre, igual redirige a los 2 segundos -->
  <meta http-equiv="refresh" content="2;url=${esc(target)}">

  <style>
    body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;
      background:#fbf6ee;color:#2c2a26;text-align:center;padding:64px 22px;line-height:1.5}
    .ico{font-size:44px;margin-bottom:6px}
    h2{color:#2f5e3e;margin:0 0 6px;font-size:20px}
    p{color:#7a756c;font-size:14px;margin:6px 0 18px}
    a.btn{display:inline-block;background:#3f7d52;color:#fff;text-decoration:none;font-weight:700;
      padding:13px 22px;border-radius:10px}
  </style>
</head>
<body>
  <div class="ico">🚀</div>
  <h2>Abriendo…</h2>
  <p>Si no se abre sola en unos segundos, toca el botón.</p>
  <a class="btn" id="go" href="${esc(target)}">Abrir de todas formas</a>

  <script>
  (function(){
    var target = ${JSON.stringify(target)};
    var scheme = ${JSON.stringify(scheme)};
    if(!scheme){ location.replace(target); return; }
    var fellBack=false, start=Date.now();
    var timer=setTimeout(function(){
      if(fellBack) return;
      if(!document.hidden && (Date.now()-start)<2500){ location.replace(target); }
    },1200);
    document.addEventListener('visibilitychange',function(){
      if(document.hidden){ fellBack=true; clearTimeout(timer); }
    });
    try{ window.location.replace(scheme); }catch(e){ location.replace(target); }
  })();
  </script>
</body>
</html>`;
}

function notFoundHtml(slug, origin) {
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Link no encontrado</title>
<style>
  body{margin:0;font-family:-apple-system,BlinkMacSystemFont,Arial,sans-serif;background:#fbf6ee;
    color:#2c2a26;text-align:center;padding:64px 22px;line-height:1.5}
  .ico{font-size:44px}h2{color:#b4452f;margin:8px 0 6px}p{color:#7a756c;font-size:14px}
  a{color:#3f7d52;font-weight:700}
</style></head>
<body>
  <div class="ico">🤔</div>
  <h2>Ese link no existe</h2>
  <p>No encontramos <strong>/r/${esc(slug)}</strong>.</p>
  <p><a href="${esc(origin)}/admin">Ir al panel</a></p>
</body></html>`;
}
