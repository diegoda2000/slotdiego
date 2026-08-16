/* Dirección del servidor de partidas en directo.

   ESTE ARCHIVO LO ESCRIBE SOLO EL FLUJO "Servidor" DE GITHUB ACTIONS al desplegar.
   No hace falta tocarlo a mano.

   Va aquí y no en un JSON porque el juego también se abre con file://, donde no se
   puede leer un archivo con fetch. Un <script src> sí funciona en los tres sitios:
   navegador, WebView del APK y pruebas.

   Vacío = todavía no se ha desplegado ningún servidor. El juego sigue funcionando
   entero (sobres, colección, partidas contra la IA, retar plantillas); lo único que
   queda apagado son las partidas en directo. */

window.SERVIDOR_POR_DEFECTO = "";
