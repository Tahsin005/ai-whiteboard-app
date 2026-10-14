import React, { useState, useEffect, useRef } from "react";
import { Excalidraw, MainMenu, WelcomeScreen } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";

/**
 * Excalidraw Canvas wrapper component
 */
export function ExcalidrawCanvas({
  initialElements = [],
  initialAppState = {},
  initialFiles = {},
  onChange,
  onPointerUpdate,
  theme = "light",
  onApiReady,
}) {
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);
  const hasInitializedRef = useRef(false);
  const loadedFileIdsRef = useRef(new Set());

  const handleApi = (api) => {
    setExcalidrawAPI(api);
    onApiReady?.(api);
  };

  useEffect(() => {
    if (!excalidrawAPI) return;

    // Add any files to Excalidraw's file cache
    if (initialFiles && typeof initialFiles === "object") {
      const fileList = Object.values(initialFiles).filter(
        (f) => f && f.id && !loadedFileIdsRef.current.has(f.id)
      );
      if (fileList.length > 0) {
        fileList.forEach((f) => loadedFileIdsRef.current.add(f.id));
        excalidrawAPI.addFiles(fileList);
      }
    }

    if (initialElements.length > 0 && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      excalidrawAPI.updateScene({
        elements: initialElements,
      });
      excalidrawAPI.scrollToContent();
    }
  }, [excalidrawAPI, initialElements, initialFiles]);

  return (
    <div
      className="excalidraw-wrapper"
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Excalidraw
        excalidrawAPI={handleApi}
        initialData={{
          elements: initialElements,
          files: initialFiles,
          appState: {
            viewBackgroundColor: "#ffffff",
            currentItemFontFamily: 1,
            ...initialAppState,
          },
        }}
        renderTopRightUI={() => null}
        theme={theme}
        onChange={onChange}
        onPointerUpdate={onPointerUpdate}
        UIOptions={{
          canvasActions: {
            loadScene: false,
            saveToActiveFile: false,
            theme: true,
            saveAsImage: true,
          },
        }}
      >
        <WelcomeScreen>
          <WelcomeScreen.Hints.ToolbarHint />
          <WelcomeScreen.Hints.MenuHint />
          <WelcomeScreen.Hints.HelpHint />
        </WelcomeScreen>
        <MainMenu>
          <MainMenu.DefaultItems.SaveAsImage />
          <MainMenu.DefaultItems.Export />
          <MainMenu.DefaultItems.ClearCanvas />
          <MainMenu.DefaultItems.ToggleTheme />
          <MainMenu.DefaultItems.ChangeCanvasBackground />
        </MainMenu>
      </Excalidraw>
    </div>
  );
}

export default ExcalidrawCanvas;
