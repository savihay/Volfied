import { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════
const CELL = 5;
const GW = 152, GH = 96;
const W = GW * CELL, H = GH * CELL;
const EMPTY = 0, CLAIMED = 1, TRAIL = 2;
const TARGET = 80;
const MOVE_INTERVAL = 0.028; // seconds between grid moves
const FAST_INTERVAL = 0.016;
const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0]; // up, right, down, left

// Power-up types
const PU = { SHIELD: 0, SPEED: 1, LIFE: 2, LASER: 3 };
const PU_COLORS = ["#ffd93d", "#44ff88", "#ff44aa", "#4488ff"];
const PU_NAMES = ["SHIELD", "SPEED", "LIFE", "LASER"];

// Level configs
const LEVELS = [
  { enemies: 2, bossHP: 0, bossSpd: 50, enemySpd: 55, pups: 2, bossSz: 14 },
  { enemies: 3, bossHP: 0, bossSpd: 60, enemySpd: 65, pups: 2, bossSz: 16 },
  { enemies: 4, bossHP: 0, bossSpd: 65, enemySpd: 75, pups: 3, bossSz: 18 },
  { enemies: 5, bossHP: 0, bossSpd: 70, enemySpd: 80, pups: 3, bossSz: 20 },
  { enemies: 6, bossHP: 0, bossSpd: 80, enemySpd: 90, pups: 4, bossSz: 22 },
];

const BOSS_COLORS = ["#ff4466", "#ff8844", "#cc44ff", "#44ddff", "#ffdd44"];

// ═══════════════════════════════════════════════════
//  GRID HELPERS
// ═══════════════════════════════════════════════════
function createGrid() {
  const g = new Uint8Array(GW * GH);
  for (let x = 0; x < GW; x++) { g[x] = CLAIMED; g[(GH - 1) * GW + x] = CLAIMED; }
  for (let y = 0; y < GH; y++) { g[y * GW] = CLAIMED; g[y * GW + GW - 1] = CLAIMED; }
  return g;
}

function calcPercent(g) {
  let c = 0;
  for (let i = 0; i < GW * GH; i++) if (g[i] === CLAIMED) c++;
  return (c / (GW * GH)) * 100;
}

function fillTerritory(grid, bx, by) {
  // BFS from boss through EMPTY cells
  const vis = new Uint8Array(GW * GH);
  const q = [];
  const bgx = Math.max(1, Math.min(GW - 2, Math.floor(bx / CELL)));
  const bgy = Math.max(1, Math.min(GH - 2, Math.floor(by / CELL)));

  // Find nearest EMPTY cell to boss if boss cell isn't empty
  let startIdx = bgy * GW + bgx;
  if (grid[startIdx] !== EMPTY) {
    // Search outward for an EMPTY cell
    let found = false;
    for (let r = 1; r < 20 && !found; r++) {
      for (let dy = -r; dy <= r && !found; dy++) {
        for (let dx = -r; dx <= r && !found; dx++) {
          const nx = bgx + dx, ny = bgy + dy;
          if (nx >= 0 && nx < GW && ny >= 0 && ny < GH && grid[ny * GW + nx] === EMPTY) {
            q.push(nx, ny);
            vis[ny * GW + nx] = 1;
            found = true;
          }
        }
      }
    }
  } else {
    q.push(bgx, bgy);
    vis[startIdx] = 1;
  }

  let qi = 0;
  while (qi < q.length) {
    const cx = q[qi++], cy = q[qi++];
    for (let d = 0; d < 4; d++) {
      const nx = cx + DX[d], ny = cy + DY[d];
      if (nx >= 0 && nx < GW && ny >= 0 && ny < GH) {
        const ni = ny * GW + nx;
        if (!vis[ni] && grid[ni] === EMPTY) {
          vis[ni] = 1;
          q.push(nx, ny);
        }
      }
    }
  }

  // Collect newly claimed cells for flash effect
  const newCells = [];
  for (let i = 0; i < GW * GH; i++) {
    if (grid[i] === TRAIL) {
      grid[i] = CLAIMED;
      newCells.push(i);
    } else if (grid[i] === EMPTY && !vis[i]) {
      grid[i] = CLAIMED;
      newCells.push(i);
    }
  }
  return newCells;
}

