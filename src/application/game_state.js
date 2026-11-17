import {
  BIOMES_CATALOG,
  BIOME_TYPES,
  GAME_MODES,
  ITEM_TYPES,
  ITEMS_CATALOG,
  LEVELS_CONFIG
} from '../domain/types.js';
import { HighScoreStore } from '../domain/score.js';
import { DropEngine } from './drop_engine.js';
import { HighwayEngine } from './highway_engine.js';

export const GAME_STATUS = {
  START: 'START',
  PLAYING: 'PLAYING',
  LEVEL_COMPLETE: 'LEVEL_COMPLETE',
  VICTORY: 'VICTORY',
  GAMEOVER: 'GAMEOVER'
};

export class GameState {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.status = GAME_STATUS.START;
    this.mode = GAME_MODES.CITY;
    this.levelIndex = 0; // 0 = Nivel 1, 1 = Nivel 2

    this.dropEngine = new DropEngine();
    this.highwayEngine = new HighwayEngine(canvasWidth, canvasHeight);

    this.highScore = HighScoreStore.get(this.mode);
    this.isNewRecord = false;

    this.carouselItems = this.getItemsForCurrentLevel();
    this.selectedItemIndex = 0;

    // Anti-spam cooldown para soltar objetos (en segundos)
    this.dropCooldown = 0;
    this.dropCooldownDuration = 0.42;

    // Tiempo transcurrido en el nivel para escalado progresivo de velocidad
    this.levelTime = 0;
    this.landmarkCounter = 0;

    // Estado del Avión
    this.plane = {
      x: 110,
      y: 88,
      width: 72,
      height: 32,
      baseSpeed: 115, // Inicia en la velocidad mínima
      speed: 115,
      tilt: 0,
      hatchOpenTimer: 0
    };

    this.smokeTrail = [];
    this.worldDistance = 0;

    this.biomeChunks = [];
    this.chunkWidth = 700;
    this.nextChunkX = 0;

    this.citizens = [];
    this.geometrySlots = [];

