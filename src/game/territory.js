import { dist, ptToSegDist, projectOnSeg, normSeg, polyArea, smoothPath, pointInPoly } from './geometry.js';

export function splitContour(mainContour, trail) {
  const first = [...trail[0]];
  const last = [...trail[trail.length - 1]];

  let tFirst = -1, dFirst = Infinity;
  for (let i = 0; i < mainContour.length; i++) {
    const d = ptToSegDist(first, [mainContour[i], mainContour[(i + 1) % mainContour.length]]);
    if (d < dFirst) { dFirst = d; tFirst = i; }
  }

  let tLast = -1, dLast = Infinity;
  for (let i = 0; i < mainContour.length; i++) {
    const d = ptToSegDist(last, [mainContour[i], mainContour[(i + 1) % mainContour.length]]);
    if (d < dLast) { dLast = d; tLast = i; }
  }

  if (tFirst === -1 || tLast === -1) return null;

  const pFirst = projectOnSeg(first, [mainContour[tFirst], mainContour[(tFirst + 1) % mainContour.length]]);
  const pLast = projectOnSeg(last, [mainContour[tLast], mainContour[(tLast + 1) % mainContour.length]]);

  const tf = trail.map(p => [...p]);
  tf[0] = pFirst;
  tf[tf.length - 1] = pLast;

  const polyA = [];
  polyA.push(pLast);

  if (tFirst === tLast) {
    const v1 = mainContour[tFirst];
    if (dist(pLast, v1) > dist(pFirst, v1)) {
      let curr = (tLast + 1) % mainContour.length;
      while (curr !== (tFirst + 1) % mainContour.length) {
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
      while (curr !== (tLast + 1) % mainContour.length) {
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

/**
 * Capture territory: split contour using trail, keep the side that contains the boss.
 * @param {Array} contour - current unclaimed area contour
 * @param {Array} trail - player's trail points
 * @param {Array|null} bossPos - [x,y] of boss, or null if no boss
 * @param {Array} enemies - list of enemy objects with .x, .y properties
 * @returns {Object|null} { contour, captured, area }
 */
export function captureTerritory(contour, trail, bossPos, enemies = []) {
  const result = splitContour(contour, trail);
  if (!result) return null;
  const [polyA, polyB] = result;

  // Validate polygons
  if (polyA.length < 3 || polyB.length < 3) return null;

  const areaA = polyArea(polyA);
  const areaB = polyArea(polyB);

  // Skip degenerate splits
  if (areaA < 1 || areaB < 1) return null;

  if (bossPos) {
    // Robust boss containment test: check the boss center AND nearby sample points
    const scoreA = containmentScore(bossPos, polyA);
    const scoreB = containmentScore(bossPos, polyB);

    if (scoreA > scoreB) {
      return { contour: polyA, captured: polyB, area: areaA };
    } else if (scoreB > scoreA) {
      return { contour: polyB, captured: polyA, area: areaB };
    }

    // Tiebreaker: count minor enemies in each polygon
    let enemiesInA = 0, enemiesInB = 0;
    for (const e of enemies) {
      if (pointInPoly([e.x, e.y], polyA)) enemiesInA++;
      if (pointInPoly([e.x, e.y], polyB)) enemiesInB++;
    }

    // The side with boss + more enemies is the unclaimed side
    if (enemiesInA > enemiesInB) {
      return { contour: polyA, captured: polyB, area: areaA };
    } else if (enemiesInB > enemiesInA) {
      return { contour: polyB, captured: polyA, area: areaB };
    }

    // Final fallback: keep the larger polygon (boss is usually in the bigger area)
    if (areaA >= areaB) return { contour: polyA, captured: polyB, area: areaA };
    return { contour: polyB, captured: polyA, area: areaB };
  }

  // No boss: keep the larger polygon as unclaimed
  if (areaA >= areaB) return { contour: polyA, captured: polyB, area: areaA };
  return { contour: polyB, captured: polyA, area: areaB };
}

/**
 * Score how confidently a point is inside a polygon.
 * Tests the center point plus 4 nearby offsets to handle boundary edge cases.
 */
function containmentScore(pt, poly) {
  let score = 0;
  const offsets = [[0, 0], [2, 0], [-2, 0], [0, 2], [0, -2]];
  for (const [ox, oy] of offsets) {
    if (pointInPoly([pt[0] + ox, pt[1] + oy], poly)) score++;
  }
  return score;
}
