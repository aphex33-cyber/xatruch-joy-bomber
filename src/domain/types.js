/**
 * DOMINIO: Definiciones de objetos, biomas, niveles, modos de juego y reglas de compatibilidad
 * Lógica pura sin dependencias de UI o librerías externas.
 */

export const GAME_MODES = {
  CITY: 'CITY',
  GEOMETRY: 'GEOMETRY',
  HIGHWAY: 'HIGHWAY'
};

export const ITEM_TYPES = {
  WATER: 'WATER',
  FOOD: 'FOOD',
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
    description: 'Nutrición para zonas marginadas y desiertos'
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
    description: 'Paz espiritual para corazones vacíos y ejecutivos'
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
    description: 'Alegría pura, juguetes y fiesta para los niños'
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
  DESERT: 'DESERT',
  RICH_DISTRICT: 'RICH_DISTRICT',
  FAVELA: 'FAVELA',
  FIRE_EMERGENCY: 'FIRE_EMERGENCY',
  GEOMETRY_ZONE: 'GEOMETRY_ZONE'
};

export const BIOMES_CATALOG = {
  [BIOME_TYPES.DESERT]: {
    id: BIOME_TYPES.DESERT,
    name: 'Zona Seca / Lomas',
    groundColor: '#d97706',
    secondaryColor: '#f59e0b',
    skyGradient: ['#fdba74', '#fed7aa'],
    accentEmoji: '🏜️',
    neededItems: [ITEM_TYPES.WATER, ITEM_TYPES.FOOD],
    happyMessage: '¡Agua bendita! ¡La tierra florece!',
    unhappyMessage: '¡Aquí hace sed, necesitamos agua o comida!',
    weightScore: 100
  },
  [BIOME_TYPES.RICH_DISTRICT]: {
    id: BIOME_TYPES.RICH_DISTRICT,
    name: 'Centro Cívico / Residencial',
    groundColor: '#334155',
    secondaryColor: '#64748b',
    skyGradient: ['#1e3a8a', '#38bdf8'],
    accentEmoji: '🏙️',
    neededItems: [ITEM_TYPES.BIBLE],
    happyMessage: '¡Paz espiritual en medio del estrés!',
    unhappyMessage: '¡Ya tengo dinero, no me mojes el traje!',
    weightScore: 120
  },
  [BIOME_TYPES.FAVELA]: {
    id: BIOME_TYPES.FAVELA,
    name: 'Barrio / Los Bordos',
    groundColor: '#78716c',
    secondaryColor: '#a8a29e',
    skyGradient: ['#0284c7', '#bae6fd'],
    accentEmoji: '🏘️',
    neededItems: [ITEM_TYPES.FOOD, ITEM_TYPES.TOY, ITEM_TYPES.WATER],
    happyMessage: '¡Llegó la ayuda y la alegría para todos!',
    unhappyMessage: '¡Oigan, eso no es lo que pedimos!',
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
      subtitle: 'El Picacho, Cerro Juana Laínez, Estadio Nacional y Centro Cívico',
      targetScore: 8500,
      minJoy: 65,
      skyTint: null,
      landmarks: ['PICACHO', 'JUANA_LAINEZ', 'ESTADIO_TGU', 'CENTRO_CIVICO']
    },
    {
      level: 2,
      id: 'SPS',
      title: 'Nivel 2: San Pedro Sula',
      subtitle: 'Cordillera del Merendón, Estadio Olímpico y Los Bordos',
      targetScore: 14000,
      minJoy: 70,
      skyTint: '#0284c7',
      landmarks: ['MERENDON', 'ESTADIO_OLIMPICO', 'BORDOS', 'FUENTE_LUMINOSA']
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
      targetScore: 9500,
      minJoy: 60,
      items: [ITEM_TYPES.HEXAGON, ITEM_TYPES.DIAMOND, ITEM_TYPES.CROSS, ITEM_TYPES.CRESCENT]
    }
  ],
  [GAME_MODES.HIGHWAY]: [
    {
      level: 1,
      id: 'HIGHWAY_ENDLESS',
      title: 'Salto en Carretera',
      subtitle: '¡Salta postes, carros y arbustos por la ventana!',
      targetScore: 999999,
      minJoy: 0
    }
  ]
};
