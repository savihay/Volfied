/**
 * Sprite generation module for Volfied game entities.
 * All sprites are drawn on offscreen canvases and cached using a Map.
 */

const spriteCache = new Map();

// ---------------------------------------------------------------------------
//  Utility helpers
// ---------------------------------------------------------------------------

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function lighter(hex, amt = 60) {
  const [r, g, b] = hexToRgb(hex);
  return `rgb(${Math.min(255, r + amt)},${Math.min(255, g + amt)},${Math.min(255, b + amt)})`;
}

function darker(hex, amt = 60) {
  const [r, g, b] = hexToRgb(hex);
  return `rgb(${Math.max(0, r - amt)},${Math.max(0, g - amt)},${Math.max(0, b - amt)})`;
}

// ---------------------------------------------------------------------------
//  BOSS SPRITES
// ---------------------------------------------------------------------------

export function getBossSprite(bossName, size, hitFlash) {
  const key = `boss_${bossName}_${size}_${hitFlash ? 1 : 0}`;
  if (spriteCache.has(key)) return spriteCache.get(key);

  const s = size;
  const canvas = makeCanvas(s, s);
  const ctx = canvas.getContext('2d');
  const cx = s / 2;
  const cy = s / 2;

  // Draw the specific boss
  const drawFn = BOSS_DRAW[bossName];
  if (drawFn) {
    drawFn(ctx, cx, cy, s);
  }

  // Hit flash overlay: draw white over everything
  if (hitFlash) {
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillRect(0, 0, s, s);
    ctx.globalCompositeOperation = 'source-over';
  }

  spriteCache.set(key, canvas);
  return canvas;
}

