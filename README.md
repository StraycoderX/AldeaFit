# AldeaFit

**Tu fuerza, calculada de verdad.** — Calculadora de fuerza multidispositivo,
offline-first y sin rastreo.

AldeaFit toma la idea de una calculadora 1RM y la convierte en una herramienta
que de verdad se usa en el gimnasio: no sólo te dice un número, te dice qué
discos poner en la barra, cómo calentar hasta ese peso, qué nivel representa y
cómo evolucionas.

---

## Por qué es distinta

La mayoría de calculadoras 1RM aplican **una** fórmula (casi siempre Epley) y
presentan el resultado como un hecho. Pero hay un problema más profundo: las
siete fórmulas clásicas (Epley, Brzycki, Lombardi, O'Conner, Wathan, Lander,
Mayhew) se ajustaron en los años 80-90, casi todas con press de banca, y **todas
son lineales en el peso**. Calculan `peso × f(reps)`: el multiplicador para 5
repeticiones es idéntico con 20 kg que con 200 kg. Por eso se agrupan en un
margen de pocos puntos porcentuales — son siete constantes distintas aplicadas a
la misma forma.

El gimnasio no funciona así. Hoeger et al. midieron ~34 repeticiones al 60 % del
1RM en prensa de piernas frente a ~11 en curl femoral, y el metaanálisis de
Nuzzo et al. (2024), sobre 952 tests y 7.289 personas, concluyó que **el
ejercicio es el único moderador que desplaza la curva de forma relevante** — el
sexo, la edad y el nivel de entrenamiento apenas influyen.

AldeaFit usa como modelo principal la ecuación de Marzagão (2026), ajustada
sobre **303.494 series reales cerca del fallo** registradas por 14.966 personas
en 388 ejercicios dentro de una app de entrenamiento:

```
1RM = w · ( 1 + (r − 1)^0.85 / ( −2.55 + 4.58 · ln w ) )
```

El denominador hace que el factor de conversión dependa del **peso absoluto**,
que es lo que permite a una sola ecuación comportarse distinto en un peso muerto
de 200 kg y en una elevación lateral de 12 kg sin que se le diga qué ejercicio
es. Redujo la inconsistencia un 17-22 % frente a las cuatro clásicas de
referencia, y mejoró en los 183 ejercicios con datos suficientes.

En la práctica, frente a Epley con una serie de 5:

| Peso | AldeaFit | Epley | Diferencia |
|---|---|---|---|
| 12 kg | 15,1 kg | 14,0 kg | +8,1 % |
| 60 kg | 69,8 kg | 70,0 kg | −0,2 % |
| 220 kg | 247,7 kg | 256,7 kg | −3,5 % |

> **Sobre las unidades:** `ln w` no es invariante de escala, así que la unidad en
> que se ajustó la ecuación cambia el resultado hasta un 5 %. El preprint no era
> accesible, de modo que la unidad se dedujo contrastando ambas hipótesis contra
> anclas publicadas de press de banca (≈2 reps al 95 %, ≈4 al 90 %, ≈8-9 al
> 80 %). Las libras encajan el doble de bien (RMSE 0,64 frente a 1,28
> repeticiones), lo que además coincide con el origen estadounidense del dataset.
> Los tests fijan esas anclas: si la unidad fuera la incorrecta, fallan.

Las siete clásicas se siguen mostrando, pero como **comparación** y etiquetadas
como lo que son.

| | Calculadora típica | AldeaFit |
|---|---|---|
| Modelo | 1 fórmula de laboratorio | Ajustado sobre 303.494 series reales |
| Sensible al peso | No | Sí — el multiplicador cambia con la carga |
| Sensible al ejercicio | No | Sí — sentadilla y press militar no dan lo mismo |
| Incertidumbre | ninguna | rango + fiabilidad alta/media/baja |
| Validación | `parseFloat` | rechaza `Infinity`, `1e999`, negativos, texto |
| 1 repetición | devuelve 103 % del peso | devuelve el peso real levantado |
| Series al fallo | asume siempre | soporta RIR (repeticiones en reserva) |
| Qué hacer después | nada | discos, calentamiento, nivel, progreso |
| Sin conexión | no | sí, instalable como app |
| Rastreo | analítica, cookies | ninguno |

## Funcionalidades

- **Calculadora 1RM** — datos reales de gimnasio con rango de confianza, desglose
  fórmula a fórmula y soporte de RIR para series que no llegan al fallo.
- **Cargador de barra** — dibuja la barra con los discos exactos por lado.
  Respeta el inventario real de tu gimnasio: si sólo tienes un par de 20 kg, te
  dice lo más cerca que puedes quedarte y cuánto te falta.
- **Tabla de porcentajes** — cada banda del 5 % con su peso, repeticiones
  aproximadas, zona de entrenamiento y la carga de discos correspondiente.
- **Calentamiento** — series de aproximación adaptadas a lo pesada que sea la
  sesión, con descansos y discos por serie.
- **Técnica** — figura 3D con superficie real que demuestra cada levantamiento,
  girable con el ratón o el dedo, más las claves de ejecución. No es un dibujo
  con degradados: el cuerpo es una malla de polígonos que se proyecta, se
  ilumina, se ordena por profundidad y se rellena en cada fotograma — un
  rasterizador propio sobre canvas. Por eso la barra puede pasar *por detrás*
  del cuello en sentadilla y *por delante* del pecho en press banca, y por eso
  el volumen se mantiene al girar la figura. Sin librería 3D, sin modelo binario
  y sin CDN, para no romper la CSP ni el presupuesto de tamaño.
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
│   ├── onerm.ts       Modelo de datos de gimnasio + 7 clásicas + porcentajes
│   ├── exercises.ts   Capacidad de repeticiones por ejercicio
│   ├── technique.ts   Esqueleto 3D, poses, cámara y claves por levantamiento
│   ├── anatomy.ts     Malla del cuerpo, la barra y el banco
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
permite testearla directamente. 126 tests cubren el modelo, la resolución de
discos, la validación, el almacenamiento y la geometría del cuerpo 3D.

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
- **La figura 3D se dibuja a 30 fps, no a 60.** Una repetición dura tres segundos
  y medio: a esa velocidad el ojo no distingue 60 de 30, y renderizar la
  superficie es lo más caro que hace la app. Dibujar la mitad de fotogramas
  reduce a la mitad el consumo de batería en el móvil del gimnasio.
- **La malla se adapta al tamaño del panel.** Un móvil dibuja la figura a un
  tercio del ancho de un escritorio y no puede resolver los mismos lados, así
  que se muestrean menos: la densidad escala con el ancho real, no con un
  breakpoint.

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
