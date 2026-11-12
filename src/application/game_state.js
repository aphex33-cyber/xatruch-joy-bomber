import { BIOMES_CATALOG, BIOME_TYPES, ITEM_TYPES, ITEMS_CATALOG } from '../domain/types.js';
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

    this.dropEngine = new DropEngine();
    
    // Lista de ítems disponibles en el carrusel
    this.carouselItems = [
      ITEM_TYPES.WATER,
      ITEM_TYPES.FOOD,
      ITEM_TYPES.BIBLE,
      ITEM_TYPES.TOY
    ];
    this.selectedItemIndex = 0;

    // Estado del Avión
    this.plane = {
      x: 120,
      y: 90,
      width: 64,
      height: 28,
      speed: 180, // px/s
      minSpeed: 120,
      maxSpeed: 260,
      tilt: 0
    };

    this.smokeTrail = [];
    this.worldDistance = 0;

    // Chunks de biomas
    this.biomeChunks = [];
    this.chunkWidth = 700;
    this.nextChunkX = 0;

    // Personas/Pobladores en el suelo
    this.citizens = [];

    this.initWorld();
  }

  initWorld() {
    this.biomeChunks = [];
    this.citizens = [];
    this.nextChunkX = 0;
    this.worldDistance = 0;
    this.dropEngine.scorer.reset();

    // Generar los primeros 3 chunks
    this.generateChunk(BIOME_TYPES.DESERT);
    this.generateChunk(BIOME_TYPES.FAVELA);
    this.generateChunk(BIOME_TYPES.RICH_DISTRICT);
    this.generateChunk(BIOME_TYPES.FIRE_EMERGENCY);
  }

  generateChunk(forcedType = null) {
    const biomeKeys = Object.keys(BIOMES_CATALOG);
    const biomeType = forcedType || biomeKeys[Math.floor(Math.random() * biomeKeys.length)];
    const biome = BIOMES_CATALOG[biomeType];

    const chunk = {
      startX: this.nextChunkX,
      endX: this.nextChunkX + this.chunkWidth,
      biome: biome,
      type: biomeType,
      buildings: this.generateBuildingsForBiome(biomeType, this.nextChunkX, this.chunkWidth)
    };

    // Agregar ciudadanos con peticiones visuales
    this.generateCitizensForChunk(chunk);

    this.biomeChunks.push(chunk);
    this.nextChunkX += this.chunkWidth;
  }

  generateBuildingsForBiome(type, startX, width) {
    const buildings = [];
    let currentX = startX + 20;

    while (currentX < startX + width - 40) {
      const bWidth = 50 + Math.random() * 50;
      let bHeight = 40;

      if (type === BIOME_TYPES.RICH_DISTRICT) {
        bHeight = 90 + Math.random() * 110; // Rascacielos
      } else if (type === BIOME_TYPES.DESERT) {
        bHeight = 25 + Math.random() * 30; // Chozas / cactus
      } else if (type === BIOME_TYPES.FAVELA) {
        bHeight = 40 + Math.random() * 60; // Casas apiladas
      } else if (type === BIOME_TYPES.FIRE_EMERGENCY) {
        bHeight = 70 + Math.random() * 80; // Edificio en llamas
      }

      buildings.push({
        x: currentX,
        y: this.canvasHeight - 60 - bHeight,
        width: bWidth,
        height: bHeight,
        type: type
      });

      currentX += bWidth + 15 + Math.random() * 25;
    }

    return buildings;
  }

  generateCitizensForChunk(chunk) {
    const count = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const x = chunk.startX + 60 + (i * (chunk.endX - chunk.startX - 120)) / count;
      const primaryNeed = chunk.biome.neededItems[0];
      const needConfig = ITEMS_CATALOG[primaryNeed];

      this.citizens.push({
        x: x,
        y: this.canvasHeight - 65,
        needIcon: needConfig ? needConfig.icon : '❤️',
        needType: primaryNeed,
        animationOffset: Math.random() * Math.PI * 2,
        isHappy: false
      });
    }
  }

  getBiomeAtX(worldX) {
    const chunk = this.biomeChunks.find(c => worldX >= c.startX && worldX < c.endX);
    return chunk ? chunk.biome : BIOMES_CATALOG[BIOME_TYPES.DESERT];
  }

  getGroundHeightAtX(worldX) {
    // Altura base del suelo
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
    return this.dropEngine.drop(itemId, this.plane);
  }

  update(dt, inputState) {
    if (this.status !== GAME_STATUS.PLAYING) return;

    // Manejar aceleración de avión
    if (inputState.speedUp) {
      this.plane.speed = Math.min(this.plane.maxSpeed, this.plane.speed + 120 * dt);
      this.plane.tilt = 0.05;
    } else if (inputState.slowDown) {
      this.plane.speed = Math.max(this.plane.minSpeed, this.plane.speed - 120 * dt);
      this.plane.tilt = -0.05;
    } else {
      this.plane.tilt *= 0.9;
    }

    // Avanzar mundo
    const moveDist = this.plane.speed * dt;
    this.worldDistance += moveDist;

    // Partículas de humo del motor
    if (Math.random() < 0.6) {
      this.smokeTrail.push({
        x: this.plane.x - 8,
        y: this.plane.y + 10 + (Math.random() - 0.5) * 4,
        size: 3 + Math.random() * 3,
        life: 0.6,
        maxLife: 0.6,
        vx: -60 - Math.random() * 20,
        vy: (Math.random() - 0.5) * 10
      });
    }

    // Actualizar humo
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
    }

    // Eliminar chunks fuera de pantalla y generar nuevos
    while (this.biomeChunks.length > 0 && this.biomeChunks[0].endX < -100) {
      this.biomeChunks.shift();
    }
    this.citizens = this.citizens.filter(c => c.x > -100);

    if (this.nextChunkX < this.canvasWidth + 600) {
      this.generateChunk();
    }

    // Actualizar motor de caída y colisiones
    this.dropEngine.update(
      dt,
      (x) => this.getGroundHeightAtX(x),
      (x) => this.getBiomeAtX(x)
    );

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
