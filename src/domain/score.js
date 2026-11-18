/**
 * DOMINIO: Sistema de Alegría (Joy-O-Meter), Combos, Puntuación y Récords
 */

import { t } from './i18n.js';

const HIGH_SCORE_STORAGE_KEY = 'joy_bomber_highscores_v1';

export class HighScoreStore {
  static loadAll() {
    try {
      const raw = window.localStorage.getItem(HIGH_SCORE_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  static get(mode) {
    const all = this.loadAll();
    return all[mode] || 0;
  }

  static update(mode, score) {
    const all = this.loadAll();
    const prev = all[mode] || 0;
    if (score > prev) {
      all[mode] = score;
      try {
        window.localStorage.setItem(HIGH_SCORE_STORAGE_KEY, JSON.stringify(all));
      } catch {
        // Ignorar si localStorage no está disponible
      }
      return { highScore: score, isNewRecord: true };
    }
    return { highScore: prev, isNewRecord: false };
  }
}

const PROGRESS_STORAGE_KEY = 'joy_bomber_progress_v1';

export class ProgressStore {
  static load() {
    try {
      const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // Ignorar
    }
    return {
      stageStars: {},
      selectedPlaneId: 'CLASSIC',
      storyCompleted: false,
      unlockedCities: ['TEGUCIGALPA']
    };
  }

  static getUnlockedCities() {
    const data = this.load();
    return Array.isArray(data.unlockedCities) && data.unlockedCities.length > 0
      ? data.unlockedCities
      : ['TEGUCIGALPA'];
  }

  static unlockCity(cityId) {
    const data = this.load();
    if (!Array.isArray(data.unlockedCities) || data.unlockedCities.length === 0) {
      data.unlockedCities = ['TEGUCIGALPA'];
    }
    if (!data.unlockedCities.includes(cityId)) {
      data.unlockedCities.push(cityId);
      this.save(data);
    }
    return data.unlockedCities;
  }

  static save(data) {
    try {
      window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Ignorar
    }
  }

  static getTotalStars() {
    const data = this.load();
    return Object.values(data.stageStars || {}).reduce((acc, s) => acc + s, 0);
  }

  static recordStageStars(stageKey, stars) {
    const data = this.load();
    if (!data.stageStars) data.stageStars = {};
    const prev = data.stageStars[stageKey] || 0;
    if (stars > prev) {
      data.stageStars[stageKey] = stars;
      this.save(data);
    }
    return this.getTotalStars();
  }

  static markStoryCompleted() {
    const data = this.load();
    data.storyCompleted = true;
    this.save(data);
  }

  static getSelectedPlaneId() {
    return this.load().selectedPlaneId || 'CLASSIC';
  }

  static setSelectedPlaneId(planeId) {
    const data = this.load();
    data.selectedPlaneId = planeId;
    this.save(data);
  }
}

export function calculateStars(joy, maxCombo) {
  if (joy >= 85 && maxCombo >= 5) return 3;
  if (joy >= 75) return 2;
  return 1;
}

export class JoyScorer {
  constructor() {
    this.joy = 60;        // 0 a 100%
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.successfulDrops = 0;
    this.totalDrops = 0;
    this.perfectDrops = 0;
  }

  reset() {
    this.joy = 60;
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.successfulDrops = 0;
    this.totalDrops = 0;
    this.perfectDrops = 0;
  }

  evaluateImpact(item, biome, hitTarget = true, targetCitizen = null, joyPenalty = 12) {
    this.totalDrops++;
    // Si hay un ciudadano objetivo cercano, debe coincidir con su petición única
    const isMatched = targetCitizen
      ? targetCitizen.needType === item.id
      : biome.neededItems.includes(item.id);

    if (isMatched) {
      if (hitTarget) {
        this.combo++;
        if (this.combo > this.maxCombo) {
          this.maxCombo = this.combo;
        }
        this.successfulDrops++;

        const comboMultiplier = Math.min(1 + (this.combo - 1) * 0.25, 4.0);
        const points = Math.round(biome.weightScore * comboMultiplier);
        this.score += points;

        const joyGain = Math.min(14 + this.combo * 2, 26);
        this.joy = Math.min(100, this.joy + joyGain);

        return {
          matched: true,
          tier: 'DIRECT',
          points,
          combo: this.combo,
          joyDelta: joyGain,
          message: t(`biome.${biome.id}.happy`)
        };
      } else {
        const points = Math.round(biome.weightScore * 0.4);
        this.score += points;
        const joyGain = 4;
        this.joy = Math.min(100, this.joy + joyGain);

        return {
          matched: true,
          tier: 'INDIRECT',
          points,
          combo: this.combo,
          joyDelta: joyGain,
          message: t('hud.near')
        };
      }
    } else {
      const oldCombo = this.combo;
      this.combo = 0;
      const joyLoss = joyPenalty;
      this.joy = Math.max(0, this.joy - joyLoss);

      return {
        matched: false,
        tier: 'MISS',
        points: 0,
        lostCombo: oldCombo,
        joyDelta: -joyLoss,
        message: targetCitizen
          ? t('hud.askedFor', { icon: targetCitizen.needIcon })
          : t(`biome.${biome.id}.unhappy`)
      };
    }
  }

  /**
   * Evaluación de Precisión Geométrica (Nivel 2)
   * Tolerancia balanceada para jugabilidad justa y divertida
   */
  evaluateGeometryImpact(item, slot, distance, joyPenalty = 8) {
    this.totalDrops++;

    if (!slot || slot.filled || slot.shapeType !== item.id || distance > 46) {
      const oldCombo = this.combo;
      this.combo = 0;
      const joyLoss = joyPenalty;
      this.joy = Math.max(0, this.joy - joyLoss);

      const reason = !slot || distance > 46
        ? t('hud.missedSlot')
        : slot.filled
          ? t('hud.slotFilled')
          : t('hud.wrongShape');

      return {
        matched: false,
        tier: 'MISS',
        points: 0,
        lostCombo: oldCombo,
        joyDelta: -joyLoss,
        message: reason
      };
    }

    this.combo++;
    if (this.combo > this.maxCombo) {
      this.maxCombo = this.combo;
    }
    this.successfulDrops++;

    const isPerfect = distance <= 18;
    if (isPerfect) {
      this.perfectDrops++;
    }

    const basePoints = isPerfect ? 300 : 140;
    const comboMultiplier = Math.min(1 + (this.combo - 1) * 0.25, 4.0);
    const points = Math.round(basePoints * comboMultiplier);
    this.score += points;

    const joyGain = isPerfect ? 24 : 15;
    this.joy = Math.min(100, this.joy + joyGain);

    return {
      matched: true,
      tier: isPerfect ? 'PERFECT' : 'GOOD',
      points,
      combo: this.combo,
      joyDelta: joyGain,
      message: isPerfect ? t('hud.perfectFit') : t('hud.goodShot')
    };
  }

  decayJoy(dt, decayRate = 1.0) {
    this.joy = Math.max(0, this.joy - decayRate * dt);
    return this.joy;
  }
}
