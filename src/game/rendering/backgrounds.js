/**
 * Rich procedural background generation for all 16 Volfied levels.
 * Each background is rendered on an offscreen canvas and cached.
 */

import { FW, FH } from '../constants.js';

const bgCache = new Map();

function rng(seed) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647; };
}

function makeCanvas() {
  const c = document.createElement('canvas');
  c.width = FW;
  c.height = FH;
  return c;
}

export function generateBackground(level) {
  if (bgCache.has(level)) return bgCache.get(level);
  const canvas = makeCanvas();
  const ctx = canvas.getContext('2d');
  const draw = LEVEL_BG[level - 1] || LEVEL_BG[0];
  draw(ctx);
  bgCache.set(level, canvas);
  return canvas;
}

// Gradient helper
function grad(ctx, x0, y0, x1, y1, stops) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  stops.forEach(([o, c]) => g.addColorStop(o, c));
  return g;
}

function radGrad(ctx, cx, cy, r, stops) {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  stops.forEach(([o, c]) => g.addColorStop(o, c));
  return g;
}

// ============================================================
// Level backgrounds
// ============================================================

const LEVEL_BG = [

  // Level 1 - Ocean / Underwater
  (ctx) => {
    const r = rng(101);
    // Deep blue gradient
    ctx.fillStyle = grad(ctx, 0, 0, 0, FH, [[0, '#0066aa'], [0.3, '#004488'], [0.7, '#002255'], [1, '#001133']]);
    ctx.fillRect(0, 0, FW, FH);
    // Light rays from above
    ctx.globalAlpha = 0.07;
    for (let i = 0; i < 8; i++) {
      const x = r() * FW;
      const w = 30 + r() * 60;
      ctx.fillStyle = '#88ccff';
      ctx.beginPath();
      ctx.moveTo(x - w / 2, 0);
      ctx.lineTo(x + w / 2, 0);
      ctx.lineTo(x + w * 1.5, FH);
      ctx.lineTo(x - w * 0.5, FH);
      ctx.fill();
    }
    // Coral reef at bottom
    ctx.globalAlpha = 0.6;
    for (let i = 0; i < 20; i++) {
      const x = r() * FW;
      const y = FH - r() * 120;
      const h = 20 + r() * 80;
      const hue = r() * 60 + 330; // pink/red/orange
      ctx.fillStyle = `hsl(${hue % 360}, 70%, 45%)`;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x - 15, y - h * 0.5, x + 15, y - h * 0.8, x + 5, y - h);
      ctx.bezierCurveTo(x + 20, y - h * 0.7, x + 25, y - h * 0.3, x + 10, y);
      ctx.fill();
    }
    // Seaweed
    ctx.globalAlpha = 0.4;
    for (let i = 0; i < 15; i++) {
      const x = r() * FW;
      ctx.strokeStyle = `hsl(${120 + r() * 40}, 60%, 30%)`;
      ctx.lineWidth = 2 + r() * 3;
      ctx.beginPath();
      ctx.moveTo(x, FH);
      let cx = x, cy = FH;
      for (let j = 0; j < 6; j++) {
        cx += (r() - 0.5) * 30;
        cy -= 15 + r() * 20;
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    }
    // Bubbles
    ctx.globalAlpha = 0.15;
    for (let i = 0; i < 60; i++) {
      const bx = r() * FW, by = r() * FH, br = 2 + r() * 8;
      ctx.strokeStyle = '#aaddff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Sand at bottom
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#8B7355';
    ctx.beginPath();
    ctx.moveTo(0, FH);
    for (let x = 0; x <= FW; x += 20) {
      ctx.lineTo(x, FH - 10 - Math.sin(x * 0.02) * 8 - r() * 5);
    }
    ctx.lineTo(FW, FH);
    ctx.fill();
    ctx.globalAlpha = 1;
  },

  // Level 2 - Garden / Nature
  (ctx) => {
    const r = rng(202);
    ctx.fillStyle = grad(ctx, 0, 0, 0, FH, [[0, '#88bbee'], [0.4, '#66aa44'], [1, '#336622']]);
    ctx.fillRect(0, 0, FW, FH);
    // Clouds
    ctx.globalAlpha = 0.3;
    for (let i = 0; i < 6; i++) {
      const cx = r() * FW, cy = 20 + r() * 100;
      ctx.fillStyle = '#ffffff';
      for (let j = 0; j < 4; j++) {
        ctx.beginPath();
        ctx.arc(cx + j * 25 - 30, cy + (r() - 0.5) * 15, 20 + r() * 15, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Grass
    ctx.globalAlpha = 0.4;
    for (let i = 0; i < 200; i++) {
      const gx = r() * FW, gy = 200 + r() * 280;
      ctx.strokeStyle = `hsl(${100 + r() * 40}, 60%, ${25 + r() * 20}%)`;
      ctx.lineWidth = 1 + r() * 2;
      ctx.beginPath();
      ctx.moveTo(gx, gy);
      ctx.lineTo(gx + (r() - 0.5) * 10, gy - 8 - r() * 15);
      ctx.stroke();
    }
    // Flowers
    ctx.globalAlpha = 0.6;
    for (let i = 0; i < 25; i++) {
      const fx = r() * FW, fy = 180 + r() * 280;
      const hue = r() * 360;
      const pr = 4 + r() * 6;
      // Stem
      ctx.strokeStyle = '#228833';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(fx, fy + 15 + r() * 15);
      ctx.stroke();
      // Petals
      ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;
      for (let p = 0; p < 5; p++) {
        const a = (p / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(fx + Math.cos(a) * pr, fy + Math.sin(a) * pr, pr * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
      // Center
      ctx.fillStyle = '#ffdd00';
      ctx.beginPath();
      ctx.arc(fx, fy, pr * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    // Butterflies
    ctx.globalAlpha = 0.3;
    for (let i = 0; i < 8; i++) {
      const bx = r() * FW, by = 50 + r() * 300;
      ctx.fillStyle = `hsl(${r() * 360}, 80%, 65%)`;
      ctx.beginPath();
      ctx.ellipse(bx - 5, by, 6, 4, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(bx + 5, by, 6, 4, 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  },

  // Level 3 - Cave / Dungeon
  (ctx) => {
    const r = rng(303);
    ctx.fillStyle = grad(ctx, 0, 0, 0, FH, [[0, '#2a1a0a'], [0.5, '#1a1008'], [1, '#0d0804']]);
    ctx.fillRect(0, 0, FW, FH);
    // Rocky texture
    ctx.globalAlpha = 0.12;
    for (let i = 0; i < 300; i++) {
      const rx = r() * FW, ry = r() * FH, rs = 1 + r() * 5;
      ctx.fillStyle = r() > 0.5 ? '#554433' : '#332211';
      ctx.fillRect(rx, ry, rs, rs);
    }
    // Stalactites from top
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 18; i++) {
      const sx = r() * FW, sw = 8 + r() * 20, sh = 30 + r() * 100;
      ctx.fillStyle = '#3a2a1a';
      ctx.beginPath();
      ctx.moveTo(sx - sw / 2, 0);
      ctx.lineTo(sx + sw / 2, 0);
      ctx.lineTo(sx + r() * 5, sh);
      ctx.fill();
    }
    // Stalagmites from bottom
    for (let i = 0; i < 15; i++) {
      const sx = r() * FW, sw = 10 + r() * 25, sh = 20 + r() * 80;
      ctx.fillStyle = '#4a3a2a';
      ctx.beginPath();
      ctx.moveTo(sx - sw / 2, FH);
      ctx.lineTo(sx + sw / 2, FH);
      ctx.lineTo(sx + r() * 5, FH - sh);
      ctx.fill();
    }
    // Cobwebs
    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = '#aaaaaa';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 6; i++) {
      const wx = r() * FW, wy = r() * 150;
      for (let j = 0; j < 8; j++) {
        const a = (j / 8) * Math.PI;
        ctx.beginPath();
        ctx.moveTo(wx, wy);
        ctx.lineTo(wx + Math.cos(a) * 60, wy + Math.sin(a) * 60);
        ctx.stroke();
      }
    }
    // Dim torch glow
    ctx.globalAlpha = 0.1;
    for (let i = 0; i < 4; i++) {
      const tx = 100 + r() * (FW - 200), ty = 80 + r() * (FH - 160);
      ctx.fillStyle = radGrad(ctx, tx, ty, 80, [[0, '#ffaa44'], [0.5, '#ff660033'], [1, 'transparent']]);
      ctx.fillRect(tx - 80, ty - 80, 160, 160);
    }
    ctx.globalAlpha = 1;
  },

  // Level 4 - Forest
  (ctx) => {
    const r = rng(404);
    ctx.fillStyle = grad(ctx, 0, 0, 0, FH, [[0, '#1a3a1a'], [0.6, '#0d2a0d'], [1, '#061a06']]);
    ctx.fillRect(0, 0, FW, FH);
    // Trees (trunks + canopy)
    ctx.globalAlpha = 0.4;
    for (let i = 0; i < 12; i++) {
      const tx = r() * FW, tw = 8 + r() * 15;
      ctx.fillStyle = '#3a2a1a';
      ctx.fillRect(tx - tw / 2, 50 + r() * 100, tw, FH);
      // Canopy
      ctx.fillStyle = `hsl(${110 + r() * 30}, 50%, ${20 + r() * 15}%)`;
      const cy = 30 + r() * 150;
      for (let j = 0; j < 5; j++) {
        ctx.beginPath();
        ctx.arc(tx + (r() - 0.5) * 40, cy + (r() - 0.5) * 30, 25 + r() * 30, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Forest floor - leaves and mushrooms
    ctx.globalAlpha = 0.3;
    for (let i = 0; i < 40; i++) {
      const lx = r() * FW, ly = FH - 30 - r() * 60;
      ctx.fillStyle = `hsl(${30 + r() * 30}, 60%, ${30 + r() * 20}%)`;
      ctx.beginPath();
      ctx.ellipse(lx, ly, 3 + r() * 8, 2 + r() * 4, r() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    // Mushrooms
    ctx.globalAlpha = 0.4;
    for (let i = 0; i < 8; i++) {
      const mx = r() * FW, my = FH - 10 - r() * 50;
      // Stem
      ctx.fillStyle = '#ddccaa';
      ctx.fillRect(mx - 2, my, 4, 10);
      // Cap
      ctx.fillStyle = `hsl(${r() * 360}, 70%, 45%)`;
      ctx.beginPath();
      ctx.arc(mx, my, 6 + r() * 5, Math.PI, 0);
      ctx.fill();
    }
    // Light filtering through
    ctx.globalAlpha = 0.05;
    for (let i = 0; i < 12; i++) {
      const lx = r() * FW, lw = 15 + r() * 30;
      ctx.fillStyle = '#aaffaa';
      ctx.beginPath();
      ctx.moveTo(lx, 0);
      ctx.lineTo(lx + lw, 0);
      ctx.lineTo(lx + lw * 2, FH);
      ctx.lineTo(lx + lw, FH);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  },

  // Level 5 - Deep Sea
  (ctx) => {
    const r = rng(505);
    ctx.fillStyle = grad(ctx, 0, 0, 0, FH, [[0, '#0a1a3a'], [0.5, '#040d1a'], [1, '#020508']]);
    ctx.fillRect(0, 0, FW, FH);
    // Bioluminescent creatures
    ctx.globalAlpha = 0.2;
    for (let i = 0; i < 30; i++) {
      const bx = r() * FW, by = r() * FH;
      const br = 2 + r() * 6;
      const hue = r() > 0.5 ? 180 + r() * 60 : 280 + r() * 40;
      ctx.fillStyle = radGrad(ctx, bx, by, br * 3, [[0, `hsla(${hue}, 80%, 70%, 0.6)`], [1, 'transparent']]);
      ctx.fillRect(bx - br * 3, by - br * 3, br * 6, br * 6);
      ctx.fillStyle = `hsl(${hue}, 80%, 70%)`;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();
    }
    // Deep water particles
    ctx.globalAlpha = 0.06;
    for (let i = 0; i < 150; i++) {
      const px = r() * FW, py = r() * FH;
      ctx.fillStyle = '#88aacc';
      ctx.beginPath();
      ctx.arc(px, py, 0.5 + r() * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    // Underwater vents
    ctx.globalAlpha = 0.08;
    for (let i = 0; i < 5; i++) {
      const vx = r() * FW;
      ctx.fillStyle = '#334466';
      for (let j = 0; j < 15; j++) {
        const vy = FH - j * 20 - r() * 30;
        ctx.beginPath();
        ctx.arc(vx + (r() - 0.5) * (j * 4), vy, 3 + r() * 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Distant jellyfish silhouettes
    ctx.globalAlpha = 0.06;
    for (let i = 0; i < 5; i++) {
      const jx = r() * FW, jy = r() * FH;
      ctx.fillStyle = '#4466aa';
      ctx.beginPath();
      ctx.arc(jx, jy, 15 + r() * 20, Math.PI, 0);
      ctx.fill();
      // Tentacles
      ctx.strokeStyle = '#4466aa';
      ctx.lineWidth = 1;
      for (let t = 0; t < 4; t++) {
        ctx.beginPath();
        ctx.moveTo(jx - 10 + t * 7, jy);
        ctx.lineTo(jx - 10 + t * 7 + (r() - 0.5) * 10, jy + 20 + r() * 30);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  },

  // Level 6 - Abstract / Surreal
  (ctx) => {
    const r = rng(606);
    ctx.fillStyle = grad(ctx, 0, 0, FW, FH, [[0, '#2a0a3a'], [0.5, '#1a0530'], [1, '#0d0220']]);
    ctx.fillRect(0, 0, FW, FH);
    // Swirling color fields
    ctx.globalAlpha = 0.12;
    for (let i = 0; i < 20; i++) {
      const sx = r() * FW, sy = r() * FH, sr = 40 + r() * 120;
      const hue = r() * 360;
      ctx.fillStyle = radGrad(ctx, sx, sy, sr, [[0, `hsl(${hue}, 70%, 50%)`], [1, 'transparent']]);
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }
    // Geometric shapes
    ctx.globalAlpha = 0.1;
    for (let i = 0; i < 30; i++) {
      const gx = r() * FW, gy = r() * FH;
      const gs = 10 + r() * 40;
      const hue = r() * 360;
      ctx.strokeStyle = `hsl(${hue}, 80%, 60%)`;
      ctx.lineWidth = 1 + r() * 2;
      ctx.save();
      ctx.translate(gx, gy);
      ctx.rotate(r() * Math.PI);
      const sides = 3 + Math.floor(r() * 5);
      ctx.beginPath();
      for (let s = 0; s <= sides; s++) {
        const a = (s / sides) * Math.PI * 2;
        const px = Math.cos(a) * gs, py = Math.sin(a) * gs;
        s === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }
    // Floating eyes
    ctx.globalAlpha = 0.15;
    for (let i = 0; i < 8; i++) {
      const ex = r() * FW, ey = r() * FH, er = 8 + r() * 15;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(ex, ey, er, er * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#220044';
      ctx.beginPath();
      ctx.arc(ex, ey, er * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    // Spirals
    ctx.globalAlpha = 0.06;
    for (let i = 0; i < 4; i++) {
      const sx = r() * FW, sy = r() * FH;
      ctx.strokeStyle = `hsl(${r() * 360}, 80%, 60%)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let t = 0; t < 100; t++) {
        const a = t * 0.15;
        const rd = t * 0.8;
        const px = sx + Math.cos(a) * rd, py = sy + Math.sin(a) * rd;
        t === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  },

  // Level 7 - Mechanical / Industrial
  (ctx) => {
    const r = rng(707);
    ctx.fillStyle = '#2a2a25';
    ctx.fillRect(0, 0, FW, FH);
    // Metal plates
    ctx.globalAlpha = 0.3;
    for (let i = 0; i < 20; i++) {
      const px = r() * FW - 30, py = r() * FH - 30;
      const pw = 40 + r() * 80, ph = 40 + r() * 80;
      ctx.fillStyle = `rgb(${60 + r() * 30},${60 + r() * 30},${55 + r() * 25})`;
      ctx.fillRect(px, py, pw, ph);
      ctx.strokeStyle = '#444440';
      ctx.lineWidth = 2;
      ctx.strokeRect(px, py, pw, ph);
    }
    // Rivets
    ctx.globalAlpha = 0.3;
    for (let i = 0; i < 80; i++) {
      const rx = r() * FW, ry = r() * FH;
      ctx.fillStyle = '#555550';
      ctx.beginPath();
      ctx.arc(rx, ry, 2 + r() * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#777770';
      ctx.beginPath();
      ctx.arc(rx - 0.5, ry - 0.5, 1, 0, Math.PI * 2);
      ctx.fill();
    }
    // Gears
    ctx.globalAlpha = 0.15;
    for (let i = 0; i < 6; i++) {
      const gx = r() * FW, gy = r() * FH;
      const gr = 20 + r() * 40;
      const teeth = 8 + Math.floor(r() * 8);
      ctx.strokeStyle = '#888880';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let t = 0; t <= teeth * 2; t++) {
        const a = (t / (teeth * 2)) * Math.PI * 2;
        const rd = t % 2 === 0 ? gr : gr * 0.8;
        const px = gx + Math.cos(a) * rd, py = gy + Math.sin(a) * rd;
        t === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(gx, gy, gr * 0.3, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Pipes
    ctx.globalAlpha = 0.2;
    for (let i = 0; i < 5; i++) {
      const py = r() * FH;
      ctx.fillStyle = '#4a4a44';
      ctx.fillRect(0, py, FW, 8 + r() * 12);
      ctx.fillStyle = '#5a5a54';
      ctx.fillRect(0, py, FW, 3);
    }
    ctx.globalAlpha = 1;
  },

  // Level 8 - Flower Garden
  (ctx) => {
    const r = rng(808);
    ctx.fillStyle = grad(ctx, 0, 0, 0, FH, [[0, '#66aa33'], [0.3, '#44882a'], [1, '#226618']]);
    ctx.fillRect(0, 0, FW, FH);
    // Many colorful flowers
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 50; i++) {
      const fx = r() * FW, fy = r() * FH;
      const hue = r() * 360;
      const pr = 5 + r() * 10;
      const petals = 5 + Math.floor(r() * 4);
      // Petals
      ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;
      for (let p = 0; p < petals; p++) {
        const a = (p / petals) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(fx + Math.cos(a) * pr * 0.7, fy + Math.sin(a) * pr * 0.7, pr * 0.5, pr * 0.3, a, 0, Math.PI * 2);
        ctx.fill();
      }
      // Center
      ctx.fillStyle = '#ffee44';
      ctx.beginPath();
      ctx.arc(fx, fy, pr * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    // Leaves
    ctx.globalAlpha = 0.25;
    for (let i = 0; i < 40; i++) {
      const lx = r() * FW, ly = r() * FH;
      ctx.fillStyle = `hsl(${100 + r() * 40}, 60%, ${25 + r() * 15}%)`;
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(r() * Math.PI * 2);
      ctx.beginPath();
      ctx.ellipse(0, 0, 8 + r() * 12, 3 + r() * 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // Petals floating
    ctx.globalAlpha = 0.15;
    for (let i = 0; i < 30; i++) {
      const px = r() * FW, py = r() * FH;
      const hue = r() * 360;
      ctx.fillStyle = `hsl(${hue}, 70%, 75%)`;
      ctx.beginPath();
      ctx.ellipse(px, py, 3 + r() * 5, 1 + r() * 3, r() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  },

  // Level 9 - Abyss / Deep Dark Ocean
  (ctx) => {
    const r = rng(909);
    ctx.fillStyle = grad(ctx, 0, 0, 0, FH, [[0, '#080812'], [0.5, '#040408'], [1, '#020204']]);
    ctx.fillRect(0, 0, FW, FH);
    // Faint bioluminescence
    ctx.globalAlpha = 0.08;
    for (let i = 0; i < 40; i++) {
      const bx = r() * FW, by = r() * FH;
      const br = 1 + r() * 4;
      const hue = 200 + r() * 100;
      ctx.fillStyle = `hsl(${hue}, 70%, 60%)`;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = radGrad(ctx, bx, by, br * 4, [[0, `hsla(${hue}, 70%, 60%, 0.3)`], [1, 'transparent']]);
      ctx.fillRect(bx - br * 4, by - br * 4, br * 8, br * 8);
    }
    // Pressure lines
    ctx.globalAlpha = 0.04;
    ctx.strokeStyle = '#334466';
    ctx.lineWidth = 1;
    for (let i = 0; i < 30; i++) {
      const y = r() * FH;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x < FW; x += 10) {
        ctx.lineTo(x, y + (r() - 0.5) * 3);
      }
      ctx.stroke();
    }
    // Distant anglerfish lights
    ctx.globalAlpha = 0.12;
    for (let i = 0; i < 3; i++) {
      const ax = r() * FW, ay = r() * FH;
      ctx.fillStyle = radGrad(ctx, ax, ay, 30, [[0, '#44ffaa'], [0.3, '#22aa66'], [1, 'transparent']]);
      ctx.fillRect(ax - 30, ay - 30, 60, 60);
    }
    ctx.globalAlpha = 1;
  },

  // Level 10 - Desert
  (ctx) => {
    const r = rng(1010);
    ctx.fillStyle = grad(ctx, 0, 0, 0, FH, [[0, '#dd8833'], [0.3, '#cc7722'], [0.7, '#aa5511'], [1, '#663300']]);
    ctx.fillRect(0, 0, FW, FH);
    // Sand dunes
    ctx.globalAlpha = 0.3;
    for (let i = 0; i < 8; i++) {
      const dy = 100 + i * 50 + r() * 30;
      ctx.fillStyle = `rgb(${200 + r() * 40},${150 + r() * 30},${80 + r() * 20})`;
      ctx.beginPath();
      ctx.moveTo(0, dy + 30);
      for (let x = 0; x <= FW; x += 5) {
        ctx.lineTo(x, dy + Math.sin(x * 0.008 + i) * 20 + Math.sin(x * 0.02 + i * 2) * 8);
      }
      ctx.lineTo(FW, FH);
      ctx.lineTo(0, FH);
      ctx.fill();
    }
    // Rocky outcrops
    ctx.globalAlpha = 0.25;
    for (let i = 0; i < 6; i++) {
      const rx = r() * FW, rw = 20 + r() * 40, rh = 30 + r() * 60;
      ctx.fillStyle = '#775533';
      ctx.beginPath();
      ctx.moveTo(rx - rw / 2, FH - r() * 100);
      ctx.lineTo(rx - rw * 0.3, FH - r() * 100 - rh);
      ctx.lineTo(rx + rw * 0.2, FH - r() * 100 - rh * 0.8);
      ctx.lineTo(rx + rw / 2, FH - r() * 100);
      ctx.fill();
    }
    // Heat shimmer dots
    ctx.globalAlpha = 0.04;
    for (let i = 0; i < 200; i++) {
      ctx.fillStyle = '#ffddaa';
      ctx.fillRect(r() * FW, r() * FH, 1 + r() * 2, 1);
    }
    // Sun
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = radGrad(ctx, FW * 0.7, 40, 120, [[0, '#ffffaa'], [0.3, '#ffdd6644'], [1, 'transparent']]);
    ctx.fillRect(FW * 0.7 - 120, -80, 240, 240);
    ctx.globalAlpha = 1;
  },

  // Level 11 - Hive / Colony
  (ctx) => {
    const r = rng(1111);
    ctx.fillStyle = grad(ctx, 0, 0, 0, FH, [[0, '#443300'], [0.5, '#332200'], [1, '#221100']]);
    ctx.fillRect(0, 0, FW, FH);
    // Honeycomb pattern
    ctx.globalAlpha = 0.2;
    const hexR = 20;
    const hexH = hexR * Math.sqrt(3);
    for (let row = -1; row < FH / hexH + 1; row++) {
      for (let col = -1; col < FW / (hexR * 1.5) + 1; col++) {
        const cx = col * hexR * 3 + (row % 2) * hexR * 1.5;
        const cy = row * hexH;
        const hue = 35 + r() * 15;
        const lit = 30 + r() * 20;
        ctx.fillStyle = `hsl(${hue}, 80%, ${lit}%)`;
        ctx.strokeStyle = '#554400';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
          const px = cx + Math.cos(a) * hexR;
          const py = cy + Math.sin(a) * hexR;
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }
    // Honey drips
    ctx.globalAlpha = 0.25;
    for (let i = 0; i < 15; i++) {
      const dx = r() * FW, dy = r() * FH;
      ctx.fillStyle = '#cc8800';
      ctx.beginPath();
      ctx.ellipse(dx, dy, 3 + r() * 5, 8 + r() * 15, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // Amber glow
    ctx.globalAlpha = 0.06;
    for (let i = 0; i < 5; i++) {
      const gx = r() * FW, gy = r() * FH;
      ctx.fillStyle = radGrad(ctx, gx, gy, 80, [[0, '#ffaa22'], [1, 'transparent']]);
      ctx.fillRect(gx - 80, gy - 80, 160, 160);
    }
    ctx.globalAlpha = 1;
  },

  // Level 12 - Jungle
  (ctx) => {
    const r = rng(1212);
    ctx.fillStyle = grad(ctx, 0, 0, 0, FH, [[0, '#0a4a0a'], [0.5, '#063a06'], [1, '#032003']]);
    ctx.fillRect(0, 0, FW, FH);
    // Dense foliage
    ctx.globalAlpha = 0.3;
    for (let i = 0; i < 60; i++) {
      const lx = r() * FW, ly = r() * FH;
      const hue = 90 + r() * 50;
      ctx.fillStyle = `hsl(${hue}, 60%, ${20 + r() * 25}%)`;
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(r() * Math.PI * 2);
      ctx.beginPath();
      ctx.ellipse(0, 0, 15 + r() * 30, 5 + r() * 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // Vines
    ctx.globalAlpha = 0.25;
    for (let i = 0; i < 10; i++) {
      const vx = r() * FW;
      ctx.strokeStyle = `hsl(${100 + r() * 30}, 50%, 25%)`;
      ctx.lineWidth = 2 + r() * 3;
      ctx.beginPath();
      ctx.moveTo(vx, 0);
      let cx = vx, cy = 0;
      for (let j = 0; j < 15; j++) {
        cx += (r() - 0.5) * 40;
        cy += 20 + r() * 25;
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    }
    // Tropical flowers
    ctx.globalAlpha = 0.35;
    for (let i = 0; i < 15; i++) {
      const fx = r() * FW, fy = r() * FH;
      const hue = r() > 0.5 ? r() * 60 : 280 + r() * 40;
      ctx.fillStyle = `hsl(${hue}, 80%, 55%)`;
      for (let p = 0; p < 5; p++) {
        const a = (p / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(fx + Math.cos(a) * 6, fy + Math.sin(a) * 6, 5, 3, a, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Parrots (simple colored shapes)
    ctx.globalAlpha = 0.12;
    for (let i = 0; i < 3; i++) {
      const bx = r() * FW, by = 30 + r() * 200;
      ctx.fillStyle = `hsl(${r() * 360}, 80%, 55%)`;
      ctx.beginPath();
      ctx.ellipse(bx, by, 8, 5, 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  },

  // Level 13 - Night Sky
  (ctx) => {
    const r = rng(1313);
    ctx.fillStyle = grad(ctx, 0, 0, 0, FH, [[0, '#0a0520'], [0.6, '#15103a'], [1, '#0a0820']]);
    ctx.fillRect(0, 0, FW, FH);
    // Stars
    ctx.globalAlpha = 0.6;
    for (let i = 0; i < 200; i++) {
      const sx = r() * FW, sy = r() * FH;
      const sr = 0.5 + r() * 2;
      ctx.fillStyle = `rgba(255,255,${200 + r() * 55},${0.3 + r() * 0.7})`;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }
    // Moon
    ctx.globalAlpha = 0.25;
    const mx = FW * 0.8, my = 80;
    ctx.fillStyle = radGrad(ctx, mx, my, 100, [[0, '#ffffdd'], [0.3, '#ddddaa44'], [1, 'transparent']]);
    ctx.fillRect(mx - 100, my - 100, 200, 200);
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#eeeecc';
    ctx.beginPath();
    ctx.arc(mx, my, 35, 0, Math.PI * 2);
    ctx.fill();
    // Moon craters
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = '#ccccaa';
    ctx.beginPath();
    ctx.arc(mx - 10, my - 5, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(mx + 8, my + 10, 5, 0, Math.PI * 2);
    ctx.fill();
    // Clouds
    ctx.globalAlpha = 0.08;
    for (let i = 0; i < 5; i++) {
      const cx = r() * FW, cy = FH - 50 - r() * 150;
      ctx.fillStyle = '#334466';
      for (let j = 0; j < 5; j++) {
        ctx.beginPath();
        ctx.arc(cx + j * 30 - 60, cy + (r() - 0.5) * 20, 20 + r() * 25, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Constellation lines
    ctx.globalAlpha = 0.04;
    ctx.strokeStyle = '#8888ff';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 4; i++) {
      const sx = r() * FW, sy = r() * FH * 0.6;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      for (let j = 0; j < 3 + Math.floor(r() * 3); j++) {
        ctx.lineTo(sx + (r() - 0.5) * 100, sy + (r() - 0.5) * 80);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  },

  // Level 14 - Space / Alien Landscape
  (ctx) => {
    const r = rng(1414);
    ctx.fillStyle = grad(ctx, 0, 0, 0, FH, [[0, '#0a1515'], [0.4, '#051010'], [1, '#020808']]);
    ctx.fillRect(0, 0, FW, FH);
    // Nebula clouds
    ctx.globalAlpha = 0.1;
    for (let i = 0; i < 15; i++) {
      const nx = r() * FW, ny = r() * FH;
      const nr = 40 + r() * 100;
      const hue = r() > 0.5 ? 150 + r() * 60 : 280 + r() * 60;
      ctx.fillStyle = radGrad(ctx, nx, ny, nr, [[0, `hsl(${hue}, 60%, 40%)`], [0.5, `hsla(${hue}, 60%, 30%, 0.3)`], [1, 'transparent']]);
      ctx.beginPath();
      ctx.arc(nx, ny, nr, 0, Math.PI * 2);
      ctx.fill();
    }
    // Stars
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 150; i++) {
      const sx = r() * FW, sy = r() * FH;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(sx, sy, r() * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    // Alien terrain at bottom
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#0a3030';
    ctx.beginPath();
    ctx.moveTo(0, FH);
    for (let x = 0; x <= FW; x += 10) {
      ctx.lineTo(x, FH - 40 - Math.sin(x * 0.015) * 25 - Math.sin(x * 0.04) * 10 - r() * 8);
    }
    ctx.lineTo(FW, FH);
    ctx.fill();
    // Alien structures
    ctx.globalAlpha = 0.2;
    for (let i = 0; i < 5; i++) {
      const ax = r() * FW, ah = 40 + r() * 80;
      ctx.fillStyle = '#115555';
      ctx.beginPath();
      ctx.moveTo(ax - 10, FH - 30);
      ctx.lineTo(ax, FH - 30 - ah);
      ctx.lineTo(ax + 10, FH - 30);
      ctx.fill();
      // Glowing tip
      ctx.fillStyle = '#22ffaa';
      ctx.globalAlpha = 0.15;
      ctx.beginPath();
      ctx.arc(ax, FH - 30 - ah, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  },

  // Level 15 - Volcanic
  (ctx) => {
    const r = rng(1515);
    ctx.fillStyle = grad(ctx, 0, 0, 0, FH, [[0, '#1a0505'], [0.5, '#2a0808'], [1, '#0d0303']]);
    ctx.fillRect(0, 0, FW, FH);
    // Lava flows
    ctx.globalAlpha = 0.3;
    for (let i = 0; i < 8; i++) {
      const lx = r() * FW;
      ctx.strokeStyle = `hsl(${r() * 30}, 100%, ${40 + r() * 20}%)`;
      ctx.lineWidth = 3 + r() * 8;
      ctx.beginPath();
      ctx.moveTo(lx, r() * FH * 0.3);
      let cx = lx, cy = r() * FH * 0.3;
      for (let j = 0; j < 10; j++) {
        cx += (r() - 0.5) * 60;
        cy += 20 + r() * 30;
        ctx.lineTo(cx, Math.min(cy, FH));
      }
      ctx.stroke();
    }
    // Dark rocks
    ctx.globalAlpha = 0.3;
    for (let i = 0; i < 25; i++) {
      const rx = r() * FW, ry = r() * FH;
      const rs = 10 + r() * 30;
      ctx.fillStyle = `rgb(${30 + r() * 20},${10 + r() * 15},${10 + r() * 10})`;
      ctx.beginPath();
      ctx.moveTo(rx, ry - rs);
      ctx.lineTo(rx + rs * 0.8, ry + rs * 0.3);
      ctx.lineTo(rx - rs * 0.6, ry + rs * 0.5);
      ctx.fill();
    }
    // Glowing cracks
    ctx.globalAlpha = 0.15;
    for (let i = 0; i < 20; i++) {
      const cx = r() * FW, cy = r() * FH;
      ctx.strokeStyle = '#ff4400';
      ctx.lineWidth = 1 + r() * 2;
      ctx.shadowColor = '#ff4400';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      let x = cx, y = cy;
      for (let j = 0; j < 4; j++) {
        x += (r() - 0.5) * 30;
        y += (r() - 0.5) * 20;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    // Embers
    ctx.globalAlpha = 0.2;
    for (let i = 0; i < 40; i++) {
      const ex = r() * FW, ey = r() * FH;
      ctx.fillStyle = `hsl(${r() * 40}, 100%, ${50 + r() * 30}%)`;
      ctx.beginPath();
      ctx.arc(ex, ey, 1 + r() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    // Volcano silhouette
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#1a0808';
    ctx.beginPath();
    ctx.moveTo(FW * 0.3, FH);
    ctx.lineTo(FW * 0.45, FH * 0.15);
    ctx.lineTo(FW * 0.5, FH * 0.2);
    ctx.lineTo(FW * 0.55, FH * 0.15);
    ctx.lineTo(FW * 0.7, FH);
    ctx.fill();
    ctx.globalAlpha = 1;
  },

  // Level 16 - Final Cosmic
  (ctx) => {
    const r = rng(1616);
    ctx.fillStyle = grad(ctx, 0, 0, FW, FH, [[0, '#0d050d'], [0.5, '#150820'], [1, '#080415']]);
    ctx.fillRect(0, 0, FW, FH);
    // Cosmic nebula
    ctx.globalAlpha = 0.12;
    for (let i = 0; i < 25; i++) {
      const nx = r() * FW, ny = r() * FH;
      const nr = 30 + r() * 100;
      const hue = r() * 360;
      ctx.fillStyle = radGrad(ctx, nx, ny, nr, [[0, `hsl(${hue}, 80%, 50%)`], [0.5, `hsla(${hue}, 60%, 30%, 0.2)`], [1, 'transparent']]);
      ctx.beginPath();
      ctx.arc(nx, ny, nr, 0, Math.PI * 2);
      ctx.fill();
    }
    // Stars
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 250; i++) {
      const sx = r() * FW, sy = r() * FH;
      ctx.fillStyle = `rgba(255,255,${200 + r() * 55},${0.2 + r() * 0.8})`;
      ctx.beginPath();
      ctx.arc(sx, sy, r() * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // Energy spirals
    ctx.globalAlpha = 0.08;
    for (let i = 0; i < 3; i++) {
      const sx = r() * FW, sy = r() * FH;
      const hue = r() * 360;
      ctx.strokeStyle = `hsl(${hue}, 80%, 60%)`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let t = 0; t < 150; t++) {
        const a = t * 0.12;
        const rd = t * 0.6;
        const px = sx + Math.cos(a) * rd, py = sy + Math.sin(a) * rd;
        t === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    // Dark tendrils
    ctx.globalAlpha = 0.06;
    for (let i = 0; i < 8; i++) {
      const tx = r() * FW, ty = r() * FH;
      ctx.strokeStyle = '#ff44ff';
      ctx.lineWidth = 2 + r() * 4;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      let cx = tx, cy = ty;
      for (let j = 0; j < 8; j++) {
        cx += (r() - 0.5) * 80;
        cy += (r() - 0.5) * 60;
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    }
    // Central dark void
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = radGrad(ctx, FW / 2, FH / 2, 150, [[0, '#000000'], [0.5, '#10001044'], [1, 'transparent']]);
    ctx.fillRect(FW / 2 - 150, FH / 2 - 150, 300, 300);
    // Glowing runes
    ctx.globalAlpha = 0.07;
    for (let i = 0; i < 12; i++) {
      const rx = r() * FW, ry = r() * FH;
      const hue = 270 + r() * 60;
      ctx.strokeStyle = `hsl(${hue}, 80%, 60%)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      const rs = 5 + r() * 10;
      const sides = 3 + Math.floor(r() * 5);
      for (let s = 0; s <= sides; s++) {
        const a = (s / sides) * Math.PI * 2;
        const px = rx + Math.cos(a) * rs, py = ry + Math.sin(a) * rs;
        s === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  },
];
