# Juego de cartas de MMA — Documento de diseño

**Estado:** bloque de cartas y PvP cerrado. Economía, modos y licencias pendientes.
**Última actualización:** 16 de agosto de 2026

---

## 1. Concepto

Juego móvil de colección de cartas de MMA, estilo Pacybits/FUT: abres sobres, montas tu plantilla y peleas contra otros jugadores online.

**La plantilla es un peleador por división.** No eres promotor ni entrenador: montas el mejor roster posible cubriendo todas las divisiones.

**Peleadores reales.** Riesgo legal asumido conscientemente (ver sección 10).

**En PvP, solo UFC.** La plantilla de 11 se monta exclusivamente con cartas de UFC. Es lo que mantiene limpia la lógica de divisiones: KSW, Rizin y ONE usan categorías de peso distintas y encajarlas en las 11 de UFC ensuciaría todo el sistema de cruces y penalizaciones.

**En colección, no solo UFC.** Cage Warriors, KSW, Rizin, Invicta, LFA y regionales existen como cartas: entran en sets, se reciclan y se intercambian. Es el hueco de mercado frente a EA, que está atada a una sola promoción.

*Decisión marcada como provisional ("de momento"). Abrir el PvP a otras promotoras es una vía de crecimiento futuro, pero exige resolver antes el mapeo de divisiones.*

**Sin casa de subastas.** No se compran ni se venden cartas por dinero del juego: no hay precios, no hay especulación. Lo que sí hay es una **sala de intercambio** entre jugadores, de trueque puro (ver sección 9).

---

## 2. La carta

### 2.1 Las 6 stats

Todas sobre 100.

| Stat | Qué mide |
|---|---|
| **GOLPEO** | Todo el juego de pie |
| **LUCHA** | Imponer dónde se pelea: derribos y defensa de derribo |
| **SUELO** | Dominio en el suelo: sumisiones, control, defensa |
| **CARDIO** | Ritmo sostenido y recuperación |
| **DUREZA** | Aguantar castigo y seguir |
| **IQ** | Lectura, adaptación, gestión del combate |

Cada stat es una **media global de ataque y defensa juntos**. No existe "derribos" separado de "defensa de derribo": el sistema compara números simétricamente (los dos peleadores hacen lo mismo a la vez), así que no hay atacante ni defensor.

Los nombres deben dejar claro que son capacidades globales. Por eso es LUCHA y no "derribos" — si se llama derribos, el jugador espera que un 90 derribe siempre.

### 2.2 Sub-stats (modelo FIFA)

Cada stat visible sale de la media de sus sub-stats internas. La carta enseña las 6 grandes; el sistema guarda el detalle.

- **GOLPEO** — potencia, precisión, volumen, boxeo, patadas, golpeo en clinch
- **LUCHA** — derribos, defensa de derribo, clinch, control contra la jaula, levantarse, transiciones
- **SUELO** — sumisiones, defensa de sumisión, control desde arriba, guardia, ground and pound, escapes
- **CARDIO** — resistencia, recuperación entre asaltos, ritmo sostenido, aguante en asaltos finales, eficiencia de movimiento, gestión del gas
- **DUREZA** — mentón, absorción de daño, resistencia a cortes, recuperación de aturdimiento, tolerancia al castigo corporal, voluntad
- **IQ** — lectura del rival, gestión de distancia, adaptación, control del octógono, defensa, gestión de asaltos

> **Aviso de trabajo:** 36 valores por carta. Con 500 cartas son 18.000 números a mano. Se puntúan las sub-stats y la grande sale sola, pero hay que contarlo en la planificación.

### 2.3 Media general

**Media simple de las 6 stats.** Nada de ponderaciones ocultas: la gente hace cuentas y si el número no cuadra, piensa que hay trampa.

Problema conocido: el especialista sale malparado. Un 92 de golpeo y 60 en el resto da media 65 y parece basura, cuando es una carta buenísima para declarar golpeo.

