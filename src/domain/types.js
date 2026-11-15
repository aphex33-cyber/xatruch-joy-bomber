/**
 * DOMINIO: Definiciones de objetos, biomas, modos de juego y reglas de compatibilidad
 * Lógica pura sin dependencias de UI o librerías externas.
 */

export const GAME_MODES = {
  CITY: 'CITY',
  GEOMETRY: 'GEOMETRY'
};

export const ITEM_TYPES = {
  WATER: 'WATER',
  FOOD: 'FOOD',
  BIBLE: 'BIBLE',
  TOY: 'TOY',
  // Piezas geométricas para el Nivel de Precisión
  TRIANGLE: 'TRIANGLE',
  SQUARE: 'SQUARE',
  CIRCLE: 'CIRCLE',
  STAR: 'STAR'
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
    description: 'Paz espiritual para corazones vacíos y magnates estresados'
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
  // Catálogo Geométrico
  [ITEM_TYPES.TRIANGLE]: {
    id: ITEM_TYPES.TRIANGLE,
    name: 'Prisma Triangular',
    shortName: 'Triángulo',
    icon: '🔺',
    color: '#22d3ee',
    splashColor: '#06b6d4',
    mass: 1.05,
    drag: 0.99,
    shape: 'TRIANGLE',
    description: 'Encaja en bases triangulares'
  },
  [ITEM_TYPES.SQUARE]: {
    id: ITEM_TYPES.SQUARE,
    name: 'Cubo Neón',
    shortName: 'Cuadrado',
    icon: '🟦',
    color: '#a855f7',
    splashColor: '#9333ea',
    mass: 1.05,
    drag: 0.99,
    shape: 'SQUARE',
    description: 'Encaja en bases cuadradas'
  },
  [ITEM_TYPES.CIRCLE]: {
    id: ITEM_TYPES.CIRCLE,
    name: 'Esfera Solar',
    shortName: 'Círculo',
    icon: '🟡',
    color: '#facc15',
    splashColor: '#eab308',
    mass: 1.05,
    drag: 0.99,
    shape: 'CIRCLE',
    description: 'Encaja en bases circulares'
  },
  [ITEM_TYPES.STAR]: {
    id: ITEM_TYPES.STAR,
    name: 'Estrella Estelar',
    shortName: 'Estrella',
    icon: '⭐',
    color: '#f43f5e',
    splashColor: '#e11d48',
    mass: 1.05,
    drag: 0.99,
    shape: 'STAR',
    description: 'Encaja en bases de estrella'
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
    name: 'Desierto Sediento',
    groundColor: '#d97706',
    secondaryColor: '#f59e0b',
    skyGradient: ['#fdba74', '#fed7aa'],
    accentEmoji: '🏜️',
    neededItems: [ITEM_TYPES.WATER, ITEM_TYPES.FOOD],
    happyMessage: '¡Agua bendita en el desierto! ¡La tierra florece!',
    unhappyMessage: '¡Aquí nos morimos de sed, necesitamos agua!',
    weightScore: 100
  },
  [BIOME_TYPES.RICH_DISTRICT]: {
    id: BIOME_TYPES.RICH_DISTRICT,
    name: 'Distrito Financiero / Mansiones',
    groundColor: '#334155',
    secondaryColor: '#64748b',
    skyGradient: ['#1e3a8a', '#38bdf8'],
    accentEmoji: '🏙️',
    neededItems: [ITEM_TYPES.BIBLE],
    happyMessage: '¡Un momento de paz espiritual! ¡Al fin hallé sentido!',
    unhappyMessage: '¡Ya tengo dinero, no me mojes el traje italiano!',
    weightScore: 120
  },
  [BIOME_TYPES.FAVELA]: {
    id: BIOME_TYPES.FAVELA,
    name: 'Comunidad Popular',
    groundColor: '#78716c',
    secondaryColor: '#a8a29e',
    skyGradient: ['#0284c7', '#bae6fd'],
    accentEmoji: '🏘️',
    neededItems: [ITEM_TYPES.FOOD, ITEM_TYPES.TOY, ITEM_TYPES.WATER],
    happyMessage: '¡Llegó la ayuda y la fiesta para todos!',
    unhappyMessage: '¡Oigan, eso no es lo que pedimos!',
    weightScore: 90
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
    neededItems: [ITEM_TYPES.TRIANGLE, ITEM_TYPES.SQUARE, ITEM_TYPES.CIRCLE, ITEM_TYPES.STAR],
    happyMessage: '¡Encaje perfecto!',
    unhappyMessage: '¡Fallo de precisión!',
    weightScore: 150
  }
};
