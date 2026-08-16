# Servidor de partidas en vivo

Arbitra las partidas por sala. Un **Durable Object** por partida: conoce las dos
plantillas y no se las enseña a nadie hasta que cada duelo se resuelve.

Esa es toda la razón de que exista. En este juego las cartas están ocultas, así que la
plantilla del rival **no puede vivir en el móvil del otro**: cualquiera la leería. Sin un
árbitro, las cartas ocultas son un pacto de caballeros entre clientes.

El motor de reglas es **el mismo archivo** que usa el juego (`../juego/motor.js`). No hay
una copia del reglamento aquí: si divergieran, el servidor arbitraría un juego distinto del
que la gente cree estar jugando.

---

## Probarlo en local (sin cuenta de nadie)

```bash
cd servidor
npm install
npx wrangler dev --port 8787 --local
```

Luego, en el juego: **Más → Partida en directo**, y pones `http://127.0.0.1:8787` en la
dirección del servidor.

Para la prueba automática, con el servidor levantado en otra terminal:

```bash
node juego/test-online.mjs
```

Abre dos navegadores, uno crea sala y el otro entra con el código, y juegan una partida
completa. Comprueba lo que de verdad importa: que **ninguna carta del rival sin resolver
llega al cliente**, que el servidor rechaza las jugadas ilegales, que la reconexión devuelve
el estado exacto y que un tercero no entra en una sala de dos.

---

## Publicarlo

```bash
npx wrangler login      # abre el navegador, cuenta gratuita
npx wrangler deploy
```

Te devuelve una dirección tipo `https://jaula-abierta.TU-CUENTA.workers.dev`. Esa es la que
pegas en **Partida en directo** dentro del juego, en los dos móviles.

**Sin terminal:** si no tienes ordenador, se puede desplegar entero desde el navegador del
móvil con GitHub Actions. Los pasos están en [`COMO-ACTIVARLO.md`](COMO-ACTIVARLO.md).

**No hace falta recompilar el APK para cambiar de servidor**: la dirección es un ajuste
guardado en el dispositivo, no algo incrustado en la aplicación.

> Las condiciones de los planes gratuitos cambian con el tiempo. Conviene mirar los límites
> vigentes el día que despliegues en vez de fiarse de lo que ponga aquí.

---

## Cómo funciona

| Ruta | Qué hace |
|---|---|
| `POST /sala` | Devuelve un código de 6 caracteres |
| `GET /sala/:codigo` | WebSocket dentro del Durable Object de esa sala |

El código usa un alfabeto **sin O/0 ni I/1**, para poder dictarlo por teléfono sin
equivocarse.

**El servidor no se fía de nada.** Valida que sea tu turno, que la división siga libre, que la
stat siga viva, que no hayas gastado ya tu jugada, y que la plantilla que mandas sea legal —
11 divisiones, todas alineables, sin peleador repetido.

**Ninguna decisión la toma la máquina.** El Veterano es reactivo, así que cuando salta se le
pregunta al defensor y se espera su respuesta, en vez de dispararse solo. Cuesta una ida y
vuelta más por duelo, pero que el servidor gaste por ti tu única jugada de la partida no es
aceptable en una partida entre dos personas.

**La redacción del estado** es la pieza clave: a cada jugador solo le viajan las cartas del
rival de divisiones **ya resueltas**. Al acabar la partida se destapa todo, que es cuando ya
no hay nada que proteger. Además el servidor voltea los lados, de modo que cada cliente se ve
siempre a sí mismo como `j` y todas las pantallas del juego funcionan sin enterarse de que hay
red por medio.

**El roster no viaja.** Se genera de la misma semilla fija en el servidor y en los clientes,
así que todos llegan al mismo catálogo por su cuenta. Por el cable solo van los 11
identificadores de carta de cada plantilla.

## Limitaciones conocidas

- **El estado vive en memoria.** Si el Durable Object se recicla —cosa que no pasa mientras
  haya alguien conectado— la partida se pierde. Reconectar funciona en el caso real, que es
  cerrar la aplicación y volver a abrirla.
- **No hay cuentas.** La identidad es un identificador del dispositivo. Vale para jugar con
  amigos; no vale para una clasificación competitiva.
- **No hay cola de emparejamiento aleatorio.** Solo salas por código.
