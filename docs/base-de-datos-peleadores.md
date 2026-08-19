# Base de datos de peleadores

**402 cartas · 355 peleadores · 57 países · 177 cartas rankeadas**
**18 de agosto de 2026 · rev. 19 de agosto: columnas País y Rk · dos rankeados de plata a oro · los cuatro rankeados que faltaban**

Seis stats sobre 100. **Sin media de ningún tipo**: la carta se lee por sus números.

## Reglas de la carta

- **Un solo atributo por carta**, y siempre en versión normal. La única excepción de todo el juego es el **Camaleón+ de Islam Makhachev**, por ser campeón con defensas de título en dos divisiones.
- **Solo las cartas de oro llevan atributo.** La plata no se alinea en la práctica, pero sí entra en los sets de colección, en los SBC y en el reciclaje. Completar una colección entera —platas incluidas— desbloquea cartas especiales.
- **Bronce vacío**, reservado a Cage Warriors, KSW, LFA y demás promotoras.
- **Cada carta lleva un ranking congelado** en la fecha de impresión: C para campeón, 1-15 para clasificados, — para el resto. Solo en la división donde el peleador está rankeado
- **Un doble campeón lleva C en las dos divisiones**, así que una división puede tener dos cartas con C: la del campeón actual y la del doble campeón. Los puestos numerados 1-15 sí son únicos por división
- **Cada carta lleva un país**, el de la bandera con la que compite. Una sola nacionalidad por carta, y las versiones de doble división cuentan una vez en los sets
- Un peleador puede tener carta en varias divisiones, con stats distintas según lo que hizo en cada una. **Un peleador, un slot**: no puedes alinear dos versiones a la vez.

| Rareza | Quién entra | Banda | Cartas |
|---|---|---|---|
| **Oro** | Rankeado, racha de 3+, 2+ peleas de título, o 12+ victorias UFC con +4 | 74-89 | 244 |
| **Plata** | Resto del roster UFC | 64-82 | 158 |
| Bronce | Otras promotoras (pendiente) | 55-74 | 0 |
| Especiales | Capa aparte | hasta 92 | — |

## Cómo salen los números

| Stat | Se calcula con |
|---|---|
| GOLPEO | Volumen × precisión, diferencial de golpes, defensa, y KO pesados por el ranking del rival |
| LUCHA | Derribos por 15 min × precisión + defensa de derribo |
| SUELO | Intentos de sumisión + sumisiones logradas − sufridas |
| CARDIO | Minutos reales por pelea + ratio de peleas que llegan a las tarjetas |
| DUREZA | No ser finalizado + defensa + castigo absorbido sin caer |
| IQ | Defensa de golpeo + defensa de derribo + fiabilidad + experiencia |

**Revisión del 19 de agosto: las reglas de puntuación no se estaban cumpliendo y se han hecho
cumplir.** El techo de cada stat lo da el puesto —campeón 89, Top 1-5 88, Top 6-10 87, Top 11-15 86,
oro sin rankear 85— tomando el **mejor puesto del peleador entre todas sus cartas**, para no romper
la regla de que lo que no depende del peso no cambia entre versiones. Y por debajo de doce peleas el
valor tira hacia la media de su banda. La corrección está en `herramientas/corregir-stats.mjs`.

Datos de UFCStats sobre el historial completo de cada peleador. **Cada pelea se pondera por el ranking del rival**: noquear a un campeón no vale lo que noquear a un debutante. Las muestras cortas tiran hacia la media hasta acumular unas doce peleas. Los valores de la élite están anclados a criterio y la fórmula coloca al resto alrededor.

## Atributos

| Atributo | Cartas |
|---|---|
| Veterano | 49 |
| Camaleón | 19 |
| Especialista DUREZA | 8 |
| Incómodo | 8 |
| Especialista IQ | 7 |
| Especialista LUCHA | 6 |
| Especialista CARDIO | 6 |
| Especialista SUELO | 5 |
| Especialista GOLPEO | 4 |
| Camaleón+ | 2 |
| **Total** | **114** de 244 oros |

---

## Nacionalidad

**Criterio: la bandera con la que compite**, no el país de nacimiento. Es lo que aparece en el gráfico
del evento y lo que el jugador espera leer en la carta. **Un país por carta**: nada de dobles
nacionalidades, porque una carta que contara en dos sets de nacionalidad abarataría completarlos y
obligaría a escribir una regla aparte para el caso.

**Daguestán no es país** a efectos de la carta: va como Rusia. Abrir subestados obliga a Chechenia,
Ingusetia y Osetia, y por coherencia a discutir Inglaterra, Escocia y Gales. El bloque daguestaní
puede existir igual como **set curado** —definido por lista, no por nacionalidad— cuando se diseñen
los sets.

**Las cartas de doble división comparten país**, obviamente, pero **cuentan una sola vez** en un set
de nacionalidad. Si contaran dos, tener a Pereira daría dos casillas brasileñas por un solo peleador.
El recuento de abajo es por peleador único, que es lo que hay que mirar para dimensionar un set.

### Reparto por país

| País | Peleadores |
|---|---|
| Estados Unidos | 133 |
| Brasil | 71 |
| Rusia | 13 |
| Inglaterra | 12 |
| México | 11 |
| Polonia | 10 |
| Francia | 7 |
| China | 7 |
| Australia | 7 |
| Canadá | 7 |
| Nueva Zelanda | 5 |
| Japón | 4 |
| Croacia | 3 |
| Nigeria | 3 |
| Moldavia | 2 |
| Escocia | 2 |
| Ucrania | 2 |
| Kirguistán | 2 |
| Suiza | 2 |
| Sudáfrica | 2 |
| Georgia | 2 |
| Alemania | 2 |
| Kazajistán | 2 |
| Ecuador | 2 |
| Irlanda | 2 |
| Jamaica | 2 |
| España | 2 |
| Azerbaiyán | 2 |
| Argentina | 2 |

Con un solo peleador: Afganistán, Angola, Armenia, Austria, Baréin, Birmania, Bélgica, Chequia, Emiratos Árabes Unidos, Eslovaquia, Irak, Italia, Lituania, Marruecos, Panamá, Países Bajos, Perú, Portugal, Rep. Dominicana, Rumanía, Serbia, Suecia, Tailandia, Turquía, Uganda, Uzbekistán, Venezuela, Zimbabue.

**57 países** sobre 355 peleadores. Dos lecturas para el diseño de sets:

- **Estados Unidos (133) y Brasil (71) suman el 58% del roster.** Un set "Estados Unidos" completo es
  inviable como colección; esos dos países piden sets por subconjunto (por división, por rareza) o
  no piden set en absoluto.
- **Hay 28 países con un solo peleador.** Ahí el set de nacionalidad no existe: o se agrupan por
  región —Latinoamérica, Balcanes, Cáucaso, África— o esas cartas quedan fuera del eje de
  nacionalidad y tiran de gimnasio o promotora. Es una decisión pendiente, y no es menor: son
  peleadores de plata y sin set no tienen destino más allá del reciclaje.

### Pendientes de verificar

17 peleadores con el país puesto por deducción y confianza baja. Están escritos en la tabla
para no dejar huecos, pero **hay que cruzarlos contra el listado oficial antes de construir ningún set
de nacionalidad**.

| Peleador | País puesto |
|---|---|
| Antonio Trocoli | Brasil |
| Brando Pericic | Croacia |
| Fatima Kline | Estados Unidos |
| John Yannis | Estados Unidos |
| Jose Delgado | Estados Unidos |
| Jose Medina | Estados Unidos |
| Julius Walker | Estados Unidos |
| Kaue Fernandes | Brasil |
| Louie Sutherland | Escocia |
| Melissa Croden | Canadá |
| Melissa Mullins | Estados Unidos |
| Michelle Montague | Nueva Zelanda |
| Mitch Ramirez | Estados Unidos |
| Steven Asplund | Estados Unidos |
| Thomas Petersen | Estados Unidos |
| Tuco Tokkos | Estados Unidos |
| Uran Satybaldiev | Kirguistán |

### Casos discutibles

No son errores: son decisiones de criterio que pueden revocarse.

| Peleador | Puesto | Alternativa |
|---|---|---|
| Ilia Topuria | España | Georgia — nacido en Alemania, criado en Georgia, sale con las dos banderas |
| Israel Adesanya | Nigeria | Nueva Zelanda — nacido en Nigeria, formado y afincado en Auckland |
| Khamzat Chimaev | Emiratos Árabes Unidos | Rusia o Suecia — compitió con bandera sueca antes del cambio |
| Leon Edwards | Inglaterra | Jamaica — nacido en Kingston, criado en Birmingham |
| Diego Lopes | Brasil | México — brasileño de nacimiento, promocionado y afincado como mexicano |
| Beneil Dariush | Estados Unidos | Irán — nacido en Urmía, emigrado a los 8 años |
| Abus Magomedov | Alemania | Rusia — daguestaní criado en Alemania |
| Jack Hermansson | Suecia | Noruega — sueco de nacimiento, entrena y se anuncia desde Oslo |
| Rafael Fiziev | Azerbaiyán | Kirguistán — nacido en Bishkek |
| Joshua Van | Birmania | Estados Unidos — nacido en Birmania, criado en Houston |

El patrón es siempre el mismo —emigrante de primera generación— y el criterio elegido prioriza la
bandera del evento. Si prefieres el país de nacimiento, cambian estas diez y ninguna más.

---

## Ranking

Posición exacta en el top 15 de la división. **C** es campeón, **—** es sin rankear.
Snapshot del **17-18 de agosto de 2026**, tomado de la clasificación oficial por división.

**El ranking se congela en la fecha de la carta**, igual que las stats. La carta dice qué era ese
peleador cuando se imprimió, no lo que es hoy. Sin esta regla habría que reimprimir cartas cada
semana, y las plantillas ya montadas cambiarían solas.

Esto importa más que antes: desde junio de 2026 la UFC usa un modelo matemático que **recalcula el
ranking automáticamente después de cada evento**, en vez de la votación de periodistas. Se mueve más
y más rápido. La foto de agosto envejece antes de lo que habría envejecido hace un año.

