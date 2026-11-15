import { BIOMES_CATALOG, BIOME_TYPES, GAME_MODES, ITEM_TYPES, ITEMS_CATALOG } from '../domain/types.js';
import { DropEngine } from './drop_engine.js';

export const GAME_STATUS = {
  START: 'START',
  PLAYING: 'PLAYING',
  GAMEOVER: 'GAMEOVER'
};

export class GameState {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.status = GAME_STATUS.START;
    this.mode = GAME_MODES.CITY;

    this.dropEngine = new DropEngine();

    this.carouselItems = this.getItemsForMode(this.mode);
    this.selectedItemIndex = 0;

    // Estado del Avión
    this.plane = {
      x: 110,
      y: 88,
      width: 72,
      height: 32,
      speed: 180, // px/s
      minSpeed: 115,
      maxSpeed: 270,
      tilt: 0,
      hatchOpenTimer: 0
    };

    this.smokeTrail = [];
    this.worldDistance = 0;

    // Chunks de biomas
    this.biomeChunks = [];
    this.chunkWidth = 700;
    this.nextChunkX = 0;

    // Personas/Pobladores en el suelo (Modo Ciudad)
    this.citizens = [];

    // Bases de encaje geométrico (Modo Precisión)
    this.geometrySlots = [];

    this.initWorld();
  }

  getItemsForMode(mode) {
    if (mode === GAME_MODES.GEOMETRY) {
      return [
        ITEM_TYPES.TRIANGLE,
        ITEM_TYPES.SQUARE,
        ITEM_TYPES.CIRCLE,
        ITEM_TYPES.STAR
      ];
    }
    return [
      ITEM_TYPES.WATER,
      ITEM_TYPES.FOOD,
      ITEM_TYPES.BIBLE,
      ITEM_TYPES.TOY
    ];
  }

  setMode(newMode) {
    this.mode = newMode;
    this.carouselItems = this.getItemsForMode(newMode);
    this.selectedItemIndex = 0;
    this.initWorld();
  }

  initWorld() {
    this.biomeChunks = [];
    this.citizens = [];
    this.geometrySlots = [];
    this.dropEngine.activeDrops = [];
    this.dropEngine.particles = [];
    this.dropEngine.floatingTexts = [];
    this.nextChunkX = 0;
    this.worldDistance = 0;
    this.dropEngine.scorer.reset();

    if (this.mode === GAME_MODES.GEOMETRY) {
      this.generateChunk(BIOME_TYPES.GEOMETRY_ZONE);
      this.generateChunk(BIOME_TYPES.GEOMETRY_ZONE);
      this.generateChunk(BIOME_TYPES.GEOMETRY_ZONE);
    } else {
      this.generateChunk(BIOME_TYPES.DESERT);
      this.generateChunk(BIOME_TYPES.FAVELA);
      this.generateChunk(BIOME_TYPES.RICH_DISTRICT);
      this.generateChunk(BIOME_TYPES.FIRE_EMERGENCY);
    }
  }

  generateChunk(forcedType = null) {
    const cityBiomeKeys = [
      BIOME_TYPES.DESERT,
      BIOME_TYPES.RICH_DISTRICT,
      BIOME_TYPES.FAVELA,
      BIOME_TYPES.FIRE_EMERGENCY
    ];

    const biomeType =
      forcedType ||
      (this.mode === GAME_MODES.GEOMETRY
        ? BIOME_TYPES.GEOMETRY_ZONE
        : cityBiomeKeys[Math.floor(Math.random() * cityBiomeKeys.length)]);

    const biome = BIOMES_CATALOG[biomeType];

    const chunk = {
      startX: this.nextChunkX,
      endX: this.nextChunkX + this.chunkWidth,
      chunkWidth: this.chunkWidth,
      biome: biome,
      type: biomeType,
      buildings: this.generateBuildingsForBiome(biomeType, this.nextChunkX, this.chunkWidth)
    };

    if (this.mode === GAME_MODES.GEOMETRY) {
      this.generateGeometrySlotsForChunk(chunk);
    } else {
      this.generateCitizensForChunk(chunk);
    }

    this.biomeChunks.push(chunk);
    this.nextChunkX += this.chunkWidth;
  }

  generateBuildingsForBiome(type, startX, width) {
    const buildings = [];
    let currentX = startX + 20;

    if (type === BIOME_TYPES.GEOMETRY_ZONE) {
      // Siluetas tecnológicas de fondo para la fábrica de precisión
      while (currentX < startX + width - 40) {
        const bWidth = 65 + Math.random() * 55;
        const bHeight = 55 + Math.random() * 95;
        buildings.push({
          x: currentX,
          y: this.canvasHeight - 60 - bHeight,
          width: bWidth,
          height: bHeight,
          type,
          extinguished: false
        });
        currentX += bWidth + 30 + Math.random() * 35;
      }
      return buildings;
    }

    while (currentX < startX + width - 40) {
      const bWidth = 54 + Math.random() * 48;
      let bHeight = 40;

      if (type === BIOME_TYPES.RICH_DISTRICT) {
        bHeight = 95 + Math.random() * 115;
      } else if (type === BIOME_TYPES.DESERT) {
        bHeight = 28 + Math.random() * 30;
      } else if (type === BIOME_TYPES.FAVELA) {
        bHeight = 45 + Math.random() * 62;
      } else if (type === BIOME_TYPES.FIRE_EMERGENCY) {
        bHeight = 72 + Math.random() * 78;
      }

      buildings.push({
        x: currentX,
        y: this.canvasHeight - 60 - bHeight,
        width: bWidth,
        height: bHeight,
        type: type,
        extinguished: false
      });

      currentX += bWidth + 16 + Math.random() * 24;
    }

    return buildings;
  }

  generateCitizensForChunk(chunk) {
    const count = 3 + Math.floor(Math.random() * 2);
    for (let i = 0; i < count; i++) {
      const x = chunk.startX + 75 + (i * (chunk.endX - chunk.startX - 140)) / count;
      const primaryNeed = chunk.biome.neededItems[0];
      const needConfig = ITEMS_CATALOG[primaryNeed];

      this.citizens.push({
        x: x,
        y: this.canvasHeight - 60,
        biomeType: chunk.type,
        needIcon: needConfig ? needConfig.icon : '❤️',
        needType: primaryNeed,
        animationOffset: Math.random() * Math.PI * 2,
        isHappy: false,
        happyTimer: 0
      });
    }
  }

  generateGeometrySlotsForChunk(chunk) {
    const shapes = [
      ITEM_TYPES.TRIANGLE,
      ITEM_TYPES.SQUARE,
      ITEM_TYPES.CIRCLE,
      ITEM_TYPES.STAR
    ];
    const count = 3;
    const spacing = (chunk.endX - chunk.startX - 160) / count;

    for (let i = 0; i < count; i++) {
      const x = chunk.startX + 120 + i * spacing + (Math.random() - 0.5) * 35;
      const shapeType = shapes[Math.floor(Math.random() * shapes.length)];

      this.geometrySlots.push({
        x,
        y: this.canvasHeight - 60,
        shapeType,
        filled: false,
        tier: null,
        snapAnim: 0
      });
    }
  }

  getBiomeAtX(worldX) {
    const chunk = this.biomeChunks.find(c => worldX >= c.startX && worldX < c.endX);
    return chunk ? chunk.biome : BIOMES_CATALOG[BIOME_TYPES.DESERT];
  }

  getGroundHeightAtX(worldX) {
    return this.canvasHeight - 60;
  }

  selectNextItem() {
    this.selectedItemIndex = (this.selectedItemIndex + 1) % this.carouselItems.length;
    return this.carouselItems[this.selectedItemIndex];
  }

  selectPrevItem() {
    this.selectedItemIndex = (this.selectedItemIndex - 1 + this.carouselItems.length) % this.carouselItems.length;
    return this.carouselItems[this.selectedItemIndex];
  }

  selectItemByIndex(index) {
    if (index >= 0 && index < this.carouselItems.length) {
      this.selectedItemIndex = index;
    }
  }

  dropSelectedItem() {
    if (this.status !== GAME_STATUS.PLAYING) return null;
    const itemId = this.carouselItems[this.selectedItemIndex];
    this.plane.hatchOpenTimer = 0.25;
    return this.dropEngine.drop(itemId, this.plane);
  }

  update(dt, inputState) {
    if (this.status !== GAME_STATUS.PLAYING) return;

    if (this.plane.hatchOpenTimer > 0) {
      this.plane.hatchOpenTimer = Math.max(0, this.plane.hatchOpenTimer - dt);
    }

    // Manejar aceleración de avión
    if (inputState.speedUp) {
      this.plane.speed = Math.min(this.plane.maxSpeed, this.plane.speed + 130 * dt);
      this.plane.tilt = 0.06;
    } else if (inputState.slowDown) {
      this.plane.speed = Math.max(this.plane.minSpeed, this.plane.speed - 130 * dt);
      this.plane.tilt = -0.06;
    } else {
      this.plane.tilt *= 0.9;
    }

    // Avanzar mundo
    const moveDist = this.plane.speed * dt;
    this.worldDistance += moveDist;

    // Partículas de humo del motor
    if (Math.random() < 0.65) {
      this.smokeTrail.push({
        x: this.plane.x - 4,
        y: this.plane.y + 14 + (Math.random() - 0.5) * 3,
        size: 3 + Math.random() * 3,
        life: 0.55,
        maxLife: 0.55,
        vx: -70 - Math.random() * 20,
        vy: (Math.random() - 0.5) * 12
      });
    }

    for (let i = this.smokeTrail.length - 1; i >= 0; i--) {
      const s = this.smokeTrail[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.life <= 0) {
        this.smokeTrail.splice(i, 1);
      }
    }

    // Desplazar chunks hacia la izquierda
    for (const chunk of this.biomeChunks) {
      chunk.startX -= moveDist;
      chunk.endX -= moveDist;
      for (const b of chunk.buildings) {
        b.x -= moveDist;
      }
    }
    this.nextChunkX -= moveDist;

    // Desplazar ciudadanos
    for (const c of this.citizens) {
      c.x -= moveDist;
      if (c.happyTimer > 0) {
        c.happyTimer -= dt;
        if (c.happyTimer <= 0) c.isHappy = false;
      }
    }

    // Desplazar bases geométricas
    for (const slot of this.geometrySlots) {
      slot.x -= moveDist;
      if (slot.snapAnim > 0) {
        slot.snapAnim = Math.max(0, slot.snapAnim - dt * 3);
      }
    }

    // Eliminar chunks fuera de pantalla y generar nuevos
    while (this.biomeChunks.length > 0 && this.biomeChunks[0].endX < -100) {
      this.biomeChunks.shift();
    }
    this.citizens = this.citizens.filter(c => c.x > -100);
    this.geometrySlots = this.geometrySlots.filter(s => s.x > -100);

    if (this.nextChunkX < this.canvasWidth + 600) {
      this.generateChunk();
    }

    // Actualizar motor de caída y colisiones
    this.dropEngine.update(dt, this);

    // Condición de derrota si el Joy-o-meter llega a 0
    if (this.dropEngine.scorer.joy <= 0) {
      this.status = GAME_STATUS.GAMEOVER;
    }
  }

  restart() {
    this.initWorld();
    this.status = GAME_STATUS.PLAYING;
  }
}
