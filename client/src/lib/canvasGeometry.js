/**
 * canvasGeometry.js
 * Pure mathematical functions for Whiteboard geometry, bounds, hit-testing, resize, and camera.
 * No React dependencies.
 */
import { getStroke } from "perfect-freehand";

export const MIN_SIZE = 12; // world px
export const HIT_TOLERANCE_PX = 6; // screen px
export const DRAG_THRESHOLD_PX = 3; // screen px

/* ---------- primitives ---------- */
export const clamp = (v, a, b) => Math.min(Math.max(v, a), b);

export function distToSegment(p, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / len2, 0, 1);
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

export const pointInRect = (p, r, pad = 0) =>
  p.x >= r.x - pad &&
  p.x <= r.x + r.w + pad &&
  p.y >= r.y - pad &&
  p.y <= r.y + r.h + pad;

// Distance from p to the rectangle OUTLINE (box signed-distance function)
export function distToRectBorder(p, r) {
  const qx = Math.abs(p.x - (r.x + r.w / 2)) - r.w / 2;
  const qy = Math.abs(p.y - (r.y + r.h / 2)) - r.h / 2;
  const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0));
  const inside = Math.min(Math.max(qx, qy), 0);
  return Math.abs(outside + inside);
}

// Normalized radial distance: <1 inside, 1 on outline, >1 outside
export const ellipseK = (p, r) => {
  const rx = r.w / 2;
  const ry = r.h / 2;
  if (rx <= 0 || ry <= 0) return 0;
  return Math.hypot((p.x - (r.x + rx)) / rx, (p.y - (r.y + ry)) / ry);
};

// Approx distance to ellipse outline (exact for circles)
export const distToEllipseBorder = (p, r) =>
  Math.abs(ellipseK(p, r) - 1) * Math.min(r.w / 2, r.h / 2);

export const diamondVerts = (r) => [
  { x: r.x + r.w / 2, y: r.y },
  { x: r.x + r.w, y: r.y + r.h / 2 },
  { x: r.x + r.w / 2, y: r.y + r.h },
  { x: r.x, y: r.y + r.h / 2 },
];

export const insideDiamond = (p, r) => {
  if (r.w <= 0 || r.h <= 0) return false;
  return (
    Math.abs(p.x - (r.x + r.w / 2)) / (r.w / 2) +
      Math.abs(p.y - (r.y + r.h / 2)) / (r.h / 2) <=
    1
  );
};

export function distToDiamondBorder(p, r) {
  const v = diamondVerts(r);
  return Math.min(...v.map((a, i) => distToSegment(p, a, v[(i + 1) % 4])));
}

export const isFilled = (fill) => !!fill && fill !== "transparent" && fill !== "none";

/* ---------- coordinates ---------- */
export function screenToWorld(sOrX, camOrY, maybeCam) {
  if (typeof sOrX === "object" && sOrX !== null) {
    const s = sOrX;
    const cam = camOrY;
    return {
      x: (s.x - cam.x) / cam.zoom,
      y: (s.y - cam.y) / cam.zoom,
    };
  }
  const screenX = sOrX;
  const screenY = camOrY;
  const camera = maybeCam;
  return {
    x: (screenX - camera.x) / camera.zoom,
    y: (screenY - camera.y) / camera.zoom,
  };
}

export function worldToScreen(wOrX, camOrY, maybeCam) {
  if (typeof wOrX === "object" && wOrX !== null) {
    const w = wOrX;
    const cam = camOrY;
    return {
      x: w.x * cam.zoom + cam.x,
      y: w.y * cam.zoom + cam.y,
    };
  }
  const worldX = wOrX;
  const worldY = camOrY;
  const camera = maybeCam;
  return {
    x: worldX * camera.zoom + camera.x,
    y: worldY * camera.zoom + camera.y,
  };
}

export const clampZoom = (zoom, min = 0.1, max = 5.0) => clamp(zoom, min, max);

export function zoomAtScreenPoint(sOrX, newZoomOrY, maybeCamOrNewZoom, maybeCam) {
  let s, newZoom, cam;
  if (typeof sOrX === "object" && sOrX !== null) {
    s = sOrX;
    newZoom = newZoomOrY;
    cam = maybeCamOrNewZoom;
  } else {
    s = { x: sOrX, y: newZoomOrY };
    newZoom = maybeCamOrNewZoom;
    cam = maybeCam;
  }
  const clampedZoom = clampZoom(newZoom);
  if (clampedZoom === cam.zoom) return cam;
  const w = screenToWorld(s, cam);
  return {
    x: s.x - w.x * clampedZoom,
    y: s.y - w.y * clampedZoom,
    zoom: clampedZoom,
  };
}

