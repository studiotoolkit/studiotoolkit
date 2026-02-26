import { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './BuildPaletteGenerator.css';
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

export default function DemoPaletteGenerator() {
  const [input, setInput] = useState('{\n  "harmonyPalette": ["#3498db"]\n}');
  const [count, setCount] = useState(9);
  const [output, setOutput] = useState('');
  const [activeGenerator, setActiveGenerator] = useState('harmony');

  const handleGenerateHarmony = () => {
    setActiveGenerator('harmony');
    try {
      const paletteInput = JSON.parse(input);
      const palettes = generateHarmonyPalettes(paletteInput, count);
      setOutput(JSON.stringify(palettes, null, 2));
    } catch (e) {
      setOutput('Invalid input or error generating palettes: ' + (e as Error).message);
    }
  };

  const handleGeneratePerceptual = () => {
    setActiveGenerator('perceptual');
    try {
      const paletteInput = JSON.parse(input);
      const palettes = generatePerceptualPalettes(paletteInput, count);
      setOutput(JSON.stringify(palettes, null, 2));
    } catch (e) {
      setOutput('Invalid input or error generating palettes: ' + (e as Error).message);
    }
  };

  const handleGenerateContrast = () => {
    setActiveGenerator('contrast');
    try {
      const paletteInput = JSON.parse(input);
      const palettes = generateContrastPalettes(paletteInput, count);
      setOutput(JSON.stringify(palettes, null, 2));
    } catch (e) {
      setOutput('Invalid input or error generating palettes: ' + (e as Error).message);
    }
  };

  const handleGenerateDataVisuals = () => {
    setActiveGenerator('datavisuals');
    try {
      const paletteInput = JSON.parse(input);
      const colors = Object.values(paletteInput).find(
        (v) => Array.isArray(v) && (v as string[]).length > 0
      ) as string[] | undefined;
      if (colors)
        setOutput(JSON.stringify(generateDataVisuals({ square: colors }, count), null, 2));
    } catch (e) {
      setOutput('Invalid input or error generating palettes: ' + (e as Error).message);
    }
  };

  const handleGenerateAlgorithmic = () => {
    setActiveGenerator('algorithmic');
    try {
      const paletteInput = JSON.parse(input);
      const colors = Object.values(paletteInput).find(
        (v) => Array.isArray(v) && (v as string[]).length > 0
      ) as string[] | undefined;
      if (colors)
        setOutput(JSON.stringify(generateAlgorithmic({ square: colors }, count), null, 2));
    } catch (e) {
      setOutput('Invalid input or error generating palettes: ' + (e as Error).message);
    }
  };

  const handleGenerateImage = () => {
    setActiveGenerator('image');
    try {
      const paletteInput = JSON.parse(input);
      const colors = Object.values(paletteInput).find(
        (v) => Array.isArray(v) && (v as string[]).length > 0
      ) as string[] | undefined;
      if (colors)
        setOutput(JSON.stringify(generateImagePalettes({ square: colors }, count), null, 2));
    } catch (e) {
      setOutput('Invalid input or error generating palettes: ' + (e as Error).message);
    }
  };

  const handleGenerate60_30_10 = () => {
    setActiveGenerator('60-30-10');
    try {
      const paletteInput = JSON.parse(input);
      const colors = Object.values(paletteInput).find(
        (v) => Array.isArray(v) && (v as string[]).length > 0
      ) as string[] | undefined;
      if (colors) {
        const result = select60_30_10(colors);
        setOutput(
          JSON.stringify(
            {
              neutralLight: [result.neutralLight.hex],
              neutralDark: [result.neutralDark.hex],
              mainColor: [result.mainColor.hex],
              mainColorShade: [result.mainColorShade.hex],
              accentColor: [result.accentColor.hex],
            },
            null,
            2
          )
        );
      }
    } catch (e) {
      setOutput('Invalid input or error generating palettes: ' + (e as Error).message);
    }
  };

  const handleApplyRadium = () => {
    setActiveGenerator('radium');
    try {
      const paletteInput = JSON.parse(input);
      const radiumPalette = generateRadiumColors(paletteInput);
      setOutput(JSON.stringify(radiumPalette, null, 2));
    } catch (e) {
      setOutput('Invalid input or error applying Radium: ' + (e as Error).message);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
    } catch {
      alert('Failed to read from clipboard');
    }
  };

  const generateJavaScriptCode = () => {
    const inp = input;
    const c = count;
    switch (activeGenerator) {
      case 'harmony':
        return `import { generateHarmonyPalettes } from "./color-palette-generator/HarmonyGenerator";

const input = ${inp};
const count = ${c};

const palettes = generateHarmonyPalettes(input, count);
console.log(palettes);`;
      case 'perceptual':
        return `import { generatePerceptualPalettes } from "./color-palette-generator/PerceptualGenerator";

const input = ${inp};
const count = ${c};

const palettes = generatePerceptualPalettes(input, count);
console.log(palettes);`;
      case 'contrast':
        return `import { generateContrastPalettes } from "./color-palette-generator/ContrastGenerator";

const input = ${inp};
const count = ${c};

const palettes = generateContrastPalettes(input, count);
console.log(palettes);`;
      case 'datavisuals':
        return `import { generateDataVisuals } from "./color-palette-generator/DataVisualsGenerator";

const input = ${inp};
const count = ${c};

const colors = Object.values(input).find((v) => Array.isArray(v) && v.length > 0);
const palettes = generateDataVisuals({ square: colors }, count);
console.log(palettes);`;
      case 'algorithmic':
        return `import { generateAlgorithmic } from "./color-palette-generator/AlgorithmicGenerator";

const input = ${inp};
const count = ${c};

const colors = Object.values(input).find((v) => Array.isArray(v) && v.length > 0);
const palettes = generateAlgorithmic({ square: colors }, count);
console.log(palettes);`;
      case 'image':
        return `import { generateImagePalettes } from "./color-palette-generator/ImageGenerator";

const input = ${inp};
const count = ${c};

const colors = Object.values(input).find((v) => Array.isArray(v) && v.length > 0);
const palettes = generateImagePalettes({ square: colors }, count);
console.log(palettes);`;
      case '60-30-10':
        return `import { select60_30_10 } from "./color-palette-generator/select60-30-10";

const input = ${inp};

const colors = Object.values(input).find((v) => Array.isArray(v) && v.length > 0);
const result = select60_30_10(colors);
console.log({
  neutralLight:   result.neutralLight.hex,
  neutralDark:    result.neutralDark.hex,
  mainColor:      result.mainColor.hex,
  mainColorShade: result.mainColorShade.hex,
  accentColor:    result.accentColor.hex,
});`;
      case 'radium':
        return `import { generateRadiumColors } from "./color-palette-generator/RadiumGenerator";

const input = ${inp};

const radiumPalette = generateRadiumColors(input);
console.log(radiumPalette);`;
      default:
        return '';
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generateJavaScriptCode());
  };

  return (
    <div className="build-page-wrapper">
      <Header />
      <h4 className="page-title">Color Palette Generator Library Usage</h4>
      <div className="demo-palette-generator-container">
        <div className="demo-pg-layout">
          {/* Panel 1: Input Palette */}
          <div className="demo-pg-input-panel">
            <div className="demo-pg-panel-header">
              <h2>Input Palette</h2>
              <button className="paste-button-small" onClick={handlePaste}>
                Paste
              </button>
            </div>
            <textarea
              className="demo-palette-generator-textarea-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              cols={30}
              rows={10}
            />
          </div>

          {/* Panel 2: Count + Buttons */}
          <div className="demo-pg-controls-panel">
            <div className="demo-pg-panel-header">
              <h2>Generate</h2>
            </div>
            <label className="demo-palette-generator-count-label">
              Count:
              <input
                type="number"
                min={1}
                max={20}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="demo-palette-generator-count-input"
              />
            </label>
            <div className="demo-palette-generator-buttons">
              <button className="demo-palette-generator-btn" onClick={handleGenerateHarmony}>
                Harmony (11)
              </button>
              <button className="demo-palette-generator-btn" onClick={handleGeneratePerceptual}>
                Perceptual (10)
              </button>
              <button className="demo-palette-generator-btn" onClick={handleGenerateContrast}>
                Contrast (7)
              </button>
              <button className="demo-palette-generator-btn" onClick={handleGenerateDataVisuals}>
                Data Visuals (7)
              </button>
              <button className="demo-palette-generator-btn" onClick={handleGenerateAlgorithmic}>
                Algorithmic (11)
              </button>
              <button className="demo-palette-generator-btn" onClick={handleGenerateImage}>
                Image (10)
              </button>
              <button className="demo-palette-generator-btn" onClick={handleGenerate60_30_10}>
                60-30-10 Design
              </button>
              <button
                className="demo-palette-generator-btn"
                onClick={handleApplyRadium}
                style={{
                  background: '#9b59b6',
                }}
              >
                Radium Colors
              </button>
            </div>
          </div>

          {/* Panel 3: Output Palette */}
          <div className="demo-pg-output-panel">
            <div className="demo-pg-panel-header">
              <h2>Output</h2>
              <button className="copy-button-small" onClick={handleCopy} disabled={!output}>
                Copy
              </button>
            </div>
            <textarea
              className="demo-palette-generator-textarea-results"
              value={output}
              readOnly
              cols={30}
              rows={10}
            />
          </div>

          {/* Bottom: JavaScript Code */}
          <div className="demo-pg-code-panel">
            <div className="demo-pg-panel-header">
              <h2>JavaScript Code</h2>
              <button className="copy-button-small" onClick={handleCopyCode}>
                Copy
              </button>
            </div>
            <textarea
              className="demo-palette-generator-textarea-jscode"
              value={generateJavaScriptCode()}
              readOnly
              cols={30}
              rows={10}
            />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
