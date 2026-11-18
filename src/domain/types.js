/**
 * DOMINIO: Definiciones de objetos, biomas, niveles, modos de juego y reglas de compatibilidad
 * Lógica pura sin dependencias de UI o librerías externas.
 */

export const OFFICIAL_TITLE = 'Xatruch Joy Bomber';

export const HONDURAS_CITIES = [
  { id: 'TEGUCIGALPA', name: 'Tegucigalpa', nx: 0.48, ny: 0.65, stageIndex: 0, playable: true },
  { id: 'SPS', name: 'San Pedro Sula', nx: 0.30, ny: 0.30, stageIndex: 1, playable: true },
  { id: 'COPAN', name: 'Copán', nx: 0.14, ny: 0.45, stageIndex: 2, playable: true },
  { id: 'GUARIZAMA', name: 'Guarizama', nx: 0.63, ny: 0.50, stageIndex: 3, playable: false },
  { id: 'COMAYAGUA', name: 'Comayagua', nx: 0.40, ny: 0.56, stageIndex: 4, playable: false },
  { id: 'JESUS_DE_OTORO', name: 'Jesús de Otoro', nx: 0.31, ny: 0.60, stageIndex: 5, playable: false }
];

export const BOSS_WEAPONS = [
  { id: 'BULLET', name: 'Balas', icon: '🔫', color: '#fbbf24', speed: 520 },
  { id: 'FIRE', name: 'Fuego', icon: '🔥', color: '#f97316', speed: 460 },
  { id: 'WATER', name: 'Agua', icon: '💧', color: '#38bdf8', speed: 470 },
  { id: 'ICE', name: 'Hielo', icon: '❄️', color: '#a5f3fc', speed: 450 }
];

export const BOSS_CONFIGS = {
  TEGUCIGALPA: {
    id: 'TEGUCIGALPA',
    name: 'Monstruo del Tráfico Capitalino',
    maxHp: 220,
    effectiveWeapons: ['BULLET', 'FIRE', 'ICE'],
    enrageWeapons: [],
    attacks: ['¡PIIIP! 📢', '¡MUEVE PUES! 🤬', '¡2 HORAS EN EL ANILLO!', '¡NO HAY PASO! 🚗'],
    victoryQuote:
      '¡Oh serpiente de mil cabezas e igual número de colas, criatura mítica de humo y hierro! Para tu deshonra caes bajo la espada de este general caído que se levanta; ¡habitantes de esta villa, sean libres!'
  },
  SPS: {
    id: 'SPS',
    name: 'Titán de Fuego y Calor',
    maxHp: 240,
    effectiveWeapons: ['WATER', 'ICE'],
    enrageWeapons: ['FIRE', 'BULLET'],
    attacks: ['☀️ ¡RAYO DE CALOR!', '🔥 ¡FURIA DEL VALLE!', '🥵 ¡SOFOCO TOTAL!', '💥 ¡LLAMARADA!'],
    victoryQuote:
      'Apagóse el fuego de tus entrañas, ciudad de los zorzales y de la gente que goza del trabajo.'
  },
  COPAN: {
    id: 'COPAN',
    name: 'Quetzalcóatl, Serpiente Emplumada',
    maxHp: 260,
    effectiveWeapons: ['BULLET', 'FIRE', 'WATER', 'ICE'],
    enrageWeapons: [],
    attacks: ['🐍 ¡FURIA MAYA!', '🐆 ¡RUGIDO DEL JAGUAR!', '🌊 ¡TORRENTE SAGRADO!'],
    victoryQuote:
      'Monstruo precolombino, agitador del espíritu, Prometeo mesoamericano, te venzo y reconozco tu grandeza, pero son otros tiempos; ¡liberada queda la Copán de mi gente!'
  }
};

export const GAME_MODES = {
  STORY: 'STORY',
  CITY: 'CITY',
  GEOMETRY: 'GEOMETRY',
  HIGHWAY: 'HIGHWAY'
};

