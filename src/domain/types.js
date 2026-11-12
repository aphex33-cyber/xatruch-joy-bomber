/**
 * DOMINIO: Definiciones de objetos, biomas y reglas de compatibilidad
 * Lógica pura sin dependencias de UI o librerías externas.
 */

export const ITEM_TYPES = {
  WATER: 'WATER',
  FOOD: 'FOOD',
  BIBLE: 'BIBLE',
  TOY: 'TOY',
};

export const ITEMS_CATALOG = {
  [ITEM_TYPES.WATER]: {
    id: ITEM_TYPES.WATER,
    name: 'Bomba de Agua',
    shortName: 'Agua',
    icon: '💧',
    color: '#38bdf8',
    splashColor: '#0284c7',
    mass: 1.2,
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
    mass: 0.9,
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
    mass: 0.8,
    drag: 0.97,
    description: 'Alegría pura, juguetes y fiesta para los niños'
  }
};

export const BIOME_TYPES = {
  DESERT: 'DESERT',
  RICH_DISTRICT: 'RICH_DISTRICT',
  FAVELA: 'FAVELA',
  FIRE_EMERGENCY: 'FIRE_EMERGENCY'
};

export const BIOMES_CATALOG = {
  [BIOME_TYPES.DESERT]: {
    id: BIOME_TYPES.DESERT,
    name: 'Desierto Sediento',
    groundColor: '#d97706',
    secondaryColor: '#f59e0b',
    skyGradient: ['#fed7aa', '#fdba74'],
    accentEmoji: '🏜️',
    neededItems: [ITEM_TYPES.WATER, ITEM_TYPES.FOOD],
    happyMessage: '¡Agua bendita en el desierto! ¡La tierra florece!',
    unhappyMessage: '¡Aquí nos morimos de sed y calor, necesitamos agua!',
    weightScore: 100
  },
  [BIOME_TYPES.RICH_DISTRICT]: {
    id: BIOME_TYPES.RICH_DISTRICT,
    name: 'Distrito Financiero / Mansiones',
    groundColor: '#334155',
    secondaryColor: '#64748b',
    skyGradient: ['#38bdf8', '#818cf8'],
    accentEmoji: '🏙️',
    neededItems: [ITEM_TYPES.BIBLE],
    happyMessage: '¡Un momento de paz espiritual! ¡Al fin hallé sentido!',
    unhappyMessage: '¡Ya tengo dinero y autos, no me mojes el traje italiano!',
    weightScore: 120
  },
  [BIOME_TYPES.FAVELA]: {
    id: BIOME_TYPES.FAVELA,
    name: 'Comunidad Popular',
    groundColor: '#78716c',
    secondaryColor: '#a8a29e',
    skyGradient: ['#bae6fd', '#7dd3fc'],
    accentEmoji: '🏘️',
    neededItems: [ITEM_TYPES.FOOD, ITEM_TYPES.TOY, ITEM_TYPES.WATER],
    happyMessage: '¡Llegó la ayuda y la fiesta para todos!',
    unhappyMessage: '¡Oigan, apunten mejor, casi nos cae en el techo!',
    weightScore: 90
  },
  [BIOME_TYPES.FIRE_EMERGENCY]: {
    id: BIOME_TYPES.FIRE_EMERGENCY,
    name: '¡Incendio Activo!',
    groundColor: '#7f1d1d',
    secondaryColor: '#b91c1c',
    skyGradient: ['#fca5a5', '#ef4444'],
    accentEmoji: '🔥',
    neededItems: [ITEM_TYPES.WATER],
    happyMessage: '¡Fuego sofocado! ¡Nos salvaron!',
    unhappyMessage: '¡Necesitamos AGUA, se nos quema todo!',
    weightScore: 150
  }
};
