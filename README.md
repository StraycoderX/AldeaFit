# AldeaFit

**Tu fuerza, calculada de verdad.** — Calculadora de fuerza multidispositivo,
offline-first y sin rastreo.

AldeaFit toma la idea de una calculadora 1RM y la convierte en una herramienta
que de verdad se usa en el gimnasio: no sólo te dice un número, te dice qué
discos poner en la barra, cómo calentar hasta ese peso, qué nivel representa y
cómo evolucionas.

---

## Por qué es distinta

La mayoría de calculadoras 1RM online aplican **una** fórmula (casi siempre
Epley) y presentan el resultado como un hecho. En realidad las fórmulas
publicadas discrepan entre un 5 % y un 10 % en rangos medios, y divergen mucho
más a partir de 10 repeticiones.

AldeaFit ejecuta **siete fórmulas** (Epley, Brzycki, Lombardi, O'Conner,
Wathan, Lander, Mayhew), muestra la **mediana** como cifra principal y enseña el
**rango completo** más una **valoración de fiabilidad**. Ver que tu 1RM es
"119,5 kg, entre 115 y 122" es mucho más honesto que un "119,5 kg" a secas.

| | Calculadora típica | AldeaFit |
|---|---|---|
| Fórmulas | 1 (Epley) | 7 + consenso por mediana |
| Incertidumbre | ninguna | rango + fiabilidad alta/media/baja |
| Validación | `parseFloat` | rechaza `Infinity`, `1e999`, negativos, texto |
| 1 repetición | devuelve 103 % del peso | devuelve el peso real levantado |
| Series al fallo | asume siempre | soporta RIR (repeticiones en reserva) |
| Qué hacer después | nada | discos, calentamiento, nivel, progreso |
| Sin conexión | no | sí, instalable como app |
| Rastreo | analítica, cookies | ninguno |

## Funcionalidades

- **Calculadora 1RM** — consenso de 7 fórmulas con rango de confianza, desglose
  fórmula a fórmula y soporte de RIR para series que no llegan al fallo.
- **Cargador de barra** — dibuja la barra con los discos exactos por lado.
  Respeta el inventario real de tu gimnasio: si sólo tienes un par de 20 kg, te
  dice lo más cerca que puedes quedarte y cuánto te falta.
- **Tabla de porcentajes** — cada banda del 5 % con su peso, repeticiones
  aproximadas, zona de entrenamiento y la carga de discos correspondiente.
- **Calentamiento** — series de aproximación adaptadas a lo pesada que sea la
  sesión, con descansos y discos por serie.
- **Nivel de fuerza** — escalera principiante → élite según tu ratio
  fuerza/peso, más puntuación DOTS normalizada por peso corporal.
- **Progreso** — historial con gráfica de evolución y detección de récord
  personal. Todo en tu dispositivo.
- **Multidispositivo de verdad** — barra de pestañas en móvil, raíl de iconos en
  tablet, barra lateral y paleta de comandos (⌘K) en escritorio.
- **PWA offline** — instalable, funciona sin cobertura en el sótano del gimnasio.
- **Español e inglés**, tema oscuro/claro/sistema, kg y lb.

## Privacidad

AldeaFit funciona **por completo en tu navegador**. No hay cuentas, ni
servidores, ni analítica, ni cookies. No se realiza **ninguna** petición de red
después de cargar: las tipografías están autoalojadas y no hay CDN. Tus datos no
salen del dispositivo, y puedes exportarlos o borrarlos por completo desde
Ajustes.

Ver [SECURITY.md](./SECURITY.md) para el modelo de amenazas y los controles.

---

## Desarrollo

```bash
npm install
npm run dev        # servidor de desarrollo
npm run verify     # typecheck + lint + tests + build
```

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo Vite |
| `npm run build` | Build de producción a `dist/` |
| `npm run preview` | Sirve el build de producción |
| `npm test` | Tests unitarios (Vitest) |
| `npm run test:coverage` | Tests con cobertura |
| `npm run typecheck` | TypeScript en modo estricto |
| `npm run lint` | ESLint |
| `npm run verify` | Todo lo anterior — lo que ejecuta CI |

### Estructura

```
src/
├── lib/          Lógica de dominio pura, sin React (y donde viven los tests)
│   ├── onerm.ts       Las 7 fórmulas + consenso + porcentajes
│   ├── plates.ts      Resolución de discos con inventario finito
│   ├── standards.ts   DOTS y escalera de niveles
│   ├── warmup.ts      Generación de series de aproximación
│   ├── validation.ts  Validación de toda entrada numérica
│   ├── storage.ts     Persistencia local + import/export validados
│   ├── units.ts       Conversión kg/lb y redondeo
│   └── i18n.ts        Diccionario ES/EN tipado
├── state/        Contexto de aplicación (settings, historial, inventario)
├── components/   Shell responsive, paleta de comandos, primitivas de UI
├── views/        Una pantalla por funcionalidad
└── styles/       Sistema de diseño (tokens, temas, tipografía)
```

La lógica de dominio es **TypeScript puro sin dependencias de React**, lo que
permite testearla directamente. 89 tests cubren las fórmulas, la resolución de
discos, la validación y el almacenamiento.

### Decisiones de diseño

- **Los pesos se guardan siempre en kilogramos.** La unidad sólo afecta a la
  presentación, de modo que cambiar de kg a lb nunca altera el significado de un
  registro guardado.
- **Los discos se calculan en la unidad de la barra.** Un disco de 20 kg es un
  objeto físico; convertirlo produciría un absurdo "disco de 9,07 kg".
- **Routing por hash.** Funciona en cualquier host estático sin reglas de
  reescritura, y el service worker sólo tiene un documento que cachear.
- **Sin librería de gráficas ni de iconos.** Ambas cosas son SVG propio: pesan
  menos que la dependencia y mantienen la CSP cerrada.

---

## Despliegue

El repositorio incluye dos workflows:

- **`.github/workflows/ci.yml`** — typecheck, lint, tests, build, presupuesto de
  tamaño de bundle y auditoría de dependencias en cada push y PR.
- **`.github/workflows/deploy.yml`** — despliegue a GitHub Pages al hacer push a
  `main`. Vuelve a ejecutar las comprobaciones antes de publicar, ajusta el
  `base` para el subdirectorio del proyecto y sella la versión de caché del
  service worker con el SHA del commit para que los visitantes recurrentes
  reciban el build nuevo.

Para activarlo: **Settings → Pages → Source: GitHub Actions**.

Cualquier host estático sirve igual (`npm run build`, publica `dist/`). En
Netlify o Cloudflare Pages se aplican además las cabeceras de seguridad de
`public/_headers`; ver la advertencia sobre GitHub Pages en
[SECURITY.md](./SECURITY.md#hosting-caveat).

## Licencia

MIT