export const DIFFICULTY_LEVELS = {
  EASY: {
    id: 'EASY',
    label: 'Fácil',
    baseSpeed: 76,
    speedRamp: 1.0,
    maxSpeed: 210,
    highwayBase: 145,
    highwayRamp: 1.4,
    highwayMax: 270,
    joyDecay: 0.45,
    joyPenalty: 6,
    windStartTime: 180, // 3 minutos
    scoreMultiplier: 0.6,
    nextDifficulty: 'NORMAL'
  },
  NORMAL: {
    id: 'NORMAL',
    label: 'Normal',
    baseSpeed: 92,
    speedRamp: 1.6,
    maxSpeed: 310,
    highwayBase: 170,
    highwayRamp: 2.2,
    highwayMax: 370,
    joyDecay: 0.75,
    joyPenalty: 9,
    windStartTime: 150, // 2.5 minutos
    scoreMultiplier: 0.85,
    nextDifficulty: 'HARD'
  },
  HARD: {
    id: 'HARD',
    label: 'Difícil',
    baseSpeed: 105,
    speedRamp: 2.4,
    maxSpeed: 430,
    highwayBase: 195,
    highwayRamp: 3.2,
    highwayMax: 480,
    joyDecay: 1.1,
    joyPenalty: 12,
    windStartTime: 120, // 2 minutos
    scoreMultiplier: 1.0,
    nextDifficulty: null
  }
};

export const STORY_STAGES = [
  {
    stageIndex: 0,
    subMode: 'CITY',
    levelIndex: 0,
    title: 'Cap. 1: Tegucigalpa',
    subtitle: 'Lleva alegría a Juana Laínez, Centro Cívico, Estadio y Catedral'
  },
  {
    stageIndex: 1,
    subMode: 'CITY',
    levelIndex: 1,
    title: 'Cap. 2: San Pedro Sula',
    subtitle: 'Vuela sobre el Merendón, Estadio Olímpico y Los Bordos'
  },
  {
    stageIndex: 2,
    subMode: 'CITY',
    levelIndex: 2,
    title: 'Cap. 3: Copán Ruinas',
    subtitle: 'Templo Rosalila, Pirámides Mayas, Cafetales y Aldeas'
  },
  {
    stageIndex: 3,
    subMode: 'GEOMETRY',
    levelIndex: 0,
    title: 'Cap. 4: Reconstrucción I',
    subtitle: 'Encaja las estructuras básicas para reconstruir plazas'
  },
  {
    stageIndex: 4,
    subMode: 'GEOMETRY',
    levelIndex: 1,
    title: 'Cap. 5: Reconstrucción II',
    subtitle: 'Gran Final: encaja las figuras complejas de precisión'
  }
];

export const PLANES_CATALOG = [
  {
    id: 'CLASSIC',
    name: 'Biplano Xatruch',
    unlockStars: 0,
    palette: { O: '#0f172a', R: '#ef4444', W: '#f8fafc', S: '#94a3b8', C: '#38bdf8', G: '#fbbf24', B: '#334155' }
  },
  {
    id: 'AZUL_BLANCO',
    name: 'Halcón Azul-Blanco',
    unlockStars: 3,
    palette: { O: '#0f172a', R: '#0284c7', W: '#f8fafc', S: '#bae6fd', C: '#fde047', G: '#38bdf8', B: '#1e3a8a' }
  },
  {
    id: 'DORADO',
    name: 'Águila Dorada',
    unlockStars: 6,
    palette: { O: '#0f172a', R: '#d97706', W: '#fef08a', S: '#eab308', C: '#38bdf8', G: '#ffffff', B: '#78350f' }
  },
  {
    id: 'LEYENDA',
    name: 'Relámpago Neón',
    unlockStars: 9,
    palette: { O: '#020617', R: '#a855f7', W: '#1e293b', S: '#0f172a', C: '#22d3ee', G: '#f43f5e', B: '#334155' }
  }
];

export const ITEM_TYPES = {
  WATER: 'WATER',
  FOOD: 'FOOD',
  MONEY: 'MONEY',
  BIBLE: 'BIBLE',
  TOY: 'TOY',
  // Nivel 1 Geometría (Básicas)
  TRIANGLE: 'TRIANGLE',
  SQUARE: 'SQUARE',
  CIRCLE: 'CIRCLE',
  STAR: 'STAR',
  // Nivel 2 Geometría (Complejas)
  HEXAGON: 'HEXAGON',
  DIAMOND: 'DIAMOND',
  CROSS: 'CROSS',
  CRESCENT: 'CRESCENT'
};

