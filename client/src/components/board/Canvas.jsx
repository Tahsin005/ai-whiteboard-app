import { useRef, useEffect, useCallback, useState } from "react";
import {
  screenToWorld,
  zoomAtScreenPoint,
  clampZoom,
} from "@/lib/canvasMath.js";
import MultiplayerCursors from "./MultiplayerCursors.jsx";

export function Canvas({
  board,
  camera,
  setCamera,
  cursors = {},
  sendCursor,
  children,
}) {
  const containerRef = useRef(null);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const isPanningRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

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
      if (e.code === "Space") {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isSpacePressed]);

  const handlePointerDown = useCallback(
    (e) => {
      const isMiddleClick = e.button === 1;
      const isSpacePan = isSpacePressed && e.button === 0;

      if (isMiddleClick || isSpacePan) {
        e.preventDefault();
        isPanningRef.current = true;
        lastMousePosRef.current = { x: e.clientX, y: e.clientY };
        containerRef.current?.setPointerCapture?.(e.pointerId);
      }
    },
    [isSpacePressed]
  );

  const handlePointerMove = useCallback(
    (e) => {
      if (isPanningRef.current) {
        const dx = e.clientX - lastMousePosRef.current.x;
        const dy = e.clientY - lastMousePosRef.current.y;
        lastMousePosRef.current = { x: e.clientX, y: e.clientY };

        setCamera((prev) => ({
          ...prev,
          x: prev.x + dx,
          y: prev.y + dy,
        }));
      }

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const worldPos = screenToWorld(screenX, screenY, camera);
        sendCursor?.(worldPos.x, worldPos.y);
      }
    },
    [camera, sendCursor, setCamera]
  );

  const handlePointerUp = useCallback((e) => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
      try {
        containerRef.current?.releasePointerCapture?.(e.pointerId);
      } catch {
      }
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      e.preventDefault();

      const rect = container.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      if (e.ctrlKey || e.metaKey) {
        const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
        setCamera((prev) =>
          zoomAtScreenPoint(screenX, screenY, prev.zoom * zoomFactor, prev)
        );
      } else {
        setCamera((prev) => ({
          ...prev,
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY,
        }));
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [setCamera]);

  const getBackgroundStyle = () => {
    const bg = board?.bg_color || "#ffffff";
    const pattern = board?.background || "dots";
    const baseGridSize = 24;
    const scaledGridSize = Math.max(baseGridSize * camera.zoom, 8);

    if (pattern === "dots") {
      return {
        backgroundColor: bg,
        backgroundImage: "radial-gradient(#94a3b8 1.2px, transparent 1.2px)",
        backgroundSize: `${scaledGridSize}px ${scaledGridSize}px`,
        backgroundPosition: `${camera.x}px ${camera.y}px`,
      };
    }

    if (pattern === "grid") {
      return {
        backgroundColor: bg,
        backgroundImage:
          "linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)",
        backgroundSize: `${scaledGridSize}px ${scaledGridSize}px`,
        backgroundPosition: `${camera.x}px ${camera.y}px`,
      };
    }

    return { backgroundColor: bg };
  };

  const cursorStyle = isPanningRef.current
    ? "grabbing"
    : isSpacePressed
    ? "grab"
    : "default";

  return (
    <div
      ref={containerRef}
      className="canvas-container"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        cursor: cursorStyle,
        ...getBackgroundStyle(),
      }}
    >
      <div
        className="canvas-world"
        style={{
          transform: `translate3d(${camera.x}px, ${camera.y}px, 0) scale(${camera.zoom})`,
        }}
      >
        {children}
      </div>

      <MultiplayerCursors cursors={cursors} camera={camera} />
    </div>
  );
}

export default Canvas;