/* ---------- bounds ---------- */
const drawBoundsCache = new WeakMap();

export function getBounds(el) {
  if (!el || !el.data) return { x: 0, y: 0, w: 0, h: 0 };
  const d = el.data;
  if (el.type === "line" || el.type === "arrow") {
    const startX = d.startX ?? d.x ?? 0;
    const startY = d.startY ?? d.y ?? 0;
    const endX = d.endX ?? startX;
    const endY = d.endY ?? startY;
    return {
      x: Math.min(startX, endX),
      y: Math.min(startY, endY),
      w: Math.abs(endX - startX),
      h: Math.abs(endY - startY),
    };
  }
  if (el.type === "draw") {
    const pts = Array.isArray(d.points) ? d.points : [];
    if (pts.length === 0) return { x: 0, y: 0, w: 0, h: 0 };
    let c = drawBoundsCache.get(pts);
    if (!c) {
      let x0 = Infinity,
        y0 = Infinity,
        x1 = -Infinity,
        y1 = -Infinity;
      for (const [px, py] of pts) {
        if (px < x0) x0 = px;
        if (py < y0) y0 = py;
        if (px > x1) x1 = px;
        if (py > y1) y1 = py;
      }
      const pad = (d.size || 4) / 2;
      c = {
        x: x0 - pad,
        y: y0 - pad,
        w: Math.max(x1 - x0 + 2 * pad, 0),
        h: Math.max(y1 - y0 + 2 * pad, 0),
      };
      drawBoundsCache.set(pts, c);
    }
    return c;
  }
  return { x: d.x ?? 0, y: d.y ?? 0, w: d.w ?? 0, h: d.h ?? 0 };
}

export function unionBounds(list) {
  if (!list || !list.length) return null;
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity;
  for (const b of list) {
    if (!b) continue;
    x0 = Math.min(x0, b.x);
    y0 = Math.min(y0, b.y);
    x1 = Math.max(x1, b.x + b.w);
    y1 = Math.max(y1, b.y + b.h);
  }
  if (x0 === Infinity) return null;
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

export const boundsIntersect = (a, b) =>
  a &&
  b &&
  a.x < b.x + b.w &&
  a.x + a.w > b.x &&
  a.y < b.y + b.h &&
  a.y + a.h > b.y;

/* ---------- hit testing (world space) ---------- */
export function hitTestElement(el, p, zoom = 1) {
  const tol = HIT_TOLERANCE_PX / zoom;
  const d = el.data;
  switch (el.type) {
    case "line":
    case "arrow":
      return (
        distToSegment(
          p,
          { x: d.startX ?? d.x ?? 0, y: d.startY ?? d.y ?? 0 },
          { x: d.endX ?? 0, y: d.endY ?? 0 }
        ) <=
        (d.strokeWidth || 3) / 2 + tol
      );

    case "draw": {
      if (!pointInRect(p, getBounds(el), tol)) return false; // cheap reject
      const pad = (d.size || 4) / 2 + tol;
      const pts = d.points || [];
      if (pts.length === 0) return false;
      if (pts.length === 1)
        return Math.hypot(p.x - pts[0][0], p.y - pts[0][1]) <= pad;
      for (let i = 0; i < pts.length - 1; i++) {
        if (
          distToSegment(
            p,
            { x: pts[i][0], y: pts[i][1] },
            { x: pts[i + 1][0], y: pts[i + 1][1] }
          ) <= pad
        )
          return true;
      }
      return false;
    }

    // Unfilled shapes are hit on the outline only
    case "rect":
      return isFilled(d.fill)
        ? pointInRect(p, d, tol)
        : distToRectBorder(p, d) <= (d.strokeWidth || 2) / 2 + tol;

    case "ellipse":
      return isFilled(d.fill) && ellipseK(p, d) <= 1
        ? true
        : distToEllipseBorder(p, d) <= (d.strokeWidth || 2) / 2 + tol;

    case "diamond":
      return isFilled(d.fill) && insideDiamond(p, d)
        ? true
        : distToDiamondBorder(p, d) <= (d.strokeWidth || 2) / 2 + tol;

    default: // text, sticky, bullet, image, chart, emoji
      return pointInRect(p, d, tol);
  }
}

// Top-most hit (iterate z-sorted array from the end)
export function hitTestTopmost(sortedElements, p, zoom = 1) {
  if (!sortedElements) return null;
  for (let i = sortedElements.length - 1; i >= 0; i--) {
    if (hitTestElement(sortedElements[i], p, zoom)) return sortedElements[i];
  }
  return null;
}

/* ---------- creation by dragging ---------- */
export function boxFromDrag(
  start,
  cur,
  { square = false, fromCenter = false } = {}
) {
  let dx = cur.x - start.x;
  let dy = cur.y - start.y;
  if (square) {
    const s = Math.max(Math.abs(dx), Math.abs(dy));
    dx = (dx < 0 ? -1 : 1) * s;
    dy = (dy < 0 ? -1 : 1) * s;
  }
  if (fromCenter) {
    return {
      x: start.x - Math.abs(dx),
      y: start.y - Math.abs(dy),
      w: 2 * Math.abs(dx),
      h: 2 * Math.abs(dy),
    };
  }
  return {
    x: Math.min(start.x, start.x + dx),
    y: Math.min(start.y, start.y + dy),
    w: Math.abs(dx),
    h: Math.abs(dy),
  };
}

// Snap line angle to step (default 15 degrees)
export function snapAngle(start, end, step = Math.PI / 12) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.hypot(dx, dy);
  const a = Math.round(Math.atan2(dy, dx) / step) * step;
  return {
    x: start.x + len * Math.cos(a),
    y: start.y + len * Math.sin(a),
  };
}

