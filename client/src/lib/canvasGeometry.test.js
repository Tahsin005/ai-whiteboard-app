import { describe, it, expect } from "vitest";
import {
  screenToWorld,
  worldToScreen,
  zoomAtScreenPoint,
  distToSegment,
  hitTestElement,
  resizeBox,
  mapPointToBox,
  applyBoxToElement,
  boxFromDrag,
  snapAngle,
  getBounds,
  arrowHead,
} from "./canvasGeometry.js";

describe("canvasGeometry", () => {
  it("screenToWorld(worldToScreen(p)) ≈ p for random cameras", () => {
    const cameras = [
      { x: 0, y: 0, zoom: 1 },
      { x: 125, y: -45, zoom: 2.5 },
      { x: -500, y: 300, zoom: 0.25 },
      { x: 42.12, y: 88.94, zoom: 1.83 },
    ];
    const points = [
      { x: 0, y: 0 },
      { x: 100, y: 200 },
      { x: -350, y: 480 },
    ];

    for (const cam of cameras) {
      for (const p of points) {
        const screen = worldToScreen(p, cam);
        const world = screenToWorld(screen, cam);
        expect(world.x).toBeCloseTo(p.x, 5);
        expect(world.y).toBeCloseTo(p.y, 5);
      }
    }
  });

  it("zoomAtScreenPoint keeps the world point under the cursor fixed", () => {
    const cam = { x: 50, y: 80, zoom: 1.2 };
    const cursorScreen = { x: 400, y: 300 };
    const worldBefore = screenToWorld(cursorScreen, cam);

    const newCam = zoomAtScreenPoint(cursorScreen, 2.5, cam);
    const worldAfter = screenToWorld(cursorScreen, newCam);

    expect(Math.abs(worldAfter.x - worldBefore.x)).toBeLessThan(1e-9);
    expect(Math.abs(worldAfter.y - worldBefore.y)).toBeLessThan(1e-9);
  });

  it("distToSegment calculates endpoints, midpoint, perpendicular, degenerate", () => {
    const a = { x: 0, y: 0 };
    const b = { x: 10, y: 0 };

    // At endpoint a
    expect(distToSegment(a, a, b)).toBe(0);
    // At endpoint b
    expect(distToSegment(b, a, b)).toBe(0);
    // At midpoint
    expect(distToSegment({ x: 5, y: 0 }, a, b)).toBe(0);
    // Perpendicular at distance 5
    expect(distToSegment({ x: 5, y: 5 }, a, b)).toBe(5);
    // Off past b
    expect(distToSegment({ x: 14, y: 0 }, a, b)).toBe(4);
    // Degenerate (a == b)
    expect(distToSegment({ x: 3, y: 4 }, a, a)).toBe(5);
  });

  it("hitTestElement: unfilled rect hits on border, misses at center; filled hits center", () => {
    const unfilledRect = {
      type: "rect",
      data: { x: 100, y: 100, w: 200, h: 100, fill: "transparent", strokeWidth: 2 },
    };
    const filledRect = {
      type: "rect",
      data: { x: 100, y: 100, w: 200, h: 100, fill: "#ffffff", strokeWidth: 2 },
    };

    // Center point (200, 150)
    expect(hitTestElement(unfilledRect, { x: 200, y: 150 })).toBe(false);
    expect(hitTestElement(filledRect, { x: 200, y: 150 })).toBe(true);

    // On border (100, 150)
    expect(hitTestElement(unfilledRect, { x: 100, y: 150 })).toBe(true);
  });

  it("hitTestElement: diagonal line misses at empty bbox corner", () => {
    const line = {
      type: "line",
      data: { startX: 0, startY: 0, endX: 200, endY: 200, strokeWidth: 3 },
    };

    // On the line
    expect(hitTestElement(line, { x: 100, y: 100 })).toBe(true);
    // At the corner of bbox (200, 0), far from diagonal
    expect(hitTestElement(line, { x: 200, y: 0 })).toBe(false);
  });

  it("hitTestElement: tolerance shrinks as zoom grows", () => {
    const line = {
      type: "line",
      data: { startX: 0, startY: 0, endX: 100, endY: 0, strokeWidth: 2 },
    };
    // 5px away in world space
    const p = { x: 50, y: 5 };
    // At zoom = 1, tol = 6 => dist = 5 <= 1 + 6 = 7 => hits
    expect(hitTestElement(line, p, 1)).toBe(true);
    // At zoom = 5, tol = 6/5 = 1.2 => dist = 5 <= 1 + 1.2 = 2.2 => false
    expect(hitTestElement(line, p, 5)).toBe(false);
  });

  it("resizeBox handles all 8 handles and flip", () => {
    const initial = { x: 100, y: 100, w: 100, h: 80 };

    // SE handle dragged +20, +10
    const se = resizeBox(initial, "se", { x: 20, y: 10 });
    expect(se.w).toBe(120);
    expect(se.h).toBe(90);
    expect(se.flipX).toBe(false);
    expect(se.flipY).toBe(false);

    // Flip horizontally past anchor: E handle dragged -150
    const flipped = resizeBox(initial, "e", { x: -150, y: 0 });
    expect(flipped.w).toBe(50);
    expect(flipped.flipX).toBe(true);
  });

  it("resizeBox aspect lock keeps w/h ratio", () => {
    const initial = { x: 100, y: 100, w: 200, h: 100 };
    const res = resizeBox(initial, "se", { x: 50, y: 80 }, { keepAspect: true });
    const ratioBefore = initial.w / initial.h;
    const ratioAfter = res.w / res.h;
    expect(Math.abs(ratioAfter - ratioBefore)).toBeLessThan(1e-6);
  });

  it("resizeBox fromCenter keeps center fixed", () => {
    const initial = { x: 100, y: 100, w: 100, h: 80 };
    const cxBefore = initial.x + initial.w / 2;
    const cyBefore = initial.y + initial.h / 2;

    const res = resizeBox(initial, "se", { x: 20, y: 10 }, { fromCenter: true });
    const cxAfter = res.x + res.w / 2;
    const cyAfter = res.y + res.h / 2;

    expect(cxAfter).toBeCloseTo(cxBefore, 5);
    expect(cyAfter).toBeCloseTo(cyBefore, 5);
  });

  it("mapPointToBox and applyBoxToElement", () => {
    const from = { x: 0, y: 0, w: 100, h: 100 };
    const to = { x: 50, y: 50, w: 200, h: 200 };

    const mapped = mapPointToBox({ x: 25, y: 25 }, from, to);
    expect(mapped.x).toBe(100);
    expect(mapped.y).toBe(100);

    const line = {
      type: "line",
      data: { startX: 0, startY: 0, endX: 100, endY: 100 },
    };
    const patch = applyBoxToElement(line, from, to);
    expect(patch.startX).toBe(50);
    expect(patch.startY).toBe(50);
    expect(patch.endX).toBe(250);
    expect(patch.endY).toBe(250);
  });

  it("boxFromDrag with negative drags, square, and fromCenter", () => {
    const start = { x: 100, y: 100 };
    const curNeg = { x: 60, y: 80 };

    const box = boxFromDrag(start, curNeg);
    expect(box.x).toBe(60);
    expect(box.y).toBe(80);
    expect(box.w).toBe(40);
    expect(box.h).toBe(20);

    const square = boxFromDrag(start, { x: 150, y: 120 }, { square: true });
    expect(square.w).toBe(50);
    expect(square.h).toBe(50);
  });

  it("snapAngle preserves length and rounds to 15 deg steps", () => {
    const start = { x: 0, y: 0 };
    const end = { x: 100, y: 5 }; // ~2.8 degrees
    const snapped = snapAngle(start, end);

    const lenOrig = Math.hypot(end.x - start.x, end.y - start.y);
    const lenSnap = Math.hypot(snapped.x - start.x, snapped.y - start.y);
    expect(lenSnap).toBeCloseTo(lenOrig, 5);

    const angle = Math.atan2(snapped.y - start.y, snapped.x - start.x);
    expect(angle).toBeCloseTo(0, 5); // snapped to 0 rad
  });

  it("getBounds for draw includes stroke padding and caches result", () => {
    const points = [
      [10, 10],
      [50, 50],
    ];
    const el = { type: "draw", data: { points, size: 6 } };

    const b1 = getBounds(el);
    expect(b1.x).toBe(7); // 10 - pad(3)
    expect(b1.y).toBe(7);
    expect(b1.w).toBe(46); // 40 + 6
    expect(b1.h).toBe(46);

    const b2 = getBounds(el);
    expect(b1).toBe(b2); // WeakMap cached reference
  });

  it("arrowHead generates polygon points and shortened shaftEnd", () => {
    const head = arrowHead({ x: 0, y: 0 }, { x: 100, y: 0 }, 4);
    expect(head.tip.x).toBe(100);
    expect(head.tip.y).toBe(0);
    expect(head.shaftEnd.x).toBeLessThan(100);
    expect(head.left.y).toBeCloseTo(-head.right.y, 5);
    expect(Math.abs(head.left.y)).toBeGreaterThan(0);
  });
});