    this.initWorld();
  }

  getCurrentLevelConfig() {
    const list = LEVELS_CONFIG[this.mode] || LEVELS_CONFIG[GAME_MODES.CITY];
    return list[Math.min(this.levelIndex, list.length - 1)];
  }

  getItemsForCurrentLevel() {
    if (this.mode === GAME_MODES.GEOMETRY) {
      const cfg = this.getCurrentLevelConfig();
      return cfg.items || [ITEM_TYPES.TRIANGLE, ITEM_TYPES.SQUARE, ITEM_TYPES.CIRCLE, ITEM_TYPES.STAR];
    }
    return [ITEM_TYPES.WATER, ITEM_TYPES.FOOD, ITEM_TYPES.MONEY, ITEM_TYPES.BIBLE, ITEM_TYPES.TOY];
  }

  setMode(newMode) {
    this.mode = newMode;
    this.levelIndex = 0;
    this.highScore = HighScoreStore.get(this.mode);
    this.isNewRecord = false;
    this.carouselItems = this.getItemsForCurrentLevel();
    this.selectedItemIndex = 0;
    this.dropEngine.scorer.reset();
    this.initWorld();
  }

  startGame(mode = null) {
    if (mode) {
      this.mode = mode;
    }
    this.levelIndex = 0;
    this.highScore = HighScoreStore.get(this.mode);
    this.isNewRecord = false;
    this.carouselItems = this.getItemsForCurrentLevel();
    this.selectedItemIndex = 0;
    this.dropEngine.scorer.reset();
    this.initWorld();
    this.status = GAME_STATUS.PLAYING;
  }

  finalizeRunHighScore() {
    const res = HighScoreStore.update(this.mode, this.dropEngine.scorer.score);
    this.highScore = res.highScore;
    this.isNewRecord = res.isNewRecord;
  }

  advanceToNextLevel() {
    const levels = LEVELS_CONFIG[this.mode];
    if (this.levelIndex + 1 < levels.length) {
      this.levelIndex++;
      this.carouselItems = this.getItemsForCurrentLevel();
      this.selectedItemIndex = 0;
      this.initWorld();
      this.status = GAME_STATUS.PLAYING;
    } else {
      this.finalizeRunHighScore();
      this.status = GAME_STATUS.VICTORY;
    }
  }

  initWorld() {
    this.biomeChunks = [];
    this.citizens = [];
    this.geometrySlots = [];
    this.dropEngine.activeDrops = [];
    this.dropEngine.rollingItems = [];
    this.dropEngine.particles = [];
    this.dropEngine.floatingTexts = [];
    this.nextChunkX = 0;
    this.worldDistance = 0;
    this.levelTime = 0;
    this.landmarkCounter = 0;
    this.dropCooldown = 0;

    if (this.mode === GAME_MODES.HIGHWAY) {
      this.plane.baseSpeed = 195;
      this.plane.speed = 195;
      this.dropEngine.scorer.joy = 100;
      this.highwayEngine.reset(this.canvasWidth, this.canvasHeight);
      return;
    }

    // Velocidad inicial en el setting más bajo
    this.plane.baseSpeed = 105 + this.levelIndex * 25;
    this.plane.speed = this.plane.baseSpeed;

    if (this.mode === GAME_MODES.GEOMETRY) {
      this.generateChunk(BIOME_TYPES.GEOMETRY_ZONE);
      this.generateChunk(BIOME_TYPES.GEOMETRY_ZONE);
      this.generateChunk(BIOME_TYPES.GEOMETRY_ZONE);
    } else {
      this.generateChunk(BIOME_TYPES.POVERTY_BELT);
      this.generateChunk(BIOME_TYPES.RICH_DISTRICT);
      this.generateChunk(BIOME_TYPES.FAVELA);
      this.generateChunk(BIOME_TYPES.FIRE_EMERGENCY);
    }
  }

  generateChunk(forcedType = null) {
    const cityBiomeOrder = [
      BIOME_TYPES.POVERTY_BELT,
      BIOME_TYPES.RICH_DISTRICT,
      BIOME_TYPES.FAVELA,
      BIOME_TYPES.FIRE_EMERGENCY
    ];

    const biomeType =
      forcedType ||
      (this.mode === GAME_MODES.GEOMETRY
        ? BIOME_TYPES.GEOMETRY_ZONE
        : cityBiomeOrder[this.landmarkCounter % cityBiomeOrder.length]);

    const biome = BIOMES_CATALOG[biomeType];
    const levelCfg = this.getCurrentLevelConfig();

    let landmark = null;
    if (this.mode === GAME_MODES.CITY && levelCfg.landmarks && levelCfg.landmarks.length > 0) {
      const lmType = levelCfg.landmarks[this.landmarkCounter % levelCfg.landmarks.length];
      this.landmarkCounter++;
      landmark = {
        type: lmType,
        x: this.nextChunkX + this.chunkWidth * 0.45,
        y: this.canvasHeight - 60
      };
    }

    const chunk = {
      startX: this.nextChunkX,
      endX: this.nextChunkX + this.chunkWidth,
      chunkWidth: this.chunkWidth,
      biome: biome,
      type: biomeType,
      landmark,
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
      const bWidth = 52 + Math.random() * 44;
      let bHeight = 40;

      if (type === BIOME_TYPES.RICH_DISTRICT) {
        bHeight = 90 + Math.random() * 105;
      } else if (type === BIOME_TYPES.POVERTY_BELT) {
        bHeight = 36 + Math.random() * 52;
      } else if (type === BIOME_TYPES.FAVELA) {
        bHeight = 42 + Math.random() * 56;
      } else if (type === BIOME_TYPES.FIRE_EMERGENCY) {
        bHeight = 70 + Math.random() * 72;
      }

      buildings.push({
        x: currentX,
        y: this.canvasHeight - 60 - bHeight,
        width: bWidth,
        height: bHeight,
        type: type,
        variant: Math.floor(Math.random() * 3),
        extinguished: false
      });

      currentX += type === BIOME_TYPES.POVERTY_BELT
        ? bWidth + 6 + Math.random() * 12 // Casitas más juntas en laderas
        : bWidth + 24 + Math.random() * 26;
    }

    return buildings;
  }

  generateCitizensForChunk(chunk) {
    const count = 3 + Math.floor(Math.random() * 2);
    const possibleNeeds = chunk.biome.neededItems;
    for (let i = 0; i < count; i++) {
      const x = chunk.startX + 75 + (i * (chunk.endX - chunk.startX - 140)) / count;
      // Cada ciudadano pide UNA sola opción específica (ej. dinero, agua o comida)
      const specificNeed = possibleNeeds[i % possibleNeeds.length];
      const needConfig = ITEMS_CATALOG[specificNeed];

      this.citizens.push({
        x: x,
        y: this.canvasHeight - 60,
        biomeType: chunk.type,
        needIcon: needConfig ? needConfig.icon : '❤️',
        needType: specificNeed,
        animationOffset: Math.random() * Math.PI * 2,
        isHappy: false,
        happyTimer: 0
      });
    }
  }

  generateGeometrySlotsForChunk(chunk) {
    const shapes = this.carouselItems;
    const count = 4;
    const spacing = (chunk.endX - chunk.startX - 120) / count;

    for (let i = 0; i < count; i++) {
      const x = chunk.startX + 95 + i * spacing + (Math.random() - 0.5) * 20;
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
    return chunk ? chunk.biome : BIOMES_CATALOG[BIOME_TYPES.POVERTY_BELT];
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
    if (this.mode === GAME_MODES.HIGHWAY) {
      return this.highwayEngine.jump();
    }
    if (this.dropCooldown > 0) return null; // Bloqueo anti-spam

    this.dropCooldown = this.dropCooldownDuration;
    const itemId = this.carouselItems[this.selectedItemIndex];
    this.plane.hatchOpenTimer = 0.25;
    return this.dropEngine.drop(itemId, this.plane);
  }

  update(dt, inputState) {
    if (this.status !== GAME_STATUS.PLAYING) return;

    this.levelTime += dt;

    if (this.mode === GAME_MODES.HIGHWAY) {
      // Velocidad progresiva en carretera (de 195 hasta 480)
      this.plane.baseSpeed = Math.min(480, 195 + this.levelTime * 3.2);
      const speedOffset = inputState.speedUp ? 55 : inputState.slowDown ? -45 : 0;
      const targetSpeed = Math.max(140, this.plane.baseSpeed + speedOffset);
      this.plane.speed += (targetSpeed - this.plane.speed) * Math.min(1, dt * 8);

      const moveDist = this.plane.speed * dt;
      this.worldDistance += moveDist;

      this.dropEngine.update(dt, this, moveDist);
      // Restaurar joy que decae en dropEngine, ya que en Highway depende de las vidas
      const isDead = this.highwayEngine.update(dt, this.plane.speed, this.dropEngine.scorer, this.dropEngine);
      if (isDead) {
        this.finalizeRunHighScore();
        this.status = GAME_STATUS.GAMEOVER;
      }
      return;
    }

    if (this.dropCooldown > 0) {
      this.dropCooldown = Math.max(0, this.dropCooldown - dt);
    }
    if (this.plane.hatchOpenTimer > 0) {
      this.plane.hatchOpenTimer = Math.max(0, this.plane.hatchOpenTimer - dt);
    }

    // Escalado continuo de velocidad a lo largo de varios minutos (105 KT -> 430 KT)
    this.plane.baseSpeed = Math.min(430, 105 + this.levelIndex * 25 + this.levelTime * 2.4);

    let speedOffset = 0;
    if (inputState.speedUp) {
      speedOffset = 65;
      this.plane.tilt = 0.06;
    } else if (inputState.slowDown) {
      speedOffset = -45;
      this.plane.tilt = -0.06;
    } else {
      this.plane.tilt *= 0.9;
    }

    const targetSpeed = Math.max(85, this.plane.baseSpeed + speedOffset);
    this.plane.speed += (targetSpeed - this.plane.speed) * Math.min(1, dt * 8);

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

    // Desplazar chunks y landmarks
    for (const chunk of this.biomeChunks) {
      chunk.startX -= moveDist;
      chunk.endX -= moveDist;
      if (chunk.landmark) {
        chunk.landmark.x -= moveDist;
      }
      for (const b of chunk.buildings) {
        b.x -= moveDist;
      }
    }
    this.nextChunkX -= moveDist;

    for (const c of this.citizens) {
      c.x -= moveDist;
      if (c.happyTimer > 0) {
        c.happyTimer -= dt;
        if (c.happyTimer <= 0) c.isHappy = false;
      }
    }

    for (const slot of this.geometrySlots) {
      slot.x -= moveDist;
      if (slot.snapAnim > 0) {
        slot.snapAnim = Math.max(0, slot.snapAnim - dt * 3);
      }
    }

    while (this.biomeChunks.length > 0 && this.biomeChunks[0].endX < -250) {
      this.biomeChunks.shift();
    }
    this.citizens = this.citizens.filter(c => c.x > -100);
    this.geometrySlots = this.geometrySlots.filter(s => s.x > -100);

    if (this.nextChunkX < this.canvasWidth + 600) {
      this.generateChunk();
    }

    this.dropEngine.update(dt, this, moveDist);

    // Gateway de Nivel (Híbrido: Puntos Meta + Joy-O-Meter mínimo)
    const levelCfg = this.getCurrentLevelConfig();
    if (
      this.dropEngine.scorer.score >= levelCfg.targetScore &&
      this.dropEngine.scorer.joy >= levelCfg.minJoy
    ) {
      const levels = LEVELS_CONFIG[this.mode];
      if (this.levelIndex + 1 < levels.length) {
        this.status = GAME_STATUS.LEVEL_COMPLETE;
      } else {
        this.finalizeRunHighScore();
        this.status = GAME_STATUS.VICTORY;
      }
      return;
    }

    if (this.dropEngine.scorer.joy <= 0) {
      this.finalizeRunHighScore();
      this.status = GAME_STATUS.GAMEOVER;
    }
  }

  restart() {
    this.startGame(this.mode);
  }
}