/* ---------- resize ---------- */
export function resizeBox(
  initial,
  handle,
  delta,
  { keepAspect = false, fromCenter = false, minSize = MIN_SIZE } = {}
) {
  const { x, y, w, h } = initial;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const E = handle.includes("e");
  const W = handle.includes("w");
  const S = handle.includes("s");
  const N = handle.includes("n");

  const ax = fromCenter ? cx : E ? x : W ? x + w : cx; // fixed anchor
  const ay = fromCenter ? cy : S ? y : N ? y + h : cy;
  const px = (E ? x + w : W ? x : cx) + (E || W ? delta.x : 0); // dragged point
  const py = (S ? y + h : N ? y : cy) + (S || N ? delta.y : 0);

  const sx = E || W ? px - ax : null; // signed extent from anchor
  const sy = S || N ? py - ay : null;
  const k = fromCenter ? 2 : 1;

  let nw = sx === null ? w : k * Math.abs(sx);
  let nh = sy === null ? h : k * Math.abs(sy);

  if (keepAspect) {
    if (sx !== null && sy !== null) {
      const s = Math.max(nw / w, nh / h);
      nw = w * s;
      nh = h * s;
    } else if (sx !== null) {
      nh = (nw * h) / w;
    } else if (sy !== null) {
      nw = (nh * w) / h;
    }
  }
  nw = Math.max(nw, minSize);
  nh = Math.max(nh, minSize);

  const nx = fromCenter || sx === null ? cx - nw / 2 : sx >= 0 ? ax : ax - nw;
  const ny = fromCenter || sy === null ? cy - nh / 2 : sy >= 0 ? ay : ay - nh;

  return {
    x: nx,
    y: ny,
    w: nw,
    h: nh,
    flipX: sx !== null && (E ? sx < 0 : sx > 0),
    flipY: sy !== null && (S ? sy < 0 : sy > 0),
  };
}

// Map a point from initial box into resized box
export function mapPointToBox(p, from, to, flipX = false, flipY = false) {
  const u = from.w ? (p.x - from.x) / from.w : 0.5;
  const v = from.h ? (p.y - from.y) / from.h : 0.5;
  return {
    x: to.x + (flipX ? 1 - u : u) * to.w,
    y: to.y + (flipY ? 1 - v : v) * to.h,
  };
}

