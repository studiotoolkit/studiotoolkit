import { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Clock } from '@studiotoolkit/analog-clock';
import { useTheme } from '../ThemeContext';
import './BuildClock.css';

const TIMEZONES: { label: string; tz: string }[] = [
  { label: 'Local time', tz: '' },
  { label: 'UTC', tz: 'UTC' },
  { label: 'New York', tz: 'America/New_York' },
  { label: 'Chicago', tz: 'America/Chicago' },
  { label: 'Los Angeles', tz: 'America/Los_Angeles' },
  { label: 'São Paulo', tz: 'America/Sao_Paulo' },
  { label: 'London', tz: 'Europe/London' },
  { label: 'Paris', tz: 'Europe/Paris' },
  { label: 'Berlin', tz: 'Europe/Berlin' },
  { label: 'Moscow', tz: 'Europe/Moscow' },
  { label: 'Dubai', tz: 'Asia/Dubai' },
  { label: 'Kolkata', tz: 'Asia/Kolkata' },
  { label: 'Singapore', tz: 'Asia/Singapore' },
  { label: 'Shanghai', tz: 'Asia/Shanghai' },
  { label: 'Tokyo', tz: 'Asia/Tokyo' },
  { label: 'Sydney', tz: 'Australia/Sydney' },
  { label: 'Auckland', tz: 'Pacific/Auckland' },
];

export default function BuildClock() {
  const { isDark } = useTheme();
  const [radius, setRadius] = useState(120);
  const [label, setLabel] = useState('');
  const [timezone, setTimezone] = useState('');
  const [customBorder, setCustomBorder] = useState(false);
  const [borderColor, setBorderColor] = useState('#000000');
  const [showSeconds, setShowSeconds] = useState(true);
  const [showDigital, setShowDigital] = useState(true);

  const theme = isDark ? 'dark' : 'light';

  // Only list props that differ from the component defaults
  const props = [
    radius !== 100 && `  radius={${radius}}`,
    label && `  label="${label}"`,
    timezone && `  timezone="${timezone}"`,
    theme !== 'light' && `  theme="${theme}"`,
    customBorder && `  borderColor="${borderColor}"`,
    !showSeconds && `  showSeconds={false}`,
    !showDigital && `  showDigital={false}`,
  ].filter(Boolean);

  const generatedCode = `import { Clock } from '@studiotoolkit/analog-clock';

${props.length ? `<Clock\n${props.join('\n')}\n/>` : '<Clock />'}`;

  const handleCopyCode = () => navigator.clipboard.writeText(generatedCode);

  const handleReset = () => {
    setRadius(120);
    setLabel('');
    setTimezone('');
    setCustomBorder(false);
    setBorderColor('#000000');
    setShowSeconds(true);
    setShowDigital(true);
  };

  return (
    <div className="build-clock-page">
      <Header />
      <main className="build-clock-content">
        <h4 className="page-title">
          Build <span>{'<Clock />'}</span>
        </h4>
        <div className="build-clock-row1">
          {/* Column 1: Settings */}
          <div className="build-clock-controls">
            <h3>Settings</h3>
            <div className="build-clock-control-inline">
              <label htmlFor="clock-radius">Radius ({radius}px)</label>
              <input
                id="clock-radius"
                type="range"
                min={30}
                max={200}
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="build-clock-range"
              />
            </div>
            <div className="build-clock-control-inline">
              <label htmlFor="clock-label">Label</label>
              <input
                id="clock-label"
                type="text"
                placeholder="e.g. London"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="build-clock-text-input"
              />
            </div>
            <div className="build-clock-control-inline">
              <label htmlFor="clock-timezone">Time Zone</label>
              <select
                id="clock-timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="build-clock-select"
              >
                {TIMEZONES.map((z) => (
                  <option key={z.tz} value={z.tz}>
                    {z.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="build-clock-control-inline">
              <label htmlFor="clock-custom-border">Custom Border</label>
              <div className="build-clock-color-row">
                <input
                  id="clock-custom-border"
                  type="checkbox"
                  checked={customBorder}
                  onChange={(e) => setCustomBorder(e.target.checked)}
                />
                <input
                  type="color"
                  aria-label="Border color"
                  value={borderColor}
                  disabled={!customBorder}
                  onChange={(e) => setBorderColor(e.target.value)}
                  className="build-clock-color-picker"
                />
              </div>
            </div>
            <div className="build-clock-control-inline">
              <label htmlFor="clock-seconds">Second Hand</label>
              <input
                id="clock-seconds"
                type="checkbox"
                checked={showSeconds}
                onChange={(e) => setShowSeconds(e.target.checked)}
              />
            </div>
            <div className="build-clock-control-inline">
              <label htmlFor="clock-digital">Digital Time</label>
              <input
                id="clock-digital"
                type="checkbox"
                checked={showDigital}
                onChange={(e) => setShowDigital(e.target.checked)}
              />
            </div>
            <p className="build-clock-hint">Theme follows the site's light/dark toggle.</p>
            <div className="build-clock-control-inline">
              <span />
              <button className="build-clock-reset-button" onClick={handleReset}>
                Reset
              </button>
            </div>
          </div>

          {/* Column 2: Preview */}
          <div className="build-clock-preview">
            <h3>Preview</h3>
            <div className="build-clock-stage">
              <Clock
                radius={radius}
                label={label}
                timezone={timezone || null}
                theme={theme}
                borderColor={customBorder ? borderColor : undefined}
                showSeconds={showSeconds}
                showDigital={showDigital}
              />
            </div>
          </div>

          {/* Column 3: Generated Code */}
          <div className="build-clock-code-section">
            <div className="build-clock-code-header">
              <h3>Generated Code</h3>
              <button className="build-clock-copy-button" onClick={handleCopyCode}>
                Copy
              </button>
            </div>
            <textarea className="build-clock-textarea" value={generatedCode} readOnly />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
