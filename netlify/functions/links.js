// ============================================================
//  Función de administración de links (Node / Netlify Functions)
//  Guarda los pares  slug -> destino  en Netlify Blobs.
//  Protegida con la contraseña ADMIN_PASSWORD (variable de
//  entorno que Paula configura en Netlify).
//
//  Acciones (POST con JSON { action, password, ... }):
//    - "list"       -> lista todos los links (requiere contraseña)
//    - "save"       -> crea/edita un link           (requiere contraseña)
//    - "delete"     -> borra un link                (requiere contraseña)
//    - "meta"       -> trae título/miniatura de YouTube (requiere contraseña)
//    - "public"     -> lista pública para la página de perfil (SIN contraseña)
// ============================================================
import { getStore } from "@netlify/blobs";

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita acentos
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
}

function youtubeId(raw) {
  let u;
  try {
    u = new URL(raw);
  } catch (_e) {
    return null;
  }
  if (/youtu\.be/.test(u.host)) return u.pathname.split("/").filter(Boolean)[0] || null;
  if (u.searchParams.get("v")) return u.searchParams.get("v");
  const parts = u.pathname.split("/").filter(Boolean);
  const i = parts.findIndex((p) => p === "shorts" || p === "embed" || p === "v");
  if (i >= 0 && parts[i + 1]) return parts[i + 1];
  return null;
}

// Trae título + miniatura de un video de YouTube de forma confiable.
async function fetchYouTubeMeta(target) {
  const id = youtubeId(target);
  const result = { title: "", image: "", isYouTube: !!id };
  if (id) {
    // imagen confiable sin depender de nada
    result.image = "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg";
  }
  try {
    const r = await fetch(
      "https://www.youtube.com/oembed?format=json&url=" + encodeURIComponent(target)
    );
    if (r.ok) {
      const d = await r.json();
      if (d && d.title) result.title = d.title;
      if (d && d.thumbnail_url && !result.image) result.image = d.thumbnail_url;
    }
  } catch (_e) {
    // sin internet o CORS: nos quedamos con la imagen hqdefault
  }
  return result;
}

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  let body;
  try {
    body = await req.json();
  } catch (_e) {
    return json({ error: "Petición inválida" }, 400);
  }

  const store = getStore("links");
  const action = body.action;

  // ----- Acción pública (para la página de perfil): NO pide contraseña -----
  if (action === "public") {
    const items = await readAll(store);
    const publicItems = items
      .filter((it) => it.showInProfile)
      .sort((a, b) => (a.order || 0) - (b.order || 0) || (a.createdAt || 0) - (b.createdAt || 0))
      .map((it) => ({
        slug: it.slug,
        title: it.title || it.slug,
        image: it.image || "",
        emoji: it.emoji || "🔗",
      }));
    return json({ ok: true, links: publicItems });
  }

  // ----- A partir de aquí, TODO pide contraseña -----
  const pass = process.env.ADMIN_PASSWORD;
  if (!pass) {
    return json(
      {
        error:
          "Falta configurar la contraseña. En Netlify: Site settings → Environment variables → agrega ADMIN_PASSWORD.",
      },
      500
    );
  }
  if (!body.password || body.password !== pass) {
    return json({ error: "Contraseña incorrecta" }, 401);
  }

  if (action === "meta") {
    if (!body.target) return json({ error: "Falta el link" }, 400);
    const meta = await fetchYouTubeMeta(body.target);
    return json({ ok: true, ...meta });
  }

  if (action === "list") {
    const items = await readAll(store);
    items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return json({ ok: true, links: items });
  }

  if (action === "save") {
    let target = String(body.target || "").trim();
    if (!target) return json({ error: "Falta el link de destino" }, 400);
    if (!/^https?:\/\//i.test(target)) target = "https://" + target;
    try {
      new URL(target);
    } catch (_e) {
      return json({ error: "El link de destino no es válido" }, 400);
    }

    let slug = slugify(body.slug);
    if (!slug) return json({ error: "Escribe un slug (nombre corto)" }, 400);

    // Si es creación nueva y el slug ya existe, avisamos (salvo que sea edición del mismo)
    const existing = await store.get(slug, { type: "json" }).catch(() => null);
    if (existing && !body.overwrite && slug !== body.originalSlug) {
      return json({ error: "Ya existe un link con ese slug. Elige otro." }, 409);
    }

    const rec = {
      slug,
      target,
      title: String(body.title || "").trim(),
      description: String(body.description || "").trim(),
      image: String(body.image || "").trim(),
      emoji: String(body.emoji || "").trim() || "🔗",
      showInProfile: !!body.showInProfile,
      order: Number(body.order) || 0,
      createdAt: existing?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    // Si renombró el slug, borramos el viejo
    if (body.originalSlug && body.originalSlug !== slug) {
      await store.delete(body.originalSlug).catch(() => {});
    }

    await store.setJSON(slug, rec);
    return json({ ok: true, link: rec });
  }

  if (action === "delete") {
    const slug = slugify(body.slug);
    if (!slug) return json({ error: "Falta el slug" }, 400);
    await store.delete(slug).catch(() => {});
    return json({ ok: true });
  }

  return json({ error: "Acción desconocida" }, 400);
};

// Lee todos los links guardados
async function readAll(store) {
  const { blobs } = await store.list();
  const items = [];
  for (const b of blobs) {
    const rec = await store.get(b.key, { type: "json" }).catch(() => null);
    if (rec) items.push(rec);
  }
  return items;
}