Solución: la carta enseña **la media y, destacadas, sus stats por encima de 85**. Dos datos para valorar, igual que en el FIFA ves la media y las stats en verde.

### 2.4 Rangos por rareza

| Rareza | Rango |
|---|---|
| Bronce | 55-68 |
| Plata | 65-78 |
| Oro | 75-88 |
| Élite y especiales | 85-95 |
| Por encima de 95 | 4-5 cartas en todo el juego |

Este reparto es lo que hace funcionar la tabla de márgenes: oro contra bronce da finish, dos oros dan decisión, dos élites dan combate reñido. Si todas las cartas vivieran entre 78 y 92, no habría un solo finish en el juego.

### 2.5 Escala de habilidad, no de peso

Un 85 de GOLPEO vale lo mismo en mosca que en pesado. Las stats están ajustadas a la división donde compite cada uno.

**El peso solo importa cuando alguien cruza de división** y come penalización. No existe división dominante.

### 2.6 Reglas de carta

- Cada carta pertenece a una división
- **Solo las cartas de UFC son alineables.** Las de otras promotoras existen como cartas de colección: valen para sets, reciclaje e intercambio, pero no se pueden poner en la plantilla
- Un mismo peleador puede tener cartas distintas en divisiones distintas (McGregor pluma / McGregor ligero), con stats diferentes
- **Un peleador, un slot:** no puedes alinear dos versiones del mismo peleador a la vez
- Los rasgos van en versiones especiales; campeones y rankeados suelen llevar rasgo normal
- Una carta puede llevar hasta **dos rasgos** (dos plus, uno plus y uno normal, o dos normales). Deben ser rarísimas: aunque solo actives uno por partida, tener dos llaves en la misma carta es muy fuerte
- **Si una carta lleva dos rasgos, tienen que ser distintos.** Un Camaleón normal junto a un Camaleón plus en la misma carta no significa nada, porque el plus siempre es mejor y nunca usarías el normal

---

## 3. La plantilla

- **11 cartas, una por división:** 8 masculinas, 3 femeninas
- **Solo cartas de UFC.** Las de otras promotoras no son alineables (ver sección 1)
- **Sin banquillo.** Se descartó: con sets de colección como sumidero, el banquillo solo añadía gestión aburrida
- Puedes alinear **todas las cartas con rasgo que quieras**, y pueden repetir rasgo entre ellas. El límite está en cuántas puedes activar, no en cuántas puedes llevar
- Repetir rasgo no da potencia extra, porque solo activas uno. Da **fiabilidad**: si llevas tres Camaleones en divisiones distintas, es más probable que al menos uno quede en posición útil después de los vetos

---

## 4. Fase previa a la partida

1. **Elección de rol.** Los dos eligen a la vez: empezar vetando o empezar declarando. Si eligen distinto, cada uno a lo suyo. Si coinciden, dado y el más alto se queda lo que pidió.
2. **Vetos alternos y visibles.** 2 cada uno. Cada veto aparece en pantalla al hacerse, para que el otro pueda reaccionar.
3. **Veto aleatorio, al final.** Rompe planes ya construidos, que es donde más impacto tiene.
4. **La división del veto aleatorio será el desempate.** Los dos la ven desde el principio y condiciona toda la partida.
5. Quedan **6 divisiones en juego**, en orden visible desde el inicio.

---

## 5. El duelo

- Se declara **división + stat**
- Declaraciones **3 y 3**, alternando. Empieza el que no empezó vetando
- **Las stats se gastan del pool compartido:** 6 stats, 6 duelos, cada stat se usa una vez y muere para los dos jugadores
- **Cada peleador pelea una sola vez** por partida
- Las cartas están **ocultas** hasta que se resuelve el duelo
- **Reloj de 20-30 segundos** por decisión

### 5.1 Por qué funciona el pool compartido

