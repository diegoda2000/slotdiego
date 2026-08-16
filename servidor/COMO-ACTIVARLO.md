# Activar las partidas en directo

> **Esto es solo para quien aloja el juego.** Si vas a jugar, no tienes que leer esto ni hacer
> nada: instalas el APK y juegas. No hay cuentas, ni registros, ni direcciones que pegar.

Hay **un único servidor** para todo el mundo, y su dirección va metida dentro del APK. Se pone
en marcha **una sola vez** y ya no se vuelve a tocar: cada vez que cambie el juego, el APK se
reconstruye solo con la dirección dentro.

Todo se hace desde el navegador, también desde el móvil. Son tres pasos.

---

## Por qué hace falta un servidor

En este juego las cartas están ocultas hasta que se resuelve el duelo. Si la plantilla del
rival estuviera guardada en el móvil del otro, cualquiera podría leerla. Hace falta alguien en
medio que conozca las dos y no las enseñe hasta que toca: eso es el servidor.

No guarda colecciones ni datos de nadie. Solo arbitra la partida mientras dura.

---

## Paso 1 · Crear el token

Es una contraseña larga que le da permiso a GitHub para publicar el servidor en tu cuenta de
Cloudflare.

1. En el panel de Cloudflare, arriba a la derecha, toca tu perfil → **My Profile**.
2. **API Tokens** → **Create Token**.
3. Busca la plantilla **"Edit Cloudflare Workers"** y dale a **Use template**.
4. Baja al final: **Continue to summary** → **Create Token**.
5. El token se enseña **una sola vez**. Cópialo ahora.

## Paso 2 · Copiar el Account ID

1. En el menú lateral, entra en **Workers & Pages**.
2. En la columna de la derecha está el **Account ID**, una fila de letras y números.
3. Cópialo.

## Paso 3 · Pegarlos en GitHub

Se guardan como **secretos**: quedan cifrados y no se ven en el código.

1. Abre **github.com/diegoda2000/slotdiego** → **Settings**.
2. Menú lateral: **Secrets and variables** → **Actions**.
3. **New repository secret**, y añade el primero:
   - *Name*: `CLOUDFLARE_API_TOKEN`
   - *Secret*: el token del paso 1
4. **New repository secret** otra vez, para el segundo:
   - *Name*: `CLOUDFLARE_ACCOUNT_ID`
   - *Secret*: el Account ID del paso 2

Los nombres tienen que ir **exactamente así**, en mayúsculas y con guiones bajos.

---

## Y ya está

Ve a la pestaña **Actions** → flujo **Servidor** → **Run workflow**. En un par de minutos, y
sin que hagas nada más, el flujo:

1. publica el servidor,
2. mete su dirección dentro del juego,
3. construye el APK con esa dirección,
4. y lo deja en la descarga **apk-latest**.

A partir de ahí, cualquiera que instale ese APK **juega en directo sin configurar nada**. Y
cada cambio futuro del servidor repite la cadena solo.

---

## Cosas que conviene saber

**El servidor es tuyo.** Una sola cuenta gratuita da servicio a todo el que instale el APK.
Para unos cuantos amigos no se nota, pero si esto creciera, el consumo es de tu cuenta.

**No debería pedirte una tarjeta** en ningún momento. Si algún paso la pide, para: significa
que te has metido por otro sitio.

**Los planes gratuitos cambian.** Los límites vigentes conviene mirarlos el día que despliegues
en vez de fiarse de lo que ponga aquí.

---

## Si algo no sale

**El flujo termina en gris diciendo que faltan secretos.** Los nombres no coinciden. Repasa el
paso 3 letra por letra.

**El flujo falla al publicar.** Casi siempre es el token: bórralo en Cloudflare y créalo otra
vez con la plantilla **"Edit Cloudflare Workers"**, sin cambiarle nada.

**En el juego dice que el directo no está activo.** El APK instalado es anterior al despliegue.
Descarga otra vez el de **apk-latest** e instálalo encima.

---

## Para desarrollar

Si quieres levantar el servidor en tu propio ordenador y probar contra él:

```bash
cd servidor
npm install
npx wrangler dev --port 8787 --local
```

Y en el juego, dentro de **Partida en directo → Ajustes avanzados**, pon
`http://127.0.0.1:8787`. Esa dirección manual tiene prioridad sobre la de fábrica; para volver
a la normal, se deja el campo vacío.
