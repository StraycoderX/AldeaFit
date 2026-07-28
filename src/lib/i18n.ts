/**
 * Translations.
 *
 * A plain typed dictionary rather than a library: the app has one namespace and
 * no pluralisation rules worth 40 kB of runtime. `TranslationKey` is derived
 * from the Spanish dictionary, so an English entry that is missing or misspelled
 * is a compile error rather than a blank label in production.
 */

export type Locale = 'es' | 'en';

const es = {
  // Brand & shell
  'app.name': 'AldeaFit',
  'app.tagline': 'Tu fuerza, calculada de verdad',
  'app.description':
    'Calculadora de fuerza offline: 1RM con datos reales de gimnasio, discos de la barra, calentamiento y progreso. Sin cuentas y sin rastreo.',

  // Navigation
  'nav.calculator': 'Calculadora',
  'nav.percentages': 'Porcentajes',
  'nav.plates': 'Discos',
  'nav.warmup': 'Calentamiento',
  'nav.standards': 'Nivel',
  'nav.history': 'Progreso',
  'nav.settings': 'Ajustes',
  'nav.technique': 'Técnica',

  // Technique
  'tech.title': 'Técnica',
  'tech.subtitle': 'Cómo ejecutar cada levantamiento',
  'tech.cues': 'Claves de ejecución',
  'tech.dragHint': 'Arrastra para girar la figura',
  'tech.play': 'Reproducir',
  'tech.pause': 'Pausar',
  'tech.figureLabel': 'Figura 3D demostrando la técnica de {lift}',
  'tech.disclaimer':
    'Guía general, no sustituye la supervisión de un entrenador. Si tienes molestias o dudas con un movimiento, revísalo con un profesional antes de cargar peso.',

  'tech.squat.cue1':
    'Barra sobre los trapecios, no sobre el cuello. Agarre firme, codos bajo la barra y pecho alto. Pies a la anchura de los hombros con las puntas ligeramente hacia fuera.',
  'tech.squat.cue2':
    'Toma aire y aprieta el abdomen antes de bajar. Inicia el movimiento llevando la cadera atrás y las rodillas hacia fuera, en la dirección de las puntas de los pies.',
  'tech.squat.cue3':
    'Baja hasta que la cadera quede por debajo de la rodilla, manteniendo la barra alineada sobre el mediopié. La espalda mantiene su curva natural: ni se redondea ni se hiperextiende.',
  'tech.squat.cue4':
    'Sube empujando el suelo con todo el pie y llevando cadera y pecho a la vez. Si la cadera sube antes que el pecho, el peso es excesivo.',

  'tech.bench.cue1':
    'Cinco puntos de apoyo: cabeza, hombros y glúteo en el banco, ambos pies en el suelo. Junta las escápulas y mantenlas retraídas toda la serie.',
  'tech.bench.cue2':
    'Agarre algo más ancho que los hombros, muñeca recta sobre el antebrazo. La barra sale del soporte y se estabiliza sobre los hombros.',
  'tech.bench.cue3':
    'Baja controlado hasta tocar el pecho a la altura del esternón, con los codos a unos 45-75° del torso, no abiertos en cruz.',
  'tech.bench.cue4':
    'Empuja la barra en diagonal hacia arriba y ligeramente atrás, hasta la vertical de los hombros. Los glúteos no se despegan del banco.',

  'tech.deadlift.cue1':
    'Barra sobre el mediopié, casi tocando la espinilla. Pies a la anchura de la cadera. Agarre justo por fuera de las piernas.',
  'tech.deadlift.cue2':
    'Baja la cadera hasta llegar a la barra sin redondear la espalda. Pecho alto, dorsales activos, hombros ligeramente por delante de la barra.',
  'tech.deadlift.cue3':
    'Aprieta el abdomen y tira eliminando la holgura de la barra antes de despegarla. Empuja el suelo con las piernas en vez de tirar con la espalda.',
  'tech.deadlift.cue4':
    'La barra sube pegada al cuerpo. Termina de pie, extendiendo cadera y rodillas a la vez. No hiperextiendas la espalda al bloquear.',

  'tech.ohp.cue1':
    'Barra sobre la clavícula, codos ligeramente por delante. Agarre a la anchura de los hombros, muñecas rectas.',
  'tech.ohp.cue2':
    'Aprieta glúteo y abdomen para que la lumbar no compense. Los pies quedan a la anchura de la cadera.',
  'tech.ohp.cue3':
    'Aparta ligeramente la cabeza hacia atrás para dejar pasar la barra y empuja en línea recta vertical.',
  'tech.ohp.cue4':
    'Bloquea con la barra sobre la mitad del pie, no por delante. Cabeza vuelve a su sitio y hombros activos arriba.',

  'tech.row.cue1':
    'Cadera atrás hasta inclinar el torso entre 15 y 45° respecto a la horizontal. Rodillas algo flexionadas, espalda neutra.',
  'tech.row.cue2':
    'Agarre a la anchura de los hombros. Deja los brazos colgar en vertical y la barra cerca de las piernas.',
  'tech.row.cue3':
    'Tira llevando los codos hacia atrás y las escápulas hacia el centro, no solo doblando los brazos.',
  'tech.row.cue4':
    'Baja controlado sin dejar que el torso se levante. Si tienes que impulsar con la cadera, el peso es excesivo.',

  // Calculator
  'calc.title': 'Calculadora 1RM',
  'calc.subtitle': 'Estimada con datos reales de gimnasio, no con fórmulas de laboratorio',
  'calc.weight': 'Peso',
  'calc.reps': 'Repeticiones',
  'calc.rir': 'RIR',
  'calc.rirHelp': 'Repeticiones en reserva: cuántas te quedaban al acabar la serie',
  'calc.lift': 'Ejercicio',
  'calc.submit': 'Calcular 1RM',
  'calc.result': 'Tu 1RM estimado',
  'calc.range': 'Rango de las clásicas',
  'calc.confidence': 'Fiabilidad',
  'calc.confidence.high': 'Alta',
  'calc.confidence.medium': 'Media',
  'calc.confidence.low': 'Baja',
  'calc.confidenceHelp.high': 'Pocas repeticiones y las fórmulas coinciden. Estimación sólida.',
  'calc.confidenceHelp.medium': 'Rango moderado. Útil para planificar, no para récords.',
  'calc.confidenceHelp.low':
    'Muchas repeticiones: las fórmulas divergen. Usa series de 5 o menos para afinar.',
  'calc.breakdown': 'Comparación con las fórmulas clásicas',
  'calc.breakdownHelp':
    'Las 7 clásicas se ajustaron en los años 80-90, casi todas con press de banca, y son lineales en el peso: dan el mismo multiplicador con 20 kg que con 200 kg. Por eso se agrupan tanto entre sí.',
  'calc.primaryHelp':
    'Modelo ajustado sobre 303.494 series reales cerca del fallo (14.966 personas, 388 ejercicios). Su factor de conversión depende del peso absoluto, así que responde distinto a un peso muerto pesado que a una elevación lateral.',
  'calc.primaryBadge': 'Datos de gimnasio',
  'calc.classicalLabel': 'Clásicas (lineales)',
  'calc.notApplicable': 'Fuera de rango',
  'calc.effectiveReps': 'Repeticiones efectivas',
  'calc.liftAdjust':
    'Ajuste por {lift}: {delta} respecto a press banca. En sentadilla se aguantan más repeticiones al mismo %1RM, así que la misma serie implica un máximo algo menor.',
  'calc.save': 'Guardar en progreso',
  'calc.saved': 'Guardado',
  'calc.share': 'Compartir',
  'calc.copied': 'Copiado',
  'calc.newPr': '¡Récord personal!',
  'calc.highRepWarning':
    'Por encima de 12 repeticiones la estimación es una extrapolación. Tómala como orientación.',
  'calc.empty': 'Introduce un peso y unas repeticiones para empezar.',

  // Percentages
  'pct.title': 'Tabla de porcentajes',
  'pct.subtitle': 'Calculado desde tu 1RM, no de una tabla fija',
  'pct.percent': '%1RM',
  'pct.weight': 'Peso',
  'pct.reps': 'Reps aprox.',
  'pct.loading': 'Carga',
  'pct.setOneRm': '1RM de referencia',
  'pct.useCalculated': 'Usar el calculado',
  'pct.zone': 'Zona',
  'pct.zone.max': 'Fuerza máxima',
  'pct.zone.strength': 'Fuerza',
  'pct.zone.hypertrophy': 'Hipertrofia',
  'pct.zone.endurance': 'Resistencia',

  // Plates
  'plates.title': 'Cargador de barra',
  'plates.subtitle': 'Qué discos poner, por lado',
  'plates.target': 'Peso objetivo',
  'plates.bar': 'Barra',
  'plates.perSide': 'por lado',
  'plates.exact': 'Carga exacta',
  'plates.closest': 'Lo más cerca posible',
  'plates.off': 'te faltan',
  'plates.over': 'te sobran',
  'plates.belowBar': 'El objetivo pesa menos que la barra vacía.',
  'plates.inventory': 'Discos disponibles',
  'plates.inventoryHelp': 'Ajusta lo que tiene tu gimnasio. Se guarda en tu dispositivo.',
  'plates.available': 'unidades',
  'plates.reset': 'Restaurar',
  'plates.total': 'Total en la barra',
  'plates.emptyBar': 'Solo la barra',

  // Warm-up
  'warmup.title': 'Calentamiento',
  'warmup.subtitle': 'Series de aproximación hasta tu peso de trabajo',
  'warmup.working': 'Peso de trabajo',
  'warmup.workingReps': 'Reps de trabajo',
  'warmup.set': 'Serie',
  'warmup.rest': 'Descanso',
  'warmup.workingSet': 'Serie de trabajo',
  'warmup.duration': 'Duración estimada',
  'warmup.barOnly': 'Barra vacía',

  // Standards
  'standards.title': 'Tu nivel de fuerza',
  'standards.subtitle': 'Comparado con tu peso corporal',
  'standards.bodyweight': 'Peso corporal',
  'standards.sex': 'Sexo',
  'standards.sex.male': 'Hombre',
  'standards.sex.female': 'Mujer',
  'standards.ratio': 'Ratio fuerza/peso',
  'standards.level': 'Nivel',
  'standards.dots': 'Puntos DOTS',
  'standards.dotsHelp':
    'DOTS normaliza tu marca por peso corporal. Permite comparar levantadores de categorías distintas.',
  'standards.nextLevel': 'Siguiente nivel',
  'standards.toGo': 'te faltan',
  'standards.maxLevel': 'Has alcanzado el nivel máximo de la tabla.',
  'standards.level.beginner': 'Principiante',
  'standards.level.novice': 'Novato',
  'standards.level.intermediate': 'Intermedio',
  'standards.level.advanced': 'Avanzado',
  'standards.level.elite': 'Élite',
  'standards.disclaimer':
    'Tablas orientativas para levantadores naturales en competición sin equipamiento.',

  // History
  'history.title': 'Tu progreso',
  'history.subtitle': 'Todo guardado en tu dispositivo',
  'history.empty': 'Aún no has guardado ningún cálculo.',
  'history.emptyHint': 'Calcula tu 1RM y pulsa «Guardar en progreso».',
  'history.best': 'Mejor marca',
  'history.entries': 'registros',
  'history.delete': 'Borrar',
  'history.filter': 'Ejercicio',
  'history.all': 'Todos',
  'history.change': 'Cambio',
  'history.chartLabel': 'Evolución del 1RM estimado',
  'history.date': 'Fecha',

  // Lifts
  'lift.squat': 'Sentadilla',
  'lift.bench': 'Press banca',
  'lift.deadlift': 'Peso muerto',
  'lift.ohp': 'Press militar',
  'lift.row': 'Remo',
  'lift.other': 'Otro',

  // Settings
  'settings.title': 'Ajustes',
  'settings.subtitle': 'Preferencias y datos',
  'settings.units': 'Unidades',
  'settings.theme': 'Tema',
  'settings.theme.dark': 'Oscuro',
  'settings.theme.light': 'Claro',
  'settings.theme.system': 'Sistema',
  'settings.language': 'Idioma',
  'settings.data': 'Tus datos',
  'settings.export': 'Exportar copia',
  'settings.import': 'Importar copia',
  'settings.clear': 'Borrar todo',
  'settings.clearConfirm': '¿Seguro? Se borrarán tus ajustes y todo tu historial.',
  'settings.clearConfirmYes': 'Sí, borrar todo',
  'settings.cancel': 'Cancelar',
  'settings.importOk': 'Importados {n} registros',
  'settings.importSkipped': '{n} registros descartados por formato inválido',
  'settings.importError': 'No se pudo leer el archivo',
  'settings.privacy': 'Privacidad',
  'settings.privacyText':
    'AldeaFit funciona por completo en tu navegador. No hay cuentas, ni servidores, ni analítica: tus datos nunca salen de este dispositivo.',
  'settings.install': 'Instalar app',
  'settings.installHint': 'Añádela a tu pantalla de inicio y úsala sin conexión.',
  'settings.about': 'Acerca de',
  'settings.version': 'Versión',

  // Common
  'common.close': 'Cerrar',
  'common.search': 'Buscar',
  'common.offline': 'Sin conexión — todo sigue funcionando',
  'common.menu': 'Menú',
  'common.optional': 'opcional',
  'common.of': 'de',
  'common.skipToContent': 'Ir al contenido',

  // Command palette
  'palette.title': 'Ir a…',
  'palette.placeholder': 'Buscar sección o acción',
  'palette.empty': 'Sin resultados',
  'palette.hint': 'para abrir',

  // Errors
  'error.required': 'Campo obligatorio',
  'error.notANumber': 'Introduce un número válido',
  'error.tooLow': 'Valor demasiado bajo',
  'error.tooHigh': 'Valor demasiado alto',
  'error.title': 'Algo ha fallado',
  'error.body': 'La aplicación ha encontrado un error inesperado. Tus datos guardados están intactos.',
  'error.reload': 'Recargar',
} as const;

