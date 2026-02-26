import { useState, useRef } from 'react';
import { ColorWheel, type PaletteOutput } from '@studiotoolkit/color-wheel';
import '@studiotoolkit/color-wheel/src/ColorWheel.css';
import { ColorFromImage, type ColorEntry } from '@studiotoolkit/color-from-image';
import '@studiotoolkit/color-from-image/src/ColorFromImage.css';
import { ColorPalette } from '@studiotoolkit/color-palette';
import '@studiotoolkit/color-palette/src/ColorPalette.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {
  generateHarmonyPalettes,
  generatePerceptualPalettes,
  generateContrastPalettes,
  generateDataVisuals,
  generateAlgorithmic,
  generateImagePalettes,
  generateRadiumColors,
  select60_30_10,
} from '@studiotoolkit/color-palette-generator';
import './DemoAll.css';

type HarmonyMode =
  | 'complementary'
  | 'analogous'
  | 'monochromatic'
  | 'split'
  | 'triadic'
  | 'square'
  | 'simple';

export default function DemoAll() {
  const [paletteData, setPaletteData] = useState<PaletteOutput | null>(null);
  const [generatedPalettes, setGeneratedPalettes] = useState<PaletteOutput | null>(null);
  const [imageColors, setImageColors] = useState<ColorEntry | null>(null);
  const [activeSource, setActiveSource] = useState<'colorWheel' | 'image' | null>(null);
  const [count, setCount] = useState(16);
  const [harmonyMode, setHarmonyMode] = useState<HarmonyMode>('split');
  const [useRadium, setUseRadium] = useState(false);
  const [saturation1, setSaturation1] = useState(50);
  const [brightness1, setBrightness1] = useState(50);
  const [saturation2, setSaturation2] = useState(50);
  const [brightness2, setBrightness2] = useState(50);
  const [selectedGenerator, setSelectedGenerator] = useState<string>('');
  const [parts, setParts] = useState<1 | 2 | 3>(1);

  // Tracks whether the user has physically interacted with the wheel (click/drag).
  // ColorWheel fires onColorsChange on every render, so we must NOT switch
  // activeSource to 'colorWheel' on passive re-renders — only on real interaction.
  const wheelInteracting = useRef(false);

  const handleColorsChange = (palette: PaletteOutput) => {
    console.log('Palette updated:', palette);
    setPaletteData(palette);
    if (wheelInteracting.current) {
      setActiveSource('colorWheel');
    }
  };

  const handleCopyColorWheel = () => {
    if (paletteData) {
      navigator.clipboard.writeText(JSON.stringify(paletteData, null, 2));
    }
  };

  const handleCopyImageColors = () => {
    if (imageColors) {
      navigator.clipboard.writeText(JSON.stringify(imageColors, null, 2));
    }
  };

  const handleCopyGenerated = () => {
    if (generatedPalettes) {
      navigator.clipboard.writeText(JSON.stringify(generatedPalettes, null, 2));
    }
  };

  const handleGenerateHarmony = () => {
    const activeInput = (paletteData ?? imageColors) as {
      [key: string]: string[];
    } | null;
    if (activeInput) {
      const palettes = generateHarmonyPalettes(activeInput, count);
      setGeneratedPalettes(palettes);
      setSelectedGenerator('Harmony (11)');
    }
  };

  const handleGeneratePerceptual = () => {
    const activeInput = (paletteData ?? imageColors) as {
      [key: string]: string[];
    } | null;
    if (activeInput) {
      const palettes = generatePerceptualPalettes(activeInput, count);
      setGeneratedPalettes(palettes);
      setSelectedGenerator('Perceptual (10)');
    }
  };

  const handleGenerateContrast = () => {
    const activeInput = (paletteData ?? imageColors) as {
      [key: string]: string[];
    } | null;
    if (activeInput) {
      const palettes = generateContrastPalettes(activeInput, count);
      setGeneratedPalettes(palettes);
      setSelectedGenerator('Contrast (7)');
    }
  };

  const handleGenerateDataVisuals = () => {
    const activeInput = (paletteData ?? imageColors) as {
      [key: string]: string[];
    } | null;
    if (activeInput) {
      const colors = Object.values(activeInput).find((v) => Array.isArray(v) && v.length > 0) as
        | string[]
        | undefined;
      if (colors) {
        setGeneratedPalettes(
          generateDataVisuals({ square: colors }, count) as unknown as {
            [key: string]: string[];
          }
        );
        setSelectedGenerator('Data Visuals (7)');
      }
    }
  };

  const handleGenerateAlgorithmic = () => {
    const activeInput = (paletteData ?? imageColors) as {
      [key: string]: string[];
    } | null;
    if (activeInput) {
      const colors = Object.values(activeInput).find((v) => Array.isArray(v) && v.length > 0) as
        | string[]
        | undefined;
      if (colors) {
        setGeneratedPalettes(
          generateAlgorithmic({ square: colors }, count) as unknown as {
            [key: string]: string[];
          }
        );
        setSelectedGenerator('Algorithmic (11)');
      }
    }
  };

  const handleGenerateImage = () => {
    const activeInput = (paletteData ?? imageColors) as {
      [key: string]: string[];
    } | null;
    if (activeInput) {
      const colors = Object.values(activeInput).find((v) => Array.isArray(v) && v.length > 0) as
        | string[]
        | undefined;
      if (colors) {
        setGeneratedPalettes(
          generateImagePalettes({ square: colors }, count) as unknown as {
            [key: string]: string[];
          }
        );
        setSelectedGenerator('Image (10)');
      }
    }
  };

  const handleGenerate60_30_10 = () => {
    const activeInput = (paletteData ?? imageColors) as {
      [key: string]: string[];
    } | null;
    if (activeInput) {
      const colors = Object.values(activeInput).find((v) => Array.isArray(v) && v.length > 0) as
        | string[]
        | undefined;
      if (colors) {
        const result = select60_30_10(colors);
        setGeneratedPalettes({
          neutralLight: [result.neutralLight.hex],
          neutralDark: [result.neutralDark.hex],
          mainColor: [result.mainColor.hex],
          mainColorShade: [result.mainColorShade.hex],
          accentColor: [result.accentColor.hex],
        });
        setSelectedGenerator('60-30-10 Design');
      }
    }
  };

  // Compute display palette - apply Radium if enabled
  const displayPalette =
    useRadium && generatedPalettes ? generateRadiumColors(generatedPalettes) : generatedPalettes;

  return (
    <div className="demo-all-page">
      <Header />
      <main className="demo-all-content">
        <div className="demo-all-grid">
          {/* Group 1: ColorWheel + Output */}
          <div className="demo-all-group demo-all-group-color-wheel">
            <div className="demo-all-column">
              <h3>Color Wheel</h3>
              <label className="demo-all-harmony-label">
                <span>Mode:</span>
                <select
                  className="demo-all-harmony-select"
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
              <div
                onMouseDown={() => {
                  wheelInteracting.current = true;
                }}
                onMouseUp={() => {
                  wheelInteracting.current = false;
                }}
                onMouseLeave={() => {
                  wheelInteracting.current = false;
                }}
                onClick={() => {
                  wheelInteracting.current = true;
                }}
                style={{ display: 'contents' }}
              >
                <ColorWheel
                  onColorsChange={handleColorsChange}
                  harmonyMode={harmonyMode}
                  saturation={100}
                  brightness={50}
                  circleRadius={1}
                  width={100}
                  height={100}
                  wheelThickness={80}
                  dotSize={5}
                  dotPosition="outer"
                  handleThickness={2}
                  handleColor="#000000"
                  harmonyPolygon={false}
                  polygonColor="#000000"
                  polygonThickness={1}
                  centerDot="#ffffff"
                  showCenterDot={false}
                  borderColor="#ffffff"
                  canvasBackgroundColor="transparent"
                />
              </div>
            </div>
          </div>

          {/* Group 1b: Load Image */}
          <div className="demo-all-group demo-all-group-color-from-image">
            <div className="demo-all-column">
              <h3>Color from Image</h3>
              <ColorFromImage
                width={200}
                height={200}
                borderColor="#cccccc"
                borderThickness={1}
                onColorsExtracted={(c) => {
                  console.log('Colors extracted from image:', c);
                  setImageColors(c);
                  setActiveSource('image');
                }}
              />
            </div>
          </div>

          {/* Group 2: Generate buttons + Generated Palette */}
          <div className="demo-all-group demo-all-group-palette-generator">
            <div className="demo-all-column">
              <h3>Palette Generator</h3>
              <label className="demo-all-count-label">
                Count:
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="demo-all-count-input"
                />
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', width: '100%' }}>
                <button
                  className="demo-all-button"
                  onClick={handleGenerateHarmony}
                  disabled={!paletteData && (!imageColors || imageColors.palette.length === 0)}
                >
                  Harmony (11)
                </button>
                <button
                  className="demo-all-button"
                  onClick={handleGeneratePerceptual}
                  disabled={!paletteData && (!imageColors || imageColors.palette.length === 0)}
                >
                  Perceptual (10)
                </button>
                <button
                  className="demo-all-button"
                  onClick={handleGenerateContrast}
                  disabled={!paletteData && (!imageColors || imageColors.palette.length === 0)}
                >
                  Contrast (7)
                </button>
                <button
                  className="demo-all-button"
                  onClick={handleGenerateDataVisuals}
                  disabled={!paletteData && (!imageColors || imageColors.palette.length === 0)}
                >
                  Data Visuals (7)
                </button>
                <button
                  className="demo-all-button"
                  onClick={handleGenerateAlgorithmic}
                  disabled={!paletteData && (!imageColors || imageColors.palette.length === 0)}
                >
                  Algorithmic (11)
                </button>
                <button
                  className="demo-all-button"
                  onClick={handleGenerateImage}
                  disabled={!paletteData && (!imageColors || imageColors.palette.length === 0)}
                >
                  Image (10)
                </button>

                <button
                  className="demo-all-button"
                  onClick={handleGenerate60_30_10}
                  disabled={!paletteData && (!imageColors || imageColors.palette.length === 0)}
                >
                  60-30-10 Design
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Data Panel */}
        <div
          className="demo-all-group demo-all-group-data-panel"
          style={{ marginTop: '10px', borderColor: '#ff9800', padding: '8px 12px 12px 12px' }}
        >
          <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
            {/* Column 1: Input */}
            <div style={{ flex: '1 1 50%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div className="demo-all-output-header">
                <h4>
                  Input{' '}
                  {activeSource && `(${activeSource === 'colorWheel' ? 'Color Wheel' : 'Image'})`}
                </h4>
                <button
                  className="demo-all-copy-button"
                  onClick={
                    activeSource === 'colorWheel' ? handleCopyColorWheel : handleCopyImageColors
                  }
                  disabled={!paletteData && !imageColors}
                >
                  Copy
                </button>
              </div>
              <textarea
                className="demo-all-textarea-generated"
                style={{ height: '150px', minHeight: '150px', borderColor: '#2196f3' }}
                value={
                  activeSource === 'colorWheel' && paletteData
                    ? JSON.stringify(paletteData, null, 2)
                    : activeSource === 'image' && imageColors
                      ? JSON.stringify(imageColors, null, 2)
                      : ''
                }
                placeholder="Use Color Wheel or load an image"
                readOnly
              />
            </div>

            {/* Column 2: Output */}
            <div style={{ flex: '1 1 50%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div className="demo-all-output-header">
                <h4>Output {selectedGenerator && `- ${selectedGenerator}`}</h4>
                <button
                  className="demo-all-copy-button"
                  onClick={handleCopyGenerated}
                  disabled={!generatedPalettes}
                >
                  Copy
                </button>
              </div>
              <textarea
                className="demo-all-textarea-generated"
                style={{ height: '150px', minHeight: '150px', borderColor: '#168b09' }}
                value={generatedPalettes ? JSON.stringify(generatedPalettes, null, 2) : ''}
                placeholder="Click a generator button to create palettes"
                readOnly
              />
            </div>
          </div>
        </div>

        {/* ColorPalette Display */}
        <div className="demo-all-group demo-all-group-color-palette" style={{ marginTop: '10px' }}>
          {/* ColorPalette Controls Panel */}
          <div
            className="demo-all-controls-panel"
            style={{
              display: 'grid',
              gridTemplateColumns: parts === 3 ? 'auto auto 1fr 1fr' : 'auto auto 1fr',
              gap: '15px',
              padding: '10px',
              border: '1px solid var(--border-color, #ddd)',
              borderRadius: '6px',
              marginBottom: '15px',
              alignItems: 'start',
            }}
          >
            {/* Column 1: Heading */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '14px', whiteSpace: 'nowrap' }}>
                Color Palette{selectedGenerator && ` - ${selectedGenerator}`}
              </h3>
            </div>

            {/* Column 2: Parts dropdown + Radium checkbox + Reset button */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                alignItems: 'flex-start',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                    fontSize: '12px',
                  }}
                >
                  <span>Parts:</span>
                  <select
                    value={parts}
                    onChange={(e) => setParts(Number(e.target.value) as 1 | 2 | 3)}
                    style={{
                      padding: '3px 6px',
                      fontSize: '12px',
                      borderRadius: '4px',
                      border: '1px solid var(--border-color, #ccc)',
                      background: 'var(--button-bg, white)',
                      cursor: 'pointer',
                    }}
                  >
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                  </select>
                </label>
                <button
                  onClick={() => {
                    setSaturation1(50);
                    setBrightness1(50);
                    setSaturation2(50);
                    setBrightness2(50);
                  }}
                  style={{
                    padding: '3px 10px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    border: '1px solid var(--border-color, #ccc)',
                    background: 'var(--button-bg, #f0f0f0)',
                    color: 'var(--text-color, #333)',
                  }}
                >
                  Reset
                </button>
              </div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  fontSize: '12px',
                }}
              >
                <span>Radium colors</span>
                <input
                  type="checkbox"
                  checked={useRadium}
                  onChange={(e) => setUseRadium(e.target.checked)}
                />
              </label>
            </div>

            {/* Column 3: Part 1 - Show only when parts >= 2 */}
            {parts >= 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <strong style={{ fontSize: '12px', marginBottom: '0' }}>Part 1 (Top)</strong>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11px',
                  }}
                >
                  <span style={{ minWidth: '60px' }}>Saturation:</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={saturation1}
                    onChange={(e) => setSaturation1(Number(e.target.value))}
                    style={{ flex: 1, minWidth: '70px' }}
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={saturation1}
                    onChange={(e) => setSaturation1(Number(e.target.value))}
                    style={{
                      width: '40px',
                      fontSize: '11px',
                      padding: '2px 3px',
                    }}
                  />
                </label>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11px',
                  }}
                >
                  <span style={{ minWidth: '60px' }}>Brightness:</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={brightness1}
                    onChange={(e) => setBrightness1(Number(e.target.value))}
                    style={{ flex: 1, minWidth: '70px' }}
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={brightness1}
                    onChange={(e) => setBrightness1(Number(e.target.value))}
                    style={{
                      width: '40px',
                      fontSize: '11px',
                      padding: '2px 3px',
                    }}
                  />
                </label>
              </div>
            )}

            {/* Column 4: Part 2 - Show only when parts === 3 */}
            {parts === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <strong style={{ fontSize: '12px', marginBottom: '0' }}>Part 2 (Middle)</strong>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11px',
                  }}
                >
                  <span style={{ minWidth: '60px' }}>Saturation:</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={saturation2}
                    onChange={(e) => setSaturation2(Number(e.target.value))}
                    style={{ flex: 1, minWidth: '70px' }}
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={saturation2}
                    onChange={(e) => setSaturation2(Number(e.target.value))}
                    style={{
                      width: '40px',
                      fontSize: '11px',
                      padding: '2px 3px',
                    }}
                  />
                </label>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11px',
                  }}
                >
                  <span style={{ minWidth: '60px' }}>Brightness:</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={brightness2}
                    onChange={(e) => setBrightness2(Number(e.target.value))}
                    style={{ flex: 1, minWidth: '70px' }}
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={brightness2}
                    onChange={(e) => setBrightness2(Number(e.target.value))}
                    style={{
                      width: '40px',
                      fontSize: '11px',
                      padding: '2px 3px',
                    }}
                  />
                </label>
              </div>
            )}
          </div>

          {/* Components */}

          <ColorPalette
            paletteData={displayPalette}
            showCopyButton={true}
            displayType="block"
            width={60}
            boxBorderSize={1}
            boxBorderColor="#ccc"
            displayTitle={true}
            fontColor="#333"
            fontSize={11}
            backgroundColor="transparent"
            parts={parts}
            saturation1={saturation1}
            brightness1={brightness1}
            saturation2={saturation2}
            brightness2={brightness2}
          />
        </div>
        <br />
        <br />
        <br />
      </main>
      <Footer />
    </div>
  );
}
