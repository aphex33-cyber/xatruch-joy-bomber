/**
 * DOMINIO: Sistema de Alegría (Joy-O-Meter), Combos y Puntuación
 */

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

  evaluateImpact(item, biome, hitTarget = true) {
    this.totalDrops++;
    const isMatched = biome.neededItems.includes(item.id);

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
          message: biome.happyMessage
        };
      } else {
        // Cayó en la zona correcta pero lejos de un ciudadano o edificio objetivo
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
          message: '¡Cerca! Apunta directo a la gente'
        };
      }
    } else {
      const oldCombo = this.combo;
      this.combo = 0;
      const joyLoss = 12;
      this.joy = Math.max(0, this.joy - joyLoss);

      return {
        matched: false,
        tier: 'MISS',
        points: 0,
        lostCombo: oldCombo,
        joyDelta: -joyLoss,
        message: biome.unhappyMessage
      };
    }
  }

  /**
   * Evaluación de Precisión Geométrica (Nivel 2)
   * Tolerancia balanceada para jugabilidad justa y divertida
   */
  evaluateGeometryImpact(item, slot, distance) {
    this.totalDrops++;

    if (!slot || slot.filled || slot.shapeType !== item.id || distance > 46) {
      const oldCombo = this.combo;
      this.combo = 0;
      const joyLoss = 8;
      this.joy = Math.max(0, this.joy - joyLoss);

      const reason = !slot || distance > 46
        ? '¡FALLASTE LA BASE!'
        : slot.filled
          ? '¡ESA BASE YA ESTÁ LLENA!'
          : '¡FIGURA INCORRECTA!';

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
      message: isPerfect ? '¡ENCAJE PERFECTO!' : '¡BUEN TIRO!'
    };
  }

  decayJoy(dt, decayRate = 1.0) {
    this.joy = Math.max(0, this.joy - decayRate * dt);
    return this.joy;
  }
}
