import { BIOME_TYPES, ITEM_TYPES, PLANES_CATALOG } from '../domain/types.js';

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

// Matriz 28x14 con contorno oscuro 16-bit (estilo Moustache Protocol) para el avión arcade
const PLANE_MATRIX = [
  '.....OOOO................... ',
  '....ORRRRO..................',
  '....ORRRRRO....OOOOO........',
  '...ORRRRRRRO..OGGGGGO.......',
  '..OOWWWWWWWWWWWWWWWWWWWOO...',
  '.OWWWWWWWWWWWWWWCCCWWWWWWOO.',
  'ORRRRRRRRRRRRRRRCCCCCRRRRRRO',
  'OWWWWWWWWWWWWWWWWWWWWWWWWWWO',
  '.OSSSSSSSSSSSSSSSSSSSSSSSSO.',
  '..OOOBBBBBBBBBBBBBBOOOOOOO..',
  '........OWO.....OWO.........',
  '.......OWWWO...OWWWO........',
  '........OBO.....OBO.........'
].map(r => r.trimEnd().padEnd(28, '.'));

const PLANE_PALETTE = {
  O: '#0f172a', // Contorno oscuro 16-bit
  R: '#ef4444', // Rojo arcade
  W: '#f8fafc', // Blanco brillante
  S: '#94a3b8', // Sombra fuselaje
  C: '#38bdf8', // Cabina vidrio
  G: '#fbbf24', // Ala superior dorada
  B: '#334155'  // Tren de aterrizaje
};

// Matriz 16x16 con contorno oscuro 16-bit basada en el retrato del General Florencio Xatruch
const XATRUCH_MATRIX = [
  '....OOOOOOOO....',
  '...OHHHHHHHHO...',
  '..OHHGGGGGGHHO..',
  '.OHHSSSSSSSSHO..',
  '.OHSSSSSSSSSSHO.',
  '.OSSBSSSSSSBSSO.',
  '.OSSWEOSSOEWSSO.',
  '.OSSSSSNNSSSSSO.',
  '.OSSMMMMMMMMSSO.',
  '.OSMMMMMMMMMMSO.',
  '..OMMMMMMMMMMO..',
  '..ODDDDDDDDDDO..',
  '...ODDDDDDDDO...',
  '.OOUUCCTTTTCUUO.',
  'OUUUUUCCTUUUUUUO',
  'OUUUUUUUUUUUUUUO'
];

const XATRUCH_PALETTE = {
  O: '#0f172a', // Contorno oscuro 16-bit
  H: '#4b5563', // Cabello entrecano oscuro
  G: '#9ca3af', // Canas onduladas
  S: '#f3c69f', // Piel rostro
  B: '#374151', // Cejas marcadas
  W: '#ffffff', // Esclerótica
  E: '#0f172a', // Pupila expresiva
  N: '#d99b66', // Nariz definida
  M: '#f8fafc', // Bigote y barba blanca espesa
  D: '#cbd5e1', // Sombra de barba
  C: '#ffffff', // Cuello blanco de camisa
  T: '#374151', // Corbatín oscuro
  U: '#1f2937'  // Casaca oscura siglo XIX
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
    case BIOME_TYPES.POVERTY_BELT:
      return { H: '#1c1917', S: '#fdba74', E: '#0f172a', B: '#d97706', P: '#78350f', K: '#451a03' };
    case BIOME_TYPES.FIRE_EMERGENCY:
      return { H: '#ef4444', S: '#fed7aa', E: '#0f172a', B: '#f97316', P: '#334155', K: '#0f172a' };
    default: // FAVELA
      return { H: '#1e293b', S: '#fdba74', E: '#0f172a', B: '#3b82f6', P: '#1d4ed8', K: '#0f172a' };
  }
}

