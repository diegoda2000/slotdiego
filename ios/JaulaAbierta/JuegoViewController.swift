import UIKit
import WebKit

/*
 El juego se sirve desde un esquema propio, `juego://`, y NO desde file://.

 Es exactamente el mismo problema que en Android: WebKit trata file:// como un origen
 opaco y bloquea localStorage, así que cargando el HTML como fichero la colección no se
 guardaría entre sesiones — abres la aplicación al día siguiente y no tienes cartas.
 Un esquema propio con su handler es un origen de verdad, y el guardado funciona.

 Es el equivalente de WebViewAssetLoader en Android, escrito a mano porque WebKit no
 trae nada parecido de serie.
*/
final class JuegoViewController: UIViewController, WKNavigationDelegate, WKScriptMessageHandler {

    private var web: WKWebView!
    private static let inicio = URL(string: "juego://app/juego.html")!

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 0.05, green: 0.06, blue: 0.08, alpha: 1)

        let conf = WKWebViewConfiguration()
        conf.setURLSchemeHandler(ManejadorDeAssets(), forURLScheme: "juego")
        conf.websiteDataStore = .default()          // localStorage persistente

        // Puente para el menú de compartir del sistema: navigator.share no está
        // disponible dentro de un WKWebView con esquema propio, y pasarle el código de
        // sala al amigo es el paso del que depende que la partida llegue a empezar.
        conf.userContentController.add(self, name: "compartir")
        let puente = """
        window.Android = { compartir: function (t) {
          window.webkit.messageHandlers.compartir.postMessage(String(t));
        }};
        """
        conf.userContentController.addUserScript(
            WKUserScript(source: puente, injectionTime: .atDocumentStart, forMainFrameOnly: true))

        web = WKWebView(frame: view.bounds, configuration: conf)
        web.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        web.navigationDelegate = self
        web.scrollView.bounces = false
        web.isOpaque = false
        web.backgroundColor = view.backgroundColor
        if #available(iOS 16.4, *) { web.isInspectable = true }
        view.addSubview(web)

        web.load(URLRequest(url: Self.inicio))
    }

    override var preferredStatusBarStyle: UIStatusBarStyle { .lightContent }

    func userContentController(_ c: WKUserContentController, didReceive m: WKScriptMessage) {
        guard m.name == "compartir", let texto = m.body as? String else { return }
        let hoja = UIActivityViewController(activityItems: [texto], applicationActivities: nil)
        hoja.popoverPresentationController?.sourceView = view
        present(hoja, animated: true)
    }

    /* Los enlaces externos se abren fuera; dentro solo vive el juego. */
    func webView(_ w: WKWebView, decidePolicyFor accion: WKNavigationAction,
                 decisionHandler d: @escaping (WKNavigationActionPolicy) -> Void) {
        if let u = accion.request.url, u.scheme == "http" || u.scheme == "https" {
            UIApplication.shared.open(u)
            d(.cancel); return
        }
        d(.allow)
    }
}

/* Sirve los archivos del juego que van dentro de la aplicación. Solo sirve lo que está
   en el paquete y solo desde juego-assets: cualquier ruta que se salga de ahí se
   rechaza, para que una ruta con ../ no pueda leer el resto del sistema. */
final class ManejadorDeAssets: NSObject, WKURLSchemeHandler {

    private static let tipos = ["html": "text/html; charset=utf-8",
                                "js": "text/javascript; charset=utf-8",
                                "css": "text/css; charset=utf-8",
                                "json": "application/json",
                                "png": "image/png", "svg": "image/svg+xml",
                                "webp": "image/webp", "jpg": "image/jpeg", "jpeg": "image/jpeg",
                                "woff2": "font/woff2", "woff": "font/woff"]

    func webView(_ w: WKWebView, start tarea: WKURLSchemeTask) {
        guard let url = tarea.request.url else { return fallar(tarea) }
        var ruta = url.path
        if ruta.hasPrefix("/") { ruta.removeFirst() }
        if ruta.isEmpty { ruta = "juego.html" }
        guard !ruta.contains("..") else { return fallar(tarea) }

        guard let base = Bundle.main.resourceURL?.appendingPathComponent("juego-assets") else {
            return fallar(tarea)
        }
        let destino = base.appendingPathComponent(ruta).standardizedFileURL
        guard destino.path.hasPrefix(base.standardizedFileURL.path),
              let datos = try? Data(contentsOf: destino) else { return fallar(tarea) }

        let tipo = Self.tipos[destino.pathExtension.lowercased()] ?? "application/octet-stream"
        let resp = HTTPURLResponse(url: url, statusCode: 200, httpVersion: "HTTP/1.1",
                                   headerFields: ["Content-Type": tipo,
                                                  "Cache-Control": "no-store"])!
        tarea.didReceive(resp)
        tarea.didReceive(datos)
        tarea.didFinish()
    }

    func webView(_ w: WKWebView, stop tarea: WKURLSchemeTask) {}

    private func fallar(_ tarea: WKURLSchemeTask) {
        tarea.didFailWithError(NSError(domain: "juego", code: 404,
            userInfo: [NSLocalizedDescriptionKey: "no está en el paquete"]))
    }
}
