import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext.jsx";
import api from "@/lib/api.js";
import { useBoardSocket } from "@/hooks/useBoardSocket.js";
import {
  zoomAtScreenPoint,
  zoomToFit,
  unionBounds,
  getBounds,
  clampZoom,
} from "@/lib/canvasGeometry.js";
import { normalizeElement, TYPE_DEFAULTS } from "@/lib/canvasSchema.js";
import { HistoryManager } from "@/lib/history.js";
import BoardNavbar from "@/components/board/BoardNavbar.jsx";
import Canvas from "@/components/board/Canvas.jsx";
import CanvasToolbar from "@/components/board/CanvasToolbar.jsx";
import ExcalidrawCanvas from "@/components/board/ExcalidrawCanvas.jsx";
import {
  toExcalidrawElement,
  fromExcalidrawElement,
  extractFilesFromElements,
} from "@/lib/excalidrawAdapter.js";
import LoadingSpinner from "@/components/ui/LoadingSpinner.jsx";
import { Sparkles, AlertCircle, ArrowLeft } from "lucide-react";

export const BoardPage = () => {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [board, setBoard] = useState(null);
  const [elements, setElements] = useState([]);
  const elementsRef = useRef(elements);
  elementsRef.current = elements;
  const [files, setFiles] = useState({});
  const filesRef = useRef({});
  filesRef.current = files;
  const savedFileIdsRef = useRef(new Set());
  const excalidrawApiRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const lastSavedVersionsRef = useRef(new Map());
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Creative Tools State
  const [activeTool, setActiveTool] = useState("select");
  const [toolOptions, setToolOptions] = useState({
    stroke: "#6965db",
    fill: "transparent",
    strokeWidth: 3,
    fontSize: 16,
  });

  // Selected & Editing State (Lifted to BoardPage)
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [editingId, setEditingId] = useState(null);

  // Operation-Based History Manager
  const historyManagerRef = useRef(new HistoryManager(100));
  const [canUndoState, setCanUndoState] = useState(false);
  const [canRedoState, setCanRedoState] = useState(false);

  const updateHistoryState = useCallback(() => {
    setCanUndoState(historyManagerRef.current.canUndo());
    setCanRedoState(historyManagerRef.current.canRedo());
  }, []);

  // Infinite Canvas Camera State
  const [camera, setCamera] = useState({
    x: typeof window !== "undefined" ? window.innerWidth / 2 : 500,
    y: typeof window !== "undefined" ? window.innerHeight / 2 : 400,
    zoom: 1,
  });

  // Handle incoming real-time socket events from peers
  const handleSocketEvent = useCallback((event, payload) => {
    switch (event) {
      case "file:created": {
        if (payload && payload.id) {
          filesRef.current = { ...filesRef.current, [payload.id]: payload };
          savedFileIdsRef.current.add(payload.id);
          setFiles((prev) => ({ ...prev, [payload.id]: payload }));
          if (excalidrawApiRef.current) {
            excalidrawApiRef.current.addFiles([payload]);
          }
        }
        break;
      }

      case "element:created":
      case "element:updated": {
        const incoming = toExcalidrawElement(payload);
        if (incoming && excalidrawApiRef.current) {
          if (incoming.type === "image" && incoming.fileId && (incoming.dataURL || incoming.src)) {
            const fileData = {
              id: incoming.fileId,
              mimeType: incoming.mimeType || "image/png",
              dataURL: incoming.dataURL || incoming.src,
              created: incoming.created || Date.now(),
            };
            filesRef.current = { ...filesRef.current, [incoming.fileId]: fileData };
            savedFileIdsRef.current.add(incoming.fileId);
            setFiles((prev) => ({ ...prev, [incoming.fileId]: fileData }));
            excalidrawApiRef.current.addFiles([fileData]);
          }
          const sceneElements = excalidrawApiRef.current.getSceneElements();
          const exists = sceneElements.some((e) => e.id === incoming.id);
          const next = exists
            ? sceneElements.map((e) => (e.id === incoming.id ? incoming : e))
            : [...sceneElements, incoming];
          lastSavedVersionsRef.current.set(incoming.id, incoming.version);
          excalidrawApiRef.current.updateScene({ elements: next });
        }
        break;
      }

      case "element:deleted": {
        if (excalidrawApiRef.current && payload.id) {
          const sceneElements = excalidrawApiRef.current.getSceneElements();
          const next = sceneElements.filter((e) => e.id !== payload.id);
          lastSavedVersionsRef.current.delete(payload.id);
          excalidrawApiRef.current.updateScene({ elements: next });
        }
        break;
      }

      case "board:updated":
        setBoard((prev) => ({ ...prev, ...payload }));
        break;

      case "member:added":
        setMembers((prev) => {
          if (prev.some((m) => m.id === payload.id)) return prev;
          return [...prev, payload];
        });
        break;

      case "member:removed":
        setMembers((prev) => prev.filter((m) => m.id !== payload.userId));
        break;

      default:
        break;
    }
  }, []);

  // Initialize Socket.io connection and presence
  const {
    isConnected,
    collaborators,
    cursors,
    sendCursor,
    sendLiveElement,
  } = useBoardSocket({
    boardId,
    currentUser: user,
    onEvent: handleSocketEvent,
  });

  // Fetch initial board and elements from DB
  const fetchBoardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get(`/whiteboards/${boardId}`);
      const data = response.data;
      setBoard(data.board);

      const initialFiles = extractFilesFromElements(data.elements || [], data.files || {});
      filesRef.current = initialFiles;
      setFiles(initialFiles);
      Object.keys(initialFiles).forEach((id) => savedFileIdsRef.current.add(id));

      // Asynchronously resolve remote S3 URLs into clean DataURLs to guarantee canvas export works without tainting
      for (const [fId, f] of Object.entries(initialFiles)) {
        if (f.dataURL && f.dataURL.startsWith("http")) {
          fetch(f.dataURL)
            .then((r) => r.blob())
            .then((blob) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                if (reader.result) {
                  const updatedFile = { ...f, dataURL: reader.result };
                  filesRef.current[fId] = updatedFile;
                  if (excalidrawApiRef.current) {
                    excalidrawApiRef.current.addFiles([updatedFile]);
                  }
                }
              };
              reader.readAsDataURL(blob);
            })
            .catch(() => {});
        }
      }

      const initialElements = (data.elements || [])
        .map(toExcalidrawElement)
        .filter(Boolean);
      for (const el of initialElements) {
        lastSavedVersionsRef.current.set(el.id, el.version);
      }
      setElements(initialElements);
      setMembers(data.members || []);
      historyManagerRef.current.clear();
      updateHistoryState();
    } catch (err) {
      console.error("Failed to load whiteboard data:", err);
      const msg =
        err.response?.data?.error ||
        "Could not load whiteboard. You might not have access.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [boardId, updateHistoryState]);

  useEffect(() => {
    fetchBoardData();
  }, [fetchBoardData]);

  // Debounced auto-save handler for Excalidraw element changes
  const handleExcalidrawChange = useCallback(
    (currentElements, appState, currentFiles) => {
      if (!currentElements || !boardId) return;

      if (currentFiles && typeof currentFiles === "object") {
        filesRef.current = { ...filesRef.current, ...currentFiles };
        const newFilesToSave = [];
        for (const [fId, fileObj] of Object.entries(currentFiles)) {
          if (fileObj && fileObj.id && !savedFileIdsRef.current.has(fId)) {
            savedFileIdsRef.current.add(fId);
            newFilesToSave.push(fileObj);
          }
        }
        if (newFilesToSave.length > 0) {
          api
            .post(`/whiteboards/${boardId}/files`, { files: newFilesToSave })
            .catch((err) => {
              console.error("Failed to save whiteboard files:", err);
              newFilesToSave.forEach((f) => savedFileIdsRef.current.delete(f.id));
            });
        }
      }

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const toSave = [];
          const toDeleteIds = [];

          for (const el of currentElements) {
            const lastVersion = lastSavedVersionsRef.current.get(el.id);
            if (el.isDeleted) {
              if (lastVersion !== undefined) {
                toDeleteIds.push(el.id);
                lastSavedVersionsRef.current.delete(el.id);
              }
            } else if (lastVersion !== el.version) {
              toSave.push(fromExcalidrawElement(el, filesRef.current));
              lastSavedVersionsRef.current.set(el.id, el.version);
            }
          }

          if (toDeleteIds.length > 0) {
            await api
              .delete(`/whiteboards/${boardId}/elements`, {
                data: { ids: toDeleteIds },
              })
              .catch(console.error);
          }

          if (toSave.length > 0) {
            await api
              .post(`/whiteboards/${boardId}/elements/bulk`, {
                elements: toSave,
              })
              .catch(console.error);
          }
        } catch (err) {
          console.error("Auto-save error:", err);
        }
      }, 400);
    },
    [boardId]
  );

  // ---------- ELEMENT MUTATION HANDLERS (PERSISTENCE + HISTORY) ---------- //

  // 1. CREATE ELEMENT
  const handleCreateElement = useCallback(
    (element) => {
      const normalized = normalizeElement(element);
      historyManagerRef.current.push({
        ops: [{ t: "create", el: normalized }],
      });
      updateHistoryState();

      setElements((prev) => [...prev, normalized]);

      api
        .post(`/whiteboards/${boardId}/elements`, {
          id: normalized.id,
          type: normalized.type,
          data: normalized.data,
          z: normalized.z,
        })
        .catch((err) => {
          console.error("Failed to create element in DB:", err);
          toast.error("Failed to save element");
          setElements((prev) => prev.filter((el) => el.id !== normalized.id));
        });
    },
    [boardId, updateHistoryState]
  );

  // 2. UPDATE ELEMENTS (BATCH)
  const handleUpdateElements = useCallback(
    (updates) => {
      if (!updates || updates.length === 0) return;

      const patchPayload = updates.map(({ id, patch }) => ({ id, patch }));

      // Record history using current elements from elementsRef
      const currentElements = elementsRef.current || [];
      const ops = [];
      for (const u of updates) {
        const el = currentElements.find((item) => item.id === u.id);
        if (el) {
          const before = {};
          for (const k of Object.keys(u.patch)) {
            before[k] = el.data ? el.data[k] : undefined;
          }
          ops.push({ t: "update", id: u.id, before, after: u.patch });
        }
      }
      if (ops.length > 0) {
        historyManagerRef.current.push({ ops });
        updateHistoryState();
      }

      setElements((prev) => {
        return prev.map((el) => {
          const u = updates.find((item) => item.id === el.id);
          if (!u) return el;
          return normalizeElement({
            ...el,
            data: { ...el.data, ...u.patch },
          });
        });
      });

      if (patchPayload.length === 1) {
        api
          .patch(`/whiteboards/${boardId}/elements/${patchPayload[0].id}`, {
            patch: patchPayload[0].patch,
          })
          .catch((err) => {
            console.error("Failed to update element in DB:", err);
          });
      } else {
        api
          .patch(`/whiteboards/${boardId}/elements`, patchPayload)
          .catch((err) => {
            console.error("Failed to update elements in DB:", err);
          });
      }
    },
    [boardId, updateHistoryState]
  );

  // 3. DELETE ELEMENTS (BATCH)
  const handleDeleteElements = useCallback(
    (ids) => {
      if (!ids || ids.length === 0) return;
      const currentElements = elementsRef.current || [];
      const toDelete = currentElements.filter((el) => ids.includes(el.id));
      if (!toDelete.length) return;

      historyManagerRef.current.push({
        ops: toDelete.map((el) => ({ t: "delete", el })),
      });
      updateHistoryState();

      setElements((prev) => prev.filter((el) => !ids.includes(el.id)));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });

      api
        .delete(`/whiteboards/${boardId}/elements`, { data: { ids } })
        .catch((err) => {
          console.error("Failed to delete elements from DB:", err);
        });
    },
    [boardId, updateHistoryState]
  );

  // 4. TOGGLE CHECKLIST ITEM
  const handleToggleCheck = useCallback(
    (id, checked) => {
      handleUpdateElements([{ id, patch: { checked } }]);
    },
    [handleUpdateElements]
  );

  // 5. UPDATE SELECTION STYLES
  const handleUpdateSelection = useCallback(
    (stylePatch) => {
      if (selectedIds.size === 0) return;
      const updates = Array.from(selectedIds).map((id) => ({
        id,
        patch: stylePatch,
      }));
      handleUpdateElements(updates);
    },
    [handleUpdateElements, selectedIds]
  );

  // 6. UPLOAD IMAGE
  const handleUploadImage = useCallback(
    async (file) => {
      const loadingToast = toast.loading("Uploading image...");
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await api.post(`/whiteboards/${boardId}/uploads`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        toast.dismiss(loadingToast);
        toast.success("Image uploaded!");

        const imgUrl = res.data.url;
        const newId = crypto.randomUUID();
        const centerWorld = {
          x: -camera.x / camera.zoom + window.innerWidth / (2 * camera.zoom),
          y: -camera.y / camera.zoom + window.innerHeight / (2 * camera.zoom),
        };

        const imageElement = {
          id: newId,
          type: "image",
          data: {
            ...TYPE_DEFAULTS.image,
            x: Math.round(centerWorld.x - 120),
            y: Math.round(centerWorld.y - 120),
            w: 240,
            h: 240,
            src: imgUrl,
          },
        };

        handleCreateElement(imageElement);
        setSelectedIds(new Set([newId]));
        setActiveTool("select");
      } catch (err) {
        toast.dismiss(loadingToast);
        console.error("Upload error:", err);
        toast.error("Failed to upload image");
      }
    },
    [boardId, camera, handleCreateElement]
  );

  // 7. CREATE EMOJI
  const handleCreateEmoji = useCallback(
    (emojiGlyph) => {
      const newId = crypto.randomUUID();
      const centerWorld = {
        x: -camera.x / camera.zoom + window.innerWidth / (2 * camera.zoom),
        y: -camera.y / camera.zoom + window.innerHeight / (2 * camera.zoom),
      };

      const emojiElement = {
        id: newId,
        type: "emoji",
        data: {
          ...TYPE_DEFAULTS.emoji,
          x: Math.round(centerWorld.x - 32),
          y: Math.round(centerWorld.y - 32),
          emoji: emojiGlyph,
        },
      };

      handleCreateElement(emojiElement);
      setSelectedIds(new Set([newId]));
      setActiveTool("select");
    },
    [camera, handleCreateElement]
  );

  // 8. DUPLICATE SELECTION (Ctrl+D)
  const handleDuplicateSelected = useCallback(() => {
    if (selectedIds.size === 0) return;
    const newElements = [];
    const newSelected = new Set();

    for (const el of elements) {
      if (selectedIds.has(el.id)) {
        const newId = crypto.randomUUID();
        const d = el.data || {};
        const cloned = normalizeElement({
          ...el,
          id: newId,
          data: {
            ...d,
            ...(d.x !== undefined ? { x: d.x + 20 } : {}),
            ...(d.y !== undefined ? { y: d.y + 20 } : {}),
            ...(d.startX !== undefined ? { startX: d.startX + 20 } : {}),
            ...(d.startY !== undefined ? { startY: d.startY + 20 } : {}),
            ...(d.endX !== undefined ? { endX: d.endX + 20 } : {}),
            ...(d.endY !== undefined ? { endY: d.endY + 20 } : {}),
            ...(el.type === "draw" && d.points
              ? { points: d.points.map(([px, py, pr]) => [px + 20, py + 20, pr]) }
              : {}),
          },
          z: (el.z ?? 0) + 1,
        });
        newElements.push(cloned);
        newSelected.add(newId);
      }
    }

    if (newElements.length > 0) {
      historyManagerRef.current.push({
        ops: newElements.map((el) => ({ t: "create", el })),
      });
      updateHistoryState();
      setElements((prev) => [...prev, ...newElements]);
      setSelectedIds(newSelected);
      api
        .post(`/whiteboards/${boardId}/elements/bulk`, { elements: newElements })
        .catch(console.error);
    }
  }, [boardId, elements, selectedIds, updateHistoryState]);

  // 9. UNDO / REDO
  const handleUndo = useCallback(() => {
    const entry = historyManagerRef.current.undo();
    if (!entry) return;
    updateHistoryState();

    // Apply inverse operations locally and on server
    for (const op of entry.ops) {
      if (op.t === "create") {
        setElements((prev) => [...prev.filter((e) => e.id !== op.el.id), op.el]);
        api
          .post(`/whiteboards/${boardId}/elements`, {
            id: op.el.id,
            type: op.el.type,
            data: op.el.data,
            z: op.el.z,
          })
          .catch(console.error);
      } else if (op.t === "delete") {
        setElements((prev) => prev.filter((e) => e.id !== op.el.id));
        api
          .delete(`/whiteboards/${boardId}/elements/${op.el.id}`)
          .catch(console.error);
      } else if (op.t === "update") {
        setElements((prev) =>
          prev.map((e) =>
            e.id === op.id ? { ...e, data: { ...e.data, ...op.after } } : e
          )
        );
        api
          .patch(`/whiteboards/${boardId}/elements/${op.id}`, { patch: op.after })
          .catch(console.error);
      }
    }
  }, [boardId, updateHistoryState]);

  const handleRedo = useCallback(() => {
    const entry = historyManagerRef.current.redo();
    if (!entry) return;
    updateHistoryState();

    for (const op of entry.ops) {
      if (op.t === "create") {
        setElements((prev) => [...prev.filter((e) => e.id !== op.el.id), op.el]);
        api
          .post(`/whiteboards/${boardId}/elements`, {
            id: op.el.id,
            type: op.el.type,
            data: op.el.data,
            z: op.el.z,
          })
          .catch(console.error);
      } else if (op.t === "delete") {
        setElements((prev) => prev.filter((e) => e.id !== op.el.id));
        api
          .delete(`/whiteboards/${boardId}/elements/${op.el.id}`)
          .catch(console.error);
      } else if (op.t === "update") {
        setElements((prev) =>
          prev.map((e) =>
            e.id === op.id ? { ...e, data: { ...e.data, ...op.after } } : e
          )
        );
        api
          .patch(`/whiteboards/${boardId}/elements/${op.id}`, { patch: op.after })
          .catch(console.error);
      }
    }
  }, [boardId, updateHistoryState]);

  // ---------- GLOBAL KEYBOARD SHORTCUTS (SECTION 11) ---------- //
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if focus is in an input or textarea
      if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) {
        return;
      }

      // Ctrl / Cmd combinations
      if (e.ctrlKey || e.metaKey) {
        const k = e.key.toLowerCase();
        if (k === "z") {
          e.preventDefault();
          if (e.shiftKey) handleRedo();
          else handleUndo();
          return;
        }
        if (k === "y") {
          e.preventDefault();
          handleRedo();
          return;
        }
        if (k === "a") {
          e.preventDefault();
          setSelectedIds(new Set(elements.map((el) => el.id)));
          return;
        }
        if (k === "d") {
          e.preventDefault();
          handleDuplicateSelected();
          return;
        }
        if (k === "0") {
          e.preventDefault();
          setCamera({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            zoom: 1,
          });
          return;
        }
        if (k === "=" || k === "+") {
          e.preventDefault();
          const screenCenter = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
          setCamera((prev) =>
            zoomAtScreenPoint(screenCenter, clampZoom(prev.zoom * 1.2), prev)
          );
          return;
        }
        if (k === "-") {
          e.preventDefault();
          const screenCenter = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
          setCamera((prev) =>
            zoomAtScreenPoint(screenCenter, clampZoom(prev.zoom / 1.2), prev)
          );
          return;
        }
        return; // Don't trigger letter tools if Ctrl/Meta is held!
      }

      // Shift + 1 => Zoom to fit all
      if (e.shiftKey && e.key === "!") {
        e.preventDefault();
        const union = unionBounds(elements.map(getBounds));
        if (union) {
          const fit = zoomToFit(union, {
            w: window.innerWidth,
            h: window.innerHeight,
          });
          setCamera(fit);
        }
        return;
      }

      // Delete / Backspace
      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        handleDeleteElements(Array.from(selectedIds));
        return;
      }

      // Escape => cancel edit / clear selection
      if (e.key === "Escape") {
        e.preventDefault();
        setEditingId(null);
        setSelectedIds(new Set());
        setActiveTool("select");
        return;
      }

      // Enter => edit selected
      if (e.key === "Enter" && selectedIds.size === 1) {
        const id = Array.from(selectedIds)[0];
        setEditingId(id);
        return;
      }

      // Pure single letter tool shortcuts (NO Ctrl / Meta / Alt)
      if (!e.altKey) {
        switch (e.key.toLowerCase()) {
          case "v":
            setActiveTool("select");
            break;
          case "h":
            setActiveTool("hand");
            break;
          case "p":
            setActiveTool("draw");
            break;
          case "s":
            setActiveTool("sticky");
            break;
          case "r":
            setActiveTool("rect");
            break;
          case "o":
            setActiveTool("ellipse");
            break;
          case "d":
            setActiveTool("diamond");
            break;
          case "a":
            setActiveTool("arrow");
            break;
          case "l":
            setActiveTool("line");
            break;
          case "t":
            setActiveTool("text");
            break;
          case "b":
            setActiveTool("bullet");
            break;
          case "c":
            setActiveTool("chart");
            break;
          case "e":
            setActiveTool("eraser");
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    elements,
    handleDeleteElements,
    handleDuplicateSelected,
    handleRedo,
    handleUndo,
    selectedIds,
  ]);

  // Navbar zoom buttons (zoom centered on canvas center)
  const handleZoomChange = (newZoom) => {
    const screenCenter = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    setCamera((prev) =>
      zoomAtScreenPoint(screenCenter, clampZoom(newZoom), prev)
    );
  };

  const handleResetZoom = () => {
    setCamera({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      zoom: 1,
    });
  };

  if (isLoading) {
    return <LoadingSpinner label="Opening collaborative canvas..." />;
  }

  if (error || !board) {
    return (
      <div className="app-shell board-state-center">
        <div className="card-simple board-error-card">
          <div className="board-error-icon">
            <AlertCircle size={28} />
          </div>
          <h2 className="board-error-title">Cannot open whiteboard</h2>
          <p className="board-error-desc">{error || "Whiteboard not found."}</p>
          <button
            type="button"
            className="btn btn-secondary btn-sm board-error-btn"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft size={16} />
            <span>Return to Dashboard</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="app-shell board-page-shell"
      style={{ display: "flex", flexDirection: "column" }}
    >
      <BoardNavbar
        board={board}
        isConnected={isConnected}
        collaborators={collaborators}
      />

      <div
        style={{
          flex: 1,
          width: "100%",
          height: "calc(100vh - 56px)",
          position: "relative",
        }}
      >
        <ExcalidrawCanvas
          initialElements={elements}
          initialFiles={files}
          theme="light"
          onChange={handleExcalidrawChange}
          onApiReady={(api) => {
            excalidrawApiRef.current = api;
          }}
          onPointerUpdate={(payload) => {
            if (payload?.pointer) {
              sendCursor?.({ x: payload.pointer.x, y: payload.pointer.y });
            }
          }}
        />
      </div>
    </div>
  );
};

export default BoardPage;