export const ITEMS_CATALOG = {
  [ITEM_TYPES.WATER]: {
    id: ITEM_TYPES.WATER,
    name: 'Bomba de Agua',
    shortName: 'Agua',
    icon: '💧',
    color: '#38bdf8',
    splashColor: '#0284c7',
    mass: 1.15,
    drag: 0.99,
    description: 'Vital para sedientos y apagar fuegos'
  },
  [ITEM_TYPES.FOOD]: {
    id: ITEM_TYPES.FOOD,
    name: 'Canasta de Comida',
    shortName: 'Comida',
    icon: '🥖',
    color: '#fbbf24',
    splashColor: '#d97706',
    mass: 1.0,
    drag: 0.985,
    description: 'Nutrición para familias y cinturones de pobreza'
  },
  [ITEM_TYPES.MONEY]: {
    id: ITEM_TYPES.MONEY,
    name: 'Apoyo Económico',
    shortName: 'Dinero',
    icon: '💵',
    color: '#22c55e',
    splashColor: '#15803d',
    mass: 0.9,
    drag: 0.975,
    description: 'Ayuda financiera directa para quienes lo necesitan'
  },
  [ITEM_TYPES.BIBLE]: {
    id: ITEM_TYPES.BIBLE,
    name: 'Biblia / Sabiduría',
    shortName: 'Biblia',
    icon: '📖',
    color: '#c084fc',
    splashColor: '#9333ea',
    mass: 0.95,
    drag: 0.98,
    description: 'Paz espiritual para el Centro Cívico y zonas modernas'
  },
  [ITEM_TYPES.TOY]: {
    id: ITEM_TYPES.TOY,
    name: 'Caja de Regalos',
    shortName: 'Regalos',
    icon: '🎁',
    color: '#f43f5e',
    splashColor: '#e11d48',
    mass: 0.85,
    drag: 0.975,
    description: 'Alegría pura y juguetes para los niños'
  },
  // Geometría Nivel 1
  [ITEM_TYPES.TRIANGLE]: {
    id: ITEM_TYPES.TRIANGLE,
    name: 'Prisma Triangular',
    shortName: 'Triángulo',
    icon: '🔺',
    color: '#22d3ee',
    splashColor: '#06b6d4',
    mass: 1.05,
    drag: 0.99
  },
  [ITEM_TYPES.SQUARE]: {
    id: ITEM_TYPES.SQUARE,
    name: 'Cubo Neón',
    shortName: 'Cuadrado',
    icon: '🟦',
    color: '#a855f7',
    splashColor: '#9333ea',
    mass: 1.05,
    drag: 0.99
  },
  [ITEM_TYPES.CIRCLE]: {
    id: ITEM_TYPES.CIRCLE,
    name: 'Esfera Solar',
    shortName: 'Círculo',
    icon: '🟡',
    color: '#facc15',
    splashColor: '#eab308',
    mass: 1.05,
    drag: 0.99
  },
  [ITEM_TYPES.STAR]: {
    id: ITEM_TYPES.STAR,
    name: 'Estrella Estelar',
    shortName: 'Estrella',
    icon: '⭐',
    color: '#f43f5e',
    splashColor: '#e11d48',
    mass: 1.05,
    drag: 0.99
  },
  // Geometría Nivel 2 (Complejas)
  [ITEM_TYPES.HEXAGON]: {
    id: ITEM_TYPES.HEXAGON,
    name: 'Hexágono',
    shortName: 'Hexágono',
    icon: '⬡',
    color: '#34d399',
    splashColor: '#10b981',
    mass: 1.08,
    drag: 0.99
  },
  [ITEM_TYPES.DIAMOND]: {
    id: ITEM_TYPES.DIAMOND,
    name: 'Rombo Diamante',
    shortName: 'Rombo',
    icon: '◆',
    color: '#f472b6',
    splashColor: '#ec4899',
    mass: 1.08,
    drag: 0.99
  },
  [ITEM_TYPES.CROSS]: {
    id: ITEM_TYPES.CROSS,
    name: 'Cruz Táctica',
    shortName: 'Cruz',
    icon: '✚',
    color: '#38bdf8',
    splashColor: '#0284c7',
    mass: 1.08,
    drag: 0.99
  },
  [ITEM_TYPES.CRESCENT]: {
    id: ITEM_TYPES.CRESCENT,
    name: 'Media Luna',
    shortName: 'Luna',
    icon: '🌙',
    color: '#fbbf24',
    splashColor: '#d97706',
    mass: 1.08,
    drag: 0.99
  }
};