**Un peleador solo lleva ranking en la división donde está rankeado.** Nadie está en dos top 15 a la
vez, así que la carta secundaria de un doble-división va siempre a **—**. Alex Pereira es #3 de
semipesado, y sus cartas de pesado y de medio salen sin ranking. No es un hueco: es que ahí no está
clasificado.

### Reparto

| | Cartas |
|---|---|
| Con ranking (C + 1-15) | 177 |
| Sin rankear | 225 |
| **Total** | **402** |

Once cinturones, doce cartas de campeón —Makhachev tiene la suya en dos divisiones— y 165 clasificados,
que son los quince puestos de las once divisiones sin un hueco. Las 225 restantes son el fondo de la colección: platas, cartas
secundarias de doble-división y oros que llegaron por racha, peleas de título o recorrido en la
compañía, que son las otras tres vías a oro.

### Lo que el cruce ha destapado

Cruzar la base contra el ranking real sacó cuatro cosas, en orden de importancia. Las cuatro están cerradas.

**1. Makhachev es campeón de welter** — cerrado el 19 de agosto. El cinturón está en welter y el
ligero lo tiene Gaethje, pero Makhachev es **doble campeón**, así que lleva carta de campeón en las
dos divisiones. Ligero tiene por tanto dos cartas con C: la de Gaethje, campeón actual, y la de
Makhachev, que ganó el cinturón y lo defendió cuatro veces. Los puestos 1-15 siguen siendo únicos.

**2. Dos rankeados estaban puestos como plata** — corregido el 19 de agosto. Estar rankeado es una
de las cuatro vías a oro, así que los dos pasan a oro:

| División | Rk | Peleador | Antes | Ahora |
|---|---|---|---|---|
| Mosca (M) | #6 | Lone'er Kavanagh | Plata | **Oro** |
| Paja (F) | #15 | Mizuki Inoue | Plata | **Oro** |

Kavanagh era el caso serio: un #6 de la división en una carta que, por diseño, no llevaba atributo y
no se alineaba nunca. Los dos siguen sin atributo —solo 110 de los oros llevan— pero ya se alinean,
ordenan por su puesto y cuestan lo que cuesta un rankeado al reciclar.

**3. Dos peleadores estaban rankeados en una división en la que no tenían carta** — corregido el
19 de agosto. Ya tienen ficha en las dos, con stats propias y no una copia penalizada, siguiendo el
mismo criterio que el resto de dobles divisiones del archivo:

| Peleador | Nueva carta | Rk | Cómo se han sacado las stats |
|---|---|---|---|
| Robert Whittaker | Semipesado (M) | #12 | Sube de peso, así que baja como bajan Adesanya y Cannonier al subir de medio: −3 golpeo, −2 suelo, cardio y dureza, −3 IQ, −1 lucha |
| Michael Page | Welter (M) | #14 | Welter es su peso de siempre, así que mejora como mejoran Holland, Buckley y Usman al volver al suyo. El cardio topa en 88, que es el techo de la banda de oro |

Los dos mantienen su atributo en las dos cartas, igual que Pereira, Adesanya o Holland. Y como
cualquier doble división: se pueden coleccionar las dos, pero **solo alinear una**.

**4. Los cuatro rankeados que faltaban ya están** — cerrado el 19 de agosto:

| División | Rk | Peleador | País | Récord | Suma |
|---|---|---|---|---|---|
| Gallo (M) | #8 | David Martinez | México | 14-1-0 | 497 |
| Mosca (M) | #10 | Ramazan Temirov | Uzbekistán | 20-3-0 | 487 |
| Paja (F) | #4 | Yan Xiaonan | China | 19-5-0 (1 NC) | 497 |
| Paja (F) | #12 | Amanda Ribas | Brasil | 13-7-0 | 493 |

Los cuatro entran como oro por la vía del ranking. Las sumas caen donde caen las de su puesto: la
media de un #8 es 497, la de un #10 es 486, la de un #4 es 493 y la de un #12 es 490.

Los números salen del mismo sitio que los demás, del historial en UFCStats:

- **David Martinez** — oro del World Games en K1 y cinturón negro de kárate y kickboxing: 10 KO en 14
  victorias y 4,62 golpes significativos por minuto sostienen GOLPEO 86. No se le conoce juego de
  derribo, así que LUCHA 76. Con 14-1 y sin haber sido finalizado nunca, DUREZA 87, y el 69% de
  defensa de golpeo deja IQ 85. Tres peleas en UFC son muestra corta, así que el resto tira a la media
- **Ramazan Temirov** — kárate, 11 KO y más del 60% de finalizaciones: GOLPEO 85. El 100% de defensa
  de derribo sube LUCHA a 81 pese a apenas derribar él. Y justo porque finaliza tanto, sus peleas no
  llegan a las tarjetas: CARDIO 80, que es lo que mide esa stat
- **Yan Xiaonan** — 25 peleas, pelea de título y #13 del libra por libra. Volumen de kickboxing (4,69
  por minuto) pero solo 0,15 derribos por golpe, así que GOLPEO 85 y no más. Absorbe 3,23 por minuto,
  de las cifras más bajas de la división: DUREZA 86. Su agujero real es el 65% de defensa de derribo,
  y por ahí baja LUCHA a 78. **Veterano** por trayectoria
- **Amanda Ribas** — cinturón negro de judo y de BJJ: 2,07 derribos por 15 minutos y 85% de defensa
  de derribo dan LUCHA 84, y 0,65 intentos de sumisión por 15 minutos con cuatro sumisiones ganadas,
  SUELO 84. Lo que le pesa son las siete derrotas y haber sido finalizada tres veces: DUREZA 79, su
  número más bajo. **Veterano** por trayectoria

Con esto **las 11 divisiones tienen sus 15 puestos y su campeón completos**, sin un solo hueco.

---

## Peso pesado (M)

### Oro

| Peleador | País | Rk | GOL | LUC | SUE | CAR | DUR | IQ | Atributo | Récord |
|---|---|---|---|---|---|---|---|---|---|---|
| **Tom Aspinall** | Inglaterra | C | 87 | 88 | 85 | 78 | 85 | 87 | — | 15-3-0 (1 NC) |
| **Ciryl Gane** | Francia | 1 | 87 | 76 | 81 | 85 | 88 | 86 | Especialista IQ | 14-2-0 (1 NC) |
| **Valter Walker** | Brasil | 11 | 81 | 86 | 86 | 75 | 84 | 84 | — | 16-1-0 |
| **Martin Buday** | Eslovaquia | — | 81 | 80 | 77 | 85 | 85 | 85 | — | 16-2-0 |
| **Waldo Cortes-Acosta** | Rep. Dominicana | 5 | 88 | 78 | 77 | 83 | 88 | 85 | — | 17-3-0 |
| **Rizvan Kuniev** | Rusia | 8 | 82 | 85 | 75 | 82 | 87 | 85 | — | 14-3-1 (1 NC) |
| **Josh Hokit** | Estados Unidos | 4 | 87 | 81 | 77 | 78 | 87 | 85 | — | 10-0-0 |
| **Mario Pinto** | Portugal | — | 82 | 85 | 78 | 78 | 85 | 85 | — | 12-0-0 |
| **Alexander Volkov** | Rusia | 2 | 87 | 78 | 75 | 85 | 87 | 85 | Veterano | 40-11-0 |
| **Vitor Petrino** ◆ | Brasil | — | 81 | 81 | 82 | 81 | 84 | 84 | — | 14-2-0 |
| **Tyrell Fortune** | Estados Unidos | 12 | 82 | 83 | 76 | 85 | 80 | 86 | — | 18-4-0 (2 NC) |
| **Brando Pericic** | Croacia ? | 15 | 85 | 77 | 77 | 79 | 86 | 84 | — | 7-1-0 |
| **Serghei Spivac** | Moldavia | 6 | 82 | 84 | 83 | 77 | 78 | 80 | — | 18-6-0 |
| **Curtis Blaydes** | Estados Unidos | 7 | 87 | 86 | 78 | 78 | 74 | 80 | Especialista LUCHA | 19-6-0 (1 NC) |
| **Sergei Pavlovich** | Rusia | 3 | 87 | 77 | 79 | 74 | 83 | 86 | Especialista GOLPEO | 21-3-0 |
| **Marcin Tybura** | Polonia | 14 | 81 | 77 | 78 | 85 | 78 | 84 | Veterano | 27-12-0 |
| **Aleksandar Rakic** ◆ | Austria | 10 | 80 | 79 | 75 | 83 | 74 | 82 | — | 15-6-0 |
| **Derrick Lewis** | Estados Unidos | 13 | 86 | 78 | 78 | 75 | 74 | 79 | Veterano | 29-14-0 (1 NC) |
| **Ante Delija** | Croacia | 9 | 80 | 77 | 76 | 78 | 80 | 78 | Veterano | 26-8-0 |
| **Alex Pereira** ◆ | Brasil | — | 88 | 79 | 74 | 76 | 74 | 76 | Camaleón | 13-4-0 |
| **Johnny Walker** ◆ | Brasil | — | 83 | 76 | 80 | 74 | 74 | 78 | Veterano | 22-10-0 (1 NC) |

### Plata

| Peleador | País | Rk | GOL | LUC | SUE | CAR | DUR | IQ | Atributo | Récord |
|---|---|---|---|---|---|---|---|---|---|---|
| **Karl Williams** | Estados Unidos | — | 81 | 82 | 76 | 82 | 82 | 82 | — | 10-2-0 |
| **Steven Asplund** | Estados Unidos ? | — | 82 | 79 | 77 | 81 | 82 | 82 | — | 8-2-0 |
| **Jailton Almeida** | Brasil | — | 81 | 82 | 82 | 76 | 80 | 81 | — | 22-5-0 |
| **Thomas Petersen** | Estados Unidos ? | — | 81 | 82 | 78 | 82 | 77 | 82 | — | 11-5-0 |
| **Mick Parkin** | Inglaterra | — | 82 | 74 | 79 | 82 | 82 | 78 | — | 10-1-0 |
| **Louie Sutherland** | Escocia ? | — | 81 | 80 | 79 | 81 | 74 | 79 | — | 11-6-0 |
| **Shamil Gaziev** | Baréin | — | 81 | 80 | 79 | 77 | 73 | 82 | — | 14-3-0 |
| **Don'Tale Mayes** | Estados Unidos | — | 81 | 71 | 78 | 82 | 82 | 78 | — | 11-9-0 (1 NC) |
| **Jhonata Diniz** | Brasil | — | 82 | 74 | 74 | 82 | 78 | 82 | — | 9-2-0 |
| **Chris Barnett** | Estados Unidos | — | 81 | 71 | 78 | 77 | 82 | 79 | — | 23-10-0 |
| **Justin Tafa** | Nueva Zelanda | — | 81 | 72 | 75 | 74 | 82 | 79 | — | 7-5-0 (1 NC) |
| **Lukasz Brzeski** | Polonia | — | 81 | 71 | 78 | 80 | 73 | 79 | — | 9-7-1 (1 NC) |
| **Kennedy Nzechukwu** ◆ | Nigeria | — | 82 | 78 | 74 | 72 | 80 | 80 | — | 14-6-1 |
| **Ryan Spann** ◆ | Estados Unidos | — | 81 | 73 | 82 | 74 | 74 | 76 | — | 24-11-0 |