Declarar no es solo elegir tu terreno: es **quemar el terreno del otro**. Puedes declarar LUCHA no porque te convenga, sino para obligar al rival a gastar ahí antes de que esté listo.

Y guardarse una stat es un plan que el rival puede reventar. Si tienes un fenómeno en lucha y lo reservas para el final, el rival puede declarar lucha en el duelo 2 y romperte el plan.

Cada declaración es a la vez ataque y defensa. Eso es lo que sostiene la tensión hasta el último duelo.

### 5.2 Resolución

Gana la stat más alta. El margen decide el tipo de victoria:

| Margen | Resultado |
|---|---|
| 13 o más | Finish (KO o sumisión) |
| 7-12 | Decisión |
| 1-6 | Combate reñido: azar ponderado 65/35 |

### 5.3 Victoria

- **A 4 victorias**
- Si acaba **3-3**: desempate en la división del veto aleatorio, **stat al azar** entre las 6, cartas frescas (esa división no se ha jugado)
- En el desempate no hay cambios de división ni jugadas: no hay divisiones contiguas en juego

---

## 6. Cambios de división

- Solo entre **divisiones contiguas** y ambas en juego
- **Salto máximo de una** división
- **Intercambio obligado:** si subes tu ligero al welter, tu welter baja al ligero
- **Una sola vez por partida** — es "tu jugada", el mismo recurso que los rasgos

### Penalizaciones

| Movimiento | Penalización |
|---|---|
| **Subir** de división | -6 a GOLPEO, LUCHA y DUREZA |
| **Bajar** de división | -6 a CARDIO y DUREZA (corte de peso) |

El -6 no es arbitrario: con la tabla de márgenes actual, **basta para convertir cualquier victoria por decisión en un combate reñido**. Cruzar de división pasa una ventaja cómoda a moneda al aire, pero no regala el duelo.

Las stats no penalizadas quedan intactas. La carta se muestra con los números ya ajustados en rojo.

---

## 7. Rasgos

**Una activación por partida**, compartida con el cambio de esquina. Puedes llevar los rasgos que quieras en plantilla, pero solo usas uno.

Los rasgos están **ocultos** hasta que se usan. Al activarse, se muestra claramente cuál ha sido — si no, el jugador no entiende por qué ha pasado lo que ha pasado y piensa que hay bugs.

**Principio de diseño: el plus no es un número mayor, es una restricción menos.**

### CAMALEÓN
*Solo peleadores con historial real en dos divisiones (McGregor, Cejudo, Adesanya, Jones, Cormier, Nunes, Shevchenko, Penn...)*

- **Normal:** al declarar, mandas la carta a pelear en una división contigua **sin penalización**. La carta que tenías en esa división **se descarta sin pelear**, y el Camaleón **sigue disponible para su propio duelo**.
- **Plus:** lo mismo, pero **no consume tu jugada de la partida**.

### INCÓMODO

- **Normal:** ocultas la división. El sistema enseña al rival **dos cartas suyas** — la de la división real y una contigua. Elige a ciegas. Si acierta, duelo limpio. Si falla, su carta come **-6**. **Solo se puede usar si los vetos han dejado dos divisiones contiguas en juego.**
- **Plus:** se enseñan la de la división real y **una aleatoria de cualquier división en juego**, no necesariamente contigua. Si falla, **-12**. **Se puede usar siempre**, porque no necesita contigüidad.

En el plus no se enseñan tres cartas contiguas: la de en medio delataría la respuesta.

### ESPECIALISTA
*Va asociado a una stat concreta*

- **Normal:** si gana su duelo en su stat, **esa stat no se gasta** del pool compartido.
- **Plus:** la stat no se gasta **aunque pierda**.

La stat revive **para los dos jugadores**. El pool es compartido: si reviviera solo para uno, habría dos listas distintas y el sistema se rompe. Es un rasgo generoso y ahí está su gracia — le devuelves una opción al rival, así que tienes que estar seguro de que en esa stat mandas tú.

