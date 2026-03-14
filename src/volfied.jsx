import { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════
const FW = 760;
const FH = 480;
const PLAYER_SPEED = 3;
const TARGET_AREA = 0.80;
const ON_CONTOUR_TOLERANCE = 4;

// ═══════════════════════════════════════════════════
//  GEOMETRY HELPERS
// ═══════════════════════════════════════════════════

function dist(a, b) {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2);
}

function normSeg(seg) {
  const [a, b] = seg;
  return [
    [Math.min(a[0], b[0]), Math.min(a[1], b[1])],
    [Math.max(a[0], b[0]), Math.max(a[1], b[1])],
  ];
}

function segLen(seg) {
  const [[x1, y1], [x2, y2]] = normSeg(seg);
  return Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
}

function ptToSegDist(pt, seg) {
  const [[ax, ay], [bx, by]] = normSeg(seg);
  if (Math.abs(ax - bx) < 0.1) { // vertical
    if (pt[1] >= ay && pt[1] <= by) return Math.abs(pt[0] - ax);
    return Math.min(dist(pt, [ax, ay]), dist(pt, [bx, by]));
  } else { // horizontal
    if (pt[0] >= ax && pt[0] <= bx) return Math.abs(pt[1] - ay);
    return Math.min(dist(pt, [ax, ay]), dist(pt, [bx, by]));
  }
}

function ptOnSeg(pt, seg, tol = 0.5) {
  return ptToSegDist(pt, seg) <= tol;
}

function projectOnSeg(pt, seg) {
  const [[ax, ay], [bx, by]] = normSeg(seg);
  if (Math.abs(ax - bx) < 0.1) return [ax, Math.max(ay, Math.min(by, pt[1]))];
  return [Math.max(ax, Math.min(bx, pt[0])), ay];
}

function ptOnContour(pt, contour, tol = ON_CONTOUR_TOLERANCE) {
  for (let i = 0; i < contour.length; i++) {
    const seg = [contour[i], contour[(i + 1) % contour.length]];
    if (ptToSegDist(pt, seg) <= tol) return true;
  }
  return false;
}

function snapToContour(pt, contour) {
  let best = pt, bestD = Infinity;
  for (let i = 0; i < contour.length; i++) {
    const seg = [contour[i], contour[(i + 1) % contour.length]];
    const proj = projectOnSeg(pt, seg);
    const d = dist(proj, pt);
    if (d < bestD) { bestD = d; best = proj; }
  }
  return best;
}

// Ray-casting algorithm for Point in Polygon
function pointInPoly(pt, contour) {
  let inside = false;
  const [x, y] = pt;
  for (let i = 0, j = contour.length - 1; i < contour.length; j = i++) {
    const [xi, yi] = contour[i];
    const [xj, yj] = contour[j];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside || ptOnContour(pt, contour, 0.1);
}

// Shoelace formula
function polyArea(contour) {
  let a = 0;
  for (let i = 0; i < contour.length; i++) {
    const p1 = contour[i];
    const p2 = contour[(i + 1) % contour.length];
    a += (p1[0] * p2[1] - p2[0] * p1[1]);
  }
  return Math.abs(a) / 2;
}

function segsCross(s1, s2) {
  const [p1, p2] = s1;
  const [p3, p4] = s2;
  function cross2d(o, a, b) {
    return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  }
  const d1 = cross2d(p3, p4, p1);
  const d2 = cross2d(p3, p4, p2);
  const d3 = cross2d(p1, p2, p3);
  const d4 = cross2d(p1, p2, p4);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
         ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

function smoothPath(path) {
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < path.length; i++) {
      const p0 = path[i];
      const p1 = path[(i + 1) % path.length];
      const p2 = path[(i + 2) % path.length];
      if ((Math.abs(p0[0] - p1[0]) < 0.5 && Math.abs(p1[0] - p2[0]) < 0.5) ||
          (Math.abs(p0[1] - p1[1]) < 0.5 && Math.abs(p1[1] - p2[1]) < 0.5)) {
        path.splice((i + 1) % path.length, 1);
        changed = true;
        break;
      }
    }
  }
}