export class SpriteLibrary {
  constructor() {
    this.planeSprites = {};
    for (const p of PLANES_CATALOG) {
      this.planeSprites[p.id] = compilePixelMatrix(PLANE_MATRIX, p.palette, 2.6);
    }
    this.planeSprite = this.planeSprites.CLASSIC;
    this.xatruchSprite = compilePixelMatrix(XATRUCH_MATRIX, XATRUCH_PALETTE, 1.75);
    this.citizenSprites = {};

    const biomes = [
      BIOME_TYPES.POVERTY_BELT,
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

  drawPlane(ctx, plane, propellerPhase, time, planeId = 'CLASSIC') {
    const activeSprite = this.planeSprites[planeId] || this.planeSprite;
    ctx.save();
    ctx.translate(plane.x, plane.y);
    ctx.rotate(plane.tilt);

    // Banda / bufanda azul y blanca ondeando detrás del General Xatruch
    const scarfWave = Math.sin(time * 18) * 3;
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(24, -1 + scarfWave * 0.4, 12, 3);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(15, 0 + scarfWave, 10, 3);

    // Piloto: Rostro y busto detallado del General Florencio Xatruch
    ctx.drawImage(this.xatruchSprite, 30, -18);

    // Sprite principal del avión
    ctx.drawImage(activeSprite, 0, 0);

    // Compuerta de carga abierta si acaba de soltar
    if (plane.hatchOpenTimer > 0) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(26, 22, 14, 4);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(26, 26, 14, 2);
    }

    // Hélice frontal giratoria con desenfoque
    const propX = activeSprite.width - 2;
    const propY = 16;
    const propH = Math.abs(Math.sin(propellerPhase)) * 16 + 2;
    ctx.fillStyle = 'rgba(226, 232, 240, 0.85)';
    ctx.fillRect(propX, propY - propH, 3, propH * 2);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(propX - 1, propY - 2, 3, 4);

    ctx.restore();
  }

  /**
   * Guacamaya Roja (Guara Roja) volando con alas animadas 16-bit
   */
  drawMacaw(ctx, obs) {
    const x = obs.x;
    const y = obs.y;
    const flap = Math.sin(obs.wingPhase || 0) * 8;

    ctx.save();
    // Cola larga roja y azul
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(x + 22, y + 10, 14, 4);
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(x + 26, y + 14, 10, 3);
    // Cuerpo rojo escarlata con contorno oscuro
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x + 4, y + 5, 22, 14);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(x + 6, y + 7, 18, 10);
    // Ala amarilla y azul aleteando
    ctx.fillStyle = '#facc15';
    ctx.fillRect(x + 10, y + 6 - Math.max(0, flap), 10, 6);
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(x + 12, y + 2 - Math.max(0, flap), 8, 4);
    // Cara blanca y pico curvo
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 5, y + 8, 5, 5);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x + 6, y + 9, 2, 2);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(x + 1, y + 9, 4, 5);
    ctx.restore();
  }

  /**
   * Venado Cola Blanca (mamífero nacional de Honduras)
   */
  drawDeer(ctx, obs) {
    const x = obs.x;
    const y = obs.y;
    ctx.save();
    // Patas delgadas con contorno
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x + 8, y + 20, 4, 16);
    ctx.fillRect(x + 15, y + 20, 4, 16);
    ctx.fillRect(x + 27, y + 20, 4, 16);
    ctx.fillRect(x + 34, y + 20, 4, 16);
    // Cuerpo café claro
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x + 6, y + 10, 32, 14);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(x + 8, y + 12, 28, 10);
    // Cola blanca levantada distintiva
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 36, y + 6, 6, 7);
    // Cuello y cabeza mirando a la izquierda
    ctx.fillStyle = '#b45309';
    ctx.fillRect(x + 5, y + 4, 8, 10);
    ctx.fillRect(x + 1, y + 4, 9, 7);
    // Ojo y nariz
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x + 4, y + 6, 2, 2);
    ctx.fillRect(x + 1, y + 8, 2, 2);
    // Cornamenta (astas)
    ctx.fillStyle = '#fde68a';
    ctx.fillRect(x + 8, y - 4, 2, 8);
    ctx.fillRect(x + 11, y - 3, 2, 7);
    ctx.fillRect(x + 6, y - 2, 6, 2);
    ctx.restore();
  }

  /**
   * Marero en la calle (obstáculo urbano con pañoleta, lentes oscuros y camiseta)
   */
  drawGangster(ctx, obs) {
    const x = obs.x;
    const y = obs.y;
    ctx.save();
    // Pantalón ancho oscuro y tenis
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x + 5, y + 24, 7, 16);
    ctx.fillRect(x + 14, y + 24, 7, 16);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 4, y + 37, 8, 3);
    ctx.fillRect(x + 14, y + 37, 8, 3);
    // Camiseta blanca sin mangas + tatuajes en brazos
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(x + 6, y + 12, 14, 13);
    ctx.fillStyle = '#d99b66';
    ctx.fillRect(x + 2, y + 13, 4, 10);
    ctx.fillRect(x + 20, y + 13, 4, 10);
    ctx.fillStyle = '#0f172a'; // Tatuajes pixelados
    ctx.fillRect(x + 3, y + 16, 2, 4);
    ctx.fillRect(x + 21, y + 15, 2, 5);
    // Cabeza, gorra hacia atrás y pañoleta / lentes oscuros
    ctx.fillStyle = '#d99b66';
    ctx.fillRect(x + 7, y + 2, 12, 10);
    ctx.fillStyle = '#0f172a'; // Lentes oscuros
    ctx.fillRect(x + 7, y + 5, 10, 3);
    ctx.fillStyle = '#dc2626'; // Pañoleta / bandana roja
    ctx.fillRect(x + 7, y + 8, 12, 4);
    ctx.fillStyle = '#1e293b'; // Gorra hacia atrás
    ctx.fillRect(x + 7, y, 12, 4);
    ctx.fillRect(x + 17, y + 2, 5, 2);
    ctx.restore();
  }

  /**
   * Cola interminable de carros del tráfico de Tegucigalpa con humor
   */
  drawTrafficJam(ctx, obs, time) {
    if (!obs.cars) return;
    ctx.save();
    for (const car of obs.cars) {
      const cx = obs.x + car.offsetX;
      const cy = obs.y;
      const vibrate = Math.sin(time * 22 + car.offsetX) * 0.6;

      // Carrocería 16-bit con contorno oscuro
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx - 1, cy + 9 + vibrate, 58, 18);
      ctx.fillStyle = car.color;
      ctx.fillRect(cx + 1, cy + 11 + vibrate, 54, 14);

      if (car.isBus) {
        // Rapidito / busito típico
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(cx + 2, cy - 2 + vibrate, 52, 13);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(cx + 4, cy + vibrate, 48, 10);
        ctx.fillStyle = '#38bdf8';
        for (let wx = 7; wx < 46; wx += 11) {
          ctx.fillRect(cx + wx, cy + 2 + vibrate, 8, 6);
        }
      } else {
        // Techo de sedán / taxi
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(cx + 10, cy + vibrate, 34, 11);
        ctx.fillStyle = car.color;
        ctx.fillRect(cx + 12, cy + 2 + vibrate, 30, 8);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(cx + 15, cy + 3 + vibrate, 11, 6);
        ctx.fillRect(cx + 29, cy + 3 + vibrate, 10, 6);
      }

      // Luces traseras de freno encendidas (rojo brillante)
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(cx + 52, cy + 14 + vibrate, 4, 5);
      // Llantas
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(cx + 12, cy + 27, 5, 0, Math.PI * 2);
      ctx.arc(cx + 44, cy + 27, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Globo humorístico de bocina / queja sobre la cola de carros
    if (obs.honkText) {
      const bx = obs.x + obs.width * 0.45;
      const by = obs.y - 24 + Math.sin(time * 6) * 2;
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      const tw = ctx.measureText(obs.honkText).width + 14;
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.roundRect(bx - tw / 2, by, tw, 17, 5);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'center';
      ctx.fillText(obs.honkText, bx, by + 12);
    }
    ctx.restore();
  }

  /**
   * Dibuja al General Florencio Xatruch corriendo y saltando en el Modo Carretera
   */
  drawXatruchRunner(ctx, runner, groundY, time) {
    ctx.save();
    ctx.translate(runner.x, runner.y);

    // Sombra en el suelo
    const shadowScale = Math.max(0.3, 1 - (groundY - runner.y) / 140);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, groundY - runner.y + 2, 14 * shadowScale, 4 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Piernas animadas (pantalón oscuro y botas)
    const legSwing = runner.grounded ? Math.sin(runner.runPhase) * 7 : 5;
    ctx.fillStyle = '#111827';
    ctx.fillRect(-5 + legSwing, -13, 5, 13);
    ctx.fillRect(1 - legSwing, -13, 5, 13);

    // Levita / casaca oscura con cuello blanco
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(-9, -27, 18, 15);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-3, -27, 6, 4);

    // Cabeza y barba plateada del General Xatruch (usando su sprite de retrato)
    const headSize = 22;
    ctx.drawImage(this.xatruchSprite, -headSize / 2, -46, headSize, headSize);

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
    } else if (shapeType === ITEM_TYPES.HEXAGON) {
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3 - Math.PI / 6;
        const hx = Math.cos(angle) * radius * 0.92;
        const hy = Math.sin(angle) * radius * 0.92;
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
    } else if (shapeType === ITEM_TYPES.DIAMOND) {
      ctx.moveTo(0, -radius);
      ctx.lineTo(radius * 0.72, 0);
      ctx.lineTo(0, radius);
      ctx.lineTo(-radius * 0.72, 0);
      ctx.closePath();
    } else if (shapeType === ITEM_TYPES.CROSS) {
      const a = radius * 0.34;
      const b = radius * 0.9;
      ctx.moveTo(-a, -b);
      ctx.lineTo(a, -b);
      ctx.lineTo(a, -a);
      ctx.lineTo(b, -a);
      ctx.lineTo(b, a);
      ctx.lineTo(a, a);
      ctx.lineTo(a, b);
      ctx.lineTo(-a, b);
      ctx.lineTo(-a, a);
      ctx.lineTo(-b, a);
      ctx.lineTo(-b, -a);
      ctx.lineTo(-a, -a);
      ctx.closePath();
    } else if (shapeType === ITEM_TYPES.CRESCENT) {
      ctx.arc(0, 0, radius * 0.88, 0.45, Math.PI * 2 - 0.45, false);
      ctx.arc(radius * 0.35, 0, radius * 0.7, Math.PI * 2 - 0.75, 0.75, true);
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