function isBorder(grid, x, y) {
  if (grid[y * GW + x] !== CLAIMED) return false;
  for (let d = 0; d < 4; d++) {
    const nx = x + DX[d], ny = y + DY[d];
    if (nx >= 0 && nx < GW && ny >= 0 && ny < GH) {
      if (grid[ny * GW + nx] !== CLAIMED) return true;
    }
  }
  return false;
}

// ═══════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════
export default function Volfied() {
  const canvasRef = useRef(null);
  const frameRef = useRef(0);
  const keysRef = useRef({});
  const [hud, setHud] = useState({ lives: 3, score: 0, level: 1, pct: 0, shield: 0, speed: 0 });
  const [screen, setScreen] = useState("menu"); // menu, intro, playing, complete, gameover

  // All mutable game state in a single ref
  const G = useRef(null);

  const initGame = useCallback(() => {
    G.current = {
      level: 1, lives: 3, score: 0,
      grid: null, player: null, trail: [],
      boss: null, enemies: [], powerups: [],
      pct: 0, dir: -1, nextDir: -1,
      drawing: false, moveTimer: 0,
      shield: 0, speedBoost: 0, laser: 0,
      flashCells: [], flashTimer: 0,
      introTimer: 0, completeTimer: 0,
      deathTimer: 0, shakeTimer: 0,
    };
  }, []);

  const initLevel = useCallback(() => {
    const g = G.current;
    const lvl = LEVELS[Math.min(g.level - 1, LEVELS.length - 1)];
    g.grid = createGrid();
    g.player = { gx: Math.floor(GW / 2), gy: GH - 1 };
    g.trail = [];
    g.drawing = false;
    g.dir = -1;
    g.nextDir = -1;
    g.moveTimer = 0;
    g.shield = 0;
    g.speedBoost = 0;
    g.laser = 0;
    g.flashCells = [];
    g.flashTimer = 0;
    g.deathTimer = 0;
    g.shakeTimer = 0;
    g.pct = calcPercent(g.grid);

    // Boss - spawns in center area
    const cx = GW / 2, cy = GH / 2;
    const angle = Math.random() * Math.PI * 2;
    g.boss = {
      x: cx * CELL, y: cy * CELL,
      vx: Math.cos(angle) * lvl.bossSpd,
      vy: Math.sin(angle) * lvl.bossSpd,
      size: lvl.bossSz,
      color: BOSS_COLORS[(g.level - 1) % BOSS_COLORS.length],
      phase: 0,
    };

    // Enemies
    g.enemies = [];
    for (let i = 0; i < lvl.enemies; i++) {
      const a = Math.random() * Math.PI * 2;
      const ex = 30 + Math.random() * (W - 60);
      const ey = 30 + Math.random() * (H - 60);
      g.enemies.push({
        x: ex, y: ey,
        vx: Math.cos(a) * lvl.enemySpd,
        vy: Math.sin(a) * lvl.enemySpd,
        size: 5 + Math.random() * 3,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // Power-ups hidden in unclaimed territory
    g.powerups = [];
    for (let i = 0; i < lvl.pups; i++) {
      let px, py, attempts = 0;
      do {
        px = 5 + Math.floor(Math.random() * (GW - 10));
        py = 5 + Math.floor(Math.random() * (GH - 10));
        attempts++;
      } while (g.grid[py * GW + px] !== EMPTY && attempts < 100);
      if (attempts < 100) {
        g.powerups.push({
          gx: px, gy: py,
          type: i === 0 ? PU.LIFE : [PU.SHIELD, PU.SPEED, PU.LASER][Math.floor(Math.random() * 3)],
          revealed: false, collected: false,
        });
      }
    }
  }, []);

  // ─── INPUT ───
  useEffect(() => {
    const onKey = (e, down) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "KeyW", "KeyA", "KeyS", "KeyD", "Space"].includes(e.code)) {
        e.preventDefault();
      }
      keysRef.current[e.code] = down;
    };
    const kd = (e) => onKey(e, true);
    const ku = (e) => onKey(e, false);
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    return () => { window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); };
  }, []);

  const getInputDir = useCallback(() => {
    const k = keysRef.current;
    if (k.ArrowUp || k.KeyW) return 0;
    if (k.ArrowRight || k.KeyD) return 1;
    if (k.ArrowDown || k.KeyS) return 2;
    if (k.ArrowLeft || k.KeyA) return 3;
    return -1;
  }, []);

  // ─── PLAYER DEATH ───
  const killPlayer = useCallback(() => {
    const g = G.current;
    // Revert trail
    for (const t of g.trail) {
      g.grid[t.y * GW + t.x] = EMPTY;
    }
    g.trail = [];
    g.drawing = false;
    g.dir = -1;
    g.lives--;
    g.shakeTimer = 0.3;
    g.deathTimer = 1.0;

    if (g.lives <= 0) {
      setScreen("gameover");
    } else {
      // Respawn on border
      g.player.gx = Math.floor(GW / 2);
      g.player.gy = GH - 1;
    }
  }, []);

  // ─── GAME LOOP ───
  useEffect(() => {
    if (screen !== "playing" && screen !== "intro" && screen !== "complete") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let lastTime = performance.now();

    const loop = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const g = G.current;
      if (!g) { frameRef.current = requestAnimationFrame(loop); return; }

      // ── INTRO SCREEN TIMER ──
      if (screen === "intro") {
        g.introTimer -= dt;
        if (g.introTimer <= 0) {
          setScreen("playing");
        }
        render(ctx, g);
        frameRef.current = requestAnimationFrame(loop);
        return;
      }

      // ── COMPLETE SCREEN TIMER ──
      if (screen === "complete") {
        g.completeTimer -= dt;
        if (g.completeTimer <= 0) {
          g.level++;
          g.introTimer = 2.0;
          initLevel();
          setScreen("intro");
        }
        render(ctx, g);
        frameRef.current = requestAnimationFrame(loop);
        return;
      }

      // ── DEATH PAUSE ──
      if (g.deathTimer > 0) {
        g.deathTimer -= dt;
        g.shakeTimer = Math.max(0, g.shakeTimer - dt);
        render(ctx, g);
        frameRef.current = requestAnimationFrame(loop);
        return;
      }

      // ── FLASH TIMER ──
      if (g.flashTimer > 0) {
        g.flashTimer -= dt;
        if (g.flashTimer <= 0) g.flashCells = [];
      }

      // ── TIMERS ──
      if (g.shield > 0) g.shield -= dt;
      if (g.speedBoost > 0) g.speedBoost -= dt;
      if (g.laser > 0) g.laser -= dt;

      // ── PLAYER MOVEMENT ──
      const inputDir = getInputDir();
      if (inputDir >= 0) {
        // Prevent 180° reversal while drawing
        if (g.drawing && g.dir >= 0) {
          if ((inputDir + 2) % 4 !== g.dir) {
            g.nextDir = inputDir;
          }
        } else {
          g.nextDir = inputDir;
        }
      }

      const interval = g.speedBoost > 0 ? FAST_INTERVAL : MOVE_INTERVAL;
      g.moveTimer += dt;

      while (g.moveTimer >= interval) {
        g.moveTimer -= interval;

        if (g.nextDir < 0) continue;
        g.dir = g.nextDir;

        const nx = g.player.gx + DX[g.dir];
        const ny = g.player.gy + DY[g.dir];

        if (nx < 0 || nx >= GW || ny < 0 || ny >= GH) continue;

        const nextCell = g.grid[ny * GW + nx];

        if (nextCell === TRAIL) continue; // Can't cross own trail

        if (g.drawing) {
          if (nextCell === CLAIMED) {
            // Complete the trail!
            g.drawing = false;
            g.dir = -1;
            g.nextDir = -1;
            g.player.gx = nx;
            g.player.gy = ny;

            // Fill territory
            const newCells = fillTerritory(g.grid, g.boss.x, g.boss.y);
            g.flashCells = newCells;
            g.flashTimer = 0.4;
            g.trail = [];

            // Check power-ups
            for (const pu of g.powerups) {
              if (!pu.collected && g.grid[pu.gy * GW + pu.gx] === CLAIMED) {
                pu.collected = true;
                pu.revealed = true;
                g.score += 200;
                switch (pu.type) {
                  case PU.SHIELD: g.shield = 5; break;
                  case PU.SPEED: g.speedBoost = 6; break;
                  case PU.LIFE: g.lives = Math.min(g.lives + 1, 5); break;
                  case PU.LASER: g.laser = 8; break;
                }
              }
            }

            // Calculate percentage
            g.pct = calcPercent(g.grid);
            const filled = newCells.length;
            g.score += filled * 2;

            // Level complete?
            if (g.pct >= TARGET) {
              g.score += Math.floor(g.pct) * 50;
              g.completeTimer = 2.5;
              setScreen("complete");
            }
          } else {
            // Continue drawing
            g.player.gx = nx;
            g.player.gy = ny;
            g.grid[ny * GW + nx] = TRAIL;
            g.trail.push({ x: nx, y: ny });
          }
        } else {
          // Not drawing
          if (nextCell === EMPTY) {
            // Start drawing
            g.drawing = true;
            g.player.gx = nx;
            g.player.gy = ny;
            g.grid[ny * GW + nx] = TRAIL;
            g.trail.push({ x: nx, y: ny });
          } else if (nextCell === CLAIMED) {
            g.player.gx = nx;
            g.player.gy = ny;
          }
        }
      }

      // ── MOVE BOSS ──
      if (g.boss) {
        g.boss.phase += dt * 3;
        g.boss.x += g.boss.vx * dt;
        g.boss.y += g.boss.vy * dt;

        const bs = g.boss.size;
        // Bounce off claimed boundaries
        const bgx = Math.floor(g.boss.x / CELL);
        const bgy = Math.floor(g.boss.y / CELL);

        // Check 4 directions for claimed cells
        const checkBounce = (px, py, axis) => {
          const gx = Math.floor(px / CELL);
          const gy = Math.floor(py / CELL);
          if (gx >= 0 && gx < GW && gy >= 0 && gy < GH) {
            if (g.grid[gy * GW + gx] === CLAIMED) return true;
          }
          return false;
        };

        if (checkBounce(g.boss.x + bs, g.boss.y, 0) || checkBounce(g.boss.x - bs, g.boss.y, 0)) {
          g.boss.vx *= -1;
          g.boss.x += g.boss.vx * dt * 2;
        }
        if (checkBounce(g.boss.x, g.boss.y + bs, 1) || checkBounce(g.boss.x, g.boss.y - bs, 1)) {
          g.boss.vy *= -1;
          g.boss.y += g.boss.vy * dt * 2;
        }

        // Keep in bounds
        g.boss.x = Math.max(CELL + bs, Math.min(W - CELL - bs, g.boss.x));
        g.boss.y = Math.max(CELL + bs, Math.min(H - CELL - bs, g.boss.y));

        // Boss hits trail?
        if (g.drawing && g.shield <= 0) {
          for (const t of g.trail) {
            const tx = t.x * CELL + CELL / 2;
            const ty = t.y * CELL + CELL / 2;
            const dx = g.boss.x - tx, dy = g.boss.y - ty;
            if (Math.sqrt(dx * dx + dy * dy) < bs + CELL / 2) {
              killPlayer();
              break;
            }
          }
        }

        // Boss hits player while drawing?
        if (g.drawing && g.shield <= 0 && g.deathTimer <= 0) {
          const px = g.player.gx * CELL + CELL / 2;
          const py = g.player.gy * CELL + CELL / 2;
          const dx = g.boss.x - px, dy = g.boss.y - py;
          if (Math.sqrt(dx * dx + dy * dy) < bs + CELL) {
            killPlayer();
          }
        }
      }

      // ── MOVE ENEMIES ──
      for (const e of g.enemies) {
        e.phase += dt * 4;
        e.x += e.vx * dt;
        e.y += e.vy * dt;

        const es = e.size;
        const egx = Math.floor(e.x / CELL);
        const egy = Math.floor(e.y / CELL);

        // Bounce off claimed
        const cl = (px, py) => {
          const gx = Math.floor(px / CELL);
          const gy = Math.floor(py / CELL);
          return gx >= 0 && gx < GW && gy >= 0 && gy < GH && g.grid[gy * GW + gx] === CLAIMED;
        };

        if (cl(e.x + es, e.y) || cl(e.x - es, e.y) || e.x < CELL + es || e.x > W - CELL - es) {
          e.vx *= -1;
          e.x += e.vx * dt * 3;
        }
        if (cl(e.x, e.y + es) || cl(e.x, e.y - es) || e.y < CELL + es || e.y > H - CELL - es) {
          e.vy *= -1;
          e.y += e.vy * dt * 3;
        }

        e.x = Math.max(CELL + es, Math.min(W - CELL - es, e.x));
        e.y = Math.max(CELL + es, Math.min(H - CELL - es, e.y));

        // Enemy hits trail?
        if (g.drawing && g.shield <= 0 && g.deathTimer <= 0) {
          for (const t of g.trail) {
            const tx = t.x * CELL + CELL / 2;
            const ty = t.y * CELL + CELL / 2;
            const dx = e.x - tx, dy = e.y - ty;
            if (Math.sqrt(dx * dx + dy * dy) < es + CELL / 2) {
              killPlayer();
              break;
            }
          }
        }

        // Enemy hits player while drawing?
        if (g.drawing && g.shield <= 0 && g.deathTimer <= 0) {
          const px = g.player.gx * CELL + CELL / 2;
          const py = g.player.gy * CELL + CELL / 2;
          const dx = e.x - px, dy = e.y - py;
          if (Math.sqrt(dx * dx + dy * dy) < es + CELL) {
            killPlayer();
          }
        }
      }

      // ── UPDATE HUD ──
      setHud({ lives: g.lives, score: g.score, level: g.level, pct: g.pct, shield: g.shield, speed: g.speedBoost });

      render(ctx, g);
      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameRef.current);
  }, [screen, getInputDir, initLevel, killPlayer]);

  // ─── RENDER ───
  function render(ctx, g) {
    if (!g || !g.grid) return;
    const now = performance.now() / 1000;

    // Shake effect
    ctx.save();
    if (g.shakeTimer > 0) {
      const s = g.shakeTimer * 10;
      ctx.translate(Math.random() * s - s / 2, Math.random() * s - s / 2);
    }

    // Background
    ctx.fillStyle = "#06060f";
    ctx.fillRect(0, 0, W, H);

    // Draw grid
    const grid = g.grid;

    // Batch draw claimed and unclaimed
    // Unclaimed subtle grid
    ctx.fillStyle = "#0a0a16";
    for (let y = 0; y < GH; y++) {
      for (let x = 0; x < GW; x++) {
        if (grid[y * GW + x] === EMPTY) {
          ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
        }
      }
    }

    // Unclaimed grid lines (subtle)
    ctx.strokeStyle = "#0e0e20";
    ctx.lineWidth = 0.5;
    for (let x = 0; x < GW; x += 4) {
      ctx.beginPath();
      ctx.moveTo(x * CELL, 0);
      ctx.lineTo(x * CELL, H);
      ctx.stroke();
    }
    for (let y = 0; y < GH; y += 4) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL);
      ctx.lineTo(W, y * CELL);
      ctx.stroke();
    }

    // Claimed area
    ctx.fillStyle = "#0d2838";
    for (let y = 0; y < GH; y++) {
      for (let x = 0; x < GW; x++) {
        if (grid[y * GW + x] === CLAIMED) {
          ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
        }
      }
    }

    // Claimed border highlight
    ctx.fillStyle = "#1a4a60";
    for (let y = 0; y < GH; y++) {
      for (let x = 0; x < GW; x++) {
        if (grid[y * GW + x] === CLAIMED) {
          // Check if adjacent to non-claimed
          for (let d = 0; d < 4; d++) {
            const nx = x + DX[d], ny = y + DY[d];
            if (nx >= 0 && nx < GW && ny >= 0 && ny < GH && grid[ny * GW + nx] !== CLAIMED) {
              ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
              break;
            }
          }
        }
      }
    }

    // Flash effect for newly claimed cells
    if (g.flashTimer > 0 && g.flashCells.length > 0) {
      const alpha = g.flashTimer / 0.4;
      ctx.fillStyle = `rgba(127, 219, 202, ${alpha * 0.5})`;
      for (const idx of g.flashCells) {
        const fx = (idx % GW) * CELL;
        const fy = Math.floor(idx / GW) * CELL;
        ctx.fillRect(fx, fy, CELL, CELL);
      }
    }

    // Trail
    if (g.trail.length > 0) {
      // Glow
      ctx.shadowColor = "#00ffcc";
      ctx.shadowBlur = 8;
      ctx.fillStyle = "#00ffcc";
      for (const t of g.trail) {
        ctx.fillRect(t.x * CELL, t.y * CELL, CELL, CELL);
      }
      ctx.shadowBlur = 0;
    }

    // Power-ups (only show uncollected ones in unclaimed territory - they glow subtly)
    for (const pu of g.powerups) {
      if (pu.collected) continue;
      const px = pu.gx * CELL + CELL / 2;
      const py = pu.gy * CELL + CELL / 2;
      const inClaimed = grid[pu.gy * GW + pu.gx] === CLAIMED;
      if (!inClaimed) {
        // Hidden but show subtle hint
        const pulse = Math.sin(now * 3 + pu.gx) * 0.3 + 0.5;
        ctx.globalAlpha = pulse * 0.4;
        ctx.fillStyle = PU_COLORS[pu.type];
        ctx.beginPath();
        ctx.arc(px, py, CELL * 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    // Enemies
    for (const e of g.enemies) {
      const pulse = Math.sin(e.phase) * 2;
      ctx.shadowColor = "#ff8844";
      ctx.shadowBlur = 6;
      ctx.fillStyle = "#ff8844";
      ctx.beginPath();
      // Diamond shape
      const s = e.size + pulse;
      ctx.moveTo(e.x, e.y - s);
      ctx.lineTo(e.x + s, e.y);
      ctx.lineTo(e.x, e.y + s);
      ctx.lineTo(e.x - s, e.y);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      // Inner
      ctx.fillStyle = "#ffcc88";
      ctx.beginPath();
      const si = s * 0.4;
      ctx.moveTo(e.x, e.y - si);
      ctx.lineTo(e.x + si, e.y);
      ctx.lineTo(e.x, e.y + si);
      ctx.lineTo(e.x - si, e.y);
      ctx.closePath();
      ctx.fill();
    }

    // Boss
    if (g.boss) {
      const b = g.boss;
      const pulse = Math.sin(b.phase) * 3;
      const bs = b.size + pulse;

      ctx.shadowColor = b.color;
      ctx.shadowBlur = 12;
      ctx.fillStyle = b.color;
      ctx.beginPath();
      // Irregular boss shape
      const pts = 8;
      for (let i = 0; i < pts; i++) {
        const a = (i / pts) * Math.PI * 2 + b.phase * 0.3;
        const r = bs * (0.8 + Math.sin(a * 3 + b.phase) * 0.2);
        const px = b.x + Math.cos(a) * r;
        const py = b.y + Math.sin(a) * r;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      // Boss eye
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(b.x, b.y, bs * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#000000";
      ctx.beginPath();
      const eyeAngle = Math.atan2(g.player.gy * CELL - b.y, g.player.gx * CELL - b.x);
      ctx.arc(b.x + Math.cos(eyeAngle) * bs * 0.12, b.y + Math.sin(eyeAngle) * bs * 0.12, bs * 0.15, 0, Math.PI * 2);
      ctx.fill();
    }

    // Player
    const px = g.player.gx * CELL + CELL / 2;
    const py = g.player.gy * CELL + CELL / 2;

    // Shield visual
    if (g.shield > 0) {
      ctx.strokeStyle = `rgba(255, 217, 61, ${0.5 + Math.sin(now * 8) * 0.3})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, CELL * 2.5, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.shadowColor = g.drawing ? "#00ffcc" : "#7fdbca";
    ctx.shadowBlur = 10;
    ctx.fillStyle = g.deathTimer > 0 ? "#ff4444" : (g.shield > 0 ? "#ffd93d" : "#ffffff");
    ctx.beginPath();
    ctx.arc(px, py, CELL * 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Player direction indicator
    if (g.dir >= 0) {
      ctx.fillStyle = "#00ffcc";
      ctx.beginPath();
      const dx = DX[g.dir] * CELL;
      const dy = DY[g.dir] * CELL;
      ctx.arc(px + dx, py + dy, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── OVERLAYS ──
    if (screen === "intro") {
      ctx.fillStyle = "rgba(5, 5, 15, 0.85)";
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = "center";
      ctx.font = "bold 36px monospace";
      ctx.fillStyle = "#7fdbca";
      ctx.fillText(`LEVEL ${g.level}`, W / 2, H / 2 - 10);
      ctx.font = "16px monospace";
      ctx.fillStyle = "#4a6a7a";
      ctx.fillText(`Claim ${TARGET}% of the field`, W / 2, H / 2 + 25);
    }

    if (screen === "complete") {
      ctx.fillStyle = "rgba(5, 5, 15, 0.8)";
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = "center";
      ctx.font = "bold 32px monospace";
      ctx.fillStyle = "#ffd93d";
      ctx.fillText("LEVEL COMPLETE!", W / 2, H / 2 - 20);
      ctx.font = "18px monospace";
      ctx.fillStyle = "#7fdbca";
      ctx.fillText(`Territory: ${g.pct.toFixed(1)}%  •  Score: ${g.score}`, W / 2, H / 2 + 20);
    }

    ctx.restore();
  }

  // ─── START / RESTART ───
  const startGame = useCallback(() => {
    initGame();
    initLevel();
    G.current.introTimer = 2.0;
    setScreen("intro");
  }, [initGame, initLevel]);

  const handleKey = useCallback((e) => {
    if (e.code === "Space" || e.code === "Enter") {
      if (screen === "menu" || screen === "gameover") {
        startGame();
      }
    }
  }, [screen, startGame]);

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  // ─── RENDER JSX ───
  return (
    <div className="flex flex-col items-center justify-center min-h-screen" style={{ background: "#06060f" }}>
      {/* HUD */}
      <div
        className="flex items-center justify-between px-4 py-2 rounded-t"
        style={{
          width: W,
          background: "linear-gradient(180deg, #141428 0%, #0c0c1a 100%)",
          borderBottom: "1px solid #1a2a3a",
          fontFamily: "monospace",
          fontSize: 13,
          letterSpacing: 1,
        }}
      >
        <div className="flex gap-5 items-center">
          <span style={{ color: "#4a6a7a" }}>LVL <span style={{ color: "#7fdbca", fontWeight: 700 }}>{hud.level}</span></span>
          <span style={{ color: "#4a6a7a" }}>SCORE <span style={{ color: "#7fdbca", fontWeight: 700 }}>{hud.score}</span></span>
        </div>
        <div className="flex gap-4 items-center">
          {hud.shield > 0 && <span style={{ color: "#ffd93d", fontSize: 11 }}>SHIELD {hud.shield.toFixed(1)}s</span>}
          {hud.speed > 0 && <span style={{ color: "#44ff88", fontSize: 11 }}>SPEED {hud.speed.toFixed(1)}s</span>}
        </div>
        <div className="flex gap-5 items-center">
          <span style={{ color: "#4a6a7a" }}>
            AREA <span style={{ color: "#ffd93d", fontWeight: 700 }}>{hud.pct.toFixed(1)}%</span>
            <span style={{ color: "#2a3a4a" }}> / {TARGET}%</span>
          </span>
          <span style={{ color: "#4a6a7a" }}>
            LIVES{" "}
            {Array.from({ length: hud.lives }, (_, i) => (
              <span key={i} style={{ color: "#ff6b6b" }}>♥</span>
            ))}
          </span>
        </div>
      </div>

      {/* CANVAS */}
      <div style={{ position: "relative", width: W, height: H }}>
        <canvas ref={canvasRef} width={W} height={H} style={{ display: "block", background: "#06060f" }} />

        {/* MENU OVERLAY */}
        {screen === "menu" && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ background: "rgba(5, 5, 15, 0.94)" }}
          >
            <div style={{ fontFamily: "monospace", fontSize: 56, fontWeight: 900, color: "#7fdbca", letterSpacing: 10, textShadow: "0 0 30px rgba(127,219,202,0.4)" }}>
              VOLFIED
            </div>
            <div style={{ fontFamily: "monospace", fontSize: 14, color: "#4a6a7a", letterSpacing: 4, marginTop: 4, marginBottom: 36 }}>
              TERRITORY CONQUEST
            </div>
            <button
              onClick={startGame}
              className="px-8 py-3 rounded cursor-pointer transition-all"
              style={{
                background: "linear-gradient(135deg, #0d3b4e 0%, #1a5a6a 100%)",
                border: "1px solid #2a7a8a",
                fontFamily: "monospace",
                fontSize: 16,
                color: "#7fdbca",
                letterSpacing: 3,
              }}
              onMouseOver={(e) => e.target.style.background = "linear-gradient(135deg, #1a5a6a 0%, #2a7a8a 100%)"}
              onMouseOut={(e) => e.target.style.background = "linear-gradient(135deg, #0d3b4e 0%, #1a5a6a 100%)"}
            >
              START GAME
            </button>
            <div style={{ fontFamily: "monospace", fontSize: 13, color: "#3a5a6a", marginTop: 24, textAlign: "center", lineHeight: 2, letterSpacing: 1 }}>
              <span style={{ color: "#5a8a9a" }}>↑ ↓ ← →</span> or <span style={{ color: "#5a8a9a" }}>WASD</span> to move<br />
              Venture into enemy territory to draw lines<br />
              Return to claimed area to capture territory<br />
              Claim <span style={{ color: "#ffd93d" }}>{TARGET}%</span> to clear each level
            </div>
          </div>
        )}

        {/* GAME OVER OVERLAY */}
        {screen === "gameover" && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ background: "rgba(5, 5, 15, 0.92)" }}
          >
            <div style={{ fontFamily: "monospace", fontSize: 44, fontWeight: 900, color: "#ff6b6b", letterSpacing: 6, textShadow: "0 0 30px rgba(255,107,107,0.4)", marginBottom: 10 }}>
              GAME OVER
            </div>
            <div style={{ fontFamily: "monospace", fontSize: 18, color: "#7fdbca", marginBottom: 6 }}>
              Score: {hud.score}
            </div>
            <div style={{ fontFamily: "monospace", fontSize: 14, color: "#4a6a7a", marginBottom: 30 }}>
              Reached Level {hud.level}
            </div>
            <button
              onClick={startGame}
              className="px-8 py-3 rounded cursor-pointer transition-all"
              style={{
                background: "linear-gradient(135deg, #3b1a1a 0%, #5a2a2a 100%)",
                border: "1px solid #8a3a3a",
                fontFamily: "monospace",
                fontSize: 16,
                color: "#ff8888",
                letterSpacing: 3,
              }}
              onMouseOver={(e) => e.target.style.background = "linear-gradient(135deg, #5a2a2a 0%, #7a3a3a 100%)"}
              onMouseOut={(e) => e.target.style.background = "linear-gradient(135deg, #3b1a1a 0%, #5a2a2a 100%)"}
            >
              TRY AGAIN
            </button>
          </div>
        )}
      </div>

      {/* BOTTOM BAR */}
      <div
        className="flex items-center justify-center py-1"
        style={{
          width: W,
          background: "#0c0c1a",
          borderTop: "1px solid #1a2a3a",
          fontFamily: "monospace",
          fontSize: 11,
          color: "#2a3a4a",
          letterSpacing: 1,
        }}
      >
        VOLFIED REMAKE • {GW}×{GH} GRID • CELL {CELL}px
      </div>
    </div>
  );
}
