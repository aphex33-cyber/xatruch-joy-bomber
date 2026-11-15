import { BIOME_TYPES, ITEM_TYPES } from '../domain/types.js';

/**
 * Compila una matriz ASCII de píxeles en un canvas offscreen para renderizado rápido 16-bit
 */
function compilePixelMatrix(matrix, palette, scale = 2) {
  const height = matrix.length;
  const width = matrix[0].length;
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');

  for (let y = 0; y < height; y++) {
    const row = matrix[y];
    for (let x = 0; x < width; x++) {
      const ch = row[x];
      if (ch !== '.' && palette[ch]) {
        ctx.fillStyle = palette[ch];
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }
  }
  return canvas;
}

// Matriz 28x14 para el avión arcade (escala 2.5x -> ~70x35 px)
const PLANE_MATRIX = [
  '.....RRRR................... ',
  '....RRRRRR..................',
  '....RRRRRR.....GGGG.........',
  '...RRRRRRRR...GGGGGG........',
  '..WWWWWWWWWWWWWWWWWWWWWW....',
  '.WWWWWWWWWWWWWWCCCWWWWWWW...',
  'RRRRRRRRRRRRRRCCCCCRRRRRR...',
  'WWWWWWWWWWWWWWWWWWWWWWWWWW..',
  '.SSSSSSSSSSSSSSSSSSSSSSSS...',
  '.....BBBBBBBBBBBBBB.........',
  '........WW......WW..........',
  '.......WWWW....WWWW.........',
  '........BB......BB..........'
].map(r => r.trimEnd().padEnd(28, '.'));

const PLANE_PALETTE = {
  R: '#ef4444', // Rojo arcade
  W: '#f8fafc', // Blanco brillante
  S: '#cbd5e1', // Sombra fuselaje
  C: '#38bdf8', // Cabina vidrio
  G: '#fbbf24', // Ala superior dorada/amarilla
  B: '#334155'  // Tren de aterrizaje / llantas
};

// Matrices 10x14 para ciudadanos (frame 1 esperando, frame 2 brazos arriba)
const CITIZEN_WAIT_1 = [
  '...HHHH...',
  '..HHHHHH..',
  '..SSSSSS..',
  '..SEEEES..',
  '...SSSS...',
  '..BBBBBB..',
  '.BB.BB.BB.',
  '.S..BB..S.',
  '....BB....',
  '...PPPP...',
  '...PP.PP..',
  '...PP.PP..',
  '..KK..KK..'
];

const CITIZEN_WAIT_2 = [
  '.S.HHHH.S.',
  '.SHHHHHHS.',
  '..SSSSSS..',
  '..SEEEES..',
  '...SSSS...',
  '..BBBBBB..',
  '....BB....',
  '....BB....',
  '....BB....',
  '...PPPP...',
  '...PP.PP..',
  '...PP.PP..',
  '..KK..KK..'
];

const CITIZEN_HAPPY = [
  'S..HHHH..S',
  '.S.HHHH.S.',
  '..SSSSSS..',
  '..SEEEES..',
  '...SSSS...',
  '..BBBBBB..',
  '....BB....',
  '....BB....',
  '...PPPP...',
  '..PP..PP..',
  '..KK..KK..',
  '..........',
  '..........'
];

function getCitizenPalette(biomeType) {
  switch (biomeType) {
    case BIOME_TYPES.RICH_DISTRICT:
      return { H: '#451a03', S: '#fed7aa', E: '#0f172a', B: '#1e293b', P: '#0f172a', K: '#000000' };
    case BIOME_TYPES.DESERT:
      return { H: '#eab308', S: '#fdba74', E: '#0f172a', B: '#d97706', P: '#78350f', K: '#451a03' };
    case BIOME_TYPES.FIRE_EMERGENCY:
      return { H: '#ef4444', S: '#fed7aa', E: '#0f172a', B: '#f97316', P: '#334155', K: '#0f172a' };
    default: // FAVELA
      return { H: '#1e293b', S: '#fdba74', E: '#0f172a', B: '#3b82f6', P: '#1d4ed8', K: '#0f172a' };
  }
}

export class SpriteLibrary {
  constructor() {
    this.planeSprite = compilePixelMatrix(PLANE_MATRIX, PLANE_PALETTE, 2.6);
    this.citizenSprites = {};

    const biomes = [
      BIOME_TYPES.DESERT,
      BIOME_TYPES.RICH_DISTRICT,
      BIOME_TYPES.FAVELA,
      BIOME_TYPES.FIRE_EMERGENCY
    ];

    for (const b of biomes) {
      const pal = getCitizenPalette(b);
      this.citizenSprites[b] = {
        wait1: compilePixelMatrix(CITIZEN_WAIT_1, pal, 2),
        wait2: compilePixelMatrix(CITIZEN_WAIT_2, pal, 2),
        happy: compilePixelMatrix(CITIZEN_HAPPY, pal, 2)
      };
    }
  }

  drawPlane(ctx, plane, propellerPhase, time) {
    ctx.save();
    ctx.translate(plane.x, plane.y);
    ctx.rotate(plane.tilt);

    // Bufanda del piloto ondeando al viento
    const scarfWave = Math.sin(time * 18) * 3;
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(28, 8 + scarfWave * 0.4, 8, 3);
    ctx.fillRect(21, 9 + scarfWave, 8, 3);

    // Sprite principal del avión
    ctx.drawImage(this.planeSprite, 0, 0);

    // Compuerta de carga abierta si acaba de soltar
    if (plane.hatchOpenTimer > 0) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(26, 22, 14, 4);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(26, 26, 14, 2);
    }

    // Hélice frontal giratoria con desenfoque
    const propX = this.planeSprite.width - 2;
    const propY = 16;
    const propH = Math.abs(Math.sin(propellerPhase)) * 16 + 2;
    ctx.fillStyle = 'rgba(226, 232, 240, 0.85)';
    ctx.fillRect(propX, propY - propH, 3, propH * 2);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(propX - 1, propY - 2, 3, 4);

    ctx.restore();
  }

  drawCitizen(ctx, citizen, time) {
    const set = this.citizenSprites[citizen.biomeType] || this.citizenSprites[BIOME_TYPES.FAVELA];
    let sprite = set.wait1;

    if (citizen.isHappy) {
      sprite = set.happy;
    } else if (Math.sin(time * 6 + citizen.animationOffset) > 0) {
      sprite = set.wait2;
    }

    const jumpY = citizen.isHappy ? -Math.abs(Math.sin(time * 10 + citizen.animationOffset)) * 8 : 0;
    const drawX = citizen.x - sprite.width / 2;
    const drawY = citizen.y - sprite.height + jumpY;

    ctx.drawImage(sprite, drawX, drawY);

    // Halo de paz si es Barrio Rico feliz
    if (citizen.isHappy && citizen.biomeType === BIOME_TYPES.RICH_DISTRICT) {
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(citizen.x, drawY - 4, 8, 3, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  /**
   * Dibuja una figura geométrica nítida estilo neón arcade
   */
  drawGeoShape(ctx, shapeType, x, y, radius, color, isOutlineOnly = false) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();

    if (shapeType === ITEM_TYPES.TRIANGLE) {
      ctx.moveTo(0, -radius);
      ctx.lineTo(radius * 0.95, radius * 0.8);
      ctx.lineTo(-radius * 0.95, radius * 0.8);
      ctx.closePath();
    } else if (shapeType === ITEM_TYPES.SQUARE) {
      const r = radius * 0.82;
      ctx.rect(-r, -r, r * 2, r * 2);
    } else if (shapeType === ITEM_TYPES.CIRCLE) {
      ctx.arc(0, 0, radius * 0.88, 0, Math.PI * 2);
    } else if (shapeType === ITEM_TYPES.STAR) {
      const spikes = 5;
      const outerR = radius;
      const innerR = radius * 0.45;
      for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const angle = (i * Math.PI) / spikes - Math.PI / 2;
        if (i === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
        else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
      }
      ctx.closePath();
    }

    if (isOutlineOnly) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([4, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.restore();
  }
}