---

## Peso semipesado (M)

### Oro

| Peleador | País | Rk | GOL | LUC | SUE | CAR | DUR | IQ | Atributo | Récord |
|---|---|---|---|---|---|---|---|---|---|---|
| **Magomed Ankalaev** | Rusia | 1 | 85 | 81 | 79 | 85 | 85 | 87 | — | 22-2-1 (1 NC) |
| **Carlos Ulberg** | Nueva Zelanda | C | 88 | 82 | 77 | 76 | 88 | 87 | — | 15-1-0 |
| **Jan Blachowicz** | Polonia | 9 | 83 | 77 | 78 | 84 | 85 | 85 | Veterano | 29-12-2 |
| **Robert Whittaker** ◆ | Australia | 12 | 86 | 79 | 78 | 85 | 83 | 84 | Especialista IQ | 28-9-0 |
| **Navajo Stirling** | Nueva Zelanda | 5 | 85 | 77 | 74 | 82 | 88 | 85 | — | 11-0-0 |
| **Azamat Murzakanov** | Rusia | 8 | 84 | 80 | 75 | 77 | 85 | 87 | — | 16-1-0 |
| **Israel Adesanya** ◆ | Nigeria | — | 87 | 82 | 79 | 85 | 82 | 85 | Veterano | 24-6-0 |
| **Paulo Costa** ◆ | Brasil | 6 | 87 | 80 | 79 | 87 | 80 | 82 | Especialista DUREZA | 16-4-0 |
| **Alex Pereira** ◆ | Brasil | 3 | 88 | 79 | 74 | 78 | 83 | 84 | Camaleón | 13-4-0 |
| **Jared Cannonier** ◆ | Estados Unidos | — | 84 | 81 | 78 | 84 | 84 | 81 | Veterano | 18-10-0 |
| **Jamahal Hill** | Estados Unidos | 7 | 87 | 77 | 78 | 81 | 77 | 82 | — | 12-4-0 (1 NC) |
| **Jiri Prochazka** | Chequia | 2 | 88 | 77 | 78 | 77 | 86 | 74 | Especialista DUREZA | 32-6-1 |
| **Nikita Krylov** | Ucrania | 15 | 83 | 80 | 85 | 79 | 75 | 81 | Veterano | 31-12-0 |
| **Bogdan Guskov** | Uzbekistán | 11 | 82 | 76 | 80 | 77 | 84 | 81 | — | 18-4-1 |
| **Ovince Saint Preux** | Estados Unidos | — | 82 | 74 | 80 | 77 | 83 | 81 | Veterano | 27-18-0 |
| **Aleksandar Rakic** ◆ | Austria | — | 80 | 79 | 75 | 85 | 74 | 84 | — | 15-6-0 |
| **Dominick Reyes** | Estados Unidos | 10 | 87 | 77 | 76 | 76 | 74 | 84 | — | 16-5-0 |
| **Khalil Rountree Jr.** | Estados Unidos | 4 | 82 | 76 | 79 | 77 | 80 | 81 | Especialista GOLPEO | 15-7-0 (1 NC) |
| **Alonzo Menifield** | Estados Unidos | 14 | 81 | 79 | 77 | 75 | 79 | 86 | — | 18-6-1 |
| **Vitor Petrino** ◆ | Brasil | — | 81 | 81 | 82 | 76 | 80 | 79 | — | 14-2-0 |
| **Johnny Walker** ◆ | Brasil | 13 | 83 | 76 | 80 | 75 | 74 | 80 | Veterano | 22-10-0 (1 NC) |

### Plata

| Peleador | País | Rk | GOL | LUC | SUE | CAR | DUR | IQ | Atributo | Récord |
|---|---|---|---|---|---|---|---|---|---|---|
| **Uran Satybaldiev** | Kirguistán ? | — | 81 | 74 | 81 | 80 | 82 | 82 | — | 9-1-0 |
| **Rodolfo Bellato** | Brasil | — | 81 | 82 | 76 | 77 | 82 | 82 | — | 13-3-1 (1 NC) |
| **Volkan Oezdemir** | Suiza | — | 82 | 76 | 74 | 78 | 82 | 82 | — | 21-8-0 |
| **Dustin Jacoby** | Estados Unidos | — | 82 | 72 | 78 | 78 | 82 | 82 | — | 22-10-1 |
| **Ibo Aslan** | Turquía | — | 80 | 77 | 78 | 75 | 82 | 82 | — | 14-4-0 |
| **Tuco Tokkos** | Estados Unidos ? | — | 81 | 74 | 80 | 78 | 82 | 79 | — | 11-6-0 |
| **Kennedy Nzechukwu** ◆ | Nigeria | — | 82 | 78 | 74 | 76 | 82 | 82 | — | 14-6-1 |
| **Modestas Bukauskas** | Lituania | — | 81 | 78 | 76 | 82 | 73 | 82 | — | 20-7-0 |
| **Julius Walker** | Estados Unidos ? | — | 81 | 80 | 76 | 82 | 74 | 80 | — | 7-3-0 |
| **Ryan Spann** ◆ | Estados Unidos | — | 81 | 73 | 82 | 79 | 77 | 80 | — | 24-11-0 |
| **Ion Cutelaba** | Moldavia | — | 81 | 82 | 75 | 76 | 77 | 80 | — | 20-12-1 (1 NC) |
| **Marcin Prachnio** | Polonia | — | 82 | 71 | 78 | 82 | 75 | 80 | — | 17-9-0 |
| **Antonio Trocoli** | Brasil ? | — | 80 | 72 | 75 | 77 | 82 | 79 | — | 12-7-0 (1 NC) |
| **Zhang Mingyang** | China | — | 82 | 74 | 74 | 75 | 76 | 81 | — | 19-8-0 |
| **Jose Medina** | Estados Unidos ? | — | 80 | 71 | 76 | 77 | 76 | 79 | — | 11-7-0 |

---

## Peso medio (M)

### Oro

| Peleador | País | Rk | GOL | LUC | SUE | CAR | DUR | IQ | Atributo | Récord |
|---|---|---|---|---|---|---|---|---|---|---|
| **Nassourdine Imavov** ◆ | Francia | 3 | 88 | 79 | 80 | 87 | 88 | 86 | — | 17-4-0 (1 NC) |
| **Anthony Hernandez** | Estados Unidos | 6 | 82 | 87 | 86 | 80 | 85 | 86 | Especialista CARDIO | 15-3-0 (1 NC) |
| **Caio Borralho** | Brasil | 5 | 81 | 83 | 78 | 87 | 88 | 87 | — | 18-2-0 (1 NC) |
| **Robert Whittaker** ◆ | Australia | — | 86 | 79 | 78 | 86 | 85 | 86 | Especialista IQ | 28-9-0 |
| **Sean Strickland** ◆ | Estados Unidos | C | 88 | 81 | 75 | 86 | 89 | 87 | Especialista DUREZA | 31-7-0 |
| **Israel Adesanya** ◆ | Nigeria | 8 | 87 | 82 | 79 | 87 | 84 | 87 | Veterano | 24-6-0 |
| **Bo Nickal** | Estados Unidos | 14 | 81 | 84 | 84 | 76 | 84 | 86 | Especialista LUCHA | 9-1-0 |
| **Ikram Aliskerov** | Rusia | 13 | 82 | 86 | 81 | 77 | 83 | 85 | — | 18-2-0 |
| **Paulo Costa** ◆ | Brasil | — | 87 | 80 | 79 | 84 | 86 | 85 | Especialista DUREZA | 16-4-0 |
| **Khamzat Chimaev** ◆ | Emiratos Árabes Unidos | 1 | 80 | 88 | 86 | 74 | 86 | 88 | Camaleón | 15-1-0 |
| **Jared Cannonier** ◆ | Estados Unidos | 12 | 84 | 81 | 78 | 86 | 86 | 85 | Veterano | 18-10-0 |
| **Dricus du Plessis** ◆ | Sudáfrica | 2 | 85 | 77 | 82 | 86 | 86 | 77 | Camaleón | 24-3-0 |
| **Kamaru Usman** ◆ | Nigeria | — | 83 | 85 | 74 | 85 | 84 | 87 | — | 21-5-0 |
| **Michael Page** ◆ | Inglaterra | — | 85 | 75 | 75 | 86 | 86 | 85 | Incómodo | 25-3-0 |
| **Reinier de Ridder** | Países Bajos | 9 | 82 | 86 | 84 | 84 | 85 | 80 | Especialista SUELO | 21-4-0 |
| **Brendan Allen** | Estados Unidos | 4 | 82 | 82 | 85 | 82 | 86 | 79 | Veterano | 27-7-0 |
| **Gregory Rodrigues** | Brasil | 11 | 83 | 83 | 75 | 77 | 83 | 85 | — | 19-6-0 |
| **Christian Leroy Duncan** | Inglaterra | 10 | 83 | 77 | 77 | 81 | 87 | 82 | — | 15-2-0 |
| **Roman Dolidze** | Georgia | 15 | 81 | 82 | 77 | 85 | 86 | 79 | — | 15-5-0 |
| **Punahele Soriano** | Estados Unidos | — | 81 | 76 | 79 | 82 | 85 | 80 | — | 13-4-0 |
| **Joe Pyfer** | Estados Unidos | 7 | 82 | 80 | 84 | 76 | 85 | 80 | — | 16-3-0 |
| **Kevin Holland** ◆ | Estados Unidos | — | 85 | 78 | 84 | 75 | 85 | 78 | Incómodo | 29-15-0 (1 NC) |
| **Joaquin Buckley** ◆ | Estados Unidos | — | 80 | 81 | 79 | 78 | 82 | 84 | Veterano | 21-8-0 |
| **Bryan Battle** ◆ | Estados Unidos | — | 82 | 75 | 82 | 74 | 85 | 80 | — | 13-2-0 (1 NC) |
| **Alex Pereira** ◆ | Brasil | — | 88 | 79 | 74 | 74 | 79 | 83 | Camaleón | 13-4-0 |