export const BIOME_TYPES = {
  POVERTY_BELT: 'POVERTY_BELT',
  RICH_DISTRICT: 'RICH_DISTRICT',
  FAVELA: 'FAVELA',
  FIRE_EMERGENCY: 'FIRE_EMERGENCY',
  GEOMETRY_ZONE: 'GEOMETRY_ZONE',
  COPAN_CROPS: 'COPAN_CROPS',
  COPAN_TEMPLES: 'COPAN_TEMPLES',
  COPAN_VILLAGE: 'COPAN_VILLAGE'
};

export const BIOMES_CATALOG = {
  [BIOME_TYPES.POVERTY_BELT]: {
    id: BIOME_TYPES.POVERTY_BELT,
    name: 'Cinturón de Pobreza',
    groundColor: '#78716c',
    secondaryColor: '#a8a29e',
    skyGradient: ['#0284c7', '#bae6fd'],
    accentEmoji: '🏘️',
    neededItems: [ITEM_TYPES.MONEY, ITEM_TYPES.WATER, ITEM_TYPES.FOOD],
    happyMessage: '¡Justo lo que necesitaba esta familia!',
    unhappyMessage: '¡Eso no es lo que pidió esta persona!',
    weightScore: 110
  },
  [BIOME_TYPES.RICH_DISTRICT]: {
    id: BIOME_TYPES.RICH_DISTRICT,
    name: 'Centro Cívico / Zona Moderna',
    groundColor: '#334155',
    secondaryColor: '#64748b',
    skyGradient: ['#1e3a8a', '#38bdf8'],
    accentEmoji: '🏙️',
    neededItems: [ITEM_TYPES.BIBLE],
    happyMessage: '¡Paz espiritual en medio de la ciudad!',
    unhappyMessage: '¡Aquí buscan paz espiritual, no eso!',
    weightScore: 120
  },
  [BIOME_TYPES.FAVELA]: {
    id: BIOME_TYPES.FAVELA,
    name: 'Barrio Popular / Laderas',
    groundColor: '#57534e',
    secondaryColor: '#84cc16',
    skyGradient: ['#0ea5e9', '#e0f2fe'],
    accentEmoji: '🏡',
    neededItems: [ITEM_TYPES.FOOD, ITEM_TYPES.TOY, ITEM_TYPES.MONEY],
    happyMessage: '¡Alegría y esperanza para el barrio!',
    unhappyMessage: '¡Fíjate en el globo de lo que piden!',
    weightScore: 100
  },
  [BIOME_TYPES.FIRE_EMERGENCY]: {
    id: BIOME_TYPES.FIRE_EMERGENCY,
    name: '¡Incendio Activo!',
    groundColor: '#7f1d1d',
    secondaryColor: '#b91c1c',
    skyGradient: ['#991b1b', '#fca5a5'],
    accentEmoji: '🔥',
    neededItems: [ITEM_TYPES.WATER],
    happyMessage: '¡Fuego sofocado! ¡Nos salvaron!',
    unhappyMessage: '¡Necesitamos AGUA, se nos quema todo!',
    weightScore: 150
  },
  [BIOME_TYPES.GEOMETRY_ZONE]: {
    id: BIOME_TYPES.GEOMETRY_ZONE,
    name: 'Fábrica de Precisión',
    groundColor: '#0f172a',
    secondaryColor: '#38bdf8',
    skyGradient: ['#090d16', '#1e1b4b'],
    accentEmoji: '📐',
    neededItems: [],
    happyMessage: '¡Encaje perfecto!',
    unhappyMessage: '¡Fallo de precisión!',
    weightScore: 150
  },
  [BIOME_TYPES.COPAN_CROPS]: {
    id: BIOME_TYPES.COPAN_CROPS,
    name: 'Cafetales de Copán',
    groundColor: '#3f6212',
    secondaryColor: '#65a30d',
    skyGradient: ['#0284c7', '#bbf7d0'],
    accentEmoji: '🌱',
    neededItems: [ITEM_TYPES.WATER],
    happyMessage: '¡Los cafetales florecen con agua fresca!',
    unhappyMessage: '¡Los cultivos necesitan agua!',
    weightScore: 115
  },
  [BIOME_TYPES.COPAN_TEMPLES]: {
    id: BIOME_TYPES.COPAN_TEMPLES,
    name: 'Templos Mayas / Rosalila',
    groundColor: '#57534e',
    secondaryColor: '#84cc16',
    skyGradient: ['#0369a1', '#bae6fd'],
    accentEmoji: '🏛️',
    neededItems: [ITEM_TYPES.BIBLE],
    happyMessage: '¡Sabiduría y paz junto a los templos!',
    unhappyMessage: '¡Cerca de los templos piden Biblia / Sabiduría!',
    weightScore: 120
  },
  [BIOME_TYPES.COPAN_VILLAGE]: {
    id: BIOME_TYPES.COPAN_VILLAGE,
    name: 'Aldea Pintoresca de Copán',
    groundColor: '#78350f',
    secondaryColor: '#65a30d',
    skyGradient: ['#0ea5e9', '#fef08a'],
    accentEmoji: '🏡',
    neededItems: [ITEM_TYPES.FOOD, ITEM_TYPES.TOY],
    happyMessage: '¡Alegría y pan en la aldea!',
    unhappyMessage: '¡Fíjate si piden pan o regalos!',
    weightScore: 110
  }
};

