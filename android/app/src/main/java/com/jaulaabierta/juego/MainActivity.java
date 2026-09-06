package com.jaulaabierta.juego;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.view.ViewGroup;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.view.inputmethod.EditorInfo;
import android.view.inputmethod.InputConnection;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.webkit.WebViewAssetLoader;

/**
 * El juego entero es un único HTML autocontenido. Esta actividad solo lo aloja.
 *
 * Detalle que importa: el HTML NO se carga con file:///android_asset/. Chromium trata
 * file:// como origen opaco y bloquea localStorage, así que con file:// la colección
 * no se guardaría entre sesiones. WebViewAssetLoader lo sirve desde
 * https://appassets.androidplatform.net/, que es un origen real, y el guardado funciona.
 */
public class MainActivity extends Activity {

    private static final String INICIO =
            "https://appassets.androidplatform.net/assets/juego.html";

    /* LA MARCA DE TELEVISIÓN. Se le dice al juego, por la dirección, que está en una
     * Android TV, y él se pone la clase `tv` en el <html>. TODO lo que es de tele cuelga
     * de esa clase —la maqueta de la ventana bajita y el manejo con la cruceta—, así que
     * en un móvil no existe ni una regla ni un oyente de más: la clase no se pone.
     *
     * Se manda por la URL y no por el puente de JavaScript porque hace falta ANTES de que
     * se pinte nada; el puente sólo se puede preguntar con la página ya cargada, y para
     * entonces el primer fotograma ya salió con la maqueta de móvil. */
    private static final String INICIO_TV = INICIO + "?tv=1";

