import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { ColorPalette } from '@studiotoolkit/color-palette';
import '@studiotoolkit/color-palette/src/ColorPalette.css';
import './BuildColorWheel.css';
import './BuildColorPalette.css';
import defaultJson from './BuildColorPalette.json';

const defaultJsonString = JSON.stringify(defaultJson, null, 2);

type DisplayType = 'square' | 'table' | 'circle' | 'triangle' | 'block';

function BuildColorPalette() {
  const [input, setInput] = useState(defaultJsonString);
  const [palettes, setPalettes] = useState(() => {
    try {
      return JSON.parse(defaultJsonString);
    } catch {
      return {};
    }
  });
  const [showCopyButton, setShowCopyButton] = useState(true);
  const [displayType, setDisplayType] = useState<DisplayType>('block');
  const [width, setWidth] = useState(60);
  const [boxBorderSize, setBoxBorderSize] = useState(1);
  const [boxBorderColor, setBoxBorderColor] = useState('#ccc');
  const [displayTitle, setDisplayTitle] = useState(true);
  const [fontColor, setFontColor] = useState('#333');
  const [fontSize, setFontSize] = useState(11);
  const [backgroundColor, setBackgroundColor] = useState('transparent');
  const [displayHexcode, setDisplayHexcode] = useState(true);
  const [parts, setParts] = useState<1 | 2 | 3>(3);
  const [saturation1, setSaturation1] = useState(100);
  const [brightness1, setBrightness1] = useState(50);
  const [saturation2, setSaturation2] = useState(100);
  const [brightness2, setBrightness2] = useState(50);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    try {
      const parsed = JSON.parse(e.target.value);
      setPalettes(parsed);
    } catch {
      setPalettes({});
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
      try {
        const parsed = JSON.parse(text);
        setPalettes(parsed);
      } catch {
        setPalettes({});
      }
    } catch {
      alert('Failed to read from clipboard');
    }
  };

  const handleCopyGeneratedCode = async () => {
    try {
      const code = `<ColorPalette
  paletteData={palettes}
  showCopyButton={${showCopyButton}}
  displayType="${displayType}"
  width={${width}}
  boxBorderSize={${boxBorderSize}}
  boxBorderColor="${boxBorderColor}"
  displayTitle={${displayTitle}}
  fontColor="${fontColor}"
  fontSize={${fontSize}}
  backgroundColor="${backgroundColor}"
  displayHexcode={${displayHexcode}}
  parts={${parts}}
  saturation1={${saturation1}}
  brightness1={${brightness1}}
  saturation2={${saturation2}}
  brightness2={${brightness2}}
/>`;
      await navigator.clipboard.writeText(code);
    } catch {
      // Silent fail
    }
  };

  return (
    <div className="build-page-wrapper">
      <Header />
      <div className="build-color-palette-container">
        <h4 className="page-title">
          Build <span>{'<ColorPalette />'}</span>
        </h4>
        <div className="build-color-palette-content">
          {/* Column 1: Input Palette JSON */}
          <div className="palette-settings-column-1">
            <h4>Input Palette</h4>
            <div className="palette-header">
              <h5>JSON</h5>
              <button onClick={handlePaste} className="paste-button">
                Paste
              </button>
            </div>
            <textarea
              value={input}
              onChange={handleChange}
              cols={30}
              rows={20}
              className="build-color-palette-textarea"
            />
          </div>

          {/* Column 2: Display Settings */}
          <div className="palette-settings-column-2">
            <h4>Display</h4>
            <div className="palette-controls">
              <label>
                <span>Display type:</span>
                <select
                  value={displayType}
                  onChange={(e) => setDisplayType(e.target.value as DisplayType)}
                >
                  <option value="block">Block</option>
                  <option value="square">Square</option>
                  <option value="table">Table</option>
                  <option value="circle">Circle</option>
                  <option value="triangle">Triangle</option>
                </select>
              </label>
              <label>
                <span>Width:</span>
                <input
                  type="number"
                  min="30"
                  max="200"
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  className="input-small"
                  style={{ width: '40px' }}
                />
              </label>
              <label>
                <span>Box border size:</span>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={boxBorderSize}
                  onChange={(e) => setBoxBorderSize(Number(e.target.value))}
                  className="input-small"
                  style={{ width: '40px' }}
                />
                <span style={{ marginLeft: '8px' }}>color:</span>
                <input
                  type="color"
                  value={boxBorderColor}
                  onChange={(e) => setBoxBorderColor(e.target.value)}
                  className="color-picker-small"
                  style={{ marginLeft: '4px' }}
                />
              </label>
              <label className="checkbox-right">
                <span>Display title:</span>
                <input
                  type="checkbox"
                  checked={displayTitle}
                  onChange={(e) => setDisplayTitle(e.target.checked)}
                />
                <span style={{ marginLeft: '8px' }}>Copy button:</span>
                <input
                  type="checkbox"
                  checked={showCopyButton}
                  onChange={(e) => setShowCopyButton(e.target.checked)}
                  style={{ marginLeft: '4px' }}
                />
                <span style={{ marginLeft: '8px' }}>Hexcode:</span>
                <input
                  type="checkbox"
                  checked={displayHexcode}
                  onChange={(e) => setDisplayHexcode(e.target.checked)}
                  style={{ marginLeft: '4px' }}
                />
              </label>
              <label>
                <span>Font size:</span>
                <input
                  type="number"
                  min="8"
                  max="24"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="input-small"
                  style={{ width: '40px' }}
                />
                <span style={{ marginLeft: '8px' }}>color:</span>
                <input
                  type="color"
                  value={fontColor}
                  onChange={(e) => setFontColor(e.target.value)}
                  className="color-picker-small"
                  style={{ marginLeft: '4px' }}
                />
              </label>
              <label className="color-picker-label">
                <span>Background color:</span>
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="color-picker-small"
                />
              </label>
            </div>
          </div>

          {/* Column 3: Parts Settings */}
          <div className="palette-settings-column-3">
            <h4>Parts</h4>
            <div className="palette-controls">
              <label>
                <span>Parts:</span>
                <select
                  value={parts}
                  onChange={(e) => setParts(Number(e.target.value) as 1 | 2 | 3)}
                >
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                </select>
              </label>
              <strong style={{ fontSize: '13px', marginTop: '4px', display: 'block' }}>
                Part 1
              </strong>
              <label>
                <span>Saturation:</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={saturation1}
                  onChange={(e) => setSaturation1(Number(e.target.value))}
                  style={{ width: '100px', verticalAlign: 'middle' }}
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={saturation1}
                  onChange={(e) => setSaturation1(Number(e.target.value))}
                  className="input-small"
                  style={{ width: '50px', marginLeft: '4px' }}
                />
              </label>
              <label>
                <span>Brightness:</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={brightness1}
                  onChange={(e) => setBrightness1(Number(e.target.value))}
                  style={{ width: '100px', verticalAlign: 'middle' }}
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={brightness1}
                  onChange={(e) => setBrightness1(Number(e.target.value))}
                  className="input-small"
                  style={{ width: '50px', marginLeft: '4px' }}
                />
              </label>
              <strong style={{ fontSize: '13px', marginTop: '4px', display: 'block' }}>
                Part 2
              </strong>
              <label>
                <span>Saturation:</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={saturation2}
                  onChange={(e) => setSaturation2(Number(e.target.value))}
                  style={{ width: '100px', verticalAlign: 'middle' }}
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={saturation2}
                  onChange={(e) => setSaturation2(Number(e.target.value))}
                  className="input-small"
                  style={{ width: '50px', marginLeft: '4px' }}
                />
              </label>
              <label>
                <span>Brightness:</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={brightness2}
                  onChange={(e) => setBrightness2(Number(e.target.value))}
                  style={{ width: '100px', verticalAlign: 'middle' }}
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={brightness2}
                  onChange={(e) => setBrightness2(Number(e.target.value))}
                  className="input-small"
                  style={{ width: '50px', marginLeft: '4px' }}
                />
              </label>
            </div>
          </div>

          {/* Column 4: Generated Code */}
          <div className="palette-generated-code-column">
            <div className="generated-code-header">
              <h4>Generated Code</h4>
              <button onClick={handleCopyGeneratedCode} className="copy-code-button">
                Copy
              </button>
            </div>
            <textarea
              readOnly
              value={`<ColorPalette
  paletteData={palettes}
  showCopyButton={${showCopyButton}}
  displayType="${displayType}"
  width={${width}}
  boxBorderSize={${boxBorderSize}}
  boxBorderColor="${boxBorderColor}"
  displayTitle={${displayTitle}}
  fontColor="${fontColor}"
  fontSize={${fontSize}}
  backgroundColor="${backgroundColor}"
  displayHexcode={${displayHexcode}}
  parts={${parts}}
  saturation1={${saturation1}}
  brightness1={${brightness1}}
  saturation2={${saturation2}}
  brightness2={${brightness2}}
/>`}
              className="generated-code-textarea"
            />
          </div>

          {/* Row 2: Preview */}
          <div className="palette-preview-column">
            <h4>Preview</h4>
            <ColorPalette
              paletteData={palettes}
              showCopyButton={showCopyButton}
              displayType={displayType}
              width={width}
              boxBorderSize={boxBorderSize}
              boxBorderColor={boxBorderColor}
              displayTitle={displayTitle}
              fontColor={fontColor}
              fontSize={fontSize}
              backgroundColor={backgroundColor}
              displayHexcode={displayHexcode}
              parts={parts}
              saturation1={saturation1}
              brightness1={brightness1}
              saturation2={saturation2}
              brightness2={brightness2}
            />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default BuildColorPalette;