const BOSS_DRAW = {
  // ──────────────────── 1. Giant Crab ────────────────────
  'Giant Crab': (ctx, cx, cy, s) => {
    const r = s * 0.35;
    // Body - red oval
    ctx.fillStyle = '#ff4422';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 2, r, r * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#cc3311';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 4, r * 0.85, r * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs - 4 on each side
    ctx.strokeStyle = '#cc3311';
    ctx.lineWidth = 2;
    for (let side = -1; side <= 1; side += 2) {
      for (let i = 0; i < 4; i++) {
        const lx = cx + side * (r * 0.3 + i * r * 0.18);
        const ly = cy + r * 0.3;
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.quadraticCurveTo(lx + side * 6, ly + 10, lx + side * 3, ly + 14);
        ctx.stroke();
      }
    }

    // Claws - prominent curved shapes
    for (let side = -1; side <= 1; side += 2) {
      const clawX = cx + side * (r + 4);
      const clawY = cy - 4;
      ctx.fillStyle = '#ff5533';
      ctx.beginPath();
      ctx.ellipse(clawX, clawY, 8, 5, side * 0.3, 0, Math.PI * 2);
      ctx.fill();
      // Pincer top
      ctx.beginPath();
      ctx.moveTo(clawX + side * 6, clawY - 4);
      ctx.quadraticCurveTo(clawX + side * 12, clawY - 2, clawX + side * 10, clawY + 2);
      ctx.lineTo(clawX + side * 6, clawY + 1);
      ctx.fill();
      // Pincer bottom
      ctx.beginPath();
      ctx.moveTo(clawX + side * 6, clawY + 4);
      ctx.quadraticCurveTo(clawX + side * 12, clawY + 6, clawX + side * 10, clawY + 2);
      ctx.lineTo(clawX + side * 6, clawY + 1);
      ctx.fill();
    }

    // Eyes on top
    for (let side = -1; side <= 1; side += 2) {
      // Eye stalk
      ctx.strokeStyle = '#ff4422';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx + side * 6, cy - r * 0.5);
      ctx.lineTo(cx + side * 8, cy - r * 0.8);
      ctx.stroke();
      // Eye ball
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx + side * 8, cy - r * 0.8, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(cx + side * 8, cy - r * 0.8, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  // ──────────────────── 2. Giant Fly ────────────────────
  'Giant Fly': (ctx, cx, cy, s) => {
    const r = s * 0.3;

    // Wings - large translucent ellipses
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#aaddff';
    ctx.beginPath();
    ctx.ellipse(cx - r * 0.8, cy - r * 0.2, r * 1.0, r * 0.5, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + r * 0.8, cy - r * 0.2, r * 1.0, r * 0.5, 0.4, 0, Math.PI * 2);
    ctx.fill();
    // Wing veins
    ctx.globalAlpha = 0.2;
    ctx.strokeStyle = '#88bbdd';
    ctx.lineWidth = 0.5;
    for (let side = -1; side <= 1; side += 2) {
      const wx = cx + side * r * 0.8;
      const wy = cy - r * 0.2;
      ctx.beginPath();
      ctx.moveTo(wx - side * r * 0.3, wy);
      ctx.lineTo(wx + side * r * 0.7, wy - r * 0.3);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(wx - side * r * 0.3, wy);
      ctx.lineTo(wx + side * r * 0.6, wy + r * 0.2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Body - green oval
    ctx.fillStyle = '#44bb44';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 4, r * 0.6, r * 0.85, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#338833';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 6, r * 0.45, r * 0.65, 0, 0, Math.PI * 2);
    ctx.fill();

    // Compound eyes - two large orange circles
    ctx.fillStyle = '#ff8800';
    ctx.beginPath();
    ctx.arc(cx - 6, cy - r * 0.5, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 6, cy - r * 0.5, 6, 0, Math.PI * 2);
    ctx.fill();
    // Eye detail - facets
    ctx.fillStyle = '#cc6600';
    for (let side = -1; side <= 1; side += 2) {
      const ex = cx + side * 6;
      const ey = cy - r * 0.5;
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(ex + Math.cos(a) * 2.5, ey + Math.sin(a) * 2.5, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Legs beneath
    ctx.strokeStyle = '#225522';
    ctx.lineWidth = 1;
    for (let i = -1; i <= 1; i++) {
      for (let side = -1; side <= 1; side += 2) {
        ctx.beginPath();
        ctx.moveTo(cx + side * 4, cy + r * 0.6 + i * 3);
        ctx.lineTo(cx + side * 10, cy + r * 1.1 + i * 2);
        ctx.stroke();
      }
    }
  },

  // ──────────────────── 3. Spider ────────────────────
  'Spider': (ctx, cx, cy, s) => {
    const r = s * 0.3;

    // 8 legs extending outward - curved
    ctx.strokeStyle = '#885522';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
      const midAngle = angle + (i % 2 === 0 ? 0.3 : -0.3);
      const x1 = cx + Math.cos(angle) * r * 0.6;
      const y1 = cy + Math.sin(angle) * r * 0.6;
      const mx = cx + Math.cos(midAngle) * r * 1.3;
      const my = cy + Math.sin(midAngle) * r * 1.3;
      const x2 = cx + Math.cos(angle) * r * 1.7;
      const y2 = cy + Math.sin(angle) * r * 1.7;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo(mx, my, x2, y2);
      ctx.stroke();
    }

    // Body - round brown
    ctx.fillStyle = '#885522';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Abdomen pattern
    ctx.fillStyle = '#774411';
    ctx.beginPath();
    ctx.arc(cx, cy + 2, r * 0.7, 0, Math.PI * 2);
    ctx.fill();

    // Hairy texture - short lines on body
    ctx.strokeStyle = '#664411';
    ctx.lineWidth = 0.8;
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const x1 = cx + Math.cos(a) * r * 0.7;
      const y1 = cy + Math.sin(a) * r * 0.7;
      const x2 = cx + Math.cos(a) * r * 1.0;
      const y2 = cy + Math.sin(a) * r * 1.0;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Cluster of eyes at front (top)
    const eyeY = cy - r * 0.4;
    ctx.fillStyle = '#ff2200';
    const eyePositions = [[-3, -2], [3, -2], [-5, 1], [5, 1], [-1, 1], [1, 1]];
    for (const [ox, oy] of eyePositions) {
      ctx.beginPath();
      ctx.arc(cx + ox, eyeY + oy, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  // ──────────────────── 4. Centipede (head only) ────────────────────
  'Centipede': (ctx, cx, cy, s) => {
    const r = s * 0.3;

    // Head - green round
    ctx.fillStyle = '#66aa33';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#558822';
    ctx.beginPath();
    ctx.arc(cx, cy + 1, r * 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Antennae
    ctx.strokeStyle = '#66aa33';
    ctx.lineWidth = 1.5;
    for (let side = -1; side <= 1; side += 2) {
      ctx.beginPath();
      ctx.moveTo(cx + side * 4, cy - r * 0.6);
      ctx.quadraticCurveTo(cx + side * 10, cy - r * 1.4, cx + side * 14, cy - r * 1.6);
      ctx.stroke();
      // Antenna tip
      ctx.fillStyle = '#88cc44';
      ctx.beginPath();
      ctx.arc(cx + side * 14, cy - r * 1.6, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Mandibles
    ctx.fillStyle = '#445500';
    for (let side = -1; side <= 1; side += 2) {
      ctx.beginPath();
      ctx.moveTo(cx + side * 3, cy + r * 0.7);
      ctx.quadraticCurveTo(cx + side * 8, cy + r * 1.2, cx + side * 2, cy + r * 1.3);
      ctx.closePath();
      ctx.fill();
    }

    // Eyes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx - 5, cy - 3, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 5, cy - 3, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111111';
    ctx.beginPath();
    ctx.arc(cx - 5, cy - 2, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 5, cy - 2, 2, 0, Math.PI * 2);
    ctx.fill();
  },

  // ──────────────────── 5. Nautilus ────────────────────
  'Nautilus': (ctx, cx, cy, s) => {
    const r = s * 0.38;

    // Spiral shell
    ctx.strokeStyle = '#4488cc';
    ctx.lineWidth = 3;
    ctx.beginPath();
    let angle = 0;
    const turns = 3;
    const steps = 80;
    for (let i = 0; i <= steps; i++) {
      angle = (i / steps) * turns * Math.PI * 2;
      const sr = 2 + (i / steps) * r * 0.85;
      const x = cx + Math.cos(angle) * sr;
      const y = cy + Math.sin(angle) * sr;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Fill shell body
    ctx.fillStyle = '#3377aa';
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.85, 0, Math.PI * 2);
    ctx.fill();

    // Shell chambers - concentric arcs
    ctx.strokeStyle = '#5599cc';
    ctx.lineWidth = 1;
    for (let i = 1; i < 5; i++) {
      const cr = r * 0.2 * i;
      ctx.beginPath();
      ctx.arc(cx, cy, cr, -Math.PI * 0.5, Math.PI * 0.8);
      ctx.stroke();
    }

    // Outer shell edge highlight
    ctx.strokeStyle = '#66aadd';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.85, 0, Math.PI * 2);
    ctx.stroke();

    // Opening area
    ctx.fillStyle = '#224466';
    ctx.beginPath();
    ctx.ellipse(cx + r * 0.5, cy + r * 0.3, r * 0.3, r * 0.5, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Tentacles from opening
    ctx.strokeStyle = '#88bbdd';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 5; i++) {
      const tx = cx + r * 0.5 + i * 2;
      const ty = cy + r * 0.6;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.quadraticCurveTo(tx + 3, ty + 8, tx - 2, ty + 14);
      ctx.stroke();
    }

    // Eye near opening
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx + r * 0.4, cy + r * 0.1, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111133';
    ctx.beginPath();
    ctx.arc(cx + r * 0.4, cy + r * 0.1, 1.5, 0, Math.PI * 2);
    ctx.fill();
  },

  // ──────────────────── 6. Twin Faces ────────────────────
  'Twin Faces': (ctx, cx, cy, s) => {
    const r = s * 0.36;

    // Round head
    ctx.fillStyle = '#cc44cc';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#aa33aa';
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.88, 0, Math.PI * 2);
    ctx.fill();

    // Eyes - white with dark pupils, slightly alien
    for (let side = -1; side <= 1; side += 2) {
      const ex = cx + side * r * 0.35;
      const ey = cy - r * 0.2;
      // White
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(ex, ey, 6, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      // Iris
      ctx.fillStyle = '#440044';
      ctx.beginPath();
      ctx.arc(ex, ey + 1, 3.5, 0, Math.PI * 2);
      ctx.fill();
      // Pupil
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(ex, ey + 1, 2, 0, Math.PI * 2);
      ctx.fill();
      // Glint
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ex + 1, ey - 1, 1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Creepy grin
    ctx.strokeStyle = '#330033';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy + r * 0.15, r * 0.45, 0.2, Math.PI - 0.2);
    ctx.stroke();
    // Teeth
    ctx.fillStyle = '#eeddee';
    for (let i = -3; i <= 3; i++) {
      const tx = cx + i * 3;
      const ty = cy + r * 0.15 + Math.sqrt(Math.max(0, (r * 0.45) ** 2 - (i * 3) ** 2)) * 0.6;
      ctx.fillRect(tx - 1, ty, 2, 3);
    }

    // Alien ridges on top
    ctx.strokeStyle = '#dd55dd';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(cx, cy - r * 0.6 + i * 3, r * 0.3 - i * 3, Math.PI + 0.5, -0.5);
      ctx.stroke();
    }
  },

  // ──────────────────── 7. Giant Hand ────────────────────
  'Giant Hand': (ctx, cx, cy, s) => {
    const r = s * 0.35;

    // Palm - oval
    ctx.fillStyle = '#ddaa77';
    ctx.beginPath();
    ctx.ellipse(cx, cy + r * 0.3, r * 0.65, r * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    // Palm shadow
    ctx.fillStyle = '#cc9966';
    ctx.beginPath();
    ctx.ellipse(cx + 2, cy + r * 0.35, r * 0.5, r * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    // Palm lines
    ctx.strokeStyle = '#bb8855';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.4, cy + r * 0.2);
    ctx.quadraticCurveTo(cx, cy + r * 0.1, cx + r * 0.3, cy + r * 0.3);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.35, cy + r * 0.4);
    ctx.quadraticCurveTo(cx, cy + r * 0.35, cx + r * 0.35, cy + r * 0.45);
    ctx.stroke();

    // 5 fingers extending upward
    const fingerData = [
      { x: -r * 0.5, len: r * 0.7, w: 4 },   // pinky
      { x: -r * 0.25, len: r * 0.9, w: 4.5 }, // ring
      { x: 0, len: r * 1.0, w: 5 },            // middle
      { x: r * 0.25, len: r * 0.85, w: 4.5 },  // index
      { x: r * 0.55, len: r * 0.6, w: 5 },     // thumb (angled)
    ];
    for (let i = 0; i < 5; i++) {
      const f = fingerData[i];
      const fx = cx + f.x;
      const baseY = cy - r * 0.15;
      const tipY = baseY - f.len;
      const thumbAngle = i === 4 ? 0.4 : 0;

      ctx.fillStyle = '#ddaa77';
      ctx.beginPath();
      if (i === 4) {
        // Thumb - angled
        ctx.save();
        ctx.translate(fx, baseY);
        ctx.rotate(thumbAngle);
        ctx.fillRect(-f.w / 2, -f.len, f.w, f.len);
        // Fingernail
        ctx.fillStyle = '#eeccaa';
        ctx.fillRect(-f.w / 2 + 0.5, -f.len, f.w - 1, 4);
        ctx.restore();
      } else {
        ctx.fillRect(fx - f.w / 2, tipY, f.w, f.len);
        // Rounded tip
        ctx.beginPath();
        ctx.arc(fx, tipY, f.w / 2, 0, Math.PI * 2);
        ctx.fill();
        // Fingernail
        ctx.fillStyle = '#eeccaa';
        ctx.beginPath();
        ctx.arc(fx, tipY + 1, f.w / 2 - 0.5, Math.PI, Math.PI * 2);
        ctx.fill();
      }
    }

    // Knuckle creases
    ctx.strokeStyle = '#bb8855';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 4; i++) {
      const f = fingerData[i];
      const fx = cx + f.x;
      const baseY = cy - r * 0.15;
      ctx.beginPath();
      ctx.moveTo(fx - 3, baseY - f.len * 0.35);
      ctx.lineTo(fx + 3, baseY - f.len * 0.35);
      ctx.stroke();
    }
  },

  // ──────────────────── 8. Killer Ladybug ────────────────────
  'Killer Ladybug': (ctx, cx, cy, s) => {
    const r = s * 0.35;

    // Red dome body
    ctx.fillStyle = '#ff2222';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 2, r, r * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wing split line
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 0.7);
    ctx.lineTo(cx, cy + r * 0.8);
    ctx.stroke();

    // Black spots
    ctx.fillStyle = '#111111';
    const spots = [[-6, -2], [6, -2], [-4, 6], [4, 6], [-8, 4], [8, 4]];
    for (const [sx, sy] of spots) {
      ctx.beginPath();
      ctx.arc(cx + sx, cy + sy, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Black head section
    ctx.fillStyle = '#111111';
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.55, r * 0.45, 0, Math.PI * 2);
    ctx.fill();

    // White eyes on head
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx - 4, cy - r * 0.6, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 4, cy - r * 0.6, 3, 0, Math.PI * 2);
    ctx.fill();
    // Pupils
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(cx - 4, cy - r * 0.55, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 4, cy - r * 0.55, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Antennae
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 1;
    for (let side = -1; side <= 1; side += 2) {
      ctx.beginPath();
      ctx.moveTo(cx + side * 3, cy - r * 0.85);
      ctx.quadraticCurveTo(cx + side * 8, cy - r * 1.2, cx + side * 10, cy - r * 1.3);
      ctx.stroke();
    }

    // Tiny legs
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 1;
    for (let i = -1; i <= 1; i++) {
      for (let side = -1; side <= 1; side += 2) {
        ctx.beginPath();
        ctx.moveTo(cx + side * r * 0.7, cy + 2 + i * 5);
        ctx.lineTo(cx + side * (r + 4), cy + 6 + i * 5);
        ctx.stroke();
      }
    }
  },

  // ──────────────────── 9. Jellyfish ────────────────────
  'Jellyfish': (ctx, cx, cy, s) => {
    const r = s * 0.35;

    // Internal glow effect
    ctx.shadowColor = '#88aaff';
    ctx.shadowBlur = 10;

    // Bell dome shape
    ctx.fillStyle = 'rgba(136,170,255,0.5)';
    ctx.beginPath();
    ctx.moveTo(cx - r, cy);
    ctx.quadraticCurveTo(cx - r, cy - r * 1.2, cx, cy - r * 1.1);
    ctx.quadraticCurveTo(cx + r, cy - r * 1.2, cx + r, cy);
    // Wavy bottom edge of bell
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      const bx = cx + r - t * r * 2;
      const by = cy + Math.sin(t * Math.PI * 4) * 3;
      ctx.lineTo(bx, by);
    }
    ctx.closePath();
    ctx.fill();

    // Second translucent layer
    ctx.fillStyle = 'rgba(170,200,255,0.3)';
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.8, cy - 2);
    ctx.quadraticCurveTo(cx - r * 0.7, cy - r * 0.9, cx, cy - r * 0.85);
    ctx.quadraticCurveTo(cx + r * 0.7, cy - r * 0.9, cx + r * 0.8, cy - 2);
    ctx.closePath();
    ctx.fill();

    // Dots on bell
    ctx.fillStyle = 'rgba(200,220,255,0.5)';
    const dotPos = [[0, -r * 0.6], [-5, -r * 0.4], [5, -r * 0.4], [-3, -r * 0.8], [3, -r * 0.8]];
    for (const [dx, dy] of dotPos) {
      ctx.beginPath();
      ctx.arc(cx + dx, cy + dy, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.shadowBlur = 0;

    // Tentacles hanging down - wavy lines
    ctx.strokeStyle = 'rgba(136,170,255,0.6)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 7; i++) {
      const tx = cx - r * 0.6 + i * r * 0.2;
      ctx.beginPath();
      ctx.moveTo(tx, cy + 2);
      const tentLen = r * 0.8 + (i % 2) * r * 0.4;
      for (let j = 0; j <= 10; j++) {
        const t = j / 10;
        const x = tx + Math.sin(t * Math.PI * 3 + i) * 4;
        const y = cy + 2 + t * tentLen;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Internal glow spots
    ctx.fillStyle = 'rgba(200,220,255,0.4)';
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.3, r * 0.25, 0, Math.PI * 2);
    ctx.fill();
  },

  // ──────────────────── 10. Scorpion ────────────────────
  'Scorpion': (ctx, cx, cy, s) => {
    const r = s * 0.35;

    // Segmented body
    ctx.fillStyle = '#cc8833';
    // Main body
    ctx.beginPath();
    ctx.ellipse(cx, cy + 2, r * 0.5, r * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    // Head
    ctx.beginPath();
    ctx.ellipse(cx, cy - r * 0.3, r * 0.3, r * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body segments texture
    ctx.strokeStyle = '#aa6622';
    ctx.lineWidth = 1;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.4, cy + 2 + i * 4);
      ctx.lineTo(cx + r * 0.4, cy + 2 + i * 4);
      ctx.stroke();
    }

    // Tail going over the back - curved segments
    ctx.strokeStyle = '#cc8833';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, cy + r * 0.35);
    ctx.quadraticCurveTo(cx + r * 0.6, cy + r * 0.8, cx + r * 0.5, cy + r * 0.2);
    ctx.quadraticCurveTo(cx + r * 0.4, cy - r * 0.6, cx + r * 0.1, cy - r * 0.9);
    ctx.stroke();

    // Stinger
    ctx.fillStyle = '#222222';
    ctx.beginPath();
    ctx.moveTo(cx + r * 0.1, cy - r * 0.9);
    ctx.lineTo(cx + r * 0.05, cy - r * 1.15);
    ctx.lineTo(cx + r * 0.2, cy - r * 0.85);
    ctx.closePath();
    ctx.fill();

    // Pincers at front
    for (let side = -1; side <= 1; side += 2) {
      ctx.strokeStyle = '#cc8833';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx + side * r * 0.3, cy - r * 0.35);
      ctx.lineTo(cx + side * r * 0.7, cy - r * 0.6);
      ctx.stroke();
      // Pincer claw
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx + side * r * 0.7, cy - r * 0.6);
      ctx.lineTo(cx + side * r * 0.85, cy - r * 0.75);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + side * r * 0.7, cy - r * 0.6);
      ctx.lineTo(cx + side * r * 0.9, cy - r * 0.55);
      ctx.stroke();
    }

    // Legs
    ctx.strokeStyle = '#aa6622';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      for (let side = -1; side <= 1; side += 2) {
        const ly = cy - 2 + i * 5;
        ctx.beginPath();
        ctx.moveTo(cx + side * r * 0.4, ly);
        ctx.lineTo(cx + side * r * 0.8, ly + 5);
        ctx.stroke();
      }
    }

    // Eyes
    ctx.fillStyle = '#111111';
    ctx.beginPath();
    ctx.arc(cx - 3, cy - r * 0.35, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 3, cy - r * 0.35, 1.5, 0, Math.PI * 2);
    ctx.fill();
  },

  // ──────────────────── 11. Wasp ────────────────────
  'Wasp': (ctx, cx, cy, s) => {
    const r = s * 0.32;

    // Wings
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#ddddff';
    ctx.beginPath();
    ctx.ellipse(cx - 6, cy - r * 0.5, r * 0.7, r * 0.3, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 6, cy - r * 0.5, r * 0.7, r * 0.3, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Abdomen - yellow and black stripes
    ctx.fillStyle = '#dddd22';
    ctx.beginPath();
    ctx.ellipse(cx, cy + r * 0.3, r * 0.45, r * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    // Black stripes
    ctx.fillStyle = '#111111';
    for (let i = -1; i <= 2; i++) {
      const sy = cy + r * 0.1 + i * 5;
      ctx.fillRect(cx - r * 0.4, sy, r * 0.8, 2.5);
    }

    // Narrow waist
    ctx.fillStyle = '#dddd22';
    ctx.fillRect(cx - 2, cy - r * 0.2, 4, 6);

    // Thorax
    ctx.fillStyle = '#222222';
    ctx.beginPath();
    ctx.ellipse(cx, cy - r * 0.35, r * 0.3, r * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = '#111111';
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.7, r * 0.22, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#dddd22';
    ctx.beginPath();
    ctx.arc(cx - 3, cy - r * 0.72, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 3, cy - r * 0.72, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Stinger at back (bottom)
    ctx.fillStyle = '#111111';
    ctx.beginPath();
    ctx.moveTo(cx - 2, cy + r * 0.95);
    ctx.lineTo(cx, cy + r * 1.2);
    ctx.lineTo(cx + 2, cy + r * 0.95);
    ctx.closePath();
    ctx.fill();

    // Legs
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      for (let side = -1; side <= 1; side += 2) {
        ctx.beginPath();
        ctx.moveTo(cx + side * r * 0.25, cy - r * 0.2 + i * 5);
        ctx.lineTo(cx + side * r * 0.65, cy + 2 + i * 5);
        ctx.stroke();
      }
    }
  },

  // ──────────────────── 12. Snake (head only) ────────────────────
  'Snake': (ctx, cx, cy, s) => {
    const r = s * 0.35;

    // Head shape - slightly triangular
    ctx.fillStyle = '#33aa55';
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 0.7);
    ctx.quadraticCurveTo(cx + r * 0.7, cy - r * 0.3, cx + r * 0.5, cy + r * 0.5);
    ctx.quadraticCurveTo(cx, cy + r * 0.7, cx - r * 0.5, cy + r * 0.5);
    ctx.quadraticCurveTo(cx - r * 0.7, cy - r * 0.3, cx, cy - r * 0.7);
    ctx.closePath();
    ctx.fill();

    // Diamond pattern on top
    ctx.fillStyle = '#228844';
    const diamonds = [[0, -r * 0.3], [-3, 0], [3, 0], [0, r * 0.2]];
    for (const [dx, dy] of diamonds) {
      ctx.save();
      ctx.translate(cx + dx, cy + dy);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-3, -3, 6, 6);
      ctx.restore();
    }

    // Scale texture
    ctx.strokeStyle = '#2a9048';
    ctx.lineWidth = 0.5;
    for (let row = -2; row <= 2; row++) {
      for (let col = -1; col <= 1; col++) {
        const sx = cx + col * 6 + (row % 2) * 3;
        const sy = cy + row * 5;
        ctx.beginPath();
        ctx.arc(sx, sy, 3, 0, Math.PI);
        ctx.stroke();
      }
    }

    // Eyes
    ctx.fillStyle = '#ffdd00';
    ctx.beginPath();
    ctx.ellipse(cx - 5, cy - r * 0.25, 3, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 5, cy - r * 0.25, 3, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    // Slit pupils
    ctx.fillStyle = '#111111';
    ctx.fillRect(cx - 5.5, cy - r * 0.25 - 3, 1.5, 6);
    ctx.fillRect(cx + 4.5, cy - r * 0.25 - 3, 1.5, 6);

    // Forked tongue
    ctx.strokeStyle = '#ff3333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy + r * 0.5);
    ctx.lineTo(cx, cy + r * 0.85);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy + r * 0.85);
    ctx.lineTo(cx - 3, cy + r * 1.0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy + r * 0.85);
    ctx.lineTo(cx + 3, cy + r * 1.0);
    ctx.stroke();

    // Nostrils
    ctx.fillStyle = '#226633';
    ctx.beginPath();
    ctx.arc(cx - 3, cy - r * 0.5, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 3, cy - r * 0.5, 1, 0, Math.PI * 2);
    ctx.fill();
  },

  // ──────────────────── 13. Giant Bat ────────────────────
  'Giant Bat': (ctx, cx, cy, s) => {
    const r = s * 0.35;

    // Wings - angular membrane shape
    for (let side = -1; side <= 1; side += 2) {
      ctx.fillStyle = '#5533aa';
      ctx.beginPath();
      ctx.moveTo(cx + side * 3, cy - 2);
      ctx.lineTo(cx + side * r * 0.6, cy - r * 0.7);
      ctx.lineTo(cx + side * r * 1.3, cy - r * 0.5);
      ctx.lineTo(cx + side * r * 1.4, cy - r * 0.1);
      ctx.lineTo(cx + side * r * 1.2, cy + r * 0.2);
      // Scalloped bottom edge
      ctx.lineTo(cx + side * r * 0.9, cy + r * 0.1);
      ctx.lineTo(cx + side * r * 0.7, cy + r * 0.3);
      ctx.lineTo(cx + side * r * 0.4, cy + r * 0.15);
      ctx.lineTo(cx + side * 3, cy + 4);
      ctx.closePath();
      ctx.fill();

      // Wing bone lines
      ctx.strokeStyle = '#7755cc';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx + side * 3, cy);
      ctx.lineTo(cx + side * r * 1.3, cy - r * 0.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + side * 3, cy);
      ctx.lineTo(cx + side * r * 1.4, cy - r * 0.1);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + side * 3, cy);
      ctx.lineTo(cx + side * r * 1.2, cy + r * 0.2);
      ctx.stroke();
    }

    // Body - purple
    ctx.fillStyle = '#6644aa';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 2, r * 0.3, r * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = '#6644aa';
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.35, r * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Pointed ears
    for (let side = -1; side <= 1; side += 2) {
      ctx.fillStyle = '#7755bb';
      ctx.beginPath();
      ctx.moveTo(cx + side * 5, cy - r * 0.5);
      ctx.lineTo(cx + side * 8, cy - r * 0.95);
      ctx.lineTo(cx + side * 2, cy - r * 0.55);
      ctx.closePath();
      ctx.fill();
    }

    // Eyes - small red
    ctx.fillStyle = '#ff4444';
    ctx.beginPath();
    ctx.arc(cx - 4, cy - r * 0.38, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 4, cy - r * 0.38, 2, 0, Math.PI * 2);
    ctx.fill();

    // Fangs
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(cx - 3, cy - r * 0.2);
    ctx.lineTo(cx - 2, cy - r * 0.05);
    ctx.lineTo(cx - 1, cy - r * 0.2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + 1, cy - r * 0.2);
    ctx.lineTo(cx + 2, cy - r * 0.05);
    ctx.lineTo(cx + 3, cy - r * 0.2);
    ctx.fill();
  },

  // ──────────────────── 14. Alien ────────────────────
  'Alien': (ctx, cx, cy, s) => {
    const r = s * 0.35;

    // Small body
    ctx.fillStyle = '#1ebb88';
    ctx.beginPath();
    ctx.ellipse(cx, cy + r * 0.5, r * 0.25, r * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    // Thin neck
    ctx.fillStyle = '#22ddaa';
    ctx.fillRect(cx - 2, cy + r * 0.1, 4, r * 0.2);

    // Large head - classic alien bulbous shape
    ctx.fillStyle = '#22ddaa';
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.5, cy + r * 0.1);
    ctx.quadraticCurveTo(cx - r * 0.7, cy - r * 0.3, cx - r * 0.5, cy - r * 0.6);
    ctx.quadraticCurveTo(cx - r * 0.3, cy - r * 1.0, cx, cy - r * 0.95);
    ctx.quadraticCurveTo(cx + r * 0.3, cy - r * 1.0, cx + r * 0.5, cy - r * 0.6);
    ctx.quadraticCurveTo(cx + r * 0.7, cy - r * 0.3, cx + r * 0.5, cy + r * 0.1);
    ctx.closePath();
    ctx.fill();

    // Head highlight
    ctx.fillStyle = '#33eebb';
    ctx.beginPath();
    ctx.ellipse(cx, cy - r * 0.5, r * 0.35, r * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();

    // Huge dark oval eyes
    for (let side = -1; side <= 1; side += 2) {
      ctx.fillStyle = '#112233';
      ctx.beginPath();
      ctx.ellipse(cx + side * r * 0.25, cy - r * 0.25, r * 0.2, r * 0.3, side * 0.3, 0, Math.PI * 2);
      ctx.fill();
      // Eye reflection
      ctx.fillStyle = 'rgba(100,200,200,0.3)';
      ctx.beginPath();
      ctx.ellipse(cx + side * r * 0.2, cy - r * 0.35, r * 0.08, r * 0.12, side * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Small nostrils
    ctx.fillStyle = '#119977';
    ctx.beginPath();
    ctx.arc(cx - 2, cy + r * 0.02, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 2, cy + r * 0.02, 1, 0, Math.PI * 2);
    ctx.fill();

    // Small slit mouth
    ctx.strokeStyle = '#119977';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 4, cy + r * 0.08);
    ctx.lineTo(cx + 4, cy + r * 0.08);
    ctx.stroke();

    // Ridges on head
    ctx.strokeStyle = '#44eebb';
    ctx.lineWidth = 0.8;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(cx, cy - r * 0.7 + i * 4, r * 0.35 + i * 2, Math.PI + 0.6, -0.6);
      ctx.stroke();
    }

    // Arms
    ctx.strokeStyle = '#22ddaa';
    ctx.lineWidth = 2;
    for (let side = -1; side <= 1; side += 2) {
      ctx.beginPath();
      ctx.moveTo(cx + side * r * 0.2, cy + r * 0.4);
      ctx.lineTo(cx + side * r * 0.5, cy + r * 0.7);
      ctx.stroke();
    }
  },

  // ──────────────────── 15. Dragon ────────────────────
  'Dragon': (ctx, cx, cy, s) => {
    const r = s * 0.38;

    // Small wings on sides
    for (let side = -1; side <= 1; side += 2) {
      ctx.fillStyle = '#cc4411';
      ctx.beginPath();
      ctx.moveTo(cx + side * r * 0.4, cy - r * 0.1);
      ctx.lineTo(cx + side * r * 1.1, cy - r * 0.6);
      ctx.lineTo(cx + side * r * 1.2, cy - r * 0.2);
      ctx.lineTo(cx + side * r * 0.9, cy + r * 0.1);
      ctx.lineTo(cx + side * r * 0.5, cy + r * 0.15);
      ctx.closePath();
      ctx.fill();
      // Wing membrane lines
      ctx.strokeStyle = '#aa3300';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(cx + side * r * 0.45, cy);
      ctx.lineTo(cx + side * r * 1.1, cy - r * 0.6);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + side * r * 0.45, cy);
      ctx.lineTo(cx + side * r * 1.2, cy - r * 0.2);
      ctx.stroke();
    }

    // Dragon head - main shape
    ctx.fillStyle = '#ff6622';
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 0.8);
    ctx.quadraticCurveTo(cx + r * 0.6, cy - r * 0.7, cx + r * 0.5, cy - r * 0.2);
    ctx.quadraticCurveTo(cx + r * 0.55, cy + r * 0.3, cx + r * 0.3, cy + r * 0.5);
    ctx.lineTo(cx - r * 0.3, cy + r * 0.5);
    ctx.quadraticCurveTo(cx - r * 0.55, cy + r * 0.3, cx - r * 0.5, cy - r * 0.2);
    ctx.quadraticCurveTo(cx - r * 0.6, cy - r * 0.7, cx, cy - r * 0.8);
    ctx.closePath();
    ctx.fill();

    // Snout/jaw area
    ctx.fillStyle = '#dd5511';
    ctx.beginPath();
    ctx.ellipse(cx, cy + r * 0.2, r * 0.35, r * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();

    // Scales texture
    ctx.fillStyle = '#cc5500';
    for (let row = -2; row <= 1; row++) {
      for (let col = -1; col <= 1; col++) {
        const sx = cx + col * 7 + (row % 2) * 3;
        const sy = cy - r * 0.2 + row * 6;
        ctx.beginPath();
        ctx.arc(sx, sy, 3, Math.PI, Math.PI * 2);
        ctx.fill();
      }
    }

    // Horns
    for (let side = -1; side <= 1; side += 2) {
      ctx.fillStyle = '#553311';
      ctx.beginPath();
      ctx.moveTo(cx + side * r * 0.3, cy - r * 0.65);
      ctx.lineTo(cx + side * r * 0.5, cy - r * 1.1);
      ctx.lineTo(cx + side * r * 0.15, cy - r * 0.6);
      ctx.closePath();
      ctx.fill();
    }

    // Eyes
    ctx.fillStyle = '#ffdd00';
    ctx.beginPath();
    ctx.ellipse(cx - r * 0.2, cy - r * 0.3, 4, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + r * 0.2, cy - r * 0.3, 4, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Slit pupils
    ctx.fillStyle = '#111111';
    ctx.fillRect(cx - r * 0.2 - 0.7, cy - r * 0.3 - 3.5, 1.4, 7);
    ctx.fillRect(cx + r * 0.2 - 0.7, cy - r * 0.3 - 3.5, 1.4, 7);

    // Open mouth with teeth
    ctx.fillStyle = '#331100';
    ctx.beginPath();
    ctx.ellipse(cx, cy + r * 0.4, r * 0.25, r * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    // Teeth - top
    ctx.fillStyle = '#ffffff';
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + i * 4 - 1.5, cy + r * 0.32);
      ctx.lineTo(cx + i * 4, cy + r * 0.38);
      ctx.lineTo(cx + i * 4 + 1.5, cy + r * 0.32);
      ctx.fill();
    }

    // Fire effect near mouth
    ctx.shadowColor = '#ff4400';
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#ff6600';
    ctx.beginPath();
    ctx.ellipse(cx, cy + r * 0.65, 5, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffaa00';
    ctx.beginPath();
    ctx.ellipse(cx, cy + r * 0.6, 3, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffff88';
    ctx.beginPath();
    ctx.arc(cx, cy + r * 0.55, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Nostrils
    ctx.fillStyle = '#331100';
    ctx.beginPath();
    ctx.arc(cx - 4, cy + r * 0.05, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 4, cy + r * 0.05, 2, 0, Math.PI * 2);
    ctx.fill();
  },

  // ──────────────────── 16. The Overlord ────────────────────
  'The Overlord': (ctx, cx, cy, s) => {
    const r = s * 0.4;

    // Dark body aura
    ctx.shadowColor = '#ff00ff';
    ctx.shadowBlur = 12;

    // Main dark body
    ctx.fillStyle = '#220033';
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Energy patterns - swirling lines
    ctx.strokeStyle = '#ff00ff';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.4;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.3 + i * 3, a, a + Math.PI * 1.2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Tendrils/tentacles extending outward
    ctx.strokeStyle = '#aa00aa';
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const x1 = cx + Math.cos(a) * r * 0.5;
      const y1 = cy + Math.sin(a) * r * 0.5;
      const mx = cx + Math.cos(a + 0.3) * r * 0.9;
      const my = cy + Math.sin(a + 0.3) * r * 0.9;
      const x2 = cx + Math.cos(a) * r * 1.1;
      const y2 = cy + Math.sin(a) * r * 1.1;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo(mx, my, x2, y2);
      ctx.stroke();
    }

    // Crown-like protrusions on top
    ctx.fillStyle = '#cc00cc';
    for (let i = -2; i <= 2; i++) {
      const px = cx + i * 6;
      ctx.beginPath();
      ctx.moveTo(px - 3, cy - r * 0.55);
      ctx.lineTo(px, cy - r * 0.9 - Math.abs(i) * 2);
      ctx.lineTo(px + 3, cy - r * 0.55);
      ctx.closePath();
      ctx.fill();
    }
    // Crown tip glow
    ctx.fillStyle = '#ff66ff';
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.arc(cx + i * 6, cy - r * 0.9 - Math.abs(i) * 2, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Multiple glowing eyes
    const eyePositions = [
      [0, -r * 0.2, 5],       // central large eye
      [-r * 0.3, -r * 0.1, 3],
      [r * 0.3, -r * 0.1, 3],
      [-r * 0.15, r * 0.15, 2.5],
      [r * 0.15, r * 0.15, 2.5],
    ];
    for (const [ex, ey, er] of eyePositions) {
      // Eye glow
      ctx.shadowColor = '#ff00ff';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#ff0066';
      ctx.beginPath();
      ctx.arc(cx + ex, cy + ey, er, 0, Math.PI * 2);
      ctx.fill();
      // Pupil
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx + ex, cy + ey, er * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // Dark inner void
    ctx.fillStyle = '#110022';
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(cx, cy + r * 0.05, r * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Mouth/maw
    ctx.fillStyle = '#440044';
    ctx.beginPath();
    ctx.ellipse(cx, cy + r * 0.35, r * 0.2, r * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ff00ff';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.ellipse(cx, cy + r * 0.35, r * 0.2, r * 0.1, 0, 0, Math.PI * 2);
    ctx.stroke();
  },
};

// ---------------------------------------------------------------------------
//  ENEMY SPRITES
// ---------------------------------------------------------------------------

export function getEnemySprite(type, radius) {
  const size = Math.ceil(radius * 2 + 8);
  const key = `enemy_${type}_${size}`;
  if (spriteCache.has(key)) return spriteCache.get(key);

  const canvas = makeCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const cx = size / 2;
  const cy = size / 2;
  const r = radius;

  const drawFn = ENEMY_DRAW[type];
  if (drawFn) {
    drawFn(ctx, cx, cy, r);
  }

  spriteCache.set(key, canvas);
  return canvas;
}

const ENEMY_DRAW = {
  // ──────────────── Bouncer (red beetle) ────────────────
  bouncer: (ctx, cx, cy, r) => {
    // Round red body
    ctx.fillStyle = '#ff4433';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    // Darker shell
    ctx.fillStyle = '#cc2211';
    ctx.beginPath();
    ctx.arc(cx, cy + 1, r * 0.75, 0, Math.PI * 2);
    ctx.fill();
    // Wing line
    ctx.strokeStyle = '#991100';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 0.6);
    ctx.lineTo(cx, cy + r * 0.7);
    ctx.stroke();
    // Tiny wings folded (darker lines)
    ctx.strokeStyle = '#aa2200';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(cx - 1, cy - r * 0.3);
    ctx.lineTo(cx - r * 0.5, cy + r * 0.1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 1, cy - r * 0.3);
    ctx.lineTo(cx + r * 0.5, cy + r * 0.1);
    ctx.stroke();
    // Eyes (white dots)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx - r * 0.3, cy - r * 0.3, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + r * 0.3, cy - r * 0.3, 1.5, 0, Math.PI * 2);
    ctx.fill();
    // Antennae
    ctx.strokeStyle = '#ff4433';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.2, cy - r * 0.7);
    ctx.lineTo(cx - r * 0.5, cy - r * 1.1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + r * 0.2, cy - r * 0.7);
    ctx.lineTo(cx + r * 0.5, cy - r * 1.1);
    ctx.stroke();
  },

  // ──────────────── Speeder (golden sleek) ────────────────
  speeder: (ctx, cx, cy, r) => {
    // Elongated golden body
    ctx.fillStyle = '#ffcc00';
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * 1.1, r * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    // Darker underside
    ctx.fillStyle = '#cc9900';
    ctx.beginPath();
    ctx.ellipse(cx + 1, cy + 1, r * 0.8, r * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    // Sharp front point
    ctx.fillStyle = '#ffdd44';
    ctx.beginPath();
    ctx.moveTo(cx + r * 1.0, cy);
    ctx.lineTo(cx + r * 0.6, cy - r * 0.35);
    ctx.lineTo(cx + r * 0.6, cy + r * 0.35);
    ctx.closePath();
    ctx.fill();
    // Eye
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx + r * 0.3, cy - r * 0.1, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111111';
    ctx.beginPath();
    ctx.arc(cx + r * 0.3, cy - r * 0.1, 0.7, 0, Math.PI * 2);
    ctx.fill();
    // Speed trail lines behind
    ctx.strokeStyle = 'rgba(255,204,0,0.4)';
    ctx.lineWidth = 0.8;
    for (let i = 0; i < 3; i++) {
      const ly = cy - r * 0.3 + i * r * 0.3;
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.6, ly);
      ctx.lineTo(cx - r * 1.3, ly);
      ctx.stroke();
    }
  },

  // ──────────────── Shapeshifter (amorphous blob) ────────────────
  shapeshifter: (ctx, cx, cy, r) => {
    // Wavy/irregular purple body outline
    ctx.fillStyle = '#cc44ff';
    ctx.beginPath();
    const points = 12;
    for (let i = 0; i <= points; i++) {
      const a = (i / points) * Math.PI * 2;
      const wobble = 0.7 + Math.sin(a * 3) * 0.3;
      const x = cx + Math.cos(a) * r * wobble;
      const y = cy + Math.sin(a) * r * wobble;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    // Inner darker area
    ctx.fillStyle = '#9933cc';
    ctx.beginPath();
    for (let i = 0; i <= points; i++) {
      const a = (i / points) * Math.PI * 2;
      const wobble = 0.5 + Math.sin(a * 3 + 1) * 0.2;
      const x = cx + Math.cos(a) * r * wobble;
      const y = cy + Math.sin(a) * r * wobble;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    // Multiple small eyes scattered
    ctx.fillStyle = '#ffffff';
    const eyePos = [[-2, -2], [3, -1], [0, 2], [-3, 1], [2, 3]];
    for (const [ex, ey] of eyePos) {
      ctx.beginPath();
      ctx.arc(cx + ex, cy + ey, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
    // Pupils
    ctx.fillStyle = '#220044';
    for (const [ex, ey] of eyePos) {
      ctx.beginPath();
      ctx.arc(cx + ex + 0.3, cy + ey + 0.3, 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  // ──────────────── Chaser (predator arrowhead) ────────────────
  chaser: (ctx, cx, cy, r) => {
    // Angular arrowhead body
    ctx.fillStyle = '#ff6622';
    ctx.beginPath();
    ctx.moveTo(cx + r * 1.0, cy);
    ctx.lineTo(cx - r * 0.6, cy - r * 0.7);
    ctx.lineTo(cx - r * 0.2, cy);
    ctx.lineTo(cx - r * 0.6, cy + r * 0.7);
    ctx.closePath();
    ctx.fill();

    // Darker inner
    ctx.fillStyle = '#cc4400';
    ctx.beginPath();
    ctx.moveTo(cx + r * 0.5, cy);
    ctx.lineTo(cx - r * 0.3, cy - r * 0.35);
    ctx.lineTo(cx - r * 0.1, cy);
    ctx.lineTo(cx - r * 0.3, cy + r * 0.35);
    ctx.closePath();
    ctx.fill();

    // Bright single eye
    ctx.fillStyle = '#ffff88';
    ctx.shadowColor = '#ffff00';
    ctx.shadowBlur = 3;
    ctx.beginPath();
    ctx.arc(cx + r * 0.2, cy, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Pupil
    ctx.fillStyle = '#111111';
    ctx.beginPath();
    ctx.arc(cx + r * 0.2, cy, 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Small fins/legs
    ctx.strokeStyle = '#ff6622';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.3, cy - r * 0.5);
    ctx.lineTo(cx - r * 0.6, cy - r * 0.9);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.3, cy + r * 0.5);
    ctx.lineTo(cx - r * 0.6, cy + r * 0.9);
    ctx.stroke();
  },
};

// ---------------------------------------------------------------------------
//  PLAYER SHIP SPRITE
// ---------------------------------------------------------------------------

export function getPlayerSprite(direction, shieldActive, drawing) {
  // Quantize direction to 8 directions for caching
  const angle = Math.atan2(direction[1], direction[0]);
  const quantized = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
  const key = `player_${quantized.toFixed(2)}_${shieldActive ? 1 : 0}_${drawing ? 1 : 0}`;
  if (spriteCache.has(key)) return spriteCache.get(key);

  const size = 24;
  const canvas = makeCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const cx = size / 2;
  const cy = size / 2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(quantized);

  // Main body color
  let bodyColor = '#ddeeff'; // white/light blue metallic
  let engineColor = '#88ffee'; // cyan engine
  if (shieldActive) {
    bodyColor = '#ffd93d'; // golden tint
    engineColor = '#ffee66';
  }
  if (drawing) {
    bodyColor = shieldActive ? '#bbdd66' : '#aaffcc'; // green tint
    engineColor = '#00ff88';
  }

  // Ship body - triangular arrow shape
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.moveTo(9, 0);
  ctx.lineTo(-6, 6);
  ctx.lineTo(-3, 0);
  ctx.lineTo(-6, -6);
  ctx.closePath();
  ctx.fill();

  // Outline
  ctx.strokeStyle = drawing ? '#00cc66' : (shieldActive ? '#ccaa22' : '#8899bb');
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(9, 0);
  ctx.lineTo(-6, 6);
  ctx.lineTo(-3, 0);
  ctx.lineTo(-6, -6);
  ctx.closePath();
  ctx.stroke();

  // Metallic highlight on top wing
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.moveTo(7, -1);
  ctx.lineTo(-4, -5);
  ctx.lineTo(-2, -1);
  ctx.closePath();
  ctx.fill();

  // Cockpit dome in center
  const cockpitColor = drawing ? '#33ff88' : (shieldActive ? '#ffcc00' : '#66ccff');
  ctx.fillStyle = cockpitColor;
  ctx.beginPath();
  ctx.arc(1, 0, 2.5, 0, Math.PI * 2);
  ctx.fill();
  // Cockpit reflection
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.arc(1.5, -0.8, 1, 0, Math.PI * 2);
  ctx.fill();

  // Engine glow at back
  ctx.shadowColor = engineColor;
  ctx.shadowBlur = 5;
  ctx.fillStyle = engineColor;
  ctx.beginPath();
  ctx.arc(-3, 0, 2, 0, Math.PI * 2);
  ctx.fill();
  // Inner hot spot
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-3, 0, 0.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.restore();

  spriteCache.set(key, canvas);
  return canvas;
}

// ---------------------------------------------------------------------------
//  POWER-UP BLOCK SPRITES
// ---------------------------------------------------------------------------

export function getPowerUpBlockSprite(type, isRed, pulse) {
  // Quantize pulse to reduce cache entries
  const pQ = Math.round(pulse * 10) / 10;
  const key = `powerup_${type}_${isRed ? 1 : 0}_${pQ.toFixed(1)}`;
  if (spriteCache.has(key)) return spriteCache.get(key);

  const baseSize = 16;
  const s = Math.round(baseSize * pulse);
  if (s < 4) {
    // Too small, return a tiny placeholder
    const tiny = makeCanvas(4, 4);
    spriteCache.set(key, tiny);
    return tiny;
  }
  const canvas = makeCanvas(s, s);
  const ctx = canvas.getContext('2d');

  const bevelW = 2;

  if (isRed) {
    // Red block with glow
    ctx.shadowColor = '#ff4444';
    ctx.shadowBlur = 6;

    // Main face - dark red
    ctx.fillStyle = `rgba(180,30,30,${0.7 + pQ * 0.3})`;
    ctx.fillRect(0, 0, s, s);
    ctx.shadowBlur = 0;

    // 3D bevel - lighter right/bottom edges
    ctx.fillStyle = '#ff6666';
    ctx.fillRect(s - bevelW, 0, bevelW, s); // right highlight
    ctx.fillRect(0, s - bevelW, s, bevelW); // bottom highlight

    // Darker left/top edges (shadow)
    ctx.fillStyle = '#881111';
    ctx.fillRect(0, 0, bevelW, s); // left shadow
    ctx.fillRect(0, 0, s, bevelW); // top shadow

    // Diamond/pyramid shape on face
    ctx.fillStyle = `rgba(255,100,100,${0.5 + pQ * 0.3})`;
    ctx.beginPath();
    ctx.moveTo(s / 2, bevelW + 1);
    ctx.lineTo(s - bevelW - 1, s / 2);
    ctx.lineTo(s / 2, s - bevelW - 1);
    ctx.lineTo(bevelW + 1, s / 2);
    ctx.closePath();
    ctx.fill();

    // Inner diamond highlight
    ctx.fillStyle = 'rgba(255,180,180,0.4)';
    ctx.beginPath();
    const inset = s * 0.25;
    ctx.moveTo(s / 2, inset);
    ctx.lineTo(s - inset, s / 2);
    ctx.lineTo(s / 2, s - inset);
    ctx.lineTo(inset, s / 2);
    ctx.closePath();
    ctx.fill();

    // Exclamation mark
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.max(7, s * 0.55)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!', s / 2, s / 2 + 1);
  } else {
    // Grey block - 3D cube effect

    // Main face - dark grey
    ctx.fillStyle = '#555566';
    ctx.fillRect(0, 0, s, s);

    // 3D bevel - lighter bottom/right edges (highlight)
    ctx.fillStyle = '#888899';
    ctx.fillRect(s - bevelW, 0, bevelW, s);
    ctx.fillRect(0, s - bevelW, s, bevelW);

    // Darker top/left edges (shadow)
    ctx.fillStyle = '#333344';
    ctx.fillRect(0, 0, bevelW, s);
    ctx.fillRect(0, 0, s, bevelW);

    // Diamond/pyramid shape on face (lighter)
    ctx.fillStyle = '#6e6e80';
    ctx.beginPath();
    ctx.moveTo(s / 2, bevelW + 1);
    ctx.lineTo(s - bevelW - 1, s / 2);
    ctx.lineTo(s / 2, s - bevelW - 1);
    ctx.lineTo(bevelW + 1, s / 2);
    ctx.closePath();
    ctx.fill();

    // Inner diamond - slightly lighter still
    ctx.fillStyle = '#7a7a8e';
    ctx.beginPath();
    const inset = s * 0.25;
    ctx.moveTo(s / 2, inset);
    ctx.lineTo(s - inset, s / 2);
    ctx.lineTo(s / 2, s - inset);
    ctx.lineTo(inset, s / 2);
    ctx.closePath();
    ctx.fill();

    // Subtle glow
    ctx.shadowColor = '#88ffaa';
    ctx.shadowBlur = 4;

    // Type letter in center
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.max(7, s * 0.55)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(type, s / 2, s / 2 + 1);
    ctx.shadowBlur = 0;
  }

  spriteCache.set(key, canvas);
  return canvas;
}
