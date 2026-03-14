import { dist } from '../geometry.js';
import { FLAME_SPEED } from '../constants.js';

/**
 * Flame travels along the player's trail toward the player.
 * When an enemy or projectile hits the trail, a flame spawns at the contact point
 * and races along the trail toward the player's current position.
 */
export class Flame {
  constructor(trailPoints, startIdx) {
    this.trail = trailPoints; // reference to the trail array
    this.idx = startIdx;      // current trail segment index
    this.x = trailPoints[startIdx][0];
    this.y = trailPoints[startIdx][1];
    this.speed = FLAME_SPEED;
    this.alive = true;
    this.reachedPlayer = false;
  }

  update(dt) {
    if (!this.alive) return;
    let remaining = this.speed;

    while (remaining > 0 && this.idx < this.trail.length - 1) {
      const target = this.trail[this.idx + 1];
      const d = dist([this.x, this.y], target);

      if (d <= remaining) {
        remaining -= d;
        this.x = target[0];
        this.y = target[1];
        this.idx++;
        if (this.idx >= this.trail.length - 1) {
          this.reachedPlayer = true;
          this.alive = false;
          return;
        }
      } else {
        const ratio = remaining / d;
        this.x += (target[0] - this.x) * ratio;
        this.y += (target[1] - this.y) * ratio;
        remaining = 0;
      }
    }
  }

  // Returns the portion of the trail that has been burned (for visual effect)
  getBurnedIndex() {
    return this.idx;
  }
}
