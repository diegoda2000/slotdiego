# Cómo activar las partidas en vivo

Para jugar **a la vez** contra un amigo hace falta un servidor. Esta guía lo pone en marcha
**sin instalar nada y sin escribir ni un comando**: todo se hace desde el navegador del móvil.

Se hace **una sola vez**. A partir de ahí funciona siempre, y cada mejora del juego se publica
sola.

---

## Por qué hace falta un servidor

En este juego las cartas están ocultas hasta que se resuelve el duelo. Si la plantilla de tu
rival estuviera guardada en tu teléfono, cualquiera podría leerla y saber de antemano lo que
te va a poner. Hace falta alguien en medio que conozca las dos plantillas y no se las enseñe a
nadie hasta que toca.

Eso es el servidor: un árbitro. No guarda tu colección ni tus datos — solo arbitra la partida
mientras dura.

---

## Antes de empezar

Es **gratis**, y en ningún momento debería pedirte una tarjeta. Si algún paso te la pide,
para y dímelo: significa que te has metido por otro sitio.

Ten a mano el móvil y unos diez minutos.

---

## Paso 1 · Crear la cuenta de Cloudflare

Entra en **dash.cloudflare.com/sign-up** y regístrate con tu correo. Confirma el correo que
te mandan.

Cuando entres te ofrecerá añadir un dominio o una web: **sáltalo**. No hace falta nada de eso.

---

## Paso 2 · Crear el token

Es una contraseña larga que le da permiso a GitHub para publicar el servidor en tu cuenta.

1. En el panel de Cloudflare, arriba a la derecha, toca tu perfil → **My Profile**.
2. **API Tokens** → **Create Token**.
3. Busca la plantilla **"Edit Cloudflare Workers"** y dale a **Use template**.
4. Baja hasta el final y confirma: **Continue to summary** → **Create Token**.
5. Te enseña el token **una sola vez**. Cópialo ahora y pégalo en las notas del móvil, que
   lo necesitas en el paso 4.

---

## Paso 3 · Copiar el Account ID

1. Vuelve al panel y entra en **Workers & Pages** (en el menú lateral).
2. En la columna de la derecha verás **Account ID**, una fila de letras y números.
3. Cópialo también.

---

## Paso 4 · Dárselos a GitHub

Estos dos datos se guardan en tu repositorio como **secretos**: quedan cifrados y no se ven
en el código.

1. Abre **github.com/diegoda2000/slotdiego** en el móvil.
2. **Settings** (arriba, puede estar en el menú "···").
3. Menú lateral: **Secrets and variables** → **Actions**.
4. Botón **New repository secret**. Añade el primero:
   - *Name*: `CLOUDFLARE_API_TOKEN`
   - *Secret*: el token del paso 2
   - **Add secret**
5. **New repository secret** otra vez, para el segundo:
   - *Name*: `CLOUDFLARE_ACCOUNT_ID`
   - *Secret*: el Account ID del paso 3
   - **Add secret**

Los nombres tienen que ir **exactamente así**, en mayúsculas y con guiones bajos.

---

## Paso 5 · Publicar el servidor

1. En el repositorio, pestaña **Actions**.
2. En la lista de la izquierda, **Servidor**.
3. **Run workflow** → elige la rama → **Run workflow**.
4. Espera un minuto y entra en la ejecución.

Al terminar, arriba del todo verás un recuadro con la dirección, algo así:

```
https://jaula-abierta.tu-cuenta.workers.dev
```

**Cópiala.**

---

## Paso 6 · Ponerla en el juego

En el juego: **Más → Amigos**, pega la dirección en el campo del servidor y dale a
**Guardar servidor**. Después toca **Probar conexión**: tiene que decirte que funciona.

Hazlo **en los dos móviles**, con la misma dirección.

---

## Ya está: cómo se juega

1. Uno de los dos toca **Crear sala**. Sale un código de 6 letras.
2. Se lo pasa al otro con el botón de **compartir**.
3. El otro toca **Entrar con código** y lo escribe.
4. La partida arranca sola en cuanto entra.

A partir de ahí jugáis los dos a la vez: elegís rol, vetáis por turnos y declaráis, viendo
cada uno lo suyo. Las cartas del rival no aparecen hasta que se resuelve cada duelo.

---

## Si algo no sale

**"Probar conexión" dice que no responde.** Comprueba que la dirección está copiada entera y
que empieza por `https://`. Y que el flujo *Servidor* terminó en verde.

**El flujo sale en gris diciendo que faltan secretos.** Los nombres no coinciden. Vuelve al
paso 4 y compruébalos letra por letra.

**El flujo falla al publicar.** Lo más habitual es que el token no tenga los permisos: bórralo
en Cloudflare y créalo otra vez usando la plantilla **"Edit Cloudflare Workers"**, sin
cambiarle nada.

**Tu amigo no puede entrar en la sala.** Los dos tenéis que tener la **misma dirección de
servidor** guardada, y la misma versión del juego instalada.

---

## Lo que esto no es

No hay cuentas ni contraseñas: la identidad es un identificador del propio teléfono. Vale de
sobra para jugar con amigos, pero no serviría para una clasificación competitiva de verdad.

Tampoco hay emparejamiento con desconocidos: solo salas por código.
