import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import { ThemeProvider } from "./ThemeContext";

import App from "./App.tsx";

// Lazy load route components for code splitting
const DemoAll = lazy(() => import("./pages-demo/DemoAll.tsx"));
const BuildColorWheel = lazy(() => import("./pages-build/BuildColorWheel.tsx"));
const BuildColorPalette = lazy(
  () => import("./pages-build/BuildColorPalette.tsx"),
);
const DemoPaletteGenerator = lazy(
  () => import("./pages-build/BuildPaletteGenerator.tsx"),
);
const BuildColorFromImage = lazy(
  () => import("./pages-build/BuildColorFromImage.tsx"),
);
const ColorPalettes = lazy(() => import("./pages-help/ColorPalettes.tsx"));
const ColorRule6030 = lazy(() => import("./pages-help/60-30-10.tsx"));
const ColorFromImageHelp = lazy(
  () => import("./pages-help/ColorFromImageHelp.tsx"),
);
const RadiumHelp = lazy(() => import("./pages-help/RadiumHelp.tsx"));

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <Suspense
          fallback={
            <div style={{ padding: "20px", textAlign: "center" }}>
              Loading...
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/demo-all" element={<DemoAll />} />
            <Route path="/build-color-wheel" element={<BuildColorWheel />} />
            <Route
              path="/build-color-palette"
              element={<BuildColorPalette />}
            />
            <Route
              path="/build-palette-generator"
              element={<DemoPaletteGenerator />}
            />
            <Route
              path="/build-color-from-image"
              element={<BuildColorFromImage />}
            />
            <Route path="/color-palettes" element={<ColorPalettes />} />
            <Route path="/60-30-10" element={<ColorRule6030 />} />
            <Route
              path="/color-from-image-help"
              element={<ColorFromImageHelp />}
            />
            <Route path="/radium-help" element={<RadiumHelp />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
);