function splitContour(mainContour, trail) {
  const first = [...trail[0]];
  const last = [...trail[trail.length - 1]];

  let tFirst = -1, dFirst = Infinity;
  for (let i = 0; i < mainContour.length; i++) {
    const d = ptToSegDist(first, [mainContour[i], mainContour[(i+1)%mainContour.length]]);
    if (d < dFirst) { dFirst = d; tFirst = i; }
  }
  
  let tLast = -1, dLast = Infinity;
  for (let i = 0; i < mainContour.length; i++) {
    const d = ptToSegDist(last, [mainContour[i], mainContour[(i+1)%mainContour.length]]);
    if (d < dLast) { dLast = d; tLast = i; }
  }

  if (tFirst === -1 || tLast === -1) return null;

  const pFirst = projectOnSeg(first, [mainContour[tFirst], mainContour[(tFirst+1)%mainContour.length]]);
  const pLast = projectOnSeg(last, [mainContour[tLast], mainContour[(tLast+1)%mainContour.length]]);
  
  const tf = trail.map(p => [...p]);
  tf[0] = pFirst;
  tf[tf.length - 1] = pLast;

  const polyA = [];
  polyA.push(pLast);
  
  if (tFirst === tLast) {
    const v1 = mainContour[tFirst];
    if (dist(pLast, v1) > dist(pFirst, v1)) {
       let curr = (tLast + 1) % mainContour.length;
       for (let i = 0; i < mainContour.length; i++) {
         polyA.push(mainContour[curr]);
         curr = (curr + 1) % mainContour.length;
       }
       polyA.push(pFirst);
    } else {
       polyA.push(pFirst);
    }
  } else {
    let curr = (tLast + 1) % mainContour.length;
    while (curr !== (tFirst + 1) % mainContour.length) {
      polyA.push(mainContour[curr]);
      curr = (curr + 1) % mainContour.length;
    }
    polyA.push(pFirst);
  }

  for (let i = 1; i < tf.length - 1; i++) polyA.push(tf[i]);
  
  const polyB = [];
  polyB.push(pFirst);
  
  if (tFirst === tLast) {
    const v1 = mainContour[tFirst];
    if (dist(pFirst, v1) > dist(pLast, v1)) {
        let curr = (tFirst + 1) % mainContour.length;
        for (let i = 0; i < mainContour.length; i++) {
          polyB.push(mainContour[curr]);
          curr = (curr + 1) % mainContour.length;
        }
        polyB.push(pLast);
    } else {
        polyB.push(pLast);
    }
  } else {
    let curr = (tFirst + 1) % mainContour.length;
    while (curr !== (tLast + 1) % mainContour.length) {
      polyB.push(mainContour[curr]);
      curr = (curr + 1) % mainContour.length;
    }
    polyB.push(pLast);
  }
  
  for (let i = tf.length - 2; i >= 1; i--) polyB.push(tf[i]);

  smoothPath(polyA);
  smoothPath(polyB);

  return [polyA, polyB];
}

function captureTerritory(contour, trail, enemies = []) {
  const result = splitContour(contour, trail);
  if (!result) return null;
  const [polyA, polyB] = result;
  
  let scoreA = 0, scoreB = 0;
  for (const e of enemies) {
    const weight = (e.baseR > 9 || e.type === "shapeshifter") ? 10 : 1; 
    if (pointInPoly(e.pt, polyA)) scoreA += weight;
    if (pointInPoly(e.pt, polyB)) scoreB += weight;
  }

  const areaA = polyArea(polyA);
  const areaB = polyArea(polyB);

  // Keep the part with the boss/most enemies as the main contour
  if (scoreA > scoreB) return { contour: polyA, captured: polyB, area: areaA };
  if (scoreB > scoreA) return { contour: polyB, captured: polyA, area: areaB };

  // If equal score, use area to determine main contour
  if (areaA >= areaB) return { contour: polyA, captured: polyB, area: areaA };
  return { contour: polyB, captured: polyA, area: areaB };
}

// ═══════════════════════════════════════════════════
//  LEVEL CONFIGS
// ═══════════════════════════════════════════════════
const LEVELS = [
  { enemies: [{ type: "normal", r: 10, spd: 1.5 }, { type: "normal", r: 8, spd: 1.8 }] },
  { enemies: [{ type: "normal", r: 10, spd: 2.0 }, { type: "normal", r: 8, spd: 2.0 }, { type: "speeder", r: 8, spd: 2.5 }] },
  { enemies: [{ type: "normal", r: 10, spd: 2.0 }, { type: "normal", r: 8, spd: 2.5 }, { type: "speeder", r: 8, spd: 3.0 }, { type: "shapeshifter", r: 12, spd: 1.8 }] },
  { enemies: [{ type: "normal", r: 10, spd: 2.5 }, { type: "normal", r: 8, spd: 2.5 }, { type: "speeder", r: 8, spd: 3.5 }, { type: "shapeshifter", r: 12, spd: 2.0 }, { type: "normal", r: 9, spd: 2.8 }] },
  { enemies: [{ type: "normal", r: 10, spd: 3.0 }, { type: "normal", r: 8, spd: 3.0 }, { type: "speeder", r: 8, spd: 4.0 }, { type: "shapeshifter", r: 12, spd: 2.5 }, { type: "speeder", r: 7, spd: 3.5 }, { type: "shapeshifter", r: 11, spd: 2.5 }] },
];

