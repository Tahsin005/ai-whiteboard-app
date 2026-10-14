import React, { useRef, useEffect, useCallback, useState, useMemo } from "react";
import {
  screenToWorld,
  worldToScreen,
  zoomAtScreenPoint,
  clampZoom,
  hitTestTopmost,
  hitTestElement,
  boxFromDrag,
  snapAngle,
  resizeBox,
  applyBoxToElement,
  translatePatch,
  getBounds,
  boundsIntersect,
  wheelZoomFactor,
  drawElementToPath,
  DRAG_THRESHOLD_PX,
  HIT_TOLERANCE_PX,
} from "@/lib/canvasGeometry.js";
import { sortElementsByZ, TYPE_DEFAULTS, normalizeElementData } from "@/lib/canvasSchema.js";
import ElementRenderer from "./ElementRenderer.jsx";
import SelectionOverlay from "./SelectionOverlay.jsx";
import MultiplayerCursors from "./MultiplayerCursors.jsx";

export function Canvas({
  board,
  camera,
  setCamera,
  elements = [],
  selectedIds = new Set(),
  setSelectedIds,
  editingId = null,
  setEditingId,
  activeTool = "select",
  setActiveTool,
  toolOptions = {},
  cursors = {},
  sendCursor,
  // Callbacks
  onCreateElement,
  onUpdateElements,
  onDeleteElements,
  onToggleCheck,
  // Live socket broadcast
  onBroadcastLiveStroke,
  children,
}) {
  const containerRef = useRef(null);
  const cameraRef = useRef(camera);
  cameraRef.current = camera;

  // Active gesture state machine
  const gestureRef = useRef(null);
  const activePointersRef = useRef(new Map());

  // Transient interaction state for smooth 60fps rendering without re-committing to DB
  const [transientDraft, setTransientDraft] = useState(null);
  const [transientMovePatches, setTransientMovePatches] = useState(null); // Map<id, patch>
  const [transientResizePatches, setTransientResizePatches] = useState(null);
  const [marqueeBox, setMarqueeBox] = useState(null);
  const [pendingEraseIds, setPendingEraseIds] = useState(new Set());
  const [cursorStyle, setCursorStyle] = useState("default");

  // Keyboard Space listener for quick pan
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.code === "Space" &&
        !isSpacePressed &&
        !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)
      ) {
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e) => {
      if (e.code === "Space") setIsSpacePressed(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isSpacePressed]);

  // Sorted elements by z-index
  const sortedElements = useMemo(() => sortElementsByZ(elements), [elements]);

  // Selected elements array
  const selectedElements = useMemo(() => {
    return sortedElements.filter((el) => selectedIds.has(el.id));
  }, [sortedElements, selectedIds]);

  // Helper to convert screen to world
  const getPoint = useCallback((clientX, clientY) => {
    if (!containerRef.current) return { screen: { x: 0, y: 0 }, world: { x: 0, y: 0 } };
    const rect = containerRef.current.getBoundingClientRect();
    const screen = { x: clientX - rect.left, y: clientY - rect.top };
    const world = screenToWorld(screen, cameraRef.current);
    return { screen, world };
  }, []);

  // Update cursor based on hover
  const updateHoverCursor = useCallback(
    (screenPt, worldPt) => {
      if (isSpacePressed || activeTool === "hand") {
        setCursorStyle("grab");
        return;
      }
      if (activeTool === "draw") {
        setCursorStyle("crosshair");
        return;
      }
      if (activeTool === "eraser") {
        setCursorStyle("crosshair");
        return;
      }
      if (
        [
          "rect",
          "ellipse",
          "diamond",
          "line",
          "arrow",
          "text",
          "sticky",
          "bullet",
          "chart",
          "emoji",
          "image",
        ].includes(activeTool)
      ) {
        setCursorStyle("crosshair");
        return;
      }

      // In select mode: check if mouse is over an element
      const hit = hitTestTopmost(sortedElements, worldPt, cameraRef.current.zoom);
      if (hit) {
        setCursorStyle("move");
      } else {
        setCursorStyle("default");
      }
    },
    [activeTool, isSpacePressed, sortedElements]
  );

  // Wheel listener: pan canvas or pinch-zoom with trackpad / ctrlKey
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const screenPt = { x: e.clientX - rect.left, y: e.clientY - rect.top };

      if (e.ctrlKey || e.metaKey) {
        // Trackpad pinch or Ctrl + Wheel => exponential zoom at cursor
        const factor = wheelZoomFactor(e);
        const newZoom = clampZoom(cameraRef.current.zoom * factor);
        setCamera((prev) => zoomAtScreenPoint(screenPt, newZoom, prev));
      } else {
        // Normal 2-finger scroll => pan
        setCamera((prev) => ({
          ...prev,
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY,
        }));
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [setCamera]);

  // ---------- GESTURE HANDLERS ---------- //

  const handlePointerDown = (e) => {
    if (e.button === 2) return; // Right-click reserved
    // Do not intercept or steal pointer capture from active text inputs
    if (
      e.target.tagName === "TEXTAREA" ||
      e.target.tagName === "INPUT" ||
      e.target.closest?.("textarea, input")
    ) {
      return;
    }
    const { screen, world } = getPoint(e.clientX, e.clientY);

    // Track pointer
    activePointersRef.current.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) { }

    // Two-finger pinch on touch devices
    if (activePointersRef.current.size === 2) {
      const pts = Array.from(activePointersRef.current.values());
      const dist = Math.hypot(pts[0].clientX - pts[1].clientX, pts[0].clientY - pts[1].clientY);
      const midClient = {
        x: (pts[0].clientX + pts[1].clientX) / 2,
        y: (pts[0].clientY + pts[1].clientY) / 2,
      };
      const rect = containerRef.current.getBoundingClientRect();
      const midScreen = { x: midClient.x - rect.left, y: midClient.y - rect.top };

      gestureRef.current = {
        kind: "pinch",
        initialDist: dist,
        initialZoom: cameraRef.current.zoom,
        midScreen,
        startCamera: { ...cameraRef.current },
      };
      return;
    }

    // Hand tool / Middle click / Space bar drag => Pan
    if (isSpacePressed || activeTool === "hand" || e.button === 1) {
      gestureRef.current = {
        kind: "pan",
        startScreen: screen,
        startCamera: { ...cameraRef.current },
      };
      setCursorStyle("grabbing");
      return;
    }

    // 1. FREEHAND DRAW
    if (activeTool === "draw") {
      const pt = [Math.round(world.x * 100) / 100, Math.round(world.y * 100) / 100];
      if (e.pointerType === "pen") {
        pt.push(e.pressure || 0.5);
      }
      const initialPoints = [pt];
      const strokeColor = toolOptions.stroke || "#6366f1";
      const strokeSize = toolOptions.strokeWidth || 4;

      gestureRef.current = {
        kind: "draw",
        points: initialPoints,
        strokeColor,
        strokeSize,
        lastAddedWorld: world,
      };

      setTransientDraft({
        type: "draw",
        data: {
          points: initialPoints,
          stroke: strokeColor,
          size: strokeSize,
          simulatePressure: e.pointerType !== "pen",
        },
      });
      return;
    }

    // 2. SHAPE BOX CREATION (rect, ellipse, diamond)
    if (["rect", "ellipse", "diamond"].includes(activeTool)) {
      gestureRef.current = {
        kind: "createBox",
        type: activeTool,
        startWorld: world,
        startScreen: screen,
        hasDragged: false,
      };
      return;
    }

    // 3. LINE / ARROW CREATION
    if (["line", "arrow"].includes(activeTool)) {
      gestureRef.current = {
        kind: "createLine",
        type: activeTool,
        startWorld: world,
        startScreen: screen,
        hasDragged: false,
      };
      return;
    }

    // 4. CLICK-TO-PLACE TYPES (sticky, text, bullet, chart, emoji, image)
    if (
      ["sticky", "text", "bullet", "chart", "emoji", "image"].includes(activeTool)
    ) {
      const def = TYPE_DEFAULTS[activeTool] || {};
      const w = def.w || 180;
      const h = def.h || 180;
      const x = Math.round(world.x - w / 2);
      const y = Math.round(world.y - h / 2);

      const newId = crypto.randomUUID();
      const newElement = {
        id: newId,
        type: activeTool,
        data: {
          ...def,
          x,
          y,
          w,
          h,
          fill:
            activeTool === "sticky"
              ? toolOptions.stickyColor || "#fef08a"
              : toolOptions.fill || def.fill,
          stroke: toolOptions.stroke || def.stroke,
          color: toolOptions.stroke || def.color,
          fontSize: toolOptions.fontSize || def.fontSize,
        },
      };

      onCreateElement?.(newElement);
      setSelectedIds?.(new Set([newId]));
      if (["sticky", "text", "bullet"].includes(activeTool)) {
        setEditingId?.(newId);
      }
      setActiveTool?.("select");
      return;
    }

    // 5. ERASER
    if (activeTool === "eraser") {
      gestureRef.current = {
        kind: "erase",
        lastWorld: world,
        erasedIds: new Set(),
      };
      // Hit test current point
      const hit = hitTestTopmost(sortedElements, world, cameraRef.current.zoom);
      if (hit) {
        gestureRef.current.erasedIds.add(hit.id);
        setPendingEraseIds(new Set([hit.id]));
      }
      return;
    }

    // 6. SELECT TOOL
    if (activeTool === "select") {
      const hit = hitTestTopmost(sortedElements, world, cameraRef.current.zoom);

      if (hit) {
        if (editingId && editingId !== hit.id) {
          setEditingId?.(null);
        }

        const isAlreadySelected = selectedIds.has(hit.id);
        const isShift = e.shiftKey;

        if (!isAlreadySelected) {
          if (isShift) {
            setSelectedIds?.(new Set([...selectedIds, hit.id]));
          } else {
            setSelectedIds?.(new Set([hit.id]));
          }
        }

        // Start move gesture
        gestureRef.current = {
          kind: "move",
          hitElement: hit,
          startWorld: world,
          startScreen: screen,
          hasDragged: false,
          isAlreadySelected,
          isShift,
          initialPositions: new Map(
            (isAlreadySelected ? selectedElements : [hit]).map((el) => [
              el.id,
              { ...el.data },
            ])
          ),
        };
      } else {
        // Click on empty canvas
        if (!e.shiftKey) {
          setSelectedIds?.(new Set());
          setEditingId?.(null);
        }
        // Start marquee selection
        gestureRef.current = {
          kind: "marquee",
          startWorld: world,
          startScreen: screen,
          isShift: e.shiftKey,
          initialSelected: new Set(e.shiftKey ? selectedIds : []),
        };
      }
    }
  };

  const handlePointerMove = (e) => {
    const { screen, world } = getPoint(e.clientX, e.clientY);

    // Broadcast cursor position for multiplayer
    sendCursor?.({ x: world.x, y: world.y });

    if (!gestureRef.current) {
      updateHoverCursor(screen, world);
      return;
    }

    const g = gestureRef.current;

    // PINCH ZOOM
    if (g.kind === "pinch") {
      activePointersRef.current.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });
      const pts = Array.from(activePointersRef.current.values());
      if (pts.length === 2) {
        const curDist = Math.hypot(pts[0].clientX - pts[1].clientX, pts[0].clientY - pts[1].clientY);
        const scale = curDist / g.initialDist;
        const newZoom = clampZoom(g.initialZoom * scale);
        setCamera(zoomAtScreenPoint(g.midScreen, newZoom, g.startCamera));
      }
      return;
    }

    // PANNING
    if (g.kind === "pan") {
      const dx = screen.x - g.startScreen.x;
      const dy = screen.y - g.startScreen.y;
      setCamera({
        ...g.startCamera,
        x: g.startCamera.x + dx,
        y: g.startCamera.y + dy,
      });
      return;
    }

    // DRAWING
    if (g.kind === "draw") {
      const coalesced = e.nativeEvent?.getCoalescedEvents?.() || [e];
      let updated = false;

      for (const ev of coalesced) {
        const ptPt = getPoint(ev.clientX, ev.clientY).world;
        const dist = Math.hypot(ptPt.x - g.lastAddedWorld.x, ptPt.y - g.lastAddedWorld.y);
        const minDist = 1.5 / cameraRef.current.zoom;

        if (dist >= minDist && g.points.length < 4000) {
          const pt = [Math.round(ptPt.x * 100) / 100, Math.round(ptPt.y * 100) / 100];
          if (ev.pointerType === "pen") pt.push(ev.pressure || 0.5);
          g.points.push(pt);
          g.lastAddedWorld = ptPt;
          updated = true;
        }
      }

      if (updated) {
        setTransientDraft({
          type: "draw",
          data: {
            points: [...g.points],
            stroke: g.strokeColor,
            size: g.strokeSize,
            simulatePressure: e.pointerType !== "pen",
          },
        });
        onBroadcastLiveStroke?.(g.points);
      }
      return;
    }

    // CREATE BOX (rect, ellipse, diamond)
    if (g.kind === "createBox") {
      const deltaScreen = Math.hypot(screen.x - g.startScreen.x, screen.y - g.startScreen.y);
      if (deltaScreen > DRAG_THRESHOLD_PX) g.hasDragged = true;

      const box = boxFromDrag(g.startWorld, world, {
        square: e.shiftKey,
        fromCenter: e.altKey,
      });

      setTransientDraft({
        type: g.type,
        data: {
          ...TYPE_DEFAULTS[g.type],
          x: Math.round(box.x),
          y: Math.round(box.y),
          w: Math.round(box.w),
          h: Math.round(box.h),
          stroke: toolOptions.stroke || "#6366f1",
          fill: toolOptions.fill || "transparent",
          strokeWidth: toolOptions.strokeWidth || 2,
        },
      });
      return;
    }

    // CREATE LINE / ARROW
    if (g.kind === "createLine") {
      const deltaScreen = Math.hypot(screen.x - g.startScreen.x, screen.y - g.startScreen.y);
      if (deltaScreen > DRAG_THRESHOLD_PX) g.hasDragged = true;

      const endPt = e.shiftKey ? snapAngle(g.startWorld, world) : world;
      setTransientDraft({
        type: g.type,
        data: {
          ...TYPE_DEFAULTS[g.type],
          startX: Math.round(g.startWorld.x),
          startY: Math.round(g.startWorld.y),
          endX: Math.round(endPt.x),
          endY: Math.round(endPt.y),
          stroke: toolOptions.stroke || "#6366f1",
          strokeWidth: toolOptions.strokeWidth || 3,
        },
      });
      return;
    }

    // MARQUEE
    if (g.kind === "marquee") {
      const box = boxFromDrag(g.startWorld, world);
      setMarqueeBox(box);

      // Hit test intersect bounds
      const newlySelected = new Set(g.initialSelected);
      for (const el of sortedElements) {
        const elBounds = getBounds(el);
        if (boundsIntersect(box, elBounds)) {
          newlySelected.add(el.id);
        }
      }
      setSelectedIds?.(newlySelected);
      return;
    }

    // MOVE SELECTED ELEMENTS
    if (g.kind === "move") {
      const deltaScreen = Math.hypot(screen.x - g.startScreen.x, screen.y - g.startScreen.y);
      if (deltaScreen > DRAG_THRESHOLD_PX) g.hasDragged = true;

      if (g.hasDragged) {
        let dx = world.x - g.startWorld.x;
        let dy = world.y - g.startWorld.y;

        // Shift locks to dominant axis
        if (e.shiftKey) {
          if (Math.abs(dx) > Math.abs(dy)) dy = 0;
          else dx = 0;
        }

        const patches = new Map();
        for (const [id, origData] of g.initialPositions.entries()) {
          const el = sortedElements.find((item) => item.id === id);
          if (el) {
            patches.set(id, translatePatch({ ...el, data: origData }, dx, dy));
          }
        }
        setTransientMovePatches(patches);
      }
      return;
    }

    // RESIZE SELECTED
    if (g.kind === "resize") {
      const deltaWorld = {
        x: world.x - g.startWorld.x,
        y: world.y - g.startWorld.y,
      };

      const lockedAspect =
        e.shiftKey ||
        (selectedElements.length === 1 &&
          ["image", "emoji"].includes(selectedElements[0].type));

      const newBox = resizeBox(g.initialBox, g.handle, deltaWorld, {
        keepAspect: lockedAspect,
        fromCenter: e.altKey,
      });

      const patches = new Map();
      for (const el of selectedElements) {
        const patch = applyBoxToElement(
          el,
          g.initialBox,
          newBox,
          newBox.flipX,
          newBox.flipY
        );
        patches.set(el.id, patch);
      }
      setTransientResizePatches(patches);
      return;
    }

    // LINE ENDPOINT MOVE
    if (g.kind === "lineEndpoint") {
      const el = selectedElements[0];
      if (!el) return;
      const d = el.data || {};
      const isStart = g.whichEnd === "start";

      let targetPt = world;
      if (e.shiftKey) {
        const anchor = isStart
          ? { x: d.endX ?? 0, y: d.endY ?? 0 }
          : { x: d.startX ?? 0, y: d.startY ?? 0 };
        targetPt = snapAngle(anchor, world);
      }

      const patch = isStart
        ? { startX: Math.round(targetPt.x), startY: Math.round(targetPt.y) }
        : { endX: Math.round(targetPt.x), endY: Math.round(targetPt.y) };

      const patches = new Map([[el.id, patch]]);
      setTransientResizePatches(patches);
      return;
    }

    // ERASER DRAG
    if (g.kind === "erase") {
      const p1 = g.lastWorld;
      const p2 = world;
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const step = (HIT_TOLERANCE_PX / cameraRef.current.zoom) / 2;
      const count = Math.max(Math.ceil(dist / step), 1);

      for (let i = 0; i <= count; i++) {
        const t = i / count;
        const samplePt = { x: p1.x + (p2.x - p1.x) * t, y: p1.y + (p2.y - p1.y) * t };
        for (const el of sortedElements) {
          if (!g.erasedIds.has(el.id) && hitTestElement(el, samplePt, cameraRef.current.zoom)) {
            g.erasedIds.add(el.id);
          }
        }
      }
      g.lastWorld = world;
      setPendingEraseIds(new Set(g.erasedIds));
      return;
    }
  };

  const handlePointerUp = (e) => {
    activePointersRef.current.delete(e.pointerId);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) { }

    if (!gestureRef.current) return;
    const g = gestureRef.current;
    gestureRef.current = null;
    const { screen, world } = getPoint(e.clientX, e.clientY);

    // 1. COMMIT DRAWING
    if (g.kind === "draw") {
      setTransientDraft(null);
      onBroadcastLiveStroke?.(null);

      if (g.points.length > 0) {
        const newId = crypto.randomUUID();
        const newElement = {
          id: newId,
          type: "draw",
          data: {
            points: g.points,
            stroke: g.strokeColor,
            size: g.strokeSize,
            thinning: 0.5,
            smoothing: 0.5,
            streamline: 0.5,
            simulatePressure: e.pointerType !== "pen",
          },
        };
        onCreateElement?.(newElement);
      }
      return;
    }

    // 2. COMMIT CREATE BOX (rect, ellipse, diamond)
    if (g.kind === "createBox") {
      setTransientDraft(null);
      let box;
      if (!g.hasDragged) {
        // Click without drag => default size 140x90 centered on click
        box = {
          x: Math.round(g.startWorld.x - 70),
          y: Math.round(g.startWorld.y - 45),
          w: 140,
          h: 90,
        };
      } else {
        box = boxFromDrag(g.startWorld, world, {
          square: e.shiftKey,
          fromCenter: e.altKey,
        });
      }

      const newId = crypto.randomUUID();
      const newElement = {
        id: newId,
        type: g.type,
        data: {
          ...TYPE_DEFAULTS[g.type],
          x: Math.round(box.x),
          y: Math.round(box.y),
          w: Math.max(Math.round(box.w), 20),
          h: Math.max(Math.round(box.h), 20),
          stroke: toolOptions.stroke || "#6366f1",
          fill: toolOptions.fill || "transparent",
          strokeWidth: toolOptions.strokeWidth || 2,
        },
      };

      onCreateElement?.(newElement);
      setSelectedIds?.(new Set([newId]));
      setActiveTool?.("select");
      return;
    }

    // 3. COMMIT CREATE LINE / ARROW
    if (g.kind === "createLine") {
      setTransientDraft(null);
      let startX = Math.round(g.startWorld.x);
      let startY = Math.round(g.startWorld.y);
      let endX, endY;

      if (!g.hasDragged) {
        // Click without drag => 120px horizontal line centered
        startX -= 60;
        endX = startX + 120;
        endY = startY;
      } else {
        const endPt = e.shiftKey ? snapAngle(g.startWorld, world) : world;
        endX = Math.round(endPt.x);
        endY = Math.round(endPt.y);
      }

      const newId = crypto.randomUUID();
      const newElement = {
        id: newId,
        type: g.type,
        data: {
          ...TYPE_DEFAULTS[g.type],
          startX,
          startY,
          endX,
          endY,
          stroke: toolOptions.stroke || "#6366f1",
          strokeWidth: toolOptions.strokeWidth || 3,
        },
      };

      onCreateElement?.(newElement);
      setSelectedIds?.(new Set([newId]));
      setActiveTool?.("select");
      return;
    }

    // 4. COMMIT MARQUEE
    if (g.kind === "marquee") {
      setMarqueeBox(null);
      return;
    }

    // 5. COMMIT MOVE
    if (g.kind === "move") {
      if (!g.hasDragged) {
        // Was a simple click on an already-selected element
        if (g.isShift) {
          // Toggle off
          const next = new Set(selectedIds);
          next.delete(g.hitElement.id);
          setSelectedIds?.(next);
        } else if (g.isAlreadySelected && selectedIds.size > 1) {
          // Collapse selection to just this element
          setSelectedIds?.(new Set([g.hitElement.id]));
        }
      } else if (transientMovePatches && transientMovePatches.size > 0) {
        // Commit moved positions to parent / server in ONE batch
        const updates = Array.from(transientMovePatches.entries()).map(([id, patch]) => ({
          id,
          patch,
        }));
        onUpdateElements?.(updates);
      }
      setTransientMovePatches(null);
      return;
    }

    // 6. COMMIT RESIZE
    if (g.kind === "resize" || g.kind === "lineEndpoint") {
      if (transientResizePatches && transientResizePatches.size > 0) {
        const updates = Array.from(transientResizePatches.entries()).map(([id, patch]) => ({
          id,
          patch,
        }));
        onUpdateElements?.(updates);
      }
      setTransientResizePatches(null);
      return;
    }

    // 7. COMMIT ERASER
    if (g.kind === "erase") {
      setPendingEraseIds(new Set());
      if (g.erasedIds.size > 0) {
        onDeleteElements?.(Array.from(g.erasedIds));
      }
      return;
    }
  };

  const handlePointerCancel = () => {
    gestureRef.current = null;
    activePointersRef.current.clear();
    setTransientDraft(null);
    setTransientMovePatches(null);
    setTransientResizePatches(null);
    setMarqueeBox(null);
    setPendingEraseIds(new Set());
  };

  // Double click on canvas: edit text or create new text
  const handleDoubleClick = (e) => {
    const { world } = getPoint(e.clientX, e.clientY);
    const hit = hitTestTopmost(sortedElements, world, cameraRef.current.zoom);

    if (hit) {
      if (["text", "sticky", "rect", "ellipse", "diamond", "bullet"].includes(hit.type)) {
        setEditingId?.(hit.id);
        setSelectedIds?.(new Set([hit.id]));
      }
    } else {
      // Create new text at cursor
      const newId = crypto.randomUUID();
      const newText = {
        id: newId,
        type: "text",
        data: {
          ...TYPE_DEFAULTS.text,
          x: Math.round(world.x),
          y: Math.round(world.y),
        },
      };
      onCreateElement?.(newText);
      setSelectedIds?.(new Set([newId]));
      setEditingId?.(newId);
    }
  };

  // Handle callbacks from SelectionOverlay
  const handleResizeStart = (handleId, e) => {
    e.stopPropagation();
    const { world, screen } = getPoint(e.clientX, e.clientY);
    const union = SelectionOverlay.unionBounds
      ? SelectionOverlay.unionBounds(selectedElements.map(getBounds))
      : getBounds(selectedElements[0]);

    gestureRef.current = {
      kind: "resize",
      handle: handleId,
      startWorld: world,
      startScreen: screen,
      initialBox: union || getBounds(selectedElements[0]),
    };
  };

  const handleEndpointStart = (whichEnd, e) => {
    e.stopPropagation();
    const { world, screen } = getPoint(e.clientX, e.clientY);
    gestureRef.current = {
      kind: "lineEndpoint",
      whichEnd,
      startWorld: world,
      startScreen: screen,
    };
  };

  // Viewport culling: compute world viewport rect with 200px margin
  const viewportBounds = useMemo(() => {
    const el = containerRef.current;
    const w = el ? el.clientWidth : window.innerWidth;
    const h = el ? el.clientHeight : window.innerHeight;
    const margin = 200 / camera.zoom;
    return {
      x: -camera.x / camera.zoom - margin,
      y: -camera.y / camera.zoom - margin,
      w: w / camera.zoom + margin * 2,
      h: h / camera.zoom + margin * 2,
    };
  }, [camera]);

  // Compute final effective elements (applying transient patches if active)
  const displayElements = useMemo(() => {
    return sortedElements.map((el) => {
      let data = el.data;
      if (transientMovePatches && transientMovePatches.has(el.id)) {
        data = { ...data, ...transientMovePatches.get(el.id) };
      } else if (transientResizePatches && transientResizePatches.has(el.id)) {
        data = { ...data, ...transientResizePatches.get(el.id) };
      }
      return { ...el, data };
    });
  }, [sortedElements, transientMovePatches, transientResizePatches]);

  // Culled elements that intersect viewport
  const visibleElements = useMemo(() => {
    return displayElements.filter((el) => {
      const b = getBounds(el);
      return boundsIntersect(b, viewportBounds);
    });
  }, [displayElements, viewportBounds]);

  // Adaptive background grid
  const gridStyle = useMemo(() => {
    let base = 24;
    let size = base * camera.zoom;
    while (size < 12) size *= 2;
    while (size > 48) size /= 2;

    const ox = camera.x % size;
    const oy = camera.y % size;

    return {
      backgroundImage: `radial-gradient(circle, rgba(148, 163, 184, 0.3) 1px, transparent 1px)`,
      backgroundSize: `${size}px ${size}px`,
      backgroundPosition: `${ox}px ${oy}px`,
    };
  }, [camera.zoom, camera.x, camera.y]);

  return (
    <div
      ref={containerRef}
      className="canvas-container"
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        touchAction: "none",
        userSelect: "none",
        overscrollBehavior: "none",
        cursor: cursorStyle,
        ...gridStyle,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onLostPointerCapture={handlePointerCancel}
      onDoubleClick={handleDoubleClick}
      onContextMenu={(e) => e.preventDefault()}
    >

      <div
        className="canvas-world"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`,
          transformOrigin: "0 0",
          willChange: "transform",
          pointerEvents: "none",
        }}
      >
        {visibleElements.map((el) => (
          <ElementRenderer
            key={el.id}
            element={el}
            isEditing={editingId === el.id}
            isPendingErase={pendingEraseIds.has(el.id)}
            onCommitEdit={(id, patch) => {
              setEditingId?.(null);
              onUpdateElements?.([{ id, patch }]);
            }}
            onToggleCheck={(id, checked) => {
              onToggleCheck?.(id, checked);
            }}
            onDeleteIfEmpty={(id) => {
              setEditingId?.(null);
              onDeleteElements?.([id]);
            }}
          />
        ))}


        {transientDraft && (
          <ElementRenderer
            element={{ id: "draft-transient", ...transientDraft }}
            isEditing={false}
          />
        )}


        {marqueeBox && (
          <div
            style={{
              position: "absolute",
              left: `${marqueeBox.x}px`,
              top: `${marqueeBox.y}px`,
              width: `${marqueeBox.w}px`,
              height: `${marqueeBox.h}px`,
              backgroundColor: "rgba(99, 102, 241, 0.12)",
              border: `${1 / camera.zoom}px solid rgba(99, 102, 241, 0.65)`,
              pointerEvents: "none",
            }}
          />
        )}
      </div>


      <SelectionOverlay
        selectedElements={selectedElements.map((el) => {
          if (transientMovePatches && transientMovePatches.has(el.id)) {
            return { ...el, data: { ...el.data, ...transientMovePatches.get(el.id) } };
          }
          if (transientResizePatches && transientResizePatches.has(el.id)) {
            return { ...el, data: { ...el.data, ...transientResizePatches.get(el.id) } };
          }
          return el;
        })}
        camera={camera}
        editingId={editingId}
        onResizeStart={handleResizeStart}
        onEndpointStart={handleEndpointStart}
      />


      <MultiplayerCursors cursors={cursors} camera={camera} />


      {children}
    </div>
  );
}

export default Canvas;
