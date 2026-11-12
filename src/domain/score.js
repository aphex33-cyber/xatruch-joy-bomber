/**
 * DOMINIO: Sistema de Alegría (Joy-O-Meter), Combos y Puntuación
 */

export class JoyScorer {
  constructor() {
    this.joy = 50;        // 0 a 100%
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.successfulDrops = 0;
    this.totalDrops = 0;
  }

  reset() {
    this.joy = 50;
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.successfulDrops = 0;
    this.totalDrops = 0;
  }

  evaluateImpact(item, biome) {
    this.totalDrops++;
    const isMatched = biome.neededItems.includes(item.id);

    if (isMatched) {
      this.combo++;
      if (this.combo > this.maxCombo) {
        this.maxCombo = this.combo;
      }
      this.successfulDrops++;

      const comboMultiplier = Math.min(1 + (this.combo - 1) * 0.25, 4.0);
      const points = Math.round(biome.weightScore * comboMultiplier);
      this.score += points;

      // Ganar alegría (bonus si combo alto)
      const joyGain = Math.min(15 + this.combo * 2, 30);
      this.joy = Math.min(100, this.joy + joyGain);

      return {
        matched: true,
        points,
        combo: this.combo,
        joyDelta: joyGain,
        message: biome.happyMessage
      };
    } else {
      // Objeto no coincide con las necesidades del bioma
      const oldCombo = this.combo;
      this.combo = 0;

      // Penalización moderada de alegría
      const joyLoss = 12;
      this.joy = Math.max(0, this.joy - joyLoss);

      return {
        matched: false,
        points: 0,
        lostCombo: oldCombo,
        joyDelta: -joyLoss,
        message: biome.unhappyMessage
      };
    }
  }

  decayJoy(dt) {
    // La alegría disminuye levemente con el tiempo para forzar dinamismo
    const decayRate = 1.2; // % por segundo
    this.joy = Math.max(0, this.joy - decayRate * dt);
    return this.joy;
  }
}