### VETERANO
*Solo peleadores con carrera larga de verdad*

- **Normal:** cuando el rival declara la stat, la cambias por **una aleatoria** de entre las vivas.
- **Plus:** **la eliges tú**.

En el duelo 6 no se puede activar: solo queda una stat viva y no hay a dónde cambiar. **El botón sale apagado con el motivo escrito** ("no quedan stats a las que cambiar"). Se pierde el recurso por mala gestión, pero no parece un bug.

Que el normal sea aleatorio significa que a veces te sale por la culata: puede caer en una stat donde el rival esté aún mejor. Es lo que le da carácter de jugada de emergencia y lo que justifica el valor del plus.

### Regla general

**No se contrarresta un rasgo con otro.** Se descartó explícitamente para no convertir el duelo en cadenas de respuestas, que en móvil es inmanejable.

---

## 8. Producto y PvP

- **Partidas en vivo, online.** Por turnos, así que la latencia da igual y el servidor es barato
- **Abandono = rendición.** Gana el otro
- **Dos modos de emparejamiento:**
  - **Normales:** cualquier emparejamiento, para probar plantillas y estrategias
  - **Competitivas:** partidas de posicionamiento → liga → ascensos

---

## 9. Economía (bloque abierto)

Lo cerrado hasta ahora:

- **Sin casa de subastas.** Las cartas no tienen precio ni se venden. El único movimiento de cartas entre jugadores es el trueque de la sala de intercambio
- **Sobres gratis** con drop bajo: lo normal es que salgan peleadores mediocres, con muy poca probabilidad de cartas buenas
- **Divisa del juego** para comprar sobres especiales, con mejores probabilidades y distinto coste. Se gana jugando partidas, cumpliendo objetivos y por logros
- **Los sobres se acumulan sin caducar.** Es deliberado: guardar veinte o cincuenta para abrirlos de golpe es uno de los momentos que más engancha en Pacybits/MadFUT, y convierte la recompensa diaria en un plan a medio plazo en vez de un caramelo suelto
- **SBC / desafíos** para cartas exclusivas y especiales
- **Sets de colección** por gimnasio, promoción y nacionalidad, que desbloquean cartas especiales no obtenibles de otra forma. Es lo que da valor a las cartas flojas: un 68 que te completa un set tiene sentido aunque no juegue nunca

### 9.1 Fichas de intercambio

Se consiguen reciclando repetidos:

| Reciclas | Obtienes |
|---|---|
| 1 oro | 1 ficha |
| 5 platas | 1 ficha |
| 20 bronces | 1 ficha |

La escala está muy separada a propósito: de bronces sobran cientos y de oros casi ninguno. Si un oro valiera poco más de tres bronces, la gente trituraría oros para farmear rápido y luego los echaría de menos en los sets.

**La ficha no es el precio de una carta: es la entrada a la sala de intercambio.** No mide valor, no se usa para pagar diferencias. Solo abre la puerta.

Eso es lo que le da peso: entrar cuesta una ficha, o sea cartas trituradas, así que salir de vacío duele. Empuja a cerrar tratos en vez de mirar escaparates, y hace que negociar en masa salga caro.

### 9.2 La sala de intercambio

- **Entrar cuesta 1 ficha.** Emparejamiento a ciegas con otro jugador
- **Solo se cambian cartas por cartas.** Ni divisa, ni fichas encima para compensar. Trueque puro
- **Hasta 3 huecos por lado**, con cualquier combinación: 1 por 1, 3 por 1, 2 por 3, lo que acepten los dos
- **Lista de deseos pública**, estilo Pacybits/MadFUT. No sirve para emparejar: sirve para que el otro vea qué buscas y pueda ofrecértelo si lo tiene

El valor no lo fija el sistema, lo fijan los dos jugadores en el momento. Como no hay precios, no hay inflación ni especulación, y las fichas solo aparecen destruyendo cartas — es una economía que se vacía sola.