/**
 * Niveles y Gateway de Progresión (Híbrido: Puntos Meta + Joy-O-Meter Saludable)
 */
export const LEVELS_CONFIG = {
  [GAME_MODES.CITY]: [
    {
      level: 1,
      id: 'TEGUCIGALPA',
      title: 'Nivel 1: Tegucigalpa',
      subtitle: 'Juana Laínez, Centro Cívico, Estadio Nacional y Catedral',
      targetScore: 8500,
      minJoy: 65,
      skyTint: null,
      landmarks: ['JUANA_LAINEZ', 'CENTRO_CIVICO', 'ESTADIO_TGU', 'CATEDRAL', 'PICACHO']
    },
    {
      level: 2,
      id: 'SPS',
      title: 'Nivel 2: San Pedro Sula',
      subtitle: 'Cordillera del Merendón, Estadio Olímpico y Los Bordos',
      targetScore: 9500,
      minJoy: 70,
      skyTint: '#0284c7',
      landmarks: ['MERENDON', 'ESTADIO_OLIMPICO', 'BORDOS', 'FUENTE_LUMINOSA']
    },
    {
      level: 3,
      id: 'COPAN',
      title: 'Nivel 3: Copán Ruinas',
      subtitle: 'Templo Rosalila, Pirámides Mayas, Cafetales y Aldeas',
      targetScore: 10500,
      minJoy: 70,
      skyTint: '#0369a1',
      biomes: [BIOME_TYPES.COPAN_CROPS, BIOME_TYPES.COPAN_TEMPLES, BIOME_TYPES.COPAN_VILLAGE],
      landmarks: ['ROSALILA', 'PIRAMIDE_MAYA', 'CAFETALES', 'ESTELA_MAYA']
    }
  ],
  [GAME_MODES.GEOMETRY]: [
    {
      level: 1,
      id: 'GEO_BASIC',
      title: 'Nivel 1: Figuras Básicas',
      subtitle: 'Triángulo, Cuadrado, Círculo y Estrella',
      targetScore: 5500,
      minJoy: 55,
      items: [ITEM_TYPES.TRIANGLE, ITEM_TYPES.SQUARE, ITEM_TYPES.CIRCLE, ITEM_TYPES.STAR]
    },
    {
      level: 2,
      id: 'GEO_COMPLEX',
      title: 'Nivel 2: Figuras Complejas',
      subtitle: 'Hexágono, Rombo, Cruz Táctica y Media Luna',
      targetScore: 7000,
      minJoy: 60,
      items: [ITEM_TYPES.HEXAGON, ITEM_TYPES.DIAMOND, ITEM_TYPES.CROSS, ITEM_TYPES.CRESCENT]
    }
  ],
  [GAME_MODES.HIGHWAY]: [
    {
      level: 1,
      id: 'HIGHWAY_ENDLESS',
      title: 'Salto en Carretera (Tegucigalpa)',
      subtitle: '¡El General Xatruch salta obstáculos y recoge suministros!',
      targetScore: 999999,
      minJoy: 0
    }
  ]
};