const ENEMY_COLORS = { normal: "#ff4433", shapeshifter: "#cc44ff", speeder: "#ffcc00" };

// ═══════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════
export default function Volfied() {
  const canvasRef = useRef(null);
  const frameRef = useRef(0);
  const keysRef = useRef({});
  const G = useRef(null);
  const setScreenRef = useRef(null);

  const [hud, setHud] = useState({ lives: 3, score: 0, level: 1, pct: 0 });
  const [screen, setScreen] = useState("menu");
  setScreenRef.current = setScreen;

  // ─── INPUT ───
  useEffect(() => {
    const down = (e) => {
      const keys = ["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space","KeyW","KeyA","KeyS","KeyD","Enter"];
      if (keys.includes(e.code)) e.preventDefault();
      keysRef.current[e.code] = true;
    };
    const up = (e) => { keysRef.current[e.code] = false; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  const getDir = useCallback(() => {
    const k = keysRef.current;
    if (k.ArrowUp    || k.KeyW) return [0, -1];
    if (k.ArrowDown  || k.KeyS) return [0,  1];
    if (k.ArrowLeft  || k.KeyA) return [-1, 0];
    if (k.ArrowRight || k.KeyD) return [1,  0];
    return null;
  }, []);

  // ─── INIT HELPERS ───
  const initGame = useCallback(() => {
    G.current = { level: 1, lives: 3, score: 0 };
  }, []);

  const initLevel = useCallback(() => {
    const g = G.current;
    const lvl = LEVELS[Math.min(g.level - 1, LEVELS.length - 1)];

    const contour = [[0, 0], [FW, 0], [FW, FH], [0, FH]];
    
    // Smoothly spawn player at bottom center
    const startX = Math.round(FW / 2);
    const startY = FH;

    const enemies = lvl.enemies.map(cfg => {
      const angle = Math.random() * Math.PI * 2;
      return {
        type: cfg.type,
        pt: [60 + Math.random() * (FW - 120), 60 + Math.random() * (FH - 120)],
        vel: [Math.cos(angle), Math.sin(angle)],
        spd: cfg.spd, baseSpd: cfg.spd,
        r: cfg.r, baseR: cfg.r,
        lastPt: null, grow: false, accel: true,
      };
    });

    g.contour = contour;
    g.player = { x: startX, y: startY };
    g.trail = [];
    g.drawing = false;
    g.shield = 4.0;
    g.enemies = enemies;
    g.bombs = [];   // enemy projectiles targeting player
    g.sparks = [];  // trail fire travelling towards player
    g.progress = 0;
    g.fieldArea = FW * FH;
    g.flashTimer = 0;
    g.deathTimer = 0;
    g.shakeTimer = 0;
    g.introTimer = 0;
    g.completeTimer = 0;
  }, []);

  const killPlayer = useCallback((g) => {
    g.trail = [];
    g.drawing = false;
    g.bombs = [];
    g.sparks = [];
    g.lives--;
    g.shakeTimer = 0.5;
    g.deathTimer = 1.5;
    g.shield = 0;

    // Respawn at bottom-most horizontal edge of border
    let spawnPt = [...g.contour[0]];
    let bestY = -Infinity;
    for (let i = 0; i < g.contour.length; i++) {
      const seg = [g.contour[i], g.contour[(i + 1) % g.contour.length]];
      const [[ax, ay], [bx, by]] = normSeg(seg);
      if (Math.abs(ay - by) < 0.1 && ay > bestY) {
        bestY = ay; spawnPt = [(ax + bx) / 2, ay];
      }
    }
    g.player = { x: spawnPt[0], y: spawnPt[1] };

    if (g.lives <= 0) setScreenRef.current("gameover");
  }, []);

  // ─── MOVE PLAYER ALONG CONTOUR ───
  function moveOnBorder(g, dir, speed) {
    if (!dir) return;
    const [dx, dy] = dir;
    const candidate = [g.player.x + dx * speed, g.player.y + dy * speed];

    let foundSlide = false;
    for (let i = 0; i < g.contour.length; i++) {
      const seg = [g.contour[i], g.contour[(i + 1) % g.contour.length]];
      if (ptToSegDist([g.player.x, g.player.y], seg) <= ON_CONTOUR_TOLERANCE) {
        const [[ax, ay], [bx, by]] = normSeg(seg);
        if (Math.abs(ax - bx) < 0.1 && dy !== 0) { // vertical
          g.player.y = Math.max(ay, Math.min(by, g.player.y + dy * speed));
          foundSlide = true; break;
        } else if (Math.abs(ay - by) < 0.1 && dx !== 0) { // horizontal
          g.player.x = Math.max(ax, Math.min(bx, g.player.x + dx * speed));
          foundSlide = true; break;
        }
      }
    }
    if (!foundSlide && ptOnContour(candidate, g.contour)) {
      g.player.x = candidate[0]; g.player.y = candidate[1];
    }
  }

  // ─── GAME TICK (60 FPS) ───
  const gameTick = useCallback((g) => {
    if (!g || !g.contour) return;
    const dir = getDir();
    const spaceHeld = keysRef.current.Space;
    const speed = PLAYER_SPEED;

    if (g.shield > 0) g.shield -= 1/60;

    // ── STEP ENEMIES ──
    for (const e of g.enemies) {
      if (e.type === "shapeshifter") {
        if (e.grow) { e.r += 0.12; if (e.r >= e.baseR) e.grow = false; }
        else { e.r -= 0.12; if (e.r <= 3) e.grow = true; }
      }
      if (e.type === "speeder") {
        if (e.accel) { e.spd += 0.04; if (e.spd >= e.baseSpd * 2) e.accel = false; }
        else { e.spd -= 0.04; if (e.spd <= 0.4) e.accel = true; }
      }

      // Erratic movement: randomly change direction sometimes
      if (Math.random() < 0.015) {
        const theta = Math.random() * Math.PI * 2;
        e.vel = [Math.cos(theta), Math.sin(theta)];
      }

      // Movement + Bounce
      e.lastPt = [...e.pt];
      const vx = e.vel[0], vy = e.vel[1];
      const extLen = e.spd + e.r;
      const myLine = [e.pt, [e.pt[0] + vx * extLen, e.pt[1] + vy * extLen]];

      let bounced = false;
      for (let j = 0; j < g.contour.length; j++) {
        const seg = [g.contour[j], g.contour[(j + 1) % g.contour.length]];
        if (segsCross(myLine, seg)) {
          const [[x1, y1], [x2, y2]] = normSeg(seg);
          if (Math.abs(x1 - x2) < 0.1) e.vel = [-vx, vy]; else e.vel = [vx, -vy];
          bounced = true; break;
        }
      }
      if (!bounced) { e.pt[0] += vx * e.spd; e.pt[1] += vy * e.spd; }

      // Enemy logic related to player/trail attacks
      if (g.shield <= 0 && g.deathTimer <= 0) {
        // Direct hit
        if (dist(e.pt, [g.player.x, g.player.y]) <= e.r + 4) {
          killPlayer(g); return;
        }
        // Enemy physically crosses trail
        if (g.drawing && g.trail.length >= 2 && e.lastPt) {
          const eMove = [e.lastPt, e.pt];
          for (let t = 0; t < g.trail.length - 1; t++) {
            if (segsCross(eMove, [g.trail[t], g.trail[t + 1]])) {
              killPlayer(g); return;
            }
          }
        }
        // Shoot Bomb randomly when player is drawing
        if (g.drawing && Math.random() < 0.005) {
          const dx = g.player.x - e.pt[0];
          const dy = g.player.y - e.pt[1];
          const d = Math.sqrt(dx*dx + dy*dy);
          if (d > 0) g.bombs.push({ pt: [...e.pt], lastPt: [...e.pt], vel: [dx/d, dy/d], spd: 4.5 });
        }
      }
    }

    // ── STEP BOMBS ──
    const nextBombs = [];
    for (const b of g.bombs) {
      b.lastPt = [...b.pt];
      b.pt[0] += b.vel[0] * b.spd; b.pt[1] += b.vel[1] * b.spd;
      let hitTrail = false;
      
      // If trailing drawing, bomb turns to spark upon intersection
      if (g.drawing && g.trail.length >= 2) {
        for (let t = 0; t < g.trail.length - 1; t++) {
          const seg = [g.trail[t], g.trail[t + 1]];
          if (segsCross([b.lastPt, b.pt], seg)) {
            const proj = projectOnSeg(b.pt, seg);
            g.sparks.push({ pt: proj, trailIdx: t, spd: 5.5 });
            hitTrail = true; break;
          }
        }
      }
      if (!hitTrail && pointInPoly(b.pt, g.contour)) nextBombs.push(b);
    }
    g.bombs = nextBombs;

    // ── STEP SPARKS (running along the line) ──
    const nextSparks = [];
    for (const s of g.sparks) {
      let distToMove = s.spd;
      let hit = false;
      while (distToMove > 0 && s.trailIdx < g.trail.length - 1) {
        const target = g.trail[s.trailIdx + 1];
        const d = dist(s.pt, target);
        if (d <= distToMove) {
          distToMove -= d; s.pt = [...target]; s.trailIdx++;
          if (s.trailIdx >= g.trail.length - 1) {
            killPlayer(g); hit = true; break; // Reached current player position!
          }
        } else {
          s.pt[0] += ((target[0] - s.pt[0]) / d) * distToMove;
          s.pt[1] += ((target[1] - s.pt[1]) / d) * distToMove;
          distToMove = 0;
        }
      }
      if (!hit && g.drawing) nextSparks.push(s);
    }
    g.sparks = nextSparks;
    if (!g.drawing) { g.bombs = []; g.sparks = []; } // Clean up when securely on border

    if (g.deathTimer > 0) return;

    // ── PLAYER MOVEMENT ──
    const onBorder = ptOnContour([g.player.x, g.player.y], g.contour);

    if (!g.drawing) {
      if (onBorder) {
        if (dir) {
          const candidate = [g.player.x + dir[0] * speed, g.player.y + dir[1] * speed];
          if (spaceHeld && !ptOnContour(candidate, g.contour)) {
            // Launch into unclaimed (inside the polygon)
            if (pointInPoly(candidate, g.contour, true)) {
              g.drawing = true;
              g.trail = [[g.player.x, g.player.y], [candidate[0], candidate[1]]];
              g.player.x = candidate[0]; g.player.y = candidate[1];
            } else {
              moveOnBorder(g, dir, speed);
            }
          } else {
            moveOnBorder(g, dir, speed);
          }
        }
      } else {
        const snapped = snapToContour([g.player.x, g.player.y], g.contour);
        g.player.x = snapped[0]; g.player.y = snapped[1];
      }
    } else {
      // ── DRAWING TRAIL ──
      if (dir) {
        const candidate = [
          Math.max(1, Math.min(FW - 1, g.player.x + dir[0] * speed)),
          Math.max(1, Math.min(FH - 1, g.player.y + dir[1] * speed)),
        ];

        // Did we hit the border to complete the capture?
        if (ptOnContour(candidate, g.contour)) {
          const snapped = snapToContour(candidate, g.contour);
          g.trail.push([snapped[0], snapped[1]]);
          g.player.x = snapped[0]; g.player.y = snapped[1];
          doCapture(g);
          return;
        }

        // Self-intersection (death!)
        if (g.trail.length >= 2) {
          const newSeg = [[g.player.x, g.player.y], candidate];
          let hitSelf = false;
          
          // Check backtracking on the current segment
          const lastPointInTrail = g.trail[g.trail.length - 2];
          if (dist(lastPointInTrail, candidate) < dist(lastPointInTrail, [g.player.x, g.player.y]) - 0.1) {
            hitSelf = true;
          }

          for (let t = 0; t < g.trail.length - 2; t++) {
            const seg = [g.trail[t], g.trail[t + 1]];
            if (segsCross(newSeg, seg) || ptOnSeg(candidate, seg, 1.5)) {
              hitSelf = true; break;
            }
            // Explicitly check if crossing precisely at a vertex
            if (ptOnSeg(seg[0], newSeg, 0.1) || ptOnSeg(seg[1], newSeg, 0.1)) {
              hitSelf = true; break;
            }
          }
          if (hitSelf) {
            killPlayer(g); return;
          }
        }

        // Extend trail orthogonally
        if (g.trail.length >= 2) {
          const prev = g.trail[g.trail.length - 2];
          const cur = g.trail[g.trail.length - 1];
          if ((Math.abs(prev[0] - cur[0]) < 0.1 && Math.abs(candidate[0] - cur[0]) < 0.5) ||
              (Math.abs(prev[1] - cur[1]) < 0.1 && Math.abs(candidate[1] - cur[1]) < 0.5)) {
            g.trail[g.trail.length - 1] = candidate;
          } else {
            g.trail.push(candidate);
          }
        } else {
           g.trail.push(candidate);
        }
        g.player.x = candidate[0]; g.player.y = candidate[1];
      }
    }
  }, [getDir, killPlayer]);

  // ─── DO CAPTURE ───
  function doCapture(g) {
    if (g.trail.length < 2) { g.drawing = false; g.trail = []; return; }
    try {
      const result = captureTerritory(g.contour, g.trail, g.enemies);
      if (result) {
        const { contour: newContour, area: newArea } = result;
        const oldProgress = g.progress;
        g.progress = Math.max(g.progress, 1 - newArea / g.fieldArea);
        g.score += Math.floor((g.progress - oldProgress) * 10000);

        // Kill enemies trapped in Captured area (meaning outside newContour)
        const trapped = g.enemies.filter(e => !pointInPoly(e.pt, newContour, true));
        trapped.forEach(() => { g.score += 500; });
        g.enemies = g.enemies.filter(e => pointInPoly(e.pt, newContour, true));

        g.contour = newContour;
        g.flashTimer = 0.5;
      }
    } catch (e) { console.error("Capture Math Failed", e); }

    g.trail = []; g.drawing = false; g.bombs = []; g.sparks = [];

    if (g.progress >= TARGET_AREA) {
      g.score += 5000; g.completeTimer = 3.0; setScreenRef.current("complete");
    }
  }

  // ─── RENDER ───
  const render = useCallback((ctx, g, scr) => {
    if (!g || !g.contour) return;
    const now = performance.now() / 1000;
    ctx.save();
    
    if (g.shakeTimer > 0) {
      const s = g.shakeTimer * 10;
      ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
    }

    // CLAIMED BACKGROUND
    const bgGrad = ctx.createLinearGradient(0, 0, FW, FH);
    bgGrad.addColorStop(0, "#0b2535"); bgGrad.addColorStop(1, "#051020");
    ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, FW, FH);

    ctx.strokeStyle = "rgba(68,221,204,0.04)"; ctx.lineWidth = 0.5;
    for (let x = 0; x <= FW; x += 20) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,FH); ctx.stroke(); }
    for (let y = 0; y <= FH; y += 20) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(FW,y); ctx.stroke(); }

    // UNCLAIMED CLIP (Inner Poly)
    ctx.save();
    ctx.fillStyle = "#06060f";
    ctx.beginPath();
    ctx.moveTo(g.contour[0][0], g.contour[0][1]);
    for (let i = 1; i < g.contour.length; i++) ctx.lineTo(g.contour[i][0], g.contour[i][1]);
    ctx.closePath();
    ctx.fill();

    ctx.clip();
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    for (let x = 10; x < FW; x += 20) {
      for (let y = 10; y < FH; y += 20) {
        ctx.beginPath(); ctx.arc(x, y, 0.8, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();

    if (g.flashTimer > 0) {
      ctx.fillStyle = `rgba(80, 200, 180, ${(g.flashTimer / 0.5) * 0.3})`;
      ctx.fillRect(0, 0, FW, FH);
    }

    // CONTOUR LINE
    ctx.shadowColor = "#44ddcc"; ctx.shadowBlur = 10;
    ctx.strokeStyle = "#44ddcc"; ctx.lineWidth = 2.5; ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(g.contour[0][0], g.contour[0][1]);
    for (let i = 1; i < g.contour.length; i++) ctx.lineTo(g.contour[i][0], g.contour[i][1]);
    ctx.closePath(); ctx.stroke(); ctx.shadowBlur = 0;

    // TRAIL
    if (g.trail.length >= 2) {
      ctx.shadowColor = "#00ff88"; ctx.shadowBlur = 12;
      ctx.strokeStyle = "#00ff88"; ctx.lineWidth = 2.5; ctx.lineJoin = "round"; ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(g.trail[0][0], g.trail[0][1]);
      for (let i = 1; i < g.trail.length; i++) ctx.lineTo(g.trail[i][0], g.trail[i][1]);
      ctx.stroke();

      const last = g.trail[g.trail.length - 1];
      ctx.fillStyle = "#00ff88"; ctx.beginPath(); ctx.arc(last[0], last[1], 3, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }

    // BOMBS
    for (const b of g.bombs) {
      ctx.shadowColor = "#ff2222"; ctx.shadowBlur = 10;
      ctx.fillStyle = "#ff4444"; ctx.beginPath(); ctx.arc(b.pt[0], b.pt[1], 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(b.pt[0], b.pt[1], 2, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }

    // SPARKS
    for (const s of g.sparks) {
      ctx.shadowColor = "#ffffff"; ctx.shadowBlur = 14;
      ctx.fillStyle = "#ffee00"; ctx.beginPath(); ctx.arc(s.pt[0], s.pt[1], 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(s.pt[0], s.pt[1], 3, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }

    // ENEMIES
    for (const e of g.enemies) {
      const col = ENEMY_COLORS[e.type] || "#ff4433";
      const r = e.r * (0.85 + Math.sin(now * 5 + e.pt[0] * 0.1) * 0.15);
      
      ctx.shadowColor = col; ctx.shadowBlur = 12;
      ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.4;
      ctx.beginPath(); ctx.arc(e.pt[0], e.pt[1], r + 4, 0, Math.PI * 2); ctx.stroke();
      
      ctx.globalAlpha = 1;
      const rG = ctx.createRadialGradient(e.pt[0] - r * 0.25, e.pt[1] - r * 0.25, r * 0.1, e.pt[0], e.pt[1], r);
      rG.addColorStop(0, "#ffffff"); rG.addColorStop(0.35, col); rG.addColorStop(1, col + "88");
      ctx.fillStyle = rG; ctx.beginPath(); ctx.arc(e.pt[0], e.pt[1], r, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      
      if (e.type === "speeder" && e.spd > e.baseSpd * 0.8 && e.lastPt) {
        ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.globalAlpha = 0.3;
        ctx.beginPath(); ctx.moveTo(e.pt[0], e.pt[1]); 
        ctx.lineTo(e.pt[0] - e.vel[0] * r * 2, e.pt[1] - e.vel[1] * r * 2);
        ctx.stroke(); ctx.globalAlpha = 1;
      }
    }

    // PLAYER
    const pColor = g.shield > 0 ? "#ffd93d" : "#ffffff";
    if (g.shield > 0) {
      ctx.strokeStyle = `rgba(255,217,61,${0.35 + Math.sin(now * 10) * 0.25})`;
      ctx.lineWidth = 2; ctx.shadowColor = "#ffd93d"; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(g.player.x, g.player.y, 15, 0, Math.PI * 2); ctx.stroke(); ctx.shadowBlur = 0;
    }

    ctx.save(); ctx.translate(g.player.x, g.player.y);
    const angle = getDir() ? Math.atan2(getDir()[1], getDir()[0]) : -Math.PI / 2;
    ctx.rotate(angle);
    ctx.shadowColor = g.drawing ? "#00ff88" : "#44ddcc"; ctx.shadowBlur = 14;
    ctx.fillStyle = pColor;
    ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(-6, 6); ctx.lineTo(-3, 0); ctx.lineTo(-6, -6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = g.drawing ? "#00ff88" : "#88ffee"; ctx.globalAlpha = 0.9;
    ctx.beginPath(); ctx.arc(-3, 0, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore(); ctx.shadowBlur = 0;

    if (scr === "intro") {
      ctx.fillStyle = "rgba(6,6,15,0.85)"; ctx.fillRect(0, 0, FW, FH);
      ctx.textAlign = "center";
      ctx.font = "bold 52px 'Segoe UI', monospace"; ctx.fillStyle = "#44ddcc"; ctx.shadowColor = "#44ddcc"; ctx.shadowBlur = 24;
      ctx.fillText(`LEVEL ${g.level}`, FW / 2, FH / 2 - 20); ctx.shadowBlur = 0;
      ctx.font = "15px monospace"; ctx.fillStyle = "#3a7080";
      ctx.fillText(`Capture ${Math.round(TARGET_AREA * 100)}% of the field to advance`, FW / 2, FH / 2 + 22);
      ctx.fillStyle = "#254050"; ctx.fillText("SPACE + ARROW to launch · Trapped enemies yield 500pts", FW / 2, FH / 2 + 50);
    }

    if (scr === "complete") {
      ctx.fillStyle = "rgba(6,6,15,0.88)"; ctx.fillRect(0, 0, FW, FH);
      ctx.textAlign = "center"; ctx.font = "bold 42px 'Segoe UI', monospace";
      ctx.fillStyle = "#ffd93d"; ctx.shadowColor = "#ffd93d"; ctx.shadowBlur = 20;
      ctx.fillText("LEVEL COMPLETE!", FW / 2, FH / 2 - 22); ctx.shadowBlur = 0;
      ctx.font = "18px monospace"; ctx.fillStyle = "#44ddcc";
      ctx.fillText(`Territory: ${Math.min(g.progress * 100, 100).toFixed(1)}%   Score: ${g.score}`, FW / 2, FH / 2 + 18);
    }
    ctx.restore();
  }, [getDir]);

  // ─── EFFECTS ───
  useEffect(() => {
    if (screen !== "playing" && screen !== "intro" && screen !== "complete") return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    let lastTime = performance.now();

    const loop = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05); lastTime = now;
      const g = G.current; if (!g) return;

      if (screen === "intro") {
        g.introTimer -= dt; if (g.introTimer <= 0) setScreen("playing");
      } else if (screen === "complete") {
        g.completeTimer -= dt;
        if (g.completeTimer <= 0) { g.level++; initLevel(); G.current.introTimer = 2.5; setScreen("intro"); }
      } else {
        if (g.deathTimer > 0) { g.deathTimer -= dt; g.shakeTimer = Math.max(0, g.shakeTimer - dt); }
        else { gameTick(g); }
        if (g.flashTimer > 0) g.flashTimer -= dt;
      }

      setHud({ lives: g.lives, score: g.score, level: g.level, pct: Math.min(g.progress * 100, 100) });
      render(ctx, g, screen);
      frameRef.current = requestAnimationFrame(loop);
    };
    frameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameRef.current);
  }, [screen, gameTick, render, initLevel]);

  const startGame = useCallback(() => { initGame(); initLevel(); G.current.introTimer = 2.5; setScreen("intro"); }, [initGame, initLevel]);
  useEffect(() => {
    const fn = (e) => { if ((e.code === "Space" || e.code === "Enter") && (screen === "menu" || screen === "gameover")) startGame(); };
    window.addEventListener("keydown", fn); return () => window.removeEventListener("keydown", fn);
  }, [screen, startGame]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#060614", fontFamily: "'Segoe UI', monospace" }}>
      <div style={{ width: FW, display: "flex", justifyContent: "space-between", padding: "8px 16px", background: "linear-gradient(180deg, #101026 0%, #060614 100%)", borderRadius: "8px 8px 0 0", fontSize: 13, color: "#3a6070", letterSpacing: 1.5, borderBottom: "2px solid #1a3a50" }}>
        <div style={{ display: "flex", gap: 24 }}><span>LVL <b style={{ color: "#44ddcc" }}>{hud.level}</b></span><span>SCORE <b style={{ color: "#44ddcc" }}>{hud.score}</b></span></div>
        <div style={{ display: "flex", gap: 24 }}>
          <span>AREA <b style={{ color: "#ffd93d" }}>{(hud.pct || 0).toFixed(1)}%</b> <span style={{ color: "#1a3a50" }}>/ {Math.round(TARGET_AREA * 100)}%</span></span>
          <span>LIVES {Array.from({ length: Math.max(0, hud.lives) }, (_, i) => (<span key={i} style={{ color: "#ff4466", textShadow: "0 0 6px #ff4466" }}>♥ </span>))}</span>
        </div>
      </div>
      <div style={{ position: "relative", width: FW, height: FH, boxShadow: "0 0 40px rgba(0,80,120,0.3)" }}>
        <canvas ref={canvasRef} width={FW} height={FH} style={{ display: "block" }} />
        {screen === "menu" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(4,4,16,0.96)" }}>
            <div style={{ fontSize: 72, fontWeight: 900, letterSpacing: 12, color: "#44ddcc", textShadow: "0 0 40px rgba(68,221,204,0.5)", marginBottom: 6 }}>VOLFIED</div>
            <div style={{ fontSize: 12, color: "#1e5060", letterSpacing: 8, marginBottom: 50 }}>TERRITORY CONQUEST</div>
            <button onClick={startGame} style={{ padding: "14px 48px", borderRadius: 6, cursor: "pointer", background: "linear-gradient(135deg, #0c3a4a 0%, #185a70 100%)", border: "2px solid #2a7a90", color: "#44ddcc", fontSize: 17, letterSpacing: 5 }}>START GAME</button>
            <div style={{ marginTop: 40, fontSize: 12, color: "#2a5060", textAlign: "center", lineHeight: 2.4 }}>SPACE + Direction to draw trail  ·  Enemies shoot bombs down lines</div>
          </div>
        )}
        {screen === "gameover" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(4,4,16,0.96)" }}>
            <div style={{ fontSize: 60, fontWeight: 900, letterSpacing: 8, color: "#ff4455", textShadow: "0 0 30px rgba(255,68,85,0.5)", marginBottom: 12 }}>GAME OVER</div>
            <div style={{ fontSize: 22, color: "#44ddcc", marginBottom: 30 }}>Score: {hud.score}</div>
            <button onClick={startGame} style={{ padding: "12px 40px", borderRadius: 6, cursor: "pointer", background: "linear-gradient(135deg, #3a1818 0%, #581c1c 100%)", border: "2px solid #8a3a3a", color: "#ff6677", fontSize: 16, letterSpacing: 4 }}>TRY AGAIN</button>
          </div>
        )}
      </div>
      <div style={{ width: FW, padding: "5px 0", textAlign: "center", background: "#060614", borderTop: "1px solid #1a3050", color: "#182838", fontSize: 10, letterSpacing: 2 }}>VOLFIED REBORN</div>
    </div>
  );
}