### Plata

| Peleador | País | Rk | GOL | LUC | SUE | CAR | DUR | IQ | Atributo | Récord |
|---|---|---|---|---|---|---|---|---|---|---|
| **Michel Pereira** ◆ | Brasil | — | 82 | 82 | 82 | 82 | 82 | 82 | — | 32-15-0 (2 NC) |
| **Abus Magomedov** | Alemania | — | 82 | 82 | 82 | 80 | 82 | 82 | — | 29-7-1 |
| **Marvin Vettori** | Italia | — | 82 | 79 | 80 | 82 | 82 | 82 | — | 19-10-1 |
| **Torrez Finney** | Estados Unidos | — | 81 | 82 | 82 | 82 | 82 | 76 | — | 11-1-0 |
| **Jack Hermansson** | Suecia | — | 82 | 82 | 80 | 82 | 75 | 82 | — | 24-10-0 |
| **Rodolfo Vieira** | Brasil | — | 81 | 76 | 82 | 78 | 82 | 81 | — | 11-5-0 |
| **Andre Muniz** | Brasil | — | 81 | 82 | 82 | 79 | 73 | 79 | — | 24-8-0 |
| **Zachary Reese** | Estados Unidos | — | 81 | 82 | 82 | 77 | 74 | 80 | — | 10-4-0 (1 NC) |
| **Robert Bryczek** | Polonia | — | 81 | 77 | 77 | 82 | 82 | 77 | — | 18-7-0 |
| **Michal Oleksiejczuk** | Polonia | — | 82 | 72 | 77 | 80 | 82 | 81 | — | 22-10-0 (1 NC) |
| **Dustin Stoltzfus** | Estados Unidos | — | 81 | 73 | 82 | 77 | 82 | 79 | — | 17-8-0 |
| **Brunno Ferreira** | Brasil | — | 82 | 72 | 81 | 75 | 82 | 81 | — | 15-4-0 |
| **Cody Brundage** | Estados Unidos | — | 81 | 80 | 77 | 75 | 77 | 81 | — | 12-9-1 (1 NC) |
| **Edmen Shahbazyan** | Estados Unidos | — | 80 | 76 | 77 | 75 | 82 | 79 | — | 16-6-0 |
| **Kyle Daukaus** | Estados Unidos | — | 81 | 82 | 82 | 77 | 72 | 75 | — | 17-5-0 (1 NC) |
| **Sedriques Dumas** | Estados Unidos | — | 80 | 71 | 74 | 81 | 78 | 79 | — | 10-5-0 (1 NC) |

---

## Peso welter (M)

### Oro

| Peleador | País | Rk | GOL | LUC | SUE | CAR | DUR | IQ | Atributo | Récord |
|---|---|---|---|---|---|---|---|---|---|---|
| **Khamzat Chimaev** ◆ | Emiratos Árabes Unidos | — | 80 | 88 | 86 | 79 | 88 | 87 | Camaleón | 15-1-0 |
| **Sean Brady** | Estados Unidos | 6 | 80 | 84 | 85 | 86 | 85 | 87 | — | 19-2-0 |
| **Kamaru Usman** ◆ | Nigeria | 9 | 83 | 85 | 74 | 87 | 87 | 87 | — | 21-5-0 |
| **Gabriel Bonfim** | Brasil | 5 | 81 | 81 | 86 | 80 | 87 | 88 | — | 20-1-0 |
| **Belal Muhammad** | Estados Unidos | 7 | 81 | 82 | 74 | 87 | 87 | 87 | Especialista CARDIO | 24-6-0 (1 NC) |
| **Rinat Fakhretdinov** | Rusia | — | 82 | 81 | 79 | 84 | 85 | 85 | — | 24-1-1 |
| **Shavkat Rakhmonov** | Kazajistán | — | 82 | 81 | 85 | 79 | 85 | 85 | — | 19-0-0 |
| **Michael Morales** | Ecuador | 3 | 84 | 84 | 75 | 79 | 88 | 87 | — | 19-0-0 |
| **Michael Page** ◆ | Inglaterra | 14 | 85 | 75 | 75 | 86 | 86 | 86 | Incómodo | 25-3-0 |
| **Islam Makhachev** ◆ | Rusia | C | 83 | 88 | 86 | 80 | 80 | 87 | Camaleón+ | 29-1-0 |
| **Yaroslav Amosov** | Ucrania | 11 | 82 | 83 | 86 | 78 | 84 | 81 | Veterano | 30-1-0 |
| **Ian Machado Garry** | Irlanda | 1 | 83 | 78 | 75 | 88 | 88 | 84 | — | 17-2-0 |
| **Joaquin Buckley** ◆ | Estados Unidos | 10 | 80 | 81 | 79 | 82 | 85 | 85 | Veterano | 21-8-0 |
| **Kevin Holland** ◆ | Estados Unidos | — | 85 | 78 | 84 | 81 | 85 | 81 | Incómodo | 29-15-0 (1 NC) |
| **Daniel Rodriguez** | Estados Unidos | 15 | 86 | 77 | 74 | 85 | 86 | 84 | — | 20-6-0 |
| **Nassourdine Imavov** ◆ | Francia | — | 88 | 79 | 80 | 84 | 85 | 83 | — | 17-4-0 (1 NC) |
| **Jack Della Maddalena** | Australia | 4 | 83 | 78 | 76 | 84 | 88 | 84 | — | 18-4-0 |
| **Leon Edwards** | Inglaterra | 8 | 82 | 82 | 76 | 87 | 85 | 85 | Veterano | 22-6-0 (1 NC) |
| **Mike Malott** | Canadá | 13 | 82 | 77 | 84 | 77 | 85 | 82 | — | 14-2-1 |
| **Randy Brown** | Jamaica | — | 81 | 75 | 80 | 83 | 83 | 85 | Veterano | 20-8-0 |
| **Neil Magny** | Estados Unidos | — | 83 | 76 | 74 | 85 | 85 | 81 | Veterano | 32-15-0 |
| **Bryan Battle** ◆ | Estados Unidos | — | 82 | 75 | 82 | 78 | 85 | 81 | — | 13-2-0 (1 NC) |
| **Sean Strickland** ◆ | Estados Unidos | — | 88 | 81 | 75 | 83 | 84 | 83 | Especialista DUREZA | 31-7-0 |
| **Uros Medic** ◆ | Serbia | 12 | 86 | 77 | 78 | 78 | 84 | 81 | — | 14-3-0 |
| **Dricus du Plessis** ◆ | Sudáfrica | — | 85 | 77 | 82 | 83 | 85 | 74 | Camaleón | 24-3-0 |
| **Carlos Prates** | Brasil | 2 | 84 | 77 | 75 | 76 | 88 | 79 | Especialista GOLPEO | 24-7-0 |

### Plata

| Peleador | País | Rk | GOL | LUC | SUE | CAR | DUR | IQ | Atributo | Récord |
|---|---|---|---|---|---|---|---|---|---|---|
| **Preston Parsons** | Estados Unidos | — | 81 | 82 | 82 | 82 | 77 | 82 | — | 11-6-0 |
| **Jeremiah Wells** | Estados Unidos | — | 81 | 80 | 82 | 80 | 82 | 80 | — | 14-4-1 |
| **Themba Gorimbo** | Zimbabue | — | 81 | 82 | 75 | 82 | 82 | 82 | — | 14-7-0 |
| **Court McGee** | Estados Unidos | — | 81 | 76 | 81 | 82 | 82 | 82 | — | 23-14-0 |
| **Danny Barlow** | Estados Unidos | — | 81 | 81 | 75 | 80 | 82 | 82 | — | 9-2-0 |
| **Geoff Neal** | Estados Unidos | — | 82 | 82 | 74 | 77 | 82 | 82 | — | 16-8-0 |
| **Carlos Leal** | Brasil | — | 80 | 78 | 75 | 81 | 82 | 82 | — | 23-7-0 |
| **Trevin Giles** | Estados Unidos | — | 80 | 80 | 79 | 82 | 75 | 82 | — | 16-7-0 |
| **Charles Radtke** | Estados Unidos | — | 82 | 80 | 80 | 79 | 75 | 82 | — | 12-5-0 |
| **Michel Pereira** ◆ | Brasil | — | 82 | 82 | 82 | 82 | 79 | 77 | — | 32-15-0 (2 NC) |
| **Alex Morono** | Estados Unidos | — | 81 | 70 | 78 | 82 | 82 | 81 | — | 24-13-0 (1 NC) |
| **Matthew Semelsberger** | Estados Unidos | — | 81 | 73 | 76 | 82 | 82 | 79 | — | 11-8-0 |
| **Joel Alvarez** ◆ | España | — | 82 | 71 | 82 | 76 | 82 | 80 | — | 23-5-0 |
| **Sam Patterson** | Inglaterra | — | 82 | 73 | 82 | 74 | 82 | 76 | — | 15-3-1 |

---

## Peso ligero (M)

### Oro

