import UIKit

/* El juego entero es un único HTML autocontenido, igual que en Android. Aquí solo se
   monta la ventana y se le cuelga el WebView. */
@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?

    func application(_ app: UIApplication,
                     didFinishLaunchingWithOptions opciones: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        let v = UIWindow(frame: UIScreen.main.bounds)
        v.rootViewController = JuegoViewController()
        v.makeKeyAndVisible()
        window = v
        return true
    }
}
