import { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {
  Clock,
  CLOCK_FACES,
  SECOND_HAND_MOTIONS,
  type ClockFace,
  type SecondHandMotion,
  type TimeFormat,
} from '@studiotoolkit/analog-clock';
import '@studiotoolkit/analog-clock/style.css';
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

/** Colour props on <Clock>, in the order they appear in Settings. */
const COLOR_PROPS = [
  { prop: 'borderColor', label: 'Border', initial: '#000000' },
  { prop: 'tickColor', label: 'Ticks', initial: '#000000' },
  { prop: 'numberColor', label: 'Numbers', initial: '#000000' },
  { prop: 'hourHandColor', label: 'Hour Hand', initial: '#000000' },
  { prop: 'minuteHandColor', label: 'Minute Hand', initial: '#000000' },
  { prop: 'secondHandColor', label: 'Second Hand', initial: '#e03a3a' },
  { prop: 'digitalColor', label: 'Digital Time', initial: '#000000' },
] as const;

type ColorProp = (typeof COLOR_PROPS)[number]['prop'];
type ColorState = Record<ColorProp, { enabled: boolean; value: string }>;

const initialColors = (): ColorState =>
  Object.fromEntries(
    COLOR_PROPS.map((c) => [c.prop, { enabled: false, value: c.initial }]),
  ) as ColorState;

export default function BuildClock() {
  const { isDark } = useTheme();
  const [radius, setRadius] = useState(120);
  const [label, setLabel] = useState('');
  const [timezone, setTimezone] = useState('');
  const [face, setFace] = useState<ClockFace>('default');
  const [timeFormat, setTimeFormat] = useState<TimeFormat>('12h');
  const [showSeconds, setShowSeconds] = useState(true);
  const [motion, setMotion] = useState<SecondHandMotion>('tick');
  const [showDigital, setShowDigital] = useState(true);
  const [colors, setColors] = useState<ColorState>(initialColors);

  const theme = isDark ? 'dark' : 'light';

  const setColor = (prop: ColorProp, patch: Partial<ColorState[ColorProp]>) =>
    setColors((prev) => ({ ...prev, [prop]: { ...prev[prop], ...patch } }));

  // Only the colours the user switched on are passed to <Clock>
  const colorProps: Partial<Record<ColorProp, string>> = Object.fromEntries(
    COLOR_PROPS.filter((c) => colors[c.prop].enabled).map((c) => [c.prop, colors[c.prop].value]),
  );

  const customColorCount = Object.keys(colorProps).length;

  // Only list props that differ from the component defaults
  const props = [
    radius !== 100 && `  radius={${radius}}`,
    label && `  label="${label}"`,
    timezone && `  timezone="${timezone}"`,
    face !== 'default' && `  face="${face}"`,
    theme !== 'light' && `  theme="${theme}"`,
    timeFormat !== '12h' && `  timeFormat="${timeFormat}"`,
    !showSeconds && `  showSeconds={false}`,
    motion !== 'tick' && `  secondHandMotion="${motion}"`,
    !showDigital && `  showDigital={false}`,
    ...Object.entries(colorProps).map(([prop, value]) => `  ${prop}="${value}"`),
  ].filter(Boolean);

  const generatedCode = `import { Clock } from '@studiotoolkit/analog-clock';
import '@studiotoolkit/analog-clock/style.css';

${props.length ? `<Clock\n${props.join('\n')}\n/>` : '<Clock />'}`;

  const handleCopyCode = () => navigator.clipboard.writeText(generatedCode);

  const handleReset = () => {
    setRadius(120);
    setLabel('');
    setTimezone('');
    setFace('default');
    setTimeFormat('12h');
    setShowSeconds(true);
    setMotion('tick');
    setShowDigital(true);
    setColors(initialColors());
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
              <label htmlFor="clock-face">Watch Face</label>
              <select
                id="clock-face"
                value={face}
                onChange={(e) => setFace(e.target.value as ClockFace)}
                className="build-clock-select"
              >
                {CLOCK_FACES.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
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
              <label htmlFor="clock-format">Digital Format</label>
              <select
                id="clock-format"
                value={timeFormat}
                onChange={(e) => setTimeFormat(e.target.value as TimeFormat)}
                className="build-clock-select"
              >
                <option value="12h">12-hour</option>
                <option value="24h">24-hour</option>
              </select>
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
              <label htmlFor="clock-motion">Second Hand Motion</label>
              <select
                id="clock-motion"
                value={motion}
                disabled={!showSeconds}
                onChange={(e) => setMotion(e.target.value as SecondHandMotion)}
                className="build-clock-select"
              >
                {SECOND_HAND_MOTIONS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
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

            <details className="build-clock-colors">
              <summary className="build-clock-subheading">
                Colors
                {customColorCount > 0 && (
                  <span className="build-clock-colors-count">· {customColorCount} custom</span>
                )}
              </summary>
              <div className="build-clock-colors-body">
                <p className="build-clock-hint">Tick a color to override the watch face.</p>
                {COLOR_PROPS.map(({ prop, label: colorLabel }) => (
                  <div className="build-clock-control-inline" key={prop}>
                    <label htmlFor={`clock-${prop}`}>{colorLabel}</label>
                    <div className="build-clock-color-row">
                      <input
                        id={`clock-${prop}`}
                        type="checkbox"
                        checked={colors[prop].enabled}
                        onChange={(e) => setColor(prop, { enabled: e.target.checked })}
                      />
                      <input
                        type="color"
                        aria-label={`${colorLabel} color`}
                        value={colors[prop].value}
                        disabled={!colors[prop].enabled}
                        onChange={(e) => setColor(prop, { value: e.target.value })}
                        className="build-clock-color-picker"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </details>

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
                face={face}
                theme={theme}
                timeFormat={timeFormat}
                showSeconds={showSeconds}
                secondHandMotion={motion}
                showDigital={showDigital}
                {...colorProps}
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

        {/* Faces gallery */}
        <section className="build-clock-faces" aria-labelledby="clock-faces-title">
          <h3 id="clock-faces-title">Faces</h3>
          <div className="build-clock-faces-grid">
            {CLOCK_FACES.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`build-clock-face-card${face === f.id ? ' is-selected' : ''}`}
                aria-pressed={face === f.id}
                onClick={() => setFace(f.id)}
              >
                <span className="build-clock-face-name">{f.label}</span>
                <Clock
                  face={f.id}
                  theme={theme}
                  radius={72}
                  timezone={timezone || null}
                  showSeconds={showSeconds}
                  secondHandMotion={motion}
                  showDigital={false}
                />
              </button>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
