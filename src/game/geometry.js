// ═══════════════════════════════════════════════════
//  GEOMETRY UTILITIES
// ═══════════════════════════════════════════════════

export function dist(a, b) {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2);
}

export function normSeg(seg) {
  const [a, b] = seg;
  return [
    [Math.min(a[0], b[0]), Math.min(a[1], b[1])],
    [Math.max(a[0], b[0]), Math.max(a[1], b[1])],
  ];
}

export function ptToSegDist(pt, seg) {
  const [[ax, ay], [bx, by]] = normSeg(seg);
  if (Math.abs(ax - bx) < 0.1) {
    if (pt[1] >= ay && pt[1] <= by) return Math.abs(pt[0] - ax);
    return Math.min(dist(pt, [ax, ay]), dist(pt, [bx, by]));
  } else {
    if (pt[0] >= ax && pt[0] <= bx) return Math.abs(pt[1] - ay);
    return Math.min(dist(pt, [ax, ay]), dist(pt, [bx, by]));
  }
}

export function ptOnSeg(pt, seg, tol = 0.5) {
  return ptToSegDist(pt, seg) <= tol;
}

export function projectOnSeg(pt, seg) {
  const [[ax, ay], [bx, by]] = normSeg(seg);
  if (Math.abs(ax - bx) < 0.1) return [ax, Math.max(ay, Math.min(by, pt[1]))];
  return [Math.max(ax, Math.min(bx, pt[0])), ay];
}

export function ptOnContour(pt, contour, tol = 4) {
  for (let i = 0; i < contour.length; i++) {
    const seg = [contour[i], contour[(i + 1) % contour.length]];
    if (ptToSegDist(pt, seg) <= tol) return true;
  }
  return false;
}

export function snapToContour(pt, contour) {
  let best = pt, bestD = Infinity;
  for (let i = 0; i < contour.length; i++) {
    const seg = [contour[i], contour[(i + 1) % contour.length]];
    const proj = projectOnSeg(pt, seg);
    const d = dist(proj, pt);
    if (d < bestD) { bestD = d; best = proj; }
  }
  return best;
}

export function findContourSegIndex(pt, contour, tol = 4) {
  let bestIdx = -1, bestD = Infinity;
  for (let i = 0; i < contour.length; i++) {
    const seg = [contour[i], contour[(i + 1) % contour.length]];
    const d = ptToSegDist(pt, seg);
    if (d < bestD) { bestD = d; bestIdx = i; }
  }
  return bestD <= tol ? bestIdx : -1;
}

// Ray-casting point-in-polygon
export function pointInPoly(pt, contour) {
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
export function polyArea(contour) {
  let a = 0;
  for (let i = 0; i < contour.length; i++) {
    const p1 = contour[i];
    const p2 = contour[(i + 1) % contour.length];
    a += (p1[0] * p2[1] - p2[0] * p1[1]);
  }
  return Math.abs(a) / 2;
}

// Check if two line segments cross (strict - endpoints excluded)
export function segsCross(s1, s2) {
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

export function smoothPath(path) {
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

// Polygon centroid
export function polyCentroid(contour) {
  let cx = 0, cy = 0;
  for (const p of contour) { cx += p[0]; cy += p[1]; }
  return [cx / contour.length, cy / contour.length];
}

// Bounding box of polygon
export function polyBounds(contour) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of contour) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return { minX, minY, maxX, maxY };
}