| Peleador | País | Rk | GOL | LUC | SUE | CAR | DUR | IQ | Atributo | Récord |
|---|---|---|---|---|---|---|---|---|---|---|
| **Islam Makhachev** ◆ | Rusia | C | 83 | 88 | 86 | 84 | 83 | 89 | Camaleón+ | 29-1-0 |
| **Rafa Garcia** | México | — | 81 | 85 | 78 | 85 | 85 | 85 | — | 19-4-0 |
| **Bobby Green** | Estados Unidos | — | 85 | 81 | 79 | 83 | 84 | 85 | Veterano | 36-17-1 (1 NC) |
| **Mateusz Gamrot** | Polonia | 9 | 80 | 84 | 78 | 84 | 87 | 87 | Especialista LUCHA | 26-5-0 (1 NC) |
| **Arman Tsarukyan** | Armenia | 2 | 83 | 81 | 76 | 85 | 87 | 85 | — | 23-3-0 |
| **Benoit Saint Denis** | Francia | 6 | 87 | 85 | 86 | 80 | 83 | 75 | — | 17-4-0 (1 NC) |
| **Quillan Salkilld** | Australia | 8 | 82 | 84 | 84 | 76 | 86 | 85 | — | 13-1-0 |
| **Rafael Fiziev** | Azerbaiyán | 12 | 83 | 82 | 79 | 84 | 84 | 85 | — | 14-5-0 |
| **Justin Gaethje** | Estados Unidos | C | 87 | 84 | 78 | 84 | 88 | 85 | Especialista DUREZA | 28-5-0 |
| **Ilia Topuria** ◆ | España | 1 | 88 | 86 | 82 | 76 | 85 | 85 | Camaleón | 17-1-0 |
| **Charles Oliveira** ◆ | Brasil | 3 | 82 | 82 | 88 | 80 | 80 | 82 | Especialista SUELO | 37-11-0 (1 NC) |
| **Renato Moicano** ◆ | Brasil | 11 | 80 | 81 | 85 | 77 | 84 | 86 | Veterano | 21-7-1 |
| **Grant Dawson** | Estados Unidos | — | 81 | 80 | 85 | 81 | 78 | 85 | — | 24-3-1 |
| **Mauricio Ruffy** | Brasil | 7 | 82 | 77 | 79 | 77 | 87 | 86 | — | 14-2-0 |
| **Max Holloway** ◆ | Estados Unidos | 4 | 86 | 82 | 76 | 85 | 82 | 87 | Camaleón | 28-9-0 |
| **Paddy Pimblett** | Inglaterra | 5 | 81 | 80 | 86 | 78 | 88 | 80 | Veterano | 24-4-0 |
| **Dan Hooker** ◆ | Nueva Zelanda | 10 | 82 | 77 | 79 | 78 | 86 | 86 | Veterano | 24-14-0 |
| **Manuel Torres** | México | 15 | 84 | 85 | 81 | 79 | 75 | 83 | — | 17-4-0 |
| **Beneil Dariush** | Estados Unidos | 14 | 81 | 81 | 84 | 77 | 74 | 86 | Veterano | 23-8-1 |
| **Patricio Pitbull** ◆ | Brasil | — | 82 | 78 | 77 | 84 | 86 | 78 | Veterano | 37-9-0 |
| **Tom Nolan** | Australia | 13 | 82 | 77 | 84 | 79 | 84 | 74 | — | 11-1-0 |
| **Drew Dober** | Estados Unidos | — | 84 | 74 | 78 | 74 | 85 | 74 | Veterano | 29-15-0 (1 NC) |
| **Uros Medic** ◆ | Serbia | — | 86 | 77 | 78 | 74 | 81 | 79 | — | 14-3-0 |
| **Conor McGregor** ◆ | Irlanda | — | 83 | 74 | 78 | 74 | 82 | 80 | Camaleón | 22-7-0 |

### Plata

| Peleador | País | Rk | GOL | LUC | SUE | CAR | DUR | IQ | Atributo | Récord |
|---|---|---|---|---|---|---|---|---|---|---|
| **Mateusz Rebecki** | Polonia | — | 81 | 82 | 80 | 81 | 82 | 82 | — | 21-5-0 |
| **Chris Duncan** | Escocia | — | 82 | 82 | 82 | 77 | 82 | 82 | — | 15-3-0 |
| **Trey Ogden** | Estados Unidos | — | 81 | 82 | 78 | 82 | 82 | 82 | — | 18-7-0 (1 NC) |
| **Fares Ziam** | Francia | — | 82 | 82 | 75 | 82 | 82 | 82 | — | 18-5-0 |
| **Jalin Turner** | Estados Unidos | — | 82 | 79 | 82 | 79 | 82 | 81 | — | 16-9-0 |
| **Nasrat Haqparast** | Alemania | — | 81 | 78 | 79 | 82 | 82 | 82 | — | 18-6-0 |
| **Alexander Hernandez** | Estados Unidos | — | 82 | 75 | 79 | 82 | 82 | 82 | — | 18-9-0 |
| **Jared Gordon** | Estados Unidos | — | 82 | 76 | 78 | 82 | 82 | 80 | — | 21-9-0 (1 NC) |
| **Kaue Fernandes** | Brasil ? | — | 80 | 82 | 75 | 78 | 78 | 82 | — | 11-3-0 |
| **Terrance McKinney** | Estados Unidos | — | 82 | 82 | 82 | 77 | 70 | 81 | — | 18-9-0 |
| **Kurt Holobaugh** | Estados Unidos | — | 81 | 71 | 79 | 82 | 82 | 79 | — | 22-10-0 (1 NC) |
| **Jordan Leavitt** | Estados Unidos | — | 81 | 72 | 82 | 76 | 82 | 80 | — | 13-4-0 |
| **Nazim Sadykhov** | Azerbaiyán | — | 82 | 78 | 78 | 76 | 82 | 76 | — | 11-3-1 |
| **Elves Brener** | Brasil | — | 81 | 76 | 74 | 82 | 82 | 75 | — | 16-6-0 |
| **Michael Chandler** | Estados Unidos | — | 80 | 77 | 78 | 76 | 77 | 80 | — | 23-11-0 |
| **Joel Alvarez** ◆ | España | — | 82 | 71 | 82 | 68 | 76 | 78 | — | 23-5-0 |
| **Mitch Ramirez** | Estados Unidos ? | — | 81 | 72 | 75 | 77 | 69 | 79 | — | 8-4-0 |

---

## Peso pluma (M)

### Oro

| Peleador | País | Rk | GOL | LUC | SUE | CAR | DUR | IQ | Atributo | Récord |
|---|---|---|---|---|---|---|---|---|---|---|
| **Ilia Topuria** ◆ | España | — | 88 | 86 | 82 | 79 | 88 | 87 | Camaleón | 17-1-0 |
| **Arnold Allen** | Inglaterra | 7 | 81 | 84 | 79 | 87 | 87 | 87 | — | 21-4-0 |
| **Nathaniel Wood** ◆ | Inglaterra | — | 82 | 84 | 84 | 85 | 85 | 84 | Veterano | 23-6-0 |
| **Movsar Evloev** | Rusia | 1 | 81 | 85 | 74 | 87 | 88 | 86 | — | 20-0-0 |
| **Youssef Zalal** | Marruecos | 8 | 82 | 80 | 86 | 85 | 87 | 86 | — | 18-6-1 |
| **Alexander Volkanovski** | Australia | C | 87 | 84 | 75 | 87 | 85 | 88 | Especialista IQ | 28-4-0 |
| **Max Holloway** ◆ | Estados Unidos | — | 86 | 82 | 76 | 88 | 86 | 88 | Especialista CARDIO | 28-9-0 |
| **Jean Silva** | Brasil | 6 | 81 | 84 | 80 | 78 | 87 | 85 | Incómodo | 17-3-0 |
| **Brian Ortega** | Estados Unidos | 11 | 81 | 81 | 85 | 85 | 86 | 81 | — | 16-5-0 (1 NC) |
| **Lerone Murphy** | Inglaterra | 3 | 83 | 80 | 76 | 87 | 88 | 84 | — | 17-1-1 |
| **Patricio Pitbull** ◆ | Brasil | 15 | 82 | 78 | 77 | 86 | 86 | 81 | Veterano | 37-9-0 |
| **Diego Lopes** | Brasil | 2 | 81 | 80 | 84 | 82 | 86 | 82 | Veterano | 28-8-0 |
| **Pat Sabatini** | Estados Unidos | — | 81 | 84 | 85 | 84 | 74 | 82 | — | 22-5-0 |
| **Steve Garcia** | Estados Unidos | 10 | 87 | 84 | 76 | 74 | 80 | 87 | — | 19-6-0 |
| **Charles Jourdain** ◆ | Canadá | — | 80 | 77 | 84 | 82 | 85 | 81 | — | 18-8-1 |
| **David Onama** | Uganda | 14 | 82 | 77 | 79 | 84 | 86 | 81 | — | 14-3-0 |
| **Aljamain Sterling** ◆ | Estados Unidos | 4 | 83 | 86 | 84 | 86 | 82 | 82 | Camaleón | 26-5-0 |
| **Kevin Vallejos** | Argentina | 9 | 83 | 79 | 74 | 77 | 87 | 85 | — | 18-1-0 |
| **Melquizael Costa** | Brasil | 13 | 82 | 77 | 83 | 82 | 85 | 80 | Veterano | 26-8-0 |
| **Yair Rodriguez** | México | 5 | 83 | 78 | 78 | 86 | 85 | 79 | Incómodo | 21-6-0 (1 NC) |
| **Aaron Pico** | Estados Unidos | 12 | 82 | 82 | 76 | 84 | 77 | 80 | — | 14-5-0 |
| **Conor McGregor** ◆ | Irlanda | — | 83 | 74 | 78 | 75 | 84 | 85 | Camaleón | 22-7-0 |
| **Renato Moicano** ◆ | Brasil | — | 80 | 81 | 85 | 74 | 82 | 85 | Veterano | 21-7-1 |
| **Dan Hooker** ◆ | Nueva Zelanda | — | 82 | 77 | 79 | 75 | 83 | 84 | Veterano | 24-14-0 |
| **Charles Oliveira** ◆ | Brasil | — | 82 | 82 | 88 | 76 | 77 | 78 | Especialista SUELO | 37-11-0 (1 NC) |

### Plata

