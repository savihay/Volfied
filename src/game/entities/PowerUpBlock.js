export const POWERUP_TYPES = ['S', 'T', 'P', 'L', 'C'];

export class PowerUpBlock {
  constructor(x, y, type = null, isRedBlock = false) {
    this.x = x;
    this.y = y;
    this.type = isRedBlock ? 'BOSS' : (type || POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)]);
    this.isRedBlock = isRedBlock;
    this.collected = false;
    this.size = 16;
    this.pulsePhase = Math.random() * Math.PI * 2;
  }

  update(dt) {
    this.pulsePhase += dt * 3;
  }

  getPulse() {
    return 0.7 + Math.sin(this.pulsePhase) * 0.3;
  }
}

/**
 * Place power-up blocks randomly within the unclaimed area.
 */
export function placePowerUpBlocks(contour, greyCount, redCount, fieldW, fieldH) {
  const blocks = [];
  const margin = 40;

  function randomPos() {
    return [
      margin + Math.random() * (fieldW - margin * 2),
      margin + Math.random() * (fieldH - margin * 2),
    ];
  }

  // We use a simple approach - place blocks and verify they're inside the contour
  for (let i = 0; i < greyCount; i++) {
    let pos, attempts = 0;
    do {
      pos = randomPos();
      attempts++;
    } while (attempts < 50 && !isInsideSimple(pos, contour));
    blocks.push(new PowerUpBlock(pos[0], pos[1]));
  }

  for (let i = 0; i < redCount; i++) {
    let pos, attempts = 0;
    do {
      pos = randomPos();
      attempts++;
    } while (attempts < 50 && !isInsideSimple(pos, contour));
    blocks.push(new PowerUpBlock(pos[0], pos[1], null, true));
  }

  return blocks;
}

function isInsideSimple(pt, contour) {
  let inside = false;
  const [x, y] = pt;
  for (let i = 0, j = contour.length - 1; i < contour.length; j = i++) {
    const [xi, yi] = contour[i];
    const [xj, yj] = contour[j];
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}
