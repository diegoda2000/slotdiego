# La versión de iPhone

## Qué se construye aquí

El mismo juego que el APK de Android: un único HTML autocontenido dentro de un WebView.
No hay dos códigos de juego, hay uno — lo que cambia es la cáscara.

El flujo `Servidor` de GitHub Actions construye las dos a la vez, con la dirección del
servidor de partidas ya dentro, y las publica juntas en la descarga `apk-latest`.

## Lo que hay que saber antes de bajarla

**El `.ipa` que sale de aquí va SIN FIRMAR**, y eso no es un descuido: firmar una
aplicación de iPhone exige un certificado de una cuenta de desarrollador de Apple, y
esa cuenta es del dueño, no algo que se pueda meter en un repositorio.

Un `.ipa` sin firmar **no se instala tocándolo en el móvil**. Hay dos caminos:

1. **Sideloadly o AltStore** (gratis, lo más rápido para probar entre amigos).
   Se instala el programa en un ordenador, se conecta el iPhone, se arrastra el `.ipa`
   y se firma con un Apple ID normal — el de cualquiera. La aplicación **caduca a los
   7 días** con una cuenta gratuita y hay que volver a firmarla. Con una cuenta de
   desarrollador de pago, un año.

2. **TestFlight** (lo serio). Requiere el Apple Developer Program, 99 $ al año. A cambio:
   se instala como cualquier otra aplicación, dura 90 días por versión y se puede
   repartir a hasta 10.000 personas por enlace.

Android no tiene nada de esto: el APK se instala y ya. Es una diferencia de Apple, no
del juego.

## Si algún día hay cuenta de desarrollador

Lo que habría que añadir al flujo, y nada más:

- Los secretos `APPLE_CERTIFICADO_P12`, `APPLE_CERTIFICADO_CLAVE`, `APPLE_PERFIL_MOBILEPROVISION`
  y `APPLE_TEAM_ID` en el repositorio.
- Importar el certificado al llavero del runner y firmar con `xcodebuild -allowProvisioningUpdates`.
- Subir a TestFlight con `xcrun altool` o `fastlane pilot`.

Mientras tanto, el `.ipa` sin firmar sirve perfectamente para probar con Sideloadly.

## Por qué un esquema propio y no `file://`

Igual que en Android. WebKit trata `file://` como un origen opaco y bloquea
`localStorage`: cargando el HTML como fichero, la colección no sobreviviría a cerrar la
aplicación. El `ManejadorDeAssets` sirve el juego desde `juego://app/`, que es un origen
de verdad, y el guardado funciona. Es lo mismo que hace `WebViewAssetLoader` en Android,
solo que allí viene hecho y aquí hay que escribirlo.

## Por qué no hay un `.xcodeproj` en el repositorio

Un `.pbxproj` es imposible de revisar: se rompe al fusionar y nadie sabe leer su diff.
El proyecto se describe en `project.yml` —legible y pequeño— y **XcodeGen** lo genera en
el momento de compilar.