| Peleador | País | Rk | GOL | LUC | SUE | CAR | DUR | IQ | Atributo | Récord |
|---|---|---|---|---|---|---|---|---|---|---|
| **Gabriel Santos** | Brasil | — | 82 | 82 | 82 | 82 | 82 | 82 | — | 12-2-0 |
| **Christian Rodriguez** | Estados Unidos | — | 82 | 80 | 82 | 82 | 82 | 82 | — | 13-4-0 |
| **Andre Fili** | Estados Unidos | — | 81 | 82 | 78 | 82 | 82 | 81 | — | 25-14-0 (1 NC) |
| **Joanderson Brito** | Brasil | — | 81 | 82 | 82 | 77 | 82 | 80 | — | 19-5-1 |
| **Austin Bashi** | Estados Unidos | — | 81 | 82 | 82 | 79 | 82 | 78 | — | 14-2-0 |
| **Losene Keita** | Bélgica | — | 82 | 78 | 77 | 82 | 82 | 82 | — | 16-2-0 |
| **Jamall Emmers** | Estados Unidos | — | 81 | 82 | 74 | 82 | 82 | 82 | — | 22-8-0 |
| **Bryce Mitchell** | Estados Unidos | — | 81 | 74 | 82 | 82 | 82 | 81 | — | 19-4-0 |
| **Sean Woodson** | Estados Unidos | — | 81 | 81 | 74 | 82 | 82 | 82 | — | 13-2-1 |
| **Damon Jackson** | Estados Unidos | — | 81 | 72 | 82 | 81 | 82 | 79 | — | 23-8-1 (1 NC) |
| **Josh Emmett** | Estados Unidos | — | 81 | 71 | 78 | 82 | 82 | 82 | — | 19-7-0 |
| **Morgan Charriere** | Francia | — | 82 | 82 | 76 | 77 | 82 | 77 | — | 21-12-1 |
| **Julian Erosa** | Estados Unidos | — | 82 | 78 | 82 | 76 | 74 | 82 | — | 31-14-0 |
| **Jose Delgado** | Estados Unidos ? | — | 81 | 76 | 74 | 80 | 82 | 77 | — | 12-2-0 |
| **Dan Ige** | Estados Unidos | — | 82 | 72 | 77 | 82 | 82 | 75 | — | 19-11-0 |

---

## Peso gallo (M)

### Oro

| Peleador | País | Rk | GOL | LUC | SUE | CAR | DUR | IQ | Atributo | Récord |
|---|---|---|---|---|---|---|---|---|---|---|
| **Umar Nurmagomedov** | Rusia | 3 | 83 | 85 | 81 | 86 | 87 | 87 | — | 20-1-0 |
| **Merab Dvalishvili** | Georgia | 1 | 80 | 88 | 76 | 88 | 88 | 86 | Especialista CARDIO | 21-5-0 |
| **Petr Yan** | Rusia | C | 89 | 80 | 79 | 86 | 86 | 86 | Especialista IQ | 20-5-0 |
| **Raoni Barcelos** | Brasil | 13 | 81 | 81 | 82 | 86 | 86 | 86 | — | 22-5-0 |
| **Mario Bautista** | Estados Unidos | 4 | 81 | 80 | 85 | 84 | 88 | 85 | — | 18-3-0 |
| **Farid Basharat** | Afganistán | 14 | 82 | 83 | 79 | 86 | 86 | 84 | — | 16-0-0 |
| **Raul Rosas Jr.** | México | 12 | 81 | 86 | 84 | 84 | 85 | 80 | — | 12-1-0 |
| **Sean O'Malley** | Estados Unidos | 2 | 87 | 77 | 79 | 83 | 88 | 86 | Especialista GOLPEO | 20-3-0 (1 NC) |
| **Marlon Vera** | Ecuador | 10 | 81 | 78 | 84 | 85 | 87 | 86 | Especialista DUREZA | 23-12-1 |
| **Payton Talbott** | Estados Unidos | 11 | 83 | 78 | 78 | 84 | 86 | 86 | — | 11-1-0 |
| **Aljamain Sterling** ◆ | Estados Unidos | — | 83 | 86 | 84 | 88 | 83 | 85 | Camaleón | 26-5-0 |
| **David Martinez** | México | 8 | 86 | 77 | 78 | 85 | 87 | 85 | — | 14-1-0 |
| **Aiemann Zahabi** | Canadá | 7 | 81 | 77 | 78 | 86 | 85 | 87 | — | 14-3-0 |
| **Marcus McGhee** | Estados Unidos | 15 | 80 | 79 | 79 | 82 | 86 | 85 | — | 11-2-0 |
| **Song Yadong** | China | 6 | 81 | 77 | 78 | 85 | 87 | 84 | Veterano | 23-9-1 (1 NC) |
| **Deiveson Figueiredo** ◆ | Brasil | 9 | 85 | 82 | 86 | 84 | 85 | 81 | Camaleón | 25-7-1 |
| **Nathaniel Wood** ◆ | Inglaterra | — | 82 | 84 | 84 | 80 | 83 | 80 | Veterano | 23-6-0 |
| **Cory Sandhagen** | Estados Unidos | 5 | 88 | 80 | 75 | 86 | 86 | 79 | Especialista IQ | 18-7-0 |
| **Henry Cejudo** ◆ | Estados Unidos | — | 82 | 79 | 79 | 83 | 85 | 84 | Camaleón | 16-6-0 |
| **Cody Garbrandt** | Estados Unidos | — | 81 | 78 | 78 | 79 | 74 | 85 | — | 15-8-0 |
| **Charles Jourdain** ◆ | Canadá | — | 80 | 77 | 84 | 78 | 85 | 80 | — | 18-8-1 |
| **Kyoji Horiguchi** ◆ | Japón | — | 80 | 77 | 75 | 83 | 82 | 83 | Veterano | 36-6-0 (1 NC) |

### Plata

| Peleador | País | Rk | GOL | LUC | SUE | CAR | DUR | IQ | Atributo | Récord |
|---|---|---|---|---|---|---|---|---|---|---|
| **Ricky Simon** | Estados Unidos | — | 81 | 82 | 81 | 82 | 82 | 82 | — | 22-7-1 |
| **Jean Matsumoto** | Brasil | — | 81 | 82 | 80 | 82 | 82 | 82 | — | 18-2-0 |
| **Kyler Phillips** | Estados Unidos | — | 82 | 81 | 78 | 82 | 82 | 82 | — | 12-5-0 |
| **Montel Jackson** | Estados Unidos | — | 81 | 82 | 77 | 82 | 82 | 82 | — | 15-4-0 |
| **Da'Mon Blackshear** | Estados Unidos | — | 82 | 78 | 82 | 78 | 82 | 82 | — | 17-8-1 |
| **Miles Johns** | Estados Unidos | — | 82 | 78 | 78 | 82 | 82 | 82 | — | 16-5-0 (1 NC) |
| **Vinicius Oliveira** | Brasil | — | 82 | 79 | 74 | 82 | 82 | 82 | — | 24-4-0 |
| **Chris Gutierrez** | Estados Unidos | — | 82 | 73 | 79 | 82 | 82 | 82 | — | 22-7-2 |
| **Alateng Heili** | China | — | 80 | 82 | 75 | 82 | 82 | 77 | — | 17-10-2 |
| **John Yannis** | Estados Unidos ? | — | 82 | 76 | 74 | 78 | 82 | 82 | — | 10-5-0 |
| **Journey Newson** | Estados Unidos | — | 81 | 72 | 75 | 82 | 82 | 81 | — | 10-5-0 (1 NC) |
| **Rob Font** | Estados Unidos | — | 82 | 70 | 75 | 82 | 82 | 81 | — | 22-10-0 |
| **Adrian Yanez** | Estados Unidos | — | 81 | 74 | 78 | 75 | 82 | 82 | — | 18-6-1 |
| **Cameron Saaiman** | Sudáfrica | — | 81 | 72 | 78 | 79 | 82 | 80 | — | 9-3-0 |
| **Malcolm Wellmaker** | Estados Unidos | — | 82 | 72 | 76 | 76 | 82 | 81 | — | 10-2-0 |
| **Toshiomi Kazama** | Japón | — | 80 | 75 | 82 | 78 | 70 | 80 | — | 11-5-0 |

---

## Peso mosca (M)

### Oro

| Peleador | País | Rk | GOL | LUC | SUE | CAR | DUR | IQ | Atributo | Récord |
|---|---|---|---|---|---|---|---|---|---|---|
| **Alexandre Pantoja** | Brasil | 1 | 80 | 82 | 86 | 84 | 88 | 84 | Veterano | 30-6-0 |
| **Brandon Moreno** | México | 8 | 84 | 77 | 81 | 87 | 87 | 84 | Veterano | 23-10-2 |
| **Asu Almabayev** | Kazajistán | 7 | 81 | 83 | 87 | 85 | 84 | 81 | — | 24-3-0 |
| **Tim Elliott** | Estados Unidos | 13 | 81 | 86 | 84 | 86 | 86 | 76 | Veterano | 22-14-1 |
| **Joshua Van** | Birmania | C | 87 | 80 | 74 | 86 | 86 | 86 | Especialista CARDIO | 17-2-0 |
| **Henry Cejudo** ◆ | Estados Unidos | — | 82 | 79 | 79 | 85 | 85 | 85 | Camaleón | 16-6-0 |
| **Tagir Ulanbekov** | Rusia | 14 | 81 | 83 | 85 | 85 | 86 | 76 | — | 17-3-0 |
| **Tatsuro Taira** | Japón | 4 | 81 | 84 | 85 | 82 | 84 | 80 | — | 18-2-0 |
| **Amir Albazi** | Irak | 9 | 81 | 80 | 83 | 85 | 87 | 85 | — | 17-3-0 |
| **Alex Perez** | Estados Unidos | 11 | 81 | 86 | 83 | 75 | 84 | 85 | Veterano | 26-10-0 (1 NC) |
| **Su Mudaerji** | China | — | 80 | 76 | 77 | 85 | 85 | 84 | — | 19-7-0 (1 NC) |
| **Manel Kape** | Angola | 2 | 87 | 77 | 74 | 81 | 88 | 84 | Incómodo | 23-7-0 |
| **Brandon Royval** | Estados Unidos | 3 | 82 | 80 | 85 | 84 | 84 | 79 | Incómodo | 18-9-0 |
| **Edgar Chairez** | México | 15 | 81 | 80 | 86 | 79 | 86 | 80 | — | 14-6-0 (1 NC) |
| **Kyoji Horiguchi** ◆ | Japón | 5 | 80 | 77 | 75 | 86 | 84 | 85 | Veterano | 36-6-0 (1 NC) |
| **Ramazan Temirov** | Uzbekistán | 10 | 85 | 81 | 75 | 80 | 86 | 80 | — | 20-3-0 |
| **Lone'er Kavanagh** | Inglaterra | 6 | 82 | 82 | 75 | 82 | 82 | 82 | — | 10-2-0 |
| **Steve Erceg** | Australia | 12 | 81 | 78 | 76 | 86 | 84 | 78 | — | 14-5-0 |
| **Deiveson Figueiredo** ◆ | Brasil | — | 85 | 82 | 86 | 74 | 83 | 77 | Camaleón | 25-7-1 |

