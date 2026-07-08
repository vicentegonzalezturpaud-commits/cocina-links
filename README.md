# 🔗 App de Links y QR — Cocina en Fácil y Sin Culpas

Tu app para crear **links cortos con vista previa** (miniatura + título en WhatsApp,
Facebook y LinkedIn) y **códigos QR**, alojada gratis en Netlify.

- Panel para crear/editar links: **https://linkpaulalarenas.netlify.app/admin**
- Tu página de perfil (bio): **https://linkpaulalarenas.netlify.app/perfil**
- Links cortos que compartes: **https://linkpaulalarenas.netlify.app/r/kefir** (tú eliges el nombre)

> **¿Dónde se guardan los links?** En **Netlify Blobs** (el almacén gratis que ya viene
> incluido en Netlify). No necesitas ninguna base de datos aparte.

---

## 🟢 PASO 1 (una sola vez): poner tu contraseña

El panel `/admin` está protegido con una contraseña que eliges tú. Se guarda en Netlify,
**no** en el código.

1. Entra a **https://app.netlify.com** y abre tu sitio **linkpaulalarenas**.
2. Arriba, entra a **Site configuration** (o *Site settings*).
3. En el menú de la izquierda: **Environment variables** → botón **Add a variable** →
   **Add a single variable**.
4. Escribe:
   - **Key:** `ADMIN_PASSWORD`
   - **Value:** la contraseña que quieras (ej. `paula2026kefir`)
5. Guarda con **Create variable**.

> Si algún día quieres cambiar la contraseña, vuelve aquí y edita ese valor.

---

## 🟢 PASO 2: publicar la app en Netlify

Tienes la carpeta **app-links** en tu computador. Esa carpeta completa es tu app.

### Opción A — Arrastrar la carpeta (la más simple)

1. Entra a **https://app.netlify.com** y abre tu sitio **linkpaulalarenas**.
2. Ve a la pestaña **Deploys**.
3. Verás un recuadro que dice *"Drag and drop your site output folder here"*.
4. **Arrastra la carpeta `app-links` completa** a ese recuadro.
5. Espera ~1 minuto a que diga **Published**. ¡Listo!

> Importante: arrastra **la carpeta completa** (así incluye las funciones y el almacén).
> Incluye una subcarpeta `node_modules` — es normal, déjala ahí, es la que hace funcionar
> el guardado de links.

### Opción B — Con la herramienta de Netlify (si la anterior te falla)

Solo si la Opción A no publica las funciones. Pídele a alguien de confianza que corra,
dentro de la carpeta `app-links`, este comando: `npx netlify deploy --prod`.

---

## 🟢 PASO 3: crear tu primer link corto

1. Entra a **https://linkpaulalarenas.netlify.app/admin**
2. Escribe tu contraseña (la del Paso 1).
3. **Pega el link** de destino (por ejemplo el de tu video de YouTube).
4. Toca **"✨ Traer título y miniatura de YouTube"** → se llenan solos el título y la imagen.
   - Puedes editar el título, la descripción o poner tu propia imagen.
5. En **"Nombre corto (slug)"** escribe algo simple, ej. `kefir`.
6. Toca **💾 Guardar link**.
7. Tu link corto queda listo: **https://linkpaulalarenas.netlify.app/r/kefir**
   - Ahí mismo puedes **descargar el QR**.

### Para que aparezca en tu página de perfil
Marca la casilla **"Mostrar este link como botón en mi página de perfil"** y (opcional)
elige un emoji y un número de orden. Se agrega solo a **/perfil**.

---

## 🟢 PASO 4: comprobar la vista previa (antes de compartir)

1. Copia tu link corto (ej. `https://linkpaulalarenas.netlify.app/r/kefir`).
2. Entra a **https://www.opengraph.xyz** y pégalo.
3. Debe mostrarse la **miniatura + título**. ✅
4. Truco: si compartes el mismo link en WhatsApp y no se actualiza la miniatura, agrégale
   `?v=2` al final una vez (ej. `/r/kefir?v=2`) para que WhatsApp lo lea de nuevo.

Luego pruébalo en un chat de WhatsApp contigo misma.

---

## ✏️ Editar o borrar un link

En **/admin**, más abajo, está la lista **"Mis links"**:
- **Editar**: cambia destino, título, imagen, etc. (puedes incluso cambiar el slug).
- **QR**: vuelve a mostrar el código QR para descargarlo.
- **🗑**: borra el link.

---

## 🖼️ (Opcional) Poner tu foto en el perfil

En la página `/perfil` sale un aguacate 🥑 si no hay foto. Para poner tu foto:
1. Guarda tu foto como **`paula.jpg`** (cuadrada se ve mejor).
2. Ponla **dentro de la carpeta `app-links`** (al lado de `index.html`).
3. Vuelve a publicar (Paso 2). Tu foto aparecerá en `/perfil`.

---

## 🔁 Cómo republicar cuando cambies algo

Cada vez que cambies un archivo (o agregues tu foto), repite el **Paso 2** (arrastrar la
carpeta). Los links que ya creaste **no se borran**: quedan guardados en Netlify.

---

## ❓ Problemas comunes

- **"Falta configurar la contraseña"** → te falta el Paso 1 (variable `ADMIN_PASSWORD`).
- **"Contraseña incorrecta"** → revisa que sea igual a la que pusiste en Netlify.
- **No aparece la miniatura en WhatsApp** → comprueba primero en opengraph.xyz; si ahí sale
  bien, usa el truco del `?v=2`.
- **El panel no guarda** → probablemente las funciones no se publicaron; usa la Opción B del
  Paso 2 o vuelve a arrastrar la carpeta **completa** (con `node_modules`).
