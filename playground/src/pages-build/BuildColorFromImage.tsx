import { useRef, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { ColorFromImage, type ColorEntry } from '@studiotoolkit/color-from-image';
import '@studiotoolkit/color-from-image/src/ColorFromImage.css';
import './BuildColorFromImage.css';

export default function BuildColorFromImage() {
  const [canvasWidth, setCanvasWidth] = useState(200);
  const [canvasHeight, setCanvasHeight] = useState(200);
  const [borderColor, setBorderColor] = useState('#cccccc');
  const [borderThickness, setBorderThickness] = useState(1);
  const [colors, setColors] = useState<ColorEntry | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [imageUrlToLoad, setImageUrlToLoad] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [clearTrigger, setClearTrigger] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const generatedCode = `<ColorFromImage
  width={${canvasWidth}}
  height={${canvasHeight}}
  borderColor="${borderColor}"
  borderThickness={${borderThickness}}
  onColorsExtracted={(colors) => console.log(colors)}
  imageFile={selectedFile}
  imageUrl="${imageUrlToLoad || 'https://example.com/image.jpg'}"
  clearTrigger={clearTrigger}
/>`;

  const handleCopyCode = () => navigator.clipboard.writeText(generatedCode);
  const handleCopyColors = () => navigator.clipboard.writeText(JSON.stringify(colors, null, 2));

  const handleLoadUrl = () => {
    if (urlInput) setImageUrlToLoad(urlInput);
  };

  const handleClear = () => {
    setClearTrigger((n) => n + 1);
    setColors(null);
    setUrlInput('');
    setImageUrlToLoad('');
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="build-cfi-page">
      <Header />
      <main className="build-cfi-content">
        <h4 className="page-title">
          Build <span>{'<ColorFromImage />'}</span>
        </h4>
        <div className="build-cfi-row1">
          {/* Column 1: Settings */}
          <div className="build-cfi-col-settings">
            <div className="build-cfi-controls">
              <h3>Settings</h3>
              <div className="build-cfi-control-inline">
                <label>Canvas Width</label>
                <input
                  type="number"
                  min={50}
                  max={9999}
                  value={canvasWidth}
                  onChange={(e) => setCanvasWidth(Number(e.target.value))}
                  className="build-cfi-number-input"
                />
              </div>
              <div className="build-cfi-control-inline">
                <label>Canvas Height</label>
                <input
                  type="number"
                  min={50}
                  max={9999}
                  value={canvasHeight}
                  onChange={(e) => setCanvasHeight(Number(e.target.value))}
                  className="build-cfi-number-input"
                />
              </div>
              <div className="build-cfi-control-inline">
                <label>Border Color</label>
                <input
                  type="color"
                  value={borderColor}
                  onChange={(e) => setBorderColor(e.target.value)}
                  className="build-cfi-color-picker"
                />
              </div>
              <div className="build-cfi-control-inline">
                <label>Border Thickness</label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={borderThickness}
                  onChange={(e) => setBorderThickness(Number(e.target.value))}
                  className="build-cfi-number-input"
                />
              </div>
              <div className="build-cfi-control-section">
                <label className="build-cfi-section-label">Choose File</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                  className="build-cfi-file-input"
                />
              </div>
              <div className="build-cfi-control-section">
                <label className="build-cfi-section-label">Image URL</label>
                <div className="build-cfi-url-row">
                  <input
                    type="text"
                    placeholder="https://..."
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLoadUrl()}
                    className="build-cfi-url-input"
                  />
                  <button className="build-cfi-load-button" onClick={handleLoadUrl}>
                    Load
                  </button>
                </div>
              </div>
              <div className="build-cfi-control-inline">
                <span />
                <button className="build-cfi-clear-button" onClick={handleClear}>
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Column 2: Preview */}
          <div className="build-cfi-col-preview">
            <div className="build-cfi-preview">
              <h3>Preview</h3>
              <ColorFromImage
                width={canvasWidth}
                height={canvasHeight}
                borderColor={borderColor}
                borderThickness={borderThickness}
                onColorsExtracted={(c) => setColors(c)}
                imageUrl={imageUrlToLoad || undefined}
                imageFile={imageFile}
                clearTrigger={clearTrigger}
              />

              <div className="build-cfi-code-header">
                <h4>
                  Output
                  {colors && colors.palette.length > 0 && (
                    <span className="build-cfi-color-count">({colors.palette.length})</span>
                  )}
                </h4>
                <button
                  className="build-cfi-copy-button"
                  onClick={handleCopyColors}
                  disabled={!colors || colors.palette.length === 0}
                >
                  Copy
                </button>
              </div>
              <textarea
                className="build-cfi-textarea build-cfi-colors-textarea"
                value={colors && colors.palette.length > 0 ? JSON.stringify(colors, null, 2) : ''}
                placeholder="Load an image to extract colors"
                readOnly
              />
            </div>
          </div>

          {/* Column 3: Generated Code */}
          <div className="build-cfi-col-code">
            <div className="build-cfi-code-section">
              <div className="build-cfi-code-header">
                <h3>Generated Code</h3>
                <button className="build-cfi-copy-button" onClick={handleCopyCode}>
                  Copy
                </button>
              </div>
              <textarea className="build-cfi-textarea" value={generatedCode} readOnly />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