export type TranslationKey = keyof typeof es;

const en: Record<TranslationKey, string> = {
  'app.name': 'AldeaFit',
  'app.tagline': 'Your strength, properly calculated',
  'app.description':
    'Offline strength calculator: consensus 1RM, plate loading, warm-up ramps and progress. No accounts, no tracking.',

  'nav.calculator': 'Calculator',
  'nav.percentages': 'Percentages',
  'nav.plates': 'Plates',
  'nav.warmup': 'Warm-up',
  'nav.standards': 'Level',
  'nav.history': 'Progress',
  'nav.settings': 'Settings',
  'nav.technique': 'Technique',

  // Technique
  'tech.title': 'Technique',
  'tech.subtitle': 'How to perform each lift',
  'tech.cues': 'Execution cues',
  'tech.dragHint': 'Drag to rotate the figure',
  'tech.play': 'Play',
  'tech.pause': 'Pause',
  'tech.figureLabel': '3D figure demonstrating {lift} technique',
  'tech.disclaimer':
    'General guidance, not a substitute for coaching. If a movement causes discomfort or you are unsure, review it with a professional before loading it.',

  'tech.squat.cue1':
    'Bar on the traps, never on the neck. Firm grip, elbows under the bar, chest tall. Feet about shoulder width with toes turned slightly out.',
  'tech.squat.cue2':
    'Breathe in and brace before descending. Start by sending the hips back and the knees out, tracking over the toes.',
  'tech.squat.cue3':
    'Descend until the hip crease is below the knee, keeping the bar stacked over mid-foot. The back holds its natural curve — neither rounded nor hyperextended.',
  'tech.squat.cue4':
    'Drive up through the whole foot, hips and chest rising together. If the hips shoot up first, the load is too heavy.',

  'tech.bench.cue1':
    'Five points of contact: head, shoulders and glutes on the bench, both feet on the floor. Pinch the shoulder blades together and keep them retracted.',
  'tech.bench.cue2':
    'Grip slightly wider than the shoulders, wrist stacked over the forearm. Unrack and stabilise the bar over the shoulders.',
  'tech.bench.cue3':
    'Lower under control to touch the chest around the sternum, elbows roughly 45-75° from the torso rather than flared straight out.',
  'tech.bench.cue4':
    'Press diagonally up and slightly back, finishing over the shoulders. The glutes stay on the bench throughout.',

  'tech.deadlift.cue1':
    'Bar over mid-foot, almost touching the shin. Feet hip width. Grip just outside the legs.',
  'tech.deadlift.cue2':
    'Drop the hips to reach the bar without rounding the back. Chest tall, lats engaged, shoulders slightly ahead of the bar.',
  'tech.deadlift.cue3':
    'Brace and pull the slack out of the bar before it leaves the floor. Push the floor away with the legs rather than pulling with the back.',
  'tech.deadlift.cue4':
    'The bar travels close to the body. Finish standing, extending hips and knees together. Do not hyperextend the back to lock out.',

  'tech.ohp.cue1':
    'Bar resting on the collarbone, elbows slightly ahead. Shoulder-width grip, wrists straight.',
  'tech.ohp.cue2':
    'Squeeze glutes and brace so the lower back does not compensate. Feet about hip width.',
  'tech.ohp.cue3':
    'Move the head back just enough to clear the bar, then press in a straight vertical line.',
  'tech.ohp.cue4':
    'Lock out with the bar over mid-foot, not in front of it. Head returns to neutral, shoulders active overhead.',

  'tech.row.cue1':
    'Hinge at the hips until the torso is 15-45° from horizontal. Knees softly bent, back neutral.',
  'tech.row.cue2':
    'Shoulder-width grip. Let the arms hang vertically with the bar close to the legs.',
  'tech.row.cue3':
    'Pull by driving the elbows back and the shoulder blades together, not just by bending the arms.',
  'tech.row.cue4':
    'Lower under control without letting the torso rise. If you need to heave with the hips, the load is too heavy.',

  'calc.title': '1RM Calculator',
  'calc.subtitle': 'Estimated from real gym data, not lab formulas',
  'calc.weight': 'Weight',
  'calc.reps': 'Repetitions',
  'calc.rir': 'RIR',
  'calc.rirHelp': 'Reps in reserve: how many you had left when you racked it',
  'calc.lift': 'Exercise',
  'calc.submit': 'Calculate 1RM',
  'calc.result': 'Your estimated 1RM',
  'calc.range': 'Classical range',
  'calc.confidence': 'Confidence',
  'calc.confidence.high': 'High',
  'calc.confidence.medium': 'Medium',
  'calc.confidence.low': 'Low',
  'calc.confidenceHelp.high': 'Low reps and the formulas agree. Solid estimate.',
  'calc.confidenceHelp.medium': 'Moderate spread. Good for programming, not for records.',
  'calc.confidenceHelp.low':
    'High reps: the formulas diverge. Use sets of 5 or fewer to sharpen it.',
  'calc.breakdown': 'Compared with the classical formulas',
  'calc.breakdownHelp':
    'The 7 classics were fitted in the 1980s-90s, mostly on bench press, and are linear in the load: they give the same multiplier at 20 kg as at 200 kg. That is why they cluster so tightly.',
  'calc.primaryHelp':
    'Model fitted on 303,494 real near-failure sets (14,966 people, 388 exercises). Its conversion factor depends on the absolute load, so it responds differently to a heavy deadlift than to a lateral raise.',
  'calc.primaryBadge': 'Gym data',
  'calc.classicalLabel': 'Classical (linear)',
  'calc.notApplicable': 'Out of range',
  'calc.effectiveReps': 'Effective reps',
  'calc.liftAdjust':
    '{lift} adjustment: {delta} vs bench press. Squats sustain more reps at the same %1RM, so the same set implies a slightly lower max.',
  'calc.save': 'Save to progress',
  'calc.saved': 'Saved',
  'calc.share': 'Share',
  'calc.copied': 'Copied',
  'calc.newPr': 'Personal record!',
  'calc.highRepWarning':
    'Above 12 reps the estimate is an extrapolation. Treat it as a rough guide.',
  'calc.empty': 'Enter a weight and rep count to begin.',

  'pct.title': 'Percentage table',
  'pct.subtitle': 'Derived from your 1RM, not a fixed chart',
  'pct.percent': '%1RM',
  'pct.weight': 'Weight',
  'pct.reps': 'Approx. reps',
  'pct.loading': 'Loading',
  'pct.setOneRm': 'Reference 1RM',
  'pct.useCalculated': 'Use calculated',
  'pct.zone': 'Zone',
  'pct.zone.max': 'Max strength',
  'pct.zone.strength': 'Strength',
  'pct.zone.hypertrophy': 'Hypertrophy',
  'pct.zone.endurance': 'Endurance',

  'plates.title': 'Bar loader',
  'plates.subtitle': 'Which plates to load, per side',
  'plates.target': 'Target weight',
  'plates.bar': 'Bar',
  'plates.perSide': 'per side',
  'plates.exact': 'Exact load',
  'plates.closest': 'Closest possible',
  'plates.off': 'short by',
  'plates.over': 'over by',
  'plates.belowBar': 'The target is lighter than the empty bar.',
  'plates.inventory': 'Available plates',
  'plates.inventoryHelp': 'Match your gym. Saved on your device.',
  'plates.available': 'units',
  'plates.reset': 'Reset',
  'plates.total': 'Total on the bar',
  'plates.emptyBar': 'Bar only',

  'warmup.title': 'Warm-up',
  'warmup.subtitle': 'Ramp-up sets to your working weight',
  'warmup.working': 'Working weight',
  'warmup.workingReps': 'Working reps',
  'warmup.set': 'Set',
  'warmup.rest': 'Rest',
  'warmup.workingSet': 'Working set',
  'warmup.duration': 'Estimated duration',
  'warmup.barOnly': 'Empty bar',

  'standards.title': 'Your strength level',
  'standards.subtitle': 'Relative to your bodyweight',
  'standards.bodyweight': 'Bodyweight',
  'standards.sex': 'Sex',
  'standards.sex.male': 'Male',
  'standards.sex.female': 'Female',
  'standards.ratio': 'Strength-to-weight ratio',
  'standards.level': 'Level',
  'standards.dots': 'DOTS points',
  'standards.dotsHelp':
    'DOTS normalises your lift by bodyweight, so lifters in different classes can be compared.',
  'standards.nextLevel': 'Next level',
  'standards.toGo': 'to go',
  'standards.maxLevel': 'You have reached the top of the table.',
  'standards.level.beginner': 'Beginner',
  'standards.level.novice': 'Novice',
  'standards.level.intermediate': 'Intermediate',
  'standards.level.advanced': 'Advanced',
  'standards.level.elite': 'Elite',
  'standards.disclaimer': 'Indicative tables for raw, drug-free lifters.',

  'history.title': 'Your progress',
  'history.subtitle': 'All stored on your device',
  'history.empty': 'No saved calculations yet.',
  'history.emptyHint': 'Calculate your 1RM and hit "Save to progress".',
  'history.best': 'Best result',
  'history.entries': 'records',
  'history.delete': 'Delete',
  'history.filter': 'Exercise',
  'history.all': 'All',
  'history.change': 'Change',
  'history.chartLabel': 'Estimated 1RM over time',
  'history.date': 'Date',

  'lift.squat': 'Squat',
  'lift.bench': 'Bench press',
  'lift.deadlift': 'Deadlift',
  'lift.ohp': 'Overhead press',
  'lift.row': 'Row',
  'lift.other': 'Other',

  'settings.title': 'Settings',
  'settings.subtitle': 'Preferences and data',
  'settings.units': 'Units',
  'settings.theme': 'Theme',
  'settings.theme.dark': 'Dark',
  'settings.theme.light': 'Light',
  'settings.theme.system': 'System',
  'settings.language': 'Language',
  'settings.data': 'Your data',
  'settings.export': 'Export backup',
  'settings.import': 'Import backup',
  'settings.clear': 'Delete everything',
  'settings.clearConfirm': 'Are you sure? This erases your settings and all history.',
  'settings.clearConfirmYes': 'Yes, delete it all',
  'settings.cancel': 'Cancel',
  'settings.importOk': 'Imported {n} records',
  'settings.importSkipped': '{n} records discarded as invalid',
  'settings.importError': 'Could not read the file',
  'settings.privacy': 'Privacy',
  'settings.privacyText':
    'AldeaFit runs entirely in your browser. No accounts, no servers, no analytics — your data never leaves this device.',
  'settings.install': 'Install app',
  'settings.installHint': 'Add it to your home screen and use it offline.',
  'settings.about': 'About',
  'settings.version': 'Version',

  'common.close': 'Close',
  'common.search': 'Search',
  'common.offline': 'Offline — everything still works',
  'common.menu': 'Menu',
  'common.optional': 'optional',
  'common.of': 'of',
  'common.skipToContent': 'Skip to content',

  'palette.title': 'Go to…',
  'palette.placeholder': 'Search sections and actions',
  'palette.empty': 'No results',
  'palette.hint': 'to open',

  'error.required': 'Required field',
  'error.notANumber': 'Enter a valid number',
  'error.tooLow': 'Value is too low',
  'error.tooHigh': 'Value is too high',
  'error.title': 'Something went wrong',
  'error.body': 'The app hit an unexpected error. Your saved data is intact.',
  'error.reload': 'Reload',
};

const DICTIONARIES: Record<Locale, Record<TranslationKey, string>> = { es, en };

/**
 * Look up a translation, optionally interpolating `{name}` placeholders.
 * Falls back to the key itself so a missing string is visible, not invisible.
 */
export function translate(
  locale: Locale,
  key: TranslationKey,
  params?: Record<string, string | number>,
): string {
  const template = DICTIONARIES[locale][key] ?? key;
  if (!params) return template;

  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match,
  );
}

/** Best-effort locale detection from the browser, defaulting to Spanish. */
export function detectLocale(): Locale {
  if (typeof navigator === 'undefined') return 'es';
  return navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'es';
}