    private WebView web;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle estado) {
        super.onCreate(estado);

        final WebViewAssetLoader cargador = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        /* EL TECLADO A PANTALLA COMPLETA, QUE ES LO QUE ROMPE ANDROID TV.
         *
         * En horizontal, el teclado de Android se pone en "modo extracción": tapa la
         * pantalla entera con un fondo claro y su propio campo de texto, y deja la
         * aplicación detrás sin pintar. En un móvil casi no se ve porque se escribe en
         * vertical; una TELEVISIÓN está SIEMPRE en horizontal, así que pasa cada vez que
         * se toca un campo. Es exactamente lo que salía en el Nvidia Shield: el juego
         * arriba, una plancha gris debajo y las teclas de canto contra el borde.
         *
         * Las dos banderas lo apagan: NO_EXTRACT_UI le quita el campo de texto propio y
         * NO_FULLSCREEN le prohíbe ocupar toda la pantalla. El teclado se queda abajo,
         * como en un móvil, y el juego se sigue viendo mientras se escribe.
         *
         * Van aquí y no en un XML porque quien abre el teclado es el campo de dentro del
         * WebView, no una vista de Android a la que se le puedan poner atributos. */
        web = new WebView(this) {
            @Override
            public InputConnection onCreateInputConnection(EditorInfo salida) {
                InputConnection cx = super.onCreateInputConnection(salida);
                if (salida != null)
                    salida.imeOptions |= EditorInfo.IME_FLAG_NO_EXTRACT_UI
                                       | EditorInfo.IME_FLAG_NO_FULLSCREEN;
                return cx;
            }
        };
        WebSettings ajustes = web.getSettings();
        ajustes.setJavaScriptEnabled(true);
        ajustes.setDomStorageEnabled(true);   // sin esto no se guarda la colección
        ajustes.setDatabaseEnabled(true);

        // Puente para el menú de compartir del sistema. navigator.share no existe en un
        // WebView normal, y pasar el código de sala al amigo es el paso del que depende
        // que la partida en directo llegue a empezar.
        web.addJavascriptInterface(new Object() {
            @JavascriptInterface
            public void compartir(String texto) {
                Intent envio = new Intent(Intent.ACTION_SEND);
                envio.setType("text/plain");
                envio.putExtra(Intent.EXTRA_TEXT, texto);
                startActivity(Intent.createChooser(envio, "Enviar el código"));
            }
        }, "Android");

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest peticion) {
                return cargador.shouldInterceptRequest(peticion.getUrl());
            }
        });

        /* Desde Android 15 la aplicación se dibuja de borde a borde por defecto, así que
         * la barra de estado —la hora, la batería— y la de gestos se quedan ENCIMA del
         * juego. Se le pide al sistema cuánto ocupan y se aparta el contenido ese tanto.
         * Se pregunta en vez de calcularlo porque cada móvil tiene lo suyo: muesca,
         * agujero, barra de gestos o botones.
         *
         * Tres detalles, y los tres hacían falta para que esto funcionara de verdad:
         *
         * 1. El relleno NO va en el WebView sino en un FrameLayout que lo envuelve. Un
         *    WebView con relleno lo aplica a su propio lienzo de desplazamiento, no a la
         *    ventana: el contenido seguía empezando arriba del todo y la barra de estado
         *    seguía encima de la cabecera. Apartando el contenedor, el WebView entero se
         *    coloca ya dentro de la zona buena y el juego ni se entera.
         *
         * 2. Hay que pedir el reparto a mano con requestApplyInsets(). El sistema reparte
         *    las medidas una sola vez al colocar la ventana, y si para entonces todavía no
         *    hay quien escuche, no se vuelve a repartir solo: el oyente se queda puesto y
         *    no lo llaman nunca.
         *
         * 3. El color de detrás de las barras lo pone el fondo de la ventana (@color/fondo),
         *    porque android:statusBarColor y navigationBarColor ya no se miran en API 35.
         *
         * En iPhone esto no hace falta: WKWebView sí reparte las medidas al CSS, y el juego
         * las lee con env(safe-area-inset-*). */
        final android.widget.FrameLayout raiz = new android.widget.FrameLayout(this);
        raiz.addView(web, new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        setContentView(raiz, new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        /* Y EL TECLADO CUENTA COMO UNA BARRA MÁS. Sin `ime()` en esta lista, el sistema
         * no aparta nada al abrirlo: en un móvil se come el final de la pantalla y en una
         * tele, donde el teclado es enorme, tapa medio juego. Metiéndolo, el contenido se
         * encoge hasta justo encima de las teclas y se ve lo que se está escribiendo.
         * `getInsets` con varias máscaras devuelve la MAYOR de cada lado, así que con el
         * teclado cerrado esto vale exactamente lo que valía antes. */
        ViewCompat.setOnApplyWindowInsetsListener(raiz, (v, ventana) -> {
            Insets barras = ventana.getInsets(
                    WindowInsetsCompat.Type.systemBars()
                            | WindowInsetsCompat.Type.displayCutout()
                            | WindowInsetsCompat.Type.ime());
            v.setPadding(barras.left, barras.top, barras.right, barras.bottom);
            return WindowInsetsCompat.CONSUMED;
        });
        ViewCompat.requestApplyInsets(raiz);

        /* FEATURE_LEANBACK es lo que declara una Android TV, y es lo que hay que mirar:
         * no vale por el tamaño de pantalla ni por si hay táctil, que una tablet grande
         * daría lo mismo y no es una tele. */
        final boolean esTele = getPackageManager()
                .hasSystemFeature(PackageManager.FEATURE_LEANBACK);

        if (estado == null) web.loadUrl(esTele ? INICIO_TV : INICIO);
        else web.restoreState(estado);
    }

    @Override
    protected void onSaveInstanceState(Bundle fuera) {
        super.onSaveInstanceState(fuera);
        web.saveState(fuera);
    }

    /**
     * El atrás vuelve a la pantalla de inicio en vez de cerrar la aplicación.
     * Durante una partida no hace nada: para rendirse está el botón de abandonar,
     * y cerrar la partida sin querer con el atrás sería una derrota accidental.
     *
     * EN UNA TELE HACE OTRA COSA, y con motivo: allí el atrás del mando es LA forma de
     * volver, y saltar a Inicio desde una pantalla interior en vez de volver a la de
     * antes se siente roto. Si el juego trae `atrasTV` —que sólo existe con la marca de
     * televisión puesta— manda ella: cierra el cartel abierto, o sale de la apertura, o
     * PULSA LA FLECHA de la pantalla, que es lo que hace que el botón del mando y la
     * flecha vayan siempre al mismo sitio.
     *
     * En un móvil `atrasTV` no existe y esto sigue línea por línea como estaba.
     */
    @Override
    public void onBackPressed() {
        web.evaluateJavascript(
                "(function(){"
                        + " if (typeof vista === 'undefined') return 'salir';"
                        + " if (vista === 'partida') return 'nada';"
                        + " if (typeof window.atrasTV === 'function') return window.atrasTV();"
                        + " if (vista !== 'inicio') { ir('inicio'); return 'nada'; }"
                        + " return 'salir';"
                        + "})()",
                valor -> {
                    if (valor != null && valor.contains("salir")) finish();
                });
    }
}
