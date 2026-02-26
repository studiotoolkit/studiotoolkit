import React, { useState } from 'react';
import { ColorWheel, type PaletteOutput } from '@studiotoolkit/color-wheel';
import '@studiotoolkit/color-wheel/src/ColorWheel.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './BuildColorWheel.css';

type HarmonyMode =
  | 'complementary'
  | 'analogous'
  | 'monochromatic'
  | 'split'
  | 'triadic'
  | 'square'
  | 'simple';

type DotPosition = 'center' | 'inner' | 'outer';

export default function BuildColorWheel() {
  // Default values for reset
  const DEFAULT_VALUES = {
    harmonyMode: 'split' as HarmonyMode,
    saturation: 100,
    brightness: 50,
    circleRadius: 1,
    width: 100,
    height: 100,
    wheelThickness: 80,
    dotSize: 5,
    dotPosition: 'outer' as DotPosition,
    handleThickness: 2,
    handleColor: '#000000',
    harmonyPolygon: false,
    polygonColor: '#000000',
    polygonThickness: 1,
    centerDot: '#ffffff',
    showCenterDot: false,
    borderColor: '#ffffff',
    canvasBackgroundColor: 'transparent',
  };

  const [palette, setPalette] = useState<PaletteOutput | null>(null);
  const [codeText, setCodeText] = useState('');
  const isManualEdit = React.useRef(false);

  // Configuration state (all defaults set to match provided <ColorWheel ... />)
  const [harmonyMode, setHarmonyMode] = useState<HarmonyMode>(DEFAULT_VALUES.harmonyMode);
  const [saturation, setSaturation] = useState(DEFAULT_VALUES.saturation);
  const [brightness, setBrightness] = useState(DEFAULT_VALUES.brightness);
  const [circleRadius, setCircleRadius] = useState(DEFAULT_VALUES.circleRadius);
  const [width, setWidth] = useState(DEFAULT_VALUES.width);
  const [height, setHeight] = useState(DEFAULT_VALUES.height);
  const [wheelThickness, setWheelThickness] = useState(DEFAULT_VALUES.wheelThickness);
  const [dotSize, setDotSize] = useState(DEFAULT_VALUES.dotSize);
  const [dotPosition, setDotPosition] = useState<DotPosition>(DEFAULT_VALUES.dotPosition);
  const [handleThickness, setHandleThickness] = useState(DEFAULT_VALUES.handleThickness);
  const [handleColor, setHandleColor] = useState(DEFAULT_VALUES.handleColor);
  const [harmonyPolygon, setHarmonyPolygon] = useState(DEFAULT_VALUES.harmonyPolygon);
  const [polygonColor, setPolygonColor] = useState(DEFAULT_VALUES.polygonColor);
  const [polygonThickness, setPolygonThickness] = useState(DEFAULT_VALUES.polygonThickness);
  const [centerDot, setCenterDot] = useState(DEFAULT_VALUES.centerDot);
  const [showCenterDot, setShowCenterDot] = useState(DEFAULT_VALUES.showCenterDot);
  const [borderColor, setBorderColor] = useState(DEFAULT_VALUES.borderColor);
  const [canvasBackgroundColor, setCanvasBackgroundColor] = useState(
    DEFAULT_VALUES.canvasBackgroundColor
  );

  const handleColorsChange = (palette: PaletteOutput) => {
    setPalette(palette);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const code = e.target.value;
    isManualEdit.current = true;
    setCodeText(code);

    // Debounce the parsing to avoid interfering with typing
    setTimeout(() => {
      const parseValue = (key: string) => {
        const match = code.match(new RegExp(`${key}=\\{?([^}\\s/>]+)\\}?`));
        return match ? match[1].replace(/["{}]/g, '') : null;
      };

      const newHarmonyMode = parseValue('harmonyMode');
      if (newHarmonyMode) setHarmonyMode(newHarmonyMode as HarmonyMode);

      const newSaturation = parseValue('saturation');
      if (newSaturation) setSaturation(Number(newSaturation));

      const newBrightness = parseValue('brightness');
      if (newBrightness) setBrightness(Number(newBrightness));

      const newCircleRadius = parseValue('circleRadius');
      if (newCircleRadius) setCircleRadius(Number(newCircleRadius));

      const newWidth = parseValue('width');
      if (newWidth) setWidth(Number(newWidth));

      const newHeight = parseValue('height');
      if (newHeight) setHeight(Number(newHeight));

      const newWheelThickness = parseValue('wheelThickness');
      if (newWheelThickness) setWheelThickness(Number(newWheelThickness));

      const newDotSize = parseValue('dotSize');
      if (newDotSize) setDotSize(Number(newDotSize));

      const newDotPosition = parseValue('dotPosition');
      if (newDotPosition) setDotPosition(newDotPosition as DotPosition);

      const newHandleThickness = parseValue('handleThickness');
      if (newHandleThickness) setHandleThickness(Number(newHandleThickness));

      const newHandleColor = parseValue('handleColor');
      if (newHandleColor) setHandleColor(newHandleColor);

      const newHarmonyPolygon = parseValue('harmonyPolygon');
      if (newHarmonyPolygon) setHarmonyPolygon(newHarmonyPolygon === 'true');

      const newPolygonColor = parseValue('polygonColor');
      if (newPolygonColor) setPolygonColor(newPolygonColor);

      const newPolygonThickness = parseValue('polygonThickness');
      if (newPolygonThickness) setPolygonThickness(Number(newPolygonThickness));

      const newCenterDot = parseValue('centerDot');
      if (newCenterDot) setCenterDot(newCenterDot);

      const newShowCenterDot = parseValue('showCenterDot');
      if (newShowCenterDot) setShowCenterDot(newShowCenterDot === 'true');

      const newBorderColor = parseValue('borderColor');
      if (newBorderColor) setBorderColor(newBorderColor);

      const newCanvasBackgroundColor = parseValue('canvasBackgroundColor');
      if (newCanvasBackgroundColor) setCanvasBackgroundColor(newCanvasBackgroundColor);

      isManualEdit.current = false;
    }, 500);
  };

  const generateCode = () => {
    return `<ColorWheel
  onColorsChange={handleColorsChange}
  harmonyMode="${harmonyMode}"
  saturation={${saturation}}
  brightness={${brightness}}
  circleRadius={${circleRadius}}
  width={${width}}
  height={${height}}
  wheelThickness={${wheelThickness}}
  dotSize={${dotSize}}
  dotPosition="${dotPosition}"
  handleThickness={${handleThickness}}
  handleColor="${handleColor}"
  harmonyPolygon={${harmonyPolygon}}
  polygonColor="${polygonColor}"
  polygonThickness={${polygonThickness}}
  centerDot="${centerDot}"
  showCenterDot={${showCenterDot}}
  borderColor="${borderColor}"
  canvasBackgroundColor="${canvasBackgroundColor}"
/>`;
  };

  // Update code text when settings change via UI
  React.useEffect(() => {
    if (isManualEdit.current) {
      return; // Skip update if user is manually editing
    }
    const code = `<ColorWheel
  onColorsChange={handleColorsChange}
  harmonyMode="${harmonyMode}"
  saturation={${saturation}}
  brightness={${brightness}}
  circleRadius={${circleRadius}}
  width={${width}}
  height={${height}}
  wheelThickness={${wheelThickness}}
  dotSize={${dotSize}}
  dotPosition="${dotPosition}"
  handleThickness={${handleThickness}}
  handleColor="${handleColor}"
  harmonyPolygon={${harmonyPolygon}}
  polygonColor="${polygonColor}"
  polygonThickness={${polygonThickness}}
  centerDot="${centerDot}"
  showCenterDot={${showCenterDot}}
  borderColor="${borderColor}"
  canvasBackgroundColor="${canvasBackgroundColor}"
/>`;
    setCodeText(code);
  }, [
    harmonyMode,
    saturation,
    brightness,
    circleRadius,
    width,
    height,
    wheelThickness,
    dotSize,
    dotPosition,
    handleThickness,
    handleColor,
    harmonyPolygon,
    polygonColor,
    polygonThickness,
    centerDot,
    showCenterDot,
    borderColor,
    canvasBackgroundColor,
  ]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generateCode());
      alert('Copied to clipboard!');
    } catch {
      alert('Failed to copy to clipboard');
    }
  };

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(formatColorsJSON());
    } catch {
      // Silent fail
    }
  };

  const handleReset = () => {
    setHarmonyMode(DEFAULT_VALUES.harmonyMode);
    setSaturation(DEFAULT_VALUES.saturation);
    setBrightness(DEFAULT_VALUES.brightness);
    setCircleRadius(DEFAULT_VALUES.circleRadius);
    setWidth(DEFAULT_VALUES.width);
    setHeight(DEFAULT_VALUES.height);
    setWheelThickness(DEFAULT_VALUES.wheelThickness);
    setDotSize(DEFAULT_VALUES.dotSize);
    setDotPosition(DEFAULT_VALUES.dotPosition);
    setHandleThickness(DEFAULT_VALUES.handleThickness);
    setHandleColor(DEFAULT_VALUES.handleColor);
    setHarmonyPolygon(DEFAULT_VALUES.harmonyPolygon);
    setPolygonColor(DEFAULT_VALUES.polygonColor);
    setPolygonThickness(DEFAULT_VALUES.polygonThickness);
    setCenterDot(DEFAULT_VALUES.centerDot);
    setShowCenterDot(DEFAULT_VALUES.showCenterDot);
    setBorderColor(DEFAULT_VALUES.borderColor);
    setCanvasBackgroundColor(DEFAULT_VALUES.canvasBackgroundColor);
  };

  const formatColorsJSON = () => {
    if (!palette) return '{}';
    return JSON.stringify(palette, null, 2);
  };

  return (
    <div className="build-color-wheel-page">
      <Header />
      <div className="build-color-wheel-container">
        <h4 className="page-title">
          Build <span>{'<ColorWheel />'}</span>
        </h4>

        <div className="build-layout">
          {/* Column 1 - Basic Configuration */}
          <div className="config-panel">
            <div className="panel-header">
              <h2>Settings</h2>
              <button onClick={handleReset} className="reset-button">
                Reset
              </button>
            </div>

            <label>
              <span className="label-text">Harmony Mode</span>
              <select
                value={harmonyMode}
                onChange={(e) => setHarmonyMode(e.target.value as HarmonyMode)}
              >
                <option value="complementary">Complementary</option>
                <option value="analogous">Analogous</option>
                <option value="monochromatic">Monochromatic</option>
                <option value="split">Split Complementary</option>
                <option value="triadic">Triadic</option>
                <option value="square">Square</option>
                <option value="simple">Simple</option>
              </select>
            </label>

            <label>
              <span className="label-text">Saturation:</span>
              <input
                type="number"
                min="0"
                max="100"
                value={saturation}
                onChange={(e) => setSaturation(+e.target.value)}
              />
            </label>

            <label>
              <span className="label-text">Brightness:</span>
              <input
                type="number"
                min="0"
                max="100"
                value={brightness}
                onChange={(e) => setBrightness(+e.target.value)}
              />
            </label>

            <label>
              <span className="label-text">Circle Radius:</span>
              <input
                type="number"
                min="1"
                max="180"
                value={circleRadius}
                onChange={(e) => setCircleRadius(+e.target.value)}
              />
            </label>

            <label>
              <span className="label-text">Width:</span>
              <input
                type="number"
                min="50"
                max="800"
                value={width}
                onChange={(e) => setWidth(+e.target.value)}
              />
            </label>

            <label>
              <span className="label-text">Height:</span>
              <input
                type="number"
                min="50"
                max="800"
                value={height}
                onChange={(e) => setHeight(+e.target.value)}
              />
            </label>

            <label>
              <span className="label-text">Wheel Thickness:</span>
              <input
                type="number"
                min="5"
                max="150"
                value={wheelThickness}
                onChange={(e) => setWheelThickness(+e.target.value)}
              />
            </label>

            <label>
              <span className="label-text">Dot Size:</span>
              <input
                type="number"
                min="4"
                max="25"
                value={dotSize}
                onChange={(e) => setDotSize(+e.target.value)}
              />
            </label>

            <label>
              <span className="label-text">Dot Position</span>
              <select
                value={dotPosition}
                onChange={(e) => setDotPosition(e.target.value as DotPosition)}
              >
                <option value="center">Center</option>
                <option value="inner">Inner Edge</option>
                <option value="outer">Outer Edge</option>
              </select>
            </label>
          </div>

          {/* Column 2 - Advanced Configuration */}
          <div className="config-panel">
            <label>
              <span className="label-text">Handle Thickness:</span>
              <input
                type="number"
                min="1"
                max="15"
                value={handleThickness}
                onChange={(e) => setHandleThickness(+e.target.value)}
              />
            </label>

            <label className="color-label">
              Handle Color
              <input
                type="color"
                value={handleColor}
                onChange={(e) => setHandleColor(e.target.value)}
              />
            </label>

            <label>
              <span className="label-text">Show Harmony Polygon</span>
              <input
                type="checkbox"
                checked={harmonyPolygon}
                onChange={(e) => setHarmonyPolygon(e.target.checked)}
              />
            </label>

            <label className="color-label">
              Polygon Color
              <input
                type="color"
                value={polygonColor}
                onChange={(e) => setPolygonColor(e.target.value)}
              />
            </label>

            <label>
              <span className="label-text">Polygon Thickness:</span>
              <input
                type="number"
                min="1"
                max="10"
                value={polygonThickness}
                onChange={(e) => setPolygonThickness(+e.target.value)}
              />
            </label>

            <label className="color-label">
              Center Dot Color
              <input
                type="color"
                value={centerDot}
                onChange={(e) => setCenterDot(e.target.value)}
              />
            </label>

            <label>
              <span className="label-text">Center Dot Display</span>
              <input
                type="checkbox"
                checked={showCenterDot}
                onChange={(e) => setShowCenterDot(e.target.checked)}
              />
            </label>

            <label className="color-label">
              Border Color
              <input
                type="color"
                value={borderColor}
                onChange={(e) => setBorderColor(e.target.value)}
              />
            </label>

            <label className="color-label">
              Canvas Background
              <input
                type="color"
                value={canvasBackgroundColor}
                onChange={(e) => setCanvasBackgroundColor(e.target.value)}
              />
            </label>
          </div>

          {/* Column 3 - Preview & JSON Values */}
          <div className="preview-panel">
            <div className="preview-section">
              <h2>Preview</h2>
              <ColorWheel
                onColorsChange={handleColorsChange}
                harmonyMode={harmonyMode}
                saturation={saturation}
                brightness={brightness}
                circleRadius={circleRadius}
                width={width}
                height={height}
                wheelThickness={wheelThickness}
                dotSize={dotSize}
                dotPosition={dotPosition}
                handleThickness={handleThickness}
                handleColor={handleColor}
                harmonyPolygon={harmonyPolygon}
                polygonColor={polygonColor}
                polygonThickness={polygonThickness}
                centerDot={centerDot}
                showCenterDot={showCenterDot}
                borderColor={borderColor}
                canvasBackgroundColor={canvasBackgroundColor}
              />
            </div>
            <div className="json-values-section">
              <div className="json-header">
                <h4>Output</h4>
                <button onClick={handleCopyJson} className="copy-json-button">
                  Copy
                </button>
              </div>
              <textarea readOnly value={formatColorsJSON()} />
            </div>
          </div>

          {/* Column 4 - Generated Code */}
          <div className="generated-code-panel">
            <div className="code-header">
              <h2>Generated Code</h2>
              <div className="button-group">
                <button onClick={handleCopy}>Copy</button>
              </div>
            </div>
            <textarea
              value={codeText}
              onChange={handleCodeChange}
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
            />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