// Returns partial data patch
export function applyBoxToElement(el, from, to, flipX = false, flipY = false) {
  const d = el.data;
  if (el.type === "draw") {
    return {
      points: (d.points || []).map(([px, py, pr]) => {
        const q = mapPointToBox({ x: px, y: py }, from, to, flipX, flipY);
        return pr !== undefined ? [q.x, q.y, pr] : [q.x, q.y];
      }),
    };
  }
  if (el.type === "line" || el.type === "arrow") {
    const a = mapPointToBox(
      { x: d.startX ?? d.x ?? 0, y: d.startY ?? d.y ?? 0 },
      from,
      to,
      flipX,
      flipY
    );
    const b = mapPointToBox(
      { x: d.endX ?? 0, y: d.endY ?? 0 },
      from,
      to,
      flipX,
      flipY
    );
    return { startX: a.x, startY: a.y, endX: b.x, endY: b.y };
  }
  const tl = mapPointToBox({ x: d.x, y: d.y }, from, to, flipX, flipY);
  const br = mapPointToBox(
    { x: d.x + d.w, y: d.y + d.h },
    from,
    to,
    flipX,
    flipY
  );
  return {
    x: Math.min(tl.x, br.x),
    y: Math.min(tl.y, br.y),
    w: Math.abs(br.x - tl.x),
    h: Math.abs(br.y - tl.y),
  };
}

/* ---------- translate ---------- */
export function translatePatch(el, dx, dy) {
  const d = el.data;
  if (el.type === "draw") {
    return {
      points: (d.points || []).map(([x, y, p]) =>
        p !== undefined ? [x + dx, y + dy, p] : [x + dx, y + dy]
      ),
    };
  }
  if (el.type === "line" || el.type === "arrow") {
    return {
      startX: (d.startX ?? d.x ?? 0) + dx,
      startY: (d.startY ?? d.y ?? 0) + dy,
      endX: (d.endX ?? 0) + dx,
      endY: (d.endY ?? 0) + dy,
    };
  }
  return { x: d.x + dx, y: d.y + dy };
}

/* ---------- freehand ---------- */
const avg = (a, b) => (a + b) / 2;

export function strokeToSvgPath(points, closed = true) {
  const len = points.length;
  if (len < 4) return "";
  let a = points[0];
  let b = points[1];
  const c = points[2];
  let r = `M${a[0].toFixed(2)},${a[1].toFixed(2)} Q${b[0].toFixed(2)},${b[1].toFixed(2)} ${avg(b[0], c[0]).toFixed(2)},${avg(b[1], c[1]).toFixed(2)} T`;
  for (let i = 2, max = len - 1; i < max; i++) {
    a = points[i];
    b = points[i + 1];
    r += `${avg(a[0], b[0]).toFixed(2)},${avg(a[1], b[1]).toFixed(2)} `;
  }
  return closed ? r + "Z" : r;
}

export function drawElementToPath(d, { last = true } = {}) {
  const points = d.points || [];
  if (points.length === 0) return "";
  // Single dot support
  const inputPoints =
    points.length === 1
      ? [points[0], [points[0][0] + 0.01, points[0][1] + 0.01, points[0][2]]]
      : points;

  const outline = getStroke(inputPoints, {
    size: d.size ?? 4,
    thinning: d.thinning ?? 0.5,
    smoothing: d.smoothing ?? 0.5,
    streamline: d.streamline ?? 0.5,
    simulatePressure: d.simulatePressure ?? true,
    last,
  });
  return strokeToSvgPath(outline);
}

/* ---------- arrowhead polygon ---------- */
export function arrowHead(start, end, strokeWidth = 3) {
  const L = Math.max(12, strokeWidth * 4);
  const a = Math.atan2(end.y - start.y, end.x - start.x);
  const spread = Math.PI / 6;
  return {
    tip: end,
    left: {
      x: end.x - L * Math.cos(a - spread),
      y: end.y - L * Math.sin(a - spread),
    },
    right: {
      x: end.x - L * Math.cos(a + spread),
      y: end.y - L * Math.sin(a + spread),
    },
    shaftEnd: {
      x: end.x - 0.8 * L * Math.cos(a),
      y: end.y - 0.8 * L * Math.sin(a),
    },
  };
}

/* ---------- camera helpers ---------- */
export function zoomToFit(bounds, viewport, margin = 64, maxZoom = 1.5) {
  if (!bounds || !bounds.w || !bounds.h)
    return { x: viewport.w / 2, y: viewport.h / 2, zoom: 1 };
  const zoom = clamp(
    Math.min(
      (viewport.w - 2 * margin) / bounds.w,
      (viewport.h - 2 * margin) / bounds.h
    ),
    0.1,
    maxZoom
  );
  return {
    zoom,
    x: viewport.w / 2 - (bounds.x + bounds.w / 2) * zoom,
    y: viewport.h / 2 - (bounds.y + bounds.h / 2) * zoom,
  };
}

export const wheelZoomFactor = (e) =>
  Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.002));