### Recomendaciones pendientes de decidir
- **Carta con rasgo garantizada al empezar**, aunque sea floja. Como los rasgos son la única jugada de la partida, un novato sin ninguna juega sin herramienta
- **Los sets deberían pedir peleadores de divisiones distintas**, para que haya que perseguir cartas que no te sirven en plantilla

---

## 10. Licencias (sin resolver)

Usar nombres, apodos e imagen de peleadores reales requiere derechos de imagen individuales. La marca UFC está licenciada en exclusiva a EA.

Riesgo asumido conscientemente. Mitigaciones prácticas a valorar antes de monetizar:

- **Roster como datos, no como código.** Nombres, apodos y arte en configuración, para poder cambiarlos sin tocar el juego
- **Arte ilustrado propio**, nunca fotos de prensa
- **Cero marcas de promotoras**: ni logos, ni cinturones, ni octógono reconocible
- Nada que sugiera respaldo o patrocinio de ningún peleador
- Las promotoras pequeñas son bastante más accesibles para acuerdos directos que las grandes

*(No soy abogado. Esto es orientación práctica, no asesoramiento legal — antes de monetizar conviene consultarlo con un profesional.)*

---

## 11. Pendiente

**Diseño**
- **Cuántas cartas tendrá el juego en total.** Sin casa de subastas, ese número decide si un set de gimnasio es alcanzable o imposible
- **Profundidad de las divisiones femeninas.** Con PvP solo UFC, las 3 femeninas salen de un roster corto (paja, mosca y gallo). Son el 27% de cada plantilla, así que hay que comprobar que hay peleadoras suficientes contando versiones especiales y retiradas
- **¿Las cartas no-UFC llevan stats completas?** Si son solo de colección, las 36 sub-stats no hacen falta y es un ahorro enorme de trabajo. Pero si algún día se abre el PvP a otras promotoras, habría que puntuarlas todas a posteriori
- **El sobre que decepciona.** Sacar un peleador buenísimo de KSW y no poder alinearlo puede sentirse como un mal tirón. Hay que decidir si se separan los pools de sobres o si basta con que los sets recompensen bien
- **El 3 por 1 y las cuentas secundarias.** Si se pueden dar tres bronces por un oro, dos cuentas del mismo dueño se vacían la una en la otra. Se tapa limitando la diferencia de rareza dentro de un mismo trueque
- **¿Entran al trueque las cartas de set y las de rasgo?** Si son intercambiables, quien tenga stock consigue las recompensas de los desafíos sin jugarlos. En FUT van marcadas como no traspasables por este motivo exacto
- Ritmo de sobres y recompensas: es la columna vertebral del juego
- Diseño concreto de los SBC
- Modos fuera del PvP: draft, modo carrera
- Nombre del juego
- Confirmar número exacto de sub-stats por stat

**A validar en playtest de papel** *(dos plantillas escritas a mano y un amigo — es lo más rentable que se puede hacer ahora)*
- ¿Con qué frecuencia sale el 3-3? Entre plantillas parejas debería rondar 1 de cada 3 partidas
- ¿Declarar 3 veces desequilibra, aunque se compense con el rol?
- ¿Compensa de verdad cruzar división a -6?
- ¿El Camaleón gana demasiado? Se lleva dos ventajas de golpe: gana un duelo y elimina uno malo. **Palanca de ajuste si hace falta:** que la carta descartada cuente como duelo perdido en vez de desaparecer
- ¿Ganar por margen 13+ sale lo bastante a menudo como para que los finishes se sientan especiales, sin llegar a ser rutina?

**Producto**
- Qué pasa con las desconexiones (distinto del abandono voluntario)
- Arranque el día 1: sin jugadores conectados, el emparejamiento en vivo no funciona
- Interfaz: hay que enseñar en todo momento **qué stats quedan vivas y qué divisiones quedan por jugar**. Sin eso, todo el sistema de pool compartido no se aprecia
