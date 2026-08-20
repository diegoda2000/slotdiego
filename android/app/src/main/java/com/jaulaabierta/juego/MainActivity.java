package com.jaulaabierta.juego;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.view.ViewGroup;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

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

    private WebView web;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle estado) {
        super.onCreate(estado);

        final WebViewAssetLoader cargador = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        web = new WebView(this);
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

        setContentView(web, new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        /* Desde Android 15 la aplicación se dibuja de borde a borde por defecto, así que
         * la barra de estado —la hora, la batería— se queda ENCIMA de la cabecera del
         * juego. Se le pide al sistema cuánto ocupan sus barras y se aparta el WebView
         * ese tanto. Se pregunta en vez de calcularlo porque cada móvil tiene lo suyo:
         * muesca, agujero, barra de gestos o botones. */
        ViewCompat.setOnApplyWindowInsetsListener(web, (v, ventana) -> {
            Insets barras = ventana.getInsets(
                    WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
            v.setPadding(barras.left, barras.top, barras.right, barras.bottom);
            return WindowInsetsCompat.CONSUMED;
        });

        if (estado == null) web.loadUrl(INICIO);
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
     */
    @Override
    public void onBackPressed() {
        web.evaluateJavascript(
                "(function(){"
                        + " if (typeof vista === 'undefined') return 'salir';"
                        + " if (vista === 'partida') return 'nada';"
                        + " if (vista !== 'inicio') { ir('inicio'); return 'nada'; }"
                        + " return 'salir';"
                        + "})()",
                valor -> {
                    if (valor != null && valor.contains("salir")) finish();
                });
    }
}