### Plata

| Peleador | País | Rk | GOL | LUC | SUE | CAR | DUR | IQ | Atributo | Récord |
|---|---|---|---|---|---|---|---|---|---|---|
| **Andre Lima** | Brasil | — | 82 | 81 | 82 | 82 | 82 | 82 | — | 11-1-0 |
| **Mitch Raposo** | Estados Unidos | — | 81 | 79 | 76 | 82 | 82 | 82 | — | 11-3-0 |
| **Cody Durden** | Estados Unidos | — | 81 | 82 | 75 | 82 | 82 | 80 | — | 18-11-1 |
| **Clayton Carpenter** | Estados Unidos | — | 81 | 74 | 82 | 81 | 82 | 80 | — | 8-3-0 |
| **Rafael Estevam** | Brasil | — | 81 | 82 | 76 | 82 | 82 | 77 | — | 14-1-0 |
| **Allan Nascimento** | Brasil | — | 81 | 72 | 82 | 82 | 82 | 80 | — | 22-7-0 |
| **Carlos Hernandez** | Estados Unidos | — | 81 | 74 | 79 | 82 | 82 | 81 | — | 10-5-0 |
| **Bruno Silva** | Brasil | — | 82 | 78 | 79 | 76 | 82 | 81 | — | 15-9-2 (1 NC) |
| **Charles Johnson** | Estados Unidos | — | 82 | 72 | 77 | 82 | 82 | 82 | — | 20-9-0 |
| **Felipe Bunes** | Brasil | — | 81 | 73 | 82 | 79 | 82 | 80 | — | 14-9-0 |
| **CJ Vergara** | Estados Unidos | — | 81 | 72 | 79 | 81 | 82 | 81 | — | 12-7-1 |
| **Kevin Borjas** | Perú | — | 81 | 74 | 74 | 82 | 82 | 82 | — | 11-5-0 |
| **Joseph Morales** | Estados Unidos | — | 81 | 72 | 82 | 77 | 79 | 81 | — | 15-2-0 |
| **Jimmy Flick** | Estados Unidos | — | 80 | 71 | 82 | 77 | 82 | 78 | — | 17-9-0 |
| **Ode' Osbourne** | Jamaica | — | 81 | 74 | 75 | 76 | 82 | 80 | — | 13-9-0 (2 NC) |
| **Matt Schnell** | Estados Unidos | — | 81 | 71 | 82 | 77 | 71 | 80 | — | 17-11-0 (1 NC) |

---

## Peso gallo (F)

### Oro

| Peleador | País | Rk | GOL | LUC | SUE | CAR | DUR | IQ | Atributo | Récord |
|---|---|---|---|---|---|---|---|---|---|---|
| **Luana Santos** | Brasil | 7 | 82 | 87 | 84 | 84 | 87 | 86 | — | 11-2-0 |
| **Kayla Harrison** | Estados Unidos | C | 82 | 87 | 84 | 83 | 85 | 86 | Especialista LUCHA | 19-1-0 |
| **Amanda Nunes** | Brasil | — | 85 | 84 | 83 | 80 | 83 | 85 | Veterano | 23-5-0 |
| **Norma Dumont** | Brasil | 4 | 81 | 83 | 79 | 88 | 85 | 86 | — | 13-3-0 |
| **Ailin Perez** | Argentina | 5 | 82 | 85 | 77 | 86 | 86 | 85 | — | 13-2-0 |
| **Raquel Pennington** | Estados Unidos | 2 | 82 | 78 | 83 | 87 | 88 | 86 | — | 16-10-0 |
| **Valentina Shevchenko** ◆ | Kirguistán | — | 83 | 85 | 78 | 86 | 85 | 86 | Especialista IQ | 26-4-1 |
| **Miesha Tate** | Estados Unidos | 14 | 80 | 82 | 85 | 86 | 86 | 82 | Veterano | 20-10-0 |
| **Joselyne Edwards** | Panamá | 3 | 81 | 77 | 82 | 85 | 88 | 82 | — | 18-6-0 |
| **Jacqueline Cavalcanti** | Brasil | 9 | 80 | 77 | 74 | 87 | 87 | 86 | — | 10-2-0 |
| **Julianna Pena** | Estados Unidos | 1 | 82 | 80 | 81 | 85 | 88 | 79 | Especialista DUREZA | 13-6-0 |
| **Karol Rosa** | Brasil | 10 | 83 | 79 | 76 | 87 | 86 | 76 | — | 19-8-0 |
| **Bia Mesquita** | Brasil | 11 | 81 | 79 | 83 | 79 | 84 | 82 | — | 8-0-0 |
| **Melissa Croden** | Canadá ? | 15 | 81 | 80 | 77 | 85 | 86 | 78 | — | 8-3-0 |
| **Michelle Montague** | Nueva Zelanda ? | 12 | 82 | 77 | 77 | 84 | 85 | 82 | — | 8-0-0 |
| **Macy Chiasson** | Estados Unidos | 8 | 81 | 77 | 79 | 82 | 84 | 80 | — | 11-6-0 |
| **Nora Cornolle** | Francia | 13 | 81 | 77 | 77 | 83 | 86 | 81 | — | 9-4-0 |
| **Yana Santos** | Rusia | 6 | 81 | 77 | 75 | 87 | 75 | 80 | — | 17-8-0 (1 NC) |

### Plata

| Peleador | País | Rk | GOL | LUC | SUE | CAR | DUR | IQ | Atributo | Récord |
|---|---|---|---|---|---|---|---|---|---|---|
| **Ketlen Vieira** | Brasil | — | 81 | 82 | 78 | 82 | 82 | 82 | — | 16-5-0 |
| **Melissa Mullins** | Estados Unidos ? | — | 82 | 81 | 76 | 82 | 82 | 82 | — | 7-3-0 |
| **Tainara Lisboa** | Brasil | — | 81 | 74 | 79 | 82 | 82 | 80 | — | 7-4-0 |
| **Stephanie Egger** | Suiza | — | 81 | 78 | 81 | 76 | 82 | 80 | — | 8-5-0 |
| **Irene Aldana** | México | — | 80 | 74 | 76 | 82 | 82 | 82 | — | 15-8-0 |
| **Mayra Bueno Silva** ◆ | Brasil | — | 81 | 73 | 82 | 78 | 82 | 80 | — | 10-7-1 (1 NC) |
| **Josiane Nunes** | Brasil | — | 82 | 73 | 74 | 82 | 82 | 81 | — | 10-4-0 |
| **Klaudia Sygula** | Polonia | — | 80 | 74 | 76 | 82 | 82 | 81 | — | 8-2-0 |
| **Ravena Oliveira** | Brasil | — | 81 | 73 | 79 | 79 | 82 | 80 | — | 7-5-1 |
| **Chelsea Chandler** | Estados Unidos | — | 82 | 72 | 79 | 79 | 82 | 78 | — | 7-4-0 |
| **Priscila Cachoeira** | Brasil | — | 81 | 74 | 77 | 76 | 82 | 80 | — | 13-9-0 |

---

## Peso mosca (F)

### Oro

| Peleador | País | Rk | GOL | LUC | SUE | CAR | DUR | IQ | Atributo | Récord |
|---|---|---|---|---|---|---|---|---|---|---|
| **Valentina Shevchenko** ◆ | Kirguistán | C | 83 | 85 | 78 | 88 | 88 | 88 | Camaleón | 26-4-1 |
| **Erin Blanchfield** | Estados Unidos | 4 | 81 | 84 | 87 | 85 | 87 | 85 | — | 14-2-0 |
| **Wang Cong** | China | 8 | 87 | 83 | 79 | 84 | 87 | 86 | — | 10-1-0 |
| **Manon Fiorot** | Francia | 2 | 88 | 82 | 75 | 86 | 88 | 87 | — | 13-2-0 |
| **Jasmine Jasudavicius** | Canadá | 7 | 82 | 80 | 84 | 86 | 87 | 85 | — | 15-4-0 |
| **Eduarda Moura** | Brasil | 13 | 81 | 85 | 80 | 84 | 86 | 84 | — | 12-2-0 |
| **Natalia Silva** | Brasil | 1 | 83 | 80 | 75 | 86 | 88 | 87 | — | 20-5-1 |
| **Casey O'Neill** | Australia | 12 | 86 | 78 | 80 | 81 | 86 | 85 | — | 11-2-0 |
| **Talita Alencar** | Brasil | — | 81 | 80 | 81 | 85 | 85 | 81 | — | 8-1-1 |
| **Miranda Maverick** | Estados Unidos | 10 | 82 | 81 | 81 | 86 | 87 | 82 | — | 17-6-0 |
| **JJ Aldrich** | Estados Unidos | 14 | 81 | 77 | 78 | 86 | 86 | 84 | — | 15-7-0 |
| **Tracy Cortez** | Estados Unidos | 9 | 82 | 78 | 74 | 87 | 87 | 82 | — | 12-4-0 |
| **Alexa Grasso** ◆ | México | 3 | 80 | 78 | 82 | 87 | 87 | 81 | — | 17-5-1 |
| **Zhang Weili** ◆ | China | — | 86 | 81 | 81 | 84 | 82 | 83 | Veterano | 26-4-0 |
| **Maycee Barber** | Estados Unidos | 6 | 87 | 80 | 77 | 85 | 86 | 79 | — | 15-3-0 |
| **Karine Silva** | Brasil | 11 | 81 | 81 | 86 | 80 | 86 | 79 | — | 19-7-0 |
| **Jessica Andrade** ◆ | Brasil | — | 87 | 86 | 75 | 75 | 86 | 83 | Veterano | 26-15-0 |
| **Rose Namajunas** ◆ | Estados Unidos | 5 | 82 | 78 | 80 | 87 | 85 | 81 | — | 15-8-0 |
| **Gabriella Fernandes** | Brasil | 15 | 81 | 77 | 79 | 85 | 86 | 78 | — | 11-4-0 |
| **Loopy Godinez** ◆ | México | — | 81 | 85 | 82 | 82 | 82 | 82 | — | 14-6-0 |
| **Tatiana Suarez** ◆ | Estados Unidos | — | 82 | 86 | 86 | 79 | 82 | 79 | Especialista LUCHA | 13-1-0 |
| **Tabatha Ricci** ◆ | Brasil | — | 82 | 77 | 76 | 83 | 86 | 79 | — | 12-5-0 |
| **Gillian Robertson** ◆ | Canadá | — | 81 | 82 | 86 | 77 | 85 | 78 | — | 17-9-0 |

