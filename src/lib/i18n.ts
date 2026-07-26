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
    'Calculadora de fuerza offline: 1RM por consenso, discos de la barra, calentamiento y progreso. Sin cuentas y sin rastreo.',

  // Navigation
  'nav.calculator': 'Calculadora',
  'nav.percentages': 'Porcentajes',
  'nav.plates': 'Discos',
  'nav.warmup': 'Calentamiento',
  'nav.standards': 'Nivel',
  'nav.history': 'Progreso',
  'nav.settings': 'Ajustes',

  // Calculator
  'calc.title': 'Calculadora 1RM',
  'calc.subtitle': 'Repetición máxima por consenso de 7 fórmulas',
  'calc.weight': 'Peso',
  'calc.reps': 'Repeticiones',
  'calc.rir': 'RIR',
  'calc.rirHelp': 'Repeticiones en reserva: cuántas te quedaban al acabar la serie',
  'calc.lift': 'Ejercicio',
  'calc.submit': 'Calcular 1RM',
  'calc.result': 'Tu 1RM estimado',
  'calc.range': 'Rango',
  'calc.confidence': 'Fiabilidad',
  'calc.confidence.high': 'Alta',
  'calc.confidence.medium': 'Media',
  'calc.confidence.low': 'Baja',
  'calc.confidenceHelp.high': 'Pocas repeticiones y las fórmulas coinciden. Estimación sólida.',
  'calc.confidenceHelp.medium': 'Rango moderado. Útil para planificar, no para récords.',
  'calc.confidenceHelp.low':
    'Muchas repeticiones: las fórmulas divergen. Usa series de 5 o menos para afinar.',
  'calc.breakdown': 'Fórmula a fórmula',
  'calc.breakdownHelp':
    'Cada fórmula se ajustó con datos distintos. Mostramos la mediana, no la más optimista.',
  'calc.notApplicable': 'Fuera de rango',
  'calc.effectiveReps': 'Repeticiones efectivas',
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
  'pct.subtitle': 'Qué peso mover para cada objetivo',
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

  'calc.title': '1RM Calculator',
  'calc.subtitle': 'One-rep max by consensus of 7 formulas',
  'calc.weight': 'Weight',
  'calc.reps': 'Repetitions',
  'calc.rir': 'RIR',
  'calc.rirHelp': 'Reps in reserve: how many you had left when you racked it',
  'calc.lift': 'Exercise',
  'calc.submit': 'Calculate 1RM',
  'calc.result': 'Your estimated 1RM',
  'calc.range': 'Range',
  'calc.confidence': 'Confidence',
  'calc.confidence.high': 'High',
  'calc.confidence.medium': 'Medium',
  'calc.confidence.low': 'Low',
  'calc.confidenceHelp.high': 'Low reps and the formulas agree. Solid estimate.',
  'calc.confidenceHelp.medium': 'Moderate spread. Good for programming, not for records.',
  'calc.confidenceHelp.low':
    'High reps: the formulas diverge. Use sets of 5 or fewer to sharpen it.',
  'calc.breakdown': 'Formula by formula',
  'calc.breakdownHelp':
    'Each formula was fitted on different data. We show the median, not the most flattering one.',
  'calc.notApplicable': 'Out of range',
  'calc.effectiveReps': 'Effective reps',
  'calc.save': 'Save to progress',
  'calc.saved': 'Saved',
  'calc.share': 'Share',
  'calc.copied': 'Copied',
  'calc.newPr': 'Personal record!',
  'calc.highRepWarning':
    'Above 12 reps the estimate is an extrapolation. Treat it as a rough guide.',
  'calc.empty': 'Enter a weight and rep count to begin.',

  'pct.title': 'Percentage table',
  'pct.subtitle': 'What to load for every goal',
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
