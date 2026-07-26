# Despliegue

AldeaFit es un sitio estático: cualquier hosting que sirva archivos vale. Esta
guía cubre GitHub Pages, que es gratis y ya está automatizado en este repo.

---

## 1. Publicar en GitHub Pages (gratis)

### Dos ajustes que solo puedes hacer tú

Ninguno de estos dos pasos se puede automatizar desde CI — GitHub exige que los
haga una persona con acceso a la configuración del repositorio.

**1. Hacer el repositorio público**

> GitHub Pages solo es gratuito en repositorios públicos. En un repositorio
> privado requiere un plan de pago (Pro, Team o Enterprise).

`Settings` → abajo del todo, `Danger Zone` → **Change repository visibility** →
`Make public`.

Qué implica: el código queda visible para cualquiera. La aplicación no contiene
secretos, claves ni datos de usuario — no hay backend y nada sale del navegador
— así que lo único que se expone es el propio código.

**2. Activar Pages con origen "GitHub Actions"**

`Settings` → `Pages` → en **Source**, elegir **GitHub Actions**.

No hace falta elegir rama ni carpeta: el workflow de este repo se encarga.

### Y ya está

El workflow `.github/workflows/deploy.yml` se dispara solo en cada push. Tras
esos dos ajustes, lánzalo desde `Actions` → `Deploy to GitHub Pages` →
`Run workflow`, o haz cualquier push.

La web queda en:

```
https://straycoderx.github.io/AldeaFit/
```

> **Antes de activar Pages, el workflow falla** en el paso `configure-pages`.
> Es lo esperado: esa acción no puede resolver la URL de un Pages que aún no
> existe. En cuanto lo actives, deja de fallar.

Qué hace el workflow en cada despliegue:

- Repite typecheck, lint y los 89 tests — `main` nunca publica algo que no pase CI.
- Ajusta el `base` al subdirectorio del proyecto (o a la raíz si hay dominio propio).
- Sella la versión de caché del service worker con el SHA del commit, para que
  quien ya tenga la app instalada reciba la versión nueva y no una cacheada.
- Añade `404.html` y `.nojekyll`.

---

## 2. Dominio propio gratuito: `aldeafit.is-a.dev`

[is-a.dev](https://is-a.dev) regala subdominios a desarrolladores. Es gratis,
permanente, y se solicita con un pull request a su repositorio.

> ⚠️ **Su README pide expresamente no generar la solicitud con IA**
> ("Do not use AI to generate your request, it WILL always get it wrong").
> Por eso abajo tienes los valores verificados contra su documentación oficial,
> pero **crea y revisa tú el archivo** antes de enviarlo, contrastándolo con
> <https://docs.is-a.dev/guides/github-pages/>.

### Pasos

1. Haz fork de <https://github.com/is-a-dev/register>.
2. Crea el archivo `domains/aldeafit.json`. Según la guía oficial de GitHub
   Pages, la estructura es:

   ```json
   {
       "owner": {
           "username": "StraycoderX",
           "email": "tu-email@ejemplo.com"
       },
       "records": {
           "CNAME": "straycoderx.github.io"
       }
   }
   ```

   Detalles que importan:
   - El campo es **`records`** en plural. Varias guías de terceros lo escriben
     como `record` en singular y el PR es rechazado.
   - El `CNAME` apunta a `straycoderx.github.io` — tu usuario, **no** el
     repositorio. GitHub resuelve el proyecto correcto por el dominio.
   - El subdominio debe tener entre 3 y 63 caracteres, sin guiones bajos.
3. Abre el pull request y espera a que lo revisen (suele tardar días).
4. Cuando lo mergeen, en `Settings` → `Pages` → **Custom domain**, escribe
   `aldeafit.is-a.dev` y marca **Enforce HTTPS**.
5. En este repo, crea el archivo `public/CNAME` con una sola línea:

   ```
   aldeafit.is-a.dev
   ```

   Eso es todo lo que hay que cambiar aquí: el workflow detecta ese archivo y
   reconstruye con el `base` en la raíz en vez de en `/AldeaFit/`. Sin ese
   cambio, la web cargaría en blanco bajo el dominio propio, porque buscaría los
   assets en `/AldeaFit/assets/...`.

Es normal ver un 404 durante los primeros minutos tras el merge, mientras el DNS
propaga.

---

## 3. Alternativas

Si prefieres mantener el repositorio privado, estos servicios sí lo permiten en
su plan gratuito:

| Servicio | URL gratuita | Repo privado |
|---|---|---|
| Cloudflare Pages | `aldeafit.pages.dev` | Sí |
| Netlify | `aldeafit.netlify.app` | Sí |
| Vercel | `aldeafit.vercel.app` | Sí |

En los tres, la configuración es: conectar el repositorio, comando de build
`npm run build`, directorio de salida `dist`. No hace falta tocar nada más,
porque el `base` por defecto ya es la raíz.

Ventaja añadida en Cloudflare y Netlify: ambos leen `public/_headers`, así que
aplican las cabeceras de seguridad completas — incluida `frame-ancestors`, que
GitHub Pages no puede servir. Ver [SECURITY.md](./SECURITY.md#hosting-caveat).