### Plata

| Peleador | País | Rk | GOL | LUC | SUE | CAR | DUR | IQ | Atributo | Récord |
|---|---|---|---|---|---|---|---|---|---|---|
| **Cynthia Calvillo** | Estados Unidos | — | 81 | 82 | 82 | 82 | 82 | 82 | — | 9-6-1 |
| **Ivana Petrovic** | Croacia | — | 81 | 78 | 81 | 82 | 82 | 82 | — | 7-3-0 |
| **Viviane Araujo** | Brasil | — | 81 | 82 | 77 | 82 | 82 | 82 | — | 13-7-0 |
| **Jamie-Lyn Horth** | Canadá | — | 82 | 80 | 75 | 82 | 82 | 82 | — | 9-3-0 |
| **Andrea Lee** | Estados Unidos | — | 81 | 76 | 79 | 82 | 82 | 81 | — | 13-11-0 |
| **Ariane Lipski** | Brasil | — | 81 | 73 | 79 | 82 | 82 | 81 | — | 17-11-0 |
| **Luana Carolina** | Brasil | — | 82 | 73 | 76 | 82 | 82 | 82 | — | 11-5-0 |
| **Molly McCann** | Inglaterra | — | 81 | 72 | 75 | 82 | 82 | 80 | — | 14-8-0 |
| **Vanessa Demopoulos** | Estados Unidos | — | 80 | 70 | 77 | 82 | 82 | 77 | — | 11-8-0 |
| **Montserrat Ruiz** | México | — | 80 | 75 | 77 | 82 | 72 | 80 | — | 10-5-0 |
| **Mayra Bueno Silva** ◆ | Brasil | — | 81 | 73 | 82 | 74 | 79 | 77 | — | 10-7-1 (1 NC) |

---

## Peso paja (F)

### Oro

| Peleador | País | Rk | GOL | LUC | SUE | CAR | DUR | IQ | Atributo | Récord |
|---|---|---|---|---|---|---|---|---|---|---|
| **Alexia Thainara** | Brasil | 8 | 81 | 85 | 84 | 85 | 87 | 86 | — | 15-1-0 |
| **Virna Jandiroba** | Brasil | 3 | 81 | 82 | 85 | 86 | 88 | 85 | Especialista SUELO | 23-4-0 |
| **Loopy Godinez** ◆ | México | 7 | 81 | 85 | 82 | 87 | 86 | 86 | — | 14-6-0 |
| **Zhang Weili** ◆ | China | 1 | 86 | 81 | 81 | 87 | 85 | 85 | Veterano | 26-4-0 |
| **Piera Rodriguez** | Venezuela | — | 82 | 85 | 79 | 85 | 85 | 84 | — | 12-2-0 |
| **Tatiana Suarez** ◆ | Estados Unidos | 2 | 82 | 86 | 86 | 82 | 85 | 82 | Especialista LUCHA | 13-1-0 |
| **Rose Namajunas** ◆ | Estados Unidos | — | 82 | 78 | 80 | 88 | 88 | 84 | — | 15-8-0 |
| **Mackenzie Dern** | Estados Unidos | C | 81 | 80 | 88 | 87 | 88 | 81 | Especialista SUELO | 17-5-0 |
| **Alice Ardelean** | Rumanía | — | 80 | 82 | 79 | 85 | 85 | 85 | — | 12-7-0 |
| **Jessica Andrade** ◆ | Brasil | 9 | 87 | 86 | 75 | 78 | 87 | 84 | Veterano | 26-15-0 |
| **Fatima Kline** | Estados Unidos ? | 6 | 83 | 81 | 76 | 85 | 87 | 85 | — | 10-1-0 |
| **Yan Xiaonan** | China | 4 | 85 | 78 | 76 | 87 | 86 | 85 | Veterano | 19-5-0 (1 NC) |
| **Angela Hill** | Estados Unidos | 13 | 83 | 76 | 78 | 86 | 86 | 84 | Especialista CARDIO | 19-16-0 |
| **Amanda Ribas** | Brasil | 12 | 81 | 84 | 84 | 83 | 79 | 82 | Veterano | 13-7-0 |
| **Tabatha Ricci** ◆ | Brasil | 10 | 82 | 77 | 76 | 86 | 87 | 82 | — | 12-5-0 |
| **Amanda Lemos** | Brasil | 11 | 82 | 78 | 81 | 83 | 86 | 81 | — | 15-7-1 |
| **Gillian Robertson** ◆ | Canadá | 5 | 81 | 82 | 86 | 79 | 87 | 80 | — | 17-9-0 |
| **Denise Gomes** | Brasil | 14 | 81 | 77 | 78 | 85 | 86 | 77 | — | 12-3-0 |
| **Alexa Grasso** ◆ | México | — | 80 | 78 | 82 | 85 | 86 | 76 | — | 17-5-1 |
| **Mizuki Inoue** | Japón | 15 | 82 | 78 | 75 | 82 | 82 | 76 | — | 16-6-0 |

### Plata

| Peleador | País | Rk | GOL | LUC | SUE | CAR | DUR | IQ | Atributo | Récord |
|---|---|---|---|---|---|---|---|---|---|---|
| **Iasmin Lucindo** | Brasil | — | 82 | 82 | 78 | 82 | 82 | 82 | — | 18-6-0 |
| **Luana Pinheiro** | Brasil | — | 81 | 82 | 75 | 82 | 82 | 82 | — | 11-5-0 |
| **Yazmin Jauregui** | México | — | 81 | 81 | 76 | 82 | 82 | 82 | — | 11-2-0 |
| **Emily Ducote** | Estados Unidos | — | 81 | 80 | 75 | 82 | 82 | 82 | — | 13-9-0 |
| **Julia Polastri** | Brasil | — | 82 | 74 | 79 | 82 | 82 | 82 | — | 14-6-0 |
| **Loma Lookboonmee** | Tailandia | — | 82 | 82 | 75 | 82 | 82 | 76 | — | 10-5-0 |
| **Xiong Jing Nan** | China | — | 82 | 77 | 77 | 82 | 82 | 78 | — | 19-3-0 |
| **Sam Hughes** | Estados Unidos | — | 81 | 74 | 77 | 82 | 82 | 82 | — | 11-7-0 |
| **Karolina Kowalkiewicz** | Polonia | — | 82 | 74 | 74 | 82 | 82 | 82 | — | 16-10-0 |
| **Ashley Yoder** | Estados Unidos | — | 81 | 74 | 77 | 82 | 82 | 79 | — | 8-9-0 |
| **Bruna Brasil** | Brasil | — | 81 | 75 | 74 | 82 | 82 | 80 | — | 11-7-1 |
| **Jaqueline Amorim** | Brasil | — | 81 | 70 | 82 | 77 | 82 | 79 | — | 11-2-0 |
| **Istela Nunes** | Brasil | — | 82 | 72 | 76 | 78 | 77 | 80 | — | 6-6-0 (1 NC) |

---

## Peleadores con carta en varias divisiones

| Peleador | Divisiones |
|---|---|
| Aleksandar Rakic | pesado · semipesado |
| Alex Pereira | pesado · semipesado · medio |
| Alexa Grasso | mosca F · paja F |
| Aljamain Sterling | pluma · gallo |
| Bryan Battle | medio · welter |
| Charles Jourdain | pluma · gallo |
| Charles Oliveira | ligero · pluma |
| Conor McGregor | ligero · pluma |
| Dan Hooker | ligero · pluma |
| Deiveson Figueiredo | gallo · mosca |
| Dricus du Plessis | medio · welter |
| Gillian Robertson | mosca F · paja F |
| Henry Cejudo | gallo · mosca |
| Ilia Topuria | ligero · pluma |
| Islam Makhachev | welter · ligero |
| Israel Adesanya | semipesado · medio |
| Jared Cannonier | semipesado · medio |
| Jessica Andrade | mosca F · paja F |
| Joaquin Buckley | medio · welter |
| Joel Alvarez | welter · ligero |
| Johnny Walker | pesado · semipesado |
| Kamaru Usman | medio · welter |
| Kennedy Nzechukwu | pesado · semipesado |
| Kevin Holland | medio · welter |
| Khamzat Chimaev | medio · welter |
| Kyoji Horiguchi | gallo · mosca |
| Loopy Godinez | mosca F · paja F |
| Max Holloway | ligero · pluma |
| Mayra Bueno Silva | gallo F · mosca F |
| Michael Page | medio · welter |
| Michel Pereira | medio · welter |
| Nassourdine Imavov | medio · welter |
| Nathaniel Wood | pluma · gallo |
| Patricio Pitbull | ligero · pluma |
| Paulo Costa | semipesado · medio |
| Renato Moicano | ligero · pluma |
| Robert Whittaker | medio · semipesado |
| Rose Namajunas | mosca F · paja F |
| Ryan Spann | pesado · semipesado |
| Sean Strickland | medio · welter |
| Tabatha Ricci | mosca F · paja F |
| Tatiana Suarez | mosca F · paja F |
| Uros Medic | welter · ligero |
| Valentina Shevchenko | gallo F · mosca F |
| Vitor Petrino | pesado · semipesado |
| Zhang Weili | mosca F · paja F |