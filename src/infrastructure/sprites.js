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
   * Perro callejero ladrando en la carretera
   */
  drawStrayDog(ctx, obs, time) {
    const x = obs.x;
    const y = obs.y;
    const legRun = Math.sin(time * 22 + x * 0.1) * 3;
    ctx.save();
    // Patas corriendo
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x + 7 + legRun, y + 15, 4, 9);
    ctx.fillRect(x + 24 - legRun, y + 15, 4, 9);
    // Cuerpo con contorno oscuro
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x + 6, y + 6, 24, 11);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(x + 8, y + 8, 20, 7);
    // Cola erizada
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x + 28, y + 3, 6, 4);
    // Cabeza y hocico ladrando hacia la izquierda
    ctx.fillStyle = '#b45309';
    ctx.fillRect(x + 2, y + 3, 9, 8);
    ctx.fillRect(x, y + 6, 4, 4);
    ctx.fillStyle = '#0f172a'; // Oreja y ojo
    ctx.fillRect(x + 7, y + 1, 3, 4);
    ctx.fillRect(x + 4, y + 5, 2, 2);
    // Ladrido
    ctx.font = 'bold 9px "JetBrains Mono", monospace';
    ctx.fillStyle = '#fef08a';
    ctx.textAlign = 'center';
    ctx.fillText('¡GUAU!', x + 14, y - 4);
    ctx.restore();
  }

  /**
   * La Sucia (leyenda hondureña) asustando en la carretera
   */
  drawLaSucia(ctx, obs, time) {
    const x = obs.x;
    const y = obs.y + Math.sin(time * 6) * 3;
    ctx.save();
    // Aura espectral celeste/morada
    ctx.fillStyle = 'rgba(192, 132, 252, 0.25)';
    ctx.beginPath();
    ctx.ellipse(x + 14, y + 24, 18, 26, 0, 0, Math.PI * 2);
    ctx.fill();

    // Vestido blanco rasgado y flotante
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x + 5, y + 14, 18, 30);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(x + 7, y + 15, 14, 27);
    // Puntas rasgadas del vestido abajo
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(x + 7, y + 40, 4, 5);
    ctx.fillRect(x + 13, y + 41, 4, 4);
    ctx.fillRect(x + 18, y + 39, 3, 5);

    // Brazos extendidos asustando hacia el General Xatruch
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(x - 4, y + 16, 11, 4);
    ctx.fillRect(x - 6, y + 15, 3, 2);

    // Cabeza y cabellera negra larga y enmarañada
    ctx.fillStyle = '#090d16';
    ctx.fillRect(x + 6, y + 1, 16, 17);
    ctx.fillRect(x + 12, y + 14, 10, 12);
    // Ojos brillantes espeluznantes
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(x + 8, y + 7, 2, 2);
    ctx.fillRect(x + 12, y + 7, 2, 2);

    // Texto de susto
    ctx.font = 'bold 9px "JetBrains Mono", monospace';
    ctx.fillStyle = '#e879f9';
    ctx.textAlign = 'center';
    ctx.fillText('¡UUUHHH! 👻', x + 14, y - 5);
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

  /**
   * Pose heroica de cuerpo entero del General Xatruch con espada y banda azul-blanca
   */
  drawXatruchHeroic(ctx, x, y, scale = 1, time = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Capa azul-blanca ondeando atrás
    const wave = Math.sin(time * 6) * 4;
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.moveTo(-10, -48);
    ctx.lineTo(-34, -18 + wave);
    ctx.lineTo(-26, 10 + wave);
    ctx.lineTo(-8, -10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-26, -16 + wave * 0.5, 14, 7);

    // Botas y pantalones oscuros en pose firme
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-14, -8, 10, 26);
    ctx.fillRect(4, -8, 10, 26);
    ctx.fillStyle = '#334155';
    ctx.fillRect(-15, 10, 12, 8);
    ctx.fillRect(3, 10, 12, 8);

    // Levita oscura siglo XIX + banda presidencial/militar
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(-16, -48, 32, 42);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.strokeRect(-16, -48, 32, 42);

    // Banda celeste y blanca cruzada en el pecho
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(-14, -48);
    ctx.lineTo(14, -14);
    ctx.lineTo(14, -22);
    ctx.lineTo(-6, -48);
    ctx.closePath();
    ctx.fill();

    // Brazo derecho levantado sosteniendo espada reluciente
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(14, -56, 10, 16);
    ctx.fillStyle = '#fbbf24'; // Empuñadura dorada
    ctx.fillRect(16, -64, 12, 4);
    ctx.fillRect(20, -64, 4, 10);
    ctx.fillStyle = '#e2e8f0'; // Hoja de la espada
    ctx.fillRect(20, -98, 4, 34);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(21, -98, 1.5, 34);

    // Retrato detallado del General Xatruch
    ctx.drawImage(this.xatruchSprite, -18, -82, 36, 36);
    ctx.restore();
  }

  /**
   * Boss 1 (Tegucigalpa): Monstruo Gigante formado por carros del tráfico
   */
  drawTegucigalpaBoss(ctx, boss, time) {
    const x = boss.x;
    const y = boss.y;
    const w = boss.width;
    const h = boss.height;
    const shake = Math.sin(time * 24) * 2;

    ctx.save();
    if (boss.hitFlash > 0) ctx.filter = 'brightness(1.8)';

    // Piernas (dos camionetas/sedanes verticales)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x + w * 0.14, y + h * 0.65, w * 0.28, h * 0.35);
    ctx.fillRect(x + w * 0.56, y + h * 0.65, w * 0.28, h * 0.35);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(x + w * 0.17, y + h * 0.68, w * 0.22, h * 0.28);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(x + w * 0.59, y + h * 0.68, w * 0.22, h * 0.28);

    // Torso (autobús / rapidito + sedanes apilados)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x + w * 0.08, y + h * 0.26, w * 0.84, h * 0.42);
    ctx.fillStyle = '#facc15'; // Taxi amarillo gigante en el pecho
    ctx.fillRect(x + w * 0.12, y + h * 0.30, w * 0.76, h * 0.34);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x + w * 0.22, y + h * 0.38, w * 0.56, h * 0.12); // Parrilla amenazante

    // Brazos hechos de taxis que golpean
    const armWave = Math.sin(time * 8) * 6;
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(x - w * 0.18, y + h * 0.32 + armWave, w * 0.26, h * 0.18);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x - w * 0.20, y + h * 0.34 + armWave, 6, 12);

    // Cabeza (busito con faros rojos furiosos como ojos y humo)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x + w * 0.22 + shake, y, w * 0.56, h * 0.28);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(x + w * 0.26 + shake, y + 4, w * 0.48, h * 0.22);
    // Ojos rojos brillantes (faros)
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(x + w * 0.30 + shake, y + h * 0.09, 10, 8);
    ctx.fillRect(x + w * 0.56 + shake, y + h * 0.09, 10, 8);
    // Boca de parachoques gritando
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x + w * 0.34 + shake, y + h * 0.19, w * 0.28, 6);

    ctx.restore();
  }

  /**
   * Boss 2 (SPS): Monstruo colosal de Fuego y Calor
   */
  drawSpsBoss(ctx, boss, time) {
    const x = boss.x;
    const y = boss.y;
    const w = boss.width;
    const h = boss.height;
    const scaleBoost = boss.enrageFlash > 0 ? 1.12 : 1.0;

    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.scale(scaleBoost, scaleBoost);
    ctx.translate(-(x + w / 2), -(y + h / 2));

    if (boss.hitFlash > 0) ctx.filter = 'brightness(1.8)';

    // Aura de calor sofocante
    ctx.fillStyle = 'rgba(249, 115, 22, 0.28)';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, w * 0.72, h * 0.65, 0, 0, Math.PI * 2);
    ctx.fill();

    // Llamas exteriores danzantes
    for (let i = 0; i < 6; i++) {
      const fx = x + (i / 5) * (w - 14);
      const fh = 18 + Math.sin(time * 16 + i * 1.4) * 10;
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(fx, y - fh + 16, 14, h * 0.4 + fh);
    }

    // Cuerpo de magma y fuego 16-bit
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(x + 6, y + 18, w - 12, h - 22);
    ctx.fillStyle = '#f97316';
    ctx.fillRect(x + 14, y + 26, w - 28, h - 38);
    ctx.fillStyle = '#fde047'; // Núcleo ardiente
    ctx.fillRect(x + 24, y + 42, w - 48, h - 64);

    // Ojos furiosos blanco-amarillos
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + w * 0.24, y + h * 0.28, 12, 10);
    ctx.fillRect(x + w * 0.58, y + h * 0.28, 12, 10);
    // Boca de fuego rugiendo
    ctx.fillStyle = '#450a0a';
    ctx.fillRect(x + w * 0.28, y + h * 0.48, w * 0.44, 16);

    ctx.restore();
  }

  /**
   * Boss 3 (Copán): Quetzalcóatl, la Serpiente Emplumada 16-bit
   */
  drawQuetzalcoatlBoss(ctx, boss, time) {
    const x = boss.x;
    const y = boss.y;
    const w = boss.width;
    const h = boss.height;

    ctx.save();
    if (boss.hitFlash > 0) ctx.filter = 'brightness(1.8)';

    // Cuerpo ondulante verde jade en segmentos
    for (let i = 4; i >= 0; i--) {
      const segWave = Math.sin(time * 7 + i * 0.9) * 10;
      const sx = x + w * 0.25 + i * 11;
      const sy = y + h * 0.35 + i * 13 + segWave;
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(sx, sy, 17, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = i % 2 === 0 ? '#10b981' : '#059669';
      ctx.beginPath();
      ctx.arc(sx, sy, 14, 0, Math.PI * 2);
      ctx.fill();
      // Escama ventral dorada
      ctx.fillStyle = '#facc15';
      ctx.fillRect(sx - 6, sy + 5, 12, 5);
    }

    // Penacho de plumas sagradas (rojo escarlata, turquesa y oro)
    const plumeWave = Math.sin(time * 10) * 4;
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(x + 28, y - 8 + plumeWave, 28, 10);
    ctx.fillStyle = '#22d3ee';
    ctx.fillRect(x + 36, y - 16 + plumeWave, 26, 8);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(x + 42, y - 22 + plumeWave, 20, 6);

    // Cabeza de serpiente mirando a la izquierda
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x + 4, y + 6, 46, 36);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(x + 7, y + 9, 40, 30);

    // Ojo dorado intenso
    ctx.fillStyle = '#facc15';
    ctx.fillRect(x + 14, y + 14, 10, 8);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x + 16, y + 16, 4, 4);

    // Boca abierta con colmillos blancos
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(x + 4, y + 27, 24, 10);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 7, y + 27, 4, 6);
    ctx.fillRect(x + 17, y + 27, 4, 6);

    ctx.restore();
  }

  /**
   * Jaguar dorado saltando (proyectil de Quetzalcóatl)
   */
  drawJaguarProjectile(ctx, atk, time) {
    const x = atk.x;
    const y = atk.y;
    const leap = Math.sin(time * 20 + x * 0.05) * 3;
    ctx.save();
    // Cuerpo dorado
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x - 16, y - 8 + leap, 32, 16);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(x - 14, y - 6 + leap, 28, 12);
    // Manchas negras de jaguar
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x - 8, y - 4 + leap, 4, 4);
    ctx.fillRect(x, y - 2 + leap, 4, 4);
    ctx.fillRect(x + 6, y - 4 + leap, 4, 4);
    // Cabeza y colmillos hacia la izquierda
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(x - 20, y - 9 + leap, 10, 10);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 20, y - 2 + leap, 3, 4);
    ctx.restore();
  }
}
