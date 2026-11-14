import { useLayoutEffect, useRef, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {
  Clock,
  CLOCK_FACES,
  DATE_FORMATS,
  DIAL_MARKERS,
  DIAL_MINUTE_TICKS,
  DIAL_NUMERALS,
  DIAL_NUMBERS,
  SECOND_HAND_MOTIONS,
  SECOND_HAND_STYLES,
  type ClockFace,
  type ClockProps,
  type DateFormat,
  type SecondHandMotion,
  type SecondHandStyle,
  type TimeFormat,
} from '@studiotoolkit/analog-clock';
import '@studiotoolkit/analog-clock/style.css';
import { useTheme } from '../ThemeContext';
import './BuildClock.css';
import samplesData from './samples.json';
import { randomLooks } from './randomLook';

/** A ready-made look: a face plus colour and second-hand settings. */
interface Sample {
  id: string;
  face: ClockFace;
  name: string;
  props: ClockProps;
}

const SAMPLES = samplesData as Sample[];

/**
 * Dial settings, in the order they appear. '' leaves the prop out: the face's
 * own design, or for the 12 and other-hour markers, the main marker.
 */
const YES_NO = [
  { id: 'yes', label: 'Yes' },
  { id: 'no', label: 'No' },
];
const DIAL_FIELDS = [
  { prop: 'numbers', label: 'Numbers', options: DIAL_NUMBERS },
  { prop: 'numerals', label: 'Numeral Style', options: DIAL_NUMERALS },
  { prop: 'rotateNumbers', label: 'Rotate Numbers', options: YES_NO },
  { prop: 'mainMarker', label: 'Main (12, 3, 6, 9)', options: DIAL_MARKERS },
  { prop: 'marker12', label: 'Accent at 12', options: DIAL_MARKERS, empty: 'Same as main' },
  { prop: 'hourMarker', label: 'Other Hours', options: DIAL_MARKERS, empty: 'Same as main' },
  { prop: 'minuteTicks', label: 'Minute Ticks', options: DIAL_MINUTE_TICKS },
  { prop: 'hideMarkersAtNumbers', label: 'Hide Markers at Numbers', options: YES_NO },
] as const;

type DialProp = (typeof DIAL_FIELDS)[number]['prop'];
type DialState = Record<DialProp, string>;
const BOOLEAN_DIAL_PROPS: DialProp[] = ['rotateNumbers', 'hideMarkersAtNumbers'];

const initialDial = (): DialState =>
  Object.fromEntries(DIAL_FIELDS.map((f) => [f.prop, ''])) as DialState;

/** Only the dial settings the user changed, as <Clock> props. */
function dialToProps(dial: DialState): Partial<ClockProps> {
  const props: Record<string, string | boolean> = {};
  for (const { prop } of DIAL_FIELDS) {
    const v = dial[prop];
    if (!v) continue;
    props[prop] = BOOLEAN_DIAL_PROPS.includes(prop) ? v === 'yes' : v;
  }
  return props as Partial<ClockProps>;
}

/** The dial settings stored in a sample's props, as dropdown values. */
function propsToDial(p: ClockProps): DialState {
  const dial = initialDial();
  for (const { prop } of DIAL_FIELDS) {
    const v = p[prop];
    if (typeof v === 'boolean') dial[prop] = v ? 'yes' : 'no';
    else if (v) dial[prop] = v;
  }
  return dial;
}

/** Samples grouped by face, in face order. */
const SAMPLE_GROUPS = CLOCK_FACES.map((f) => ({
  face: f,
  samples: SAMPLES.filter((s) => s.face === f.id),
})).filter((g) => g.samples.length > 0);

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

/** Cities for Randomise: the Time Zone list without Local time and UTC. */
const CITIES = TIMEZONES.filter((z) => z.tz && z.tz !== 'UTC');
/** Date formats for Randomise: every format except None. */
const RANDOM_DATE_FORMATS = DATE_FORMATS.filter((d) => d.id !== 'none').map((d) => d.id);

/** A shuffled copy (Fisher-Yates). */
function shuffled<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Colour props on <Clock>, in the order they appear in Settings. */
const COLOR_PROPS = [
  { prop: 'borderColor', label: 'Border', initial: '#000000' },
  { prop: 'dialColor', label: 'Dial Face', initial: '#ffffff' },
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
  const [handStyle, setHandStyle] = useState<SecondHandStyle>('face');
  const [markerAt, setMarkerAt] = useState(100);
  const [showDigital, setShowDigital] = useState(false);
  const [dateFormat, setDateFormat] = useState<DateFormat>('none');
  const [dateInside, setDateInside] = useState(false);
  const [colors, setColors] = useState<ColorState>(initialColors);
  const [dial, setDial] = useState<DialState>(initialDial);

  const theme = isDark ? 'dark' : 'light';

  const setColor = (prop: ColorProp, patch: Partial<ColorState[ColorProp]>) =>
    setColors((prev) => ({ ...prev, [prop]: { ...prev[prop], ...patch } }));

  // Only the colours the user switched on are passed to <Clock>
  const colorProps: Partial<Record<ColorProp, string>> = Object.fromEntries(
    COLOR_PROPS.filter((c) => colors[c.prop].enabled).map((c) => [c.prop, colors[c.prop].value]),
  );

  const customColorCount = Object.keys(colorProps).length;

  const dialProps = dialToProps(dial);
  const customDialCount = Object.keys(dialProps).length;

  // Loads a sample into the settings and brings the preview into view
  const previewRef = useRef<HTMLDivElement>(null);
  const applySample = (s: Sample) => {
    const p = s.props;
    setFace(s.face);
    setShowSeconds(true);
    setMotion(p.secondHandMotion ?? 'tick');
    setHandStyle(p.secondHandStyle ?? 'face');
    setMarkerAt(p.secondHandMarkerAt ?? 100);
    setDial(propsToDial(p));
    // Random variations carry a city, its time zone and a date format
    if (p.timezone !== undefined) {
      setTimezone(p.timezone ?? '');
      setLabel(p.label ?? '');
      setDateFormat(p.dateFormat ?? 'none');
      setDateInside(p.dateInside ?? false);
    }
    setColors(
      Object.fromEntries(
        COLOR_PROPS.map((c) => [
          c.prop,
          { enabled: p[c.prop] !== undefined, value: p[c.prop] ?? c.initial },
        ]),
      ) as ColorState,
    );
    previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Randomise: every variation card gets a new random look for its face.
  // The page stays put; a card is only loaded when clicked.
  const [randomGroups, setRandomGroups] = useState<typeof SAMPLE_GROUPS | null>(null);
  const [shuffleCount, setShuffleCount] = useState(0);
  const handleRandomise = () => {
    setShuffleCount((n) => n + 1);
    setRandomGroups(
      SAMPLE_GROUPS.map(({ face: f, samples }) => ({
        face: f,
        samples: (() => {
          // A different city for every card in the row
          const cities = shuffled(CITIES);
          return randomLooks(f.id, samples.length).map((look, i) => {
            const city = cities[i % cities.length];
            const dateFormat =
              RANDOM_DATE_FORMATS[Math.floor(Math.random() * RANDOM_DATE_FORMATS.length)];
            return {
              id: `random-${f.id}-${i}`,
              face: look.face,
              name: look.name,
              props: {
                ...look.props,
                timezone: city.tz,
                label: city.label,
                dateFormat,
                dateInside: true,
              },
            };
          });
        })(),
      })),
    );
  };
  const variationGroups = randomGroups ?? SAMPLE_GROUPS;

  // A sample is highlighted while the settings still match it exactly
  const matchesSample = (s: Sample) => {
    const p = s.props;
    return (
      face === s.face &&
      showSeconds &&
      motion === (p.secondHandMotion ?? 'tick') &&
      handStyle === (p.secondHandStyle ?? 'face') &&
      (!SECOND_HAND_STYLES.some((x) => x.id === handStyle && x.group === 'Object') ||
        markerAt === (p.secondHandMarkerAt ?? 100)) &&
      DIAL_FIELDS.every((f) => dialProps[f.prop] === p[f.prop]) &&
      (p.timezone === undefined ||
        (timezone === p.timezone &&
          label === (p.label ?? '') &&
          dateFormat === (p.dateFormat ?? 'none') &&
          dateInside === (p.dateInside ?? false))) &&
      COLOR_PROPS.every((c) => colorProps[c.prop] === p[c.prop])
    );
  };

  // The Add At slider only applies to styles that place an object on the hand
  const hasObject = SECOND_HAND_STYLES.some((s) => s.id === handStyle && s.group === 'Object');

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
    handStyle !== 'face' && `  secondHandStyle="${handStyle}"`,
    hasObject && markerAt !== 100 && `  secondHandMarkerAt={${markerAt}}`,
    !showDigital && `  showDigital={false}`,
    dateFormat !== 'none' && `  dateFormat="${dateFormat}"`,
    dateFormat !== 'none' && dateInside && `  dateInside`,
    ...Object.entries(dialProps).map(([prop, value]) =>
      typeof value === 'boolean' ? `  ${prop}={${value}}` : `  ${prop}="${value}"`,
    ),
    ...Object.entries(colorProps).map(([prop, value]) => `  ${prop}="${value}"`),
  ].filter(Boolean);

  const generatedCode = `import { Clock } from '@studiotoolkit/analog-clock';
import '@studiotoolkit/analog-clock/style.css';

${props.length ? `<Clock\n${props.join('\n')}\n/>` : '<Clock />'}`;

  const handleCopyCode = () => navigator.clipboard.writeText(generatedCode);

  // Grow the code box to fit the code, so it never needs a scrollbar
  const codeRef = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const fit = () => {
      const el = codeRef.current;
      if (!el) return;
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight + 2}px`; // + border
    };
    fit();
    // Long lines wrap differently at other widths
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [generatedCode]);

  // Bumped on Reset so the Dial and Colors sections close again
  const [resetCount, setResetCount] = useState(0);

  const handleReset = () => {
    setResetCount((n) => n + 1);
    setRadius(120);
    setLabel('');
    setTimezone('');
    setFace('default');
    setTimeFormat('12h');
    setShowSeconds(true);
    setMotion('tick');
    setHandStyle('face');
    setMarkerAt(100);
    setShowDigital(false);
    setDateFormat('none');
    setDateInside(false);
    setColors(initialColors());
    setDial(initialDial());
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
            <div className="build-clock-settings-header">
              <h3>Settings</h3>
              <button
                className="build-clock-reset-button"
                onClick={handleReset}
                title="Set every setting back to its default"
              >
                Reset
              </button>
            </div>
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
              <label htmlFor="clock-hand-style">Second Hand Object</label>
              <select
                id="clock-hand-style"
                value={handStyle}
                disabled={!showSeconds}
                onChange={(e) => setHandStyle(e.target.value as SecondHandStyle)}
                className="build-clock-select"
              >
                {[...new Set(SECOND_HAND_STYLES.map((s) => s.group))].map((group) => (
                  <optgroup key={group} label={group}>
                    {SECOND_HAND_STYLES.filter((s) => s.group === group).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className="build-clock-control-inline">
              <label htmlFor="clock-marker-at">Add At ({markerAt})</label>
              <input
                id="clock-marker-at"
                type="range"
                min={0}
                max={100}
                value={markerAt}
                disabled={!showSeconds || !hasObject}
                onChange={(e) => setMarkerAt(Number(e.target.value))}
                className="build-clock-range"
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
            <div className="build-clock-control-inline">
              <label htmlFor="clock-date">Date Display</label>
              <select
                id="clock-date"
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value as DateFormat)}
                className="build-clock-select"
              >
                {DATE_FORMATS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.example ? `${d.label} (${d.example})` : d.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="build-clock-control-inline">
              <label htmlFor="clock-date-inside">Date Inside Dial</label>
              <input
                id="clock-date-inside"
                type="checkbox"
                checked={dateInside}
                disabled={dateFormat === 'none'}
                onChange={(e) => setDateInside(e.target.checked)}
              />
            </div>

            <details className="build-clock-colors" key={`dial-${resetCount}`}>
              <summary className="build-clock-subheading">
                Dial
                {customDialCount > 0 && (
                  <span className="build-clock-colors-count">· {customDialCount} custom</span>
                )}
              </summary>
              <div className="build-clock-colors-body">
                <p className="build-clock-hint">Numbers, markers and ticks. Face default keeps the watch face's own design.</p>
                {DIAL_FIELDS.map((field) => {
                  const { prop, label: fieldLabel, options } = field;
                  return (
                  <div className="build-clock-control-inline" key={prop}>
                    <label htmlFor={`clock-dial-${prop}`}>{fieldLabel}</label>
                    <select
                      id={`clock-dial-${prop}`}
                      value={dial[prop]}
                      onChange={(e) => setDial((prev) => ({ ...prev, [prop]: e.target.value }))}
                      className="build-clock-select"
                    >
                      <option value="">{'empty' in field ? field.empty : 'Face default'}</option>
                      {options.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  );
                })}
              </div>
            </details>

            <details className="build-clock-colors" key={`colors-${resetCount}`}>
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
          </div>

          {/* Column 2: Preview */}
          <div className="build-clock-preview" ref={previewRef}>
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
                secondHandStyle={handStyle}
                secondHandMarkerAt={markerAt}
                showDigital={showDigital}
                dateFormat={dateFormat}
                dateInside={dateInside}
                {...dialProps}
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
            <textarea
              ref={codeRef}
              className="build-clock-textarea"
              value={generatedCode}
              readOnly
            />
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
                  secondHandStyle={handStyle}
                  secondHandMarkerAt={markerAt}
                  showDigital={false}
                  {...dialProps}
                />
              </button>
            ))}
          </div>
        </section>

        {/* Variations gallery: ready-made looks for every face */}
        <section className="build-clock-faces" aria-labelledby="clock-variations-title">
          <div className="build-clock-variations-header">
            <h3 id="clock-variations-title">Variations</h3>
            <div className="build-clock-randomise">
              {randomGroups && (
                <button
                  type="button"
                  className="build-clock-curated-button"
                  onClick={() => setRandomGroups(null)}
                  title="Show the hand-picked variations again"
                >
                  Curated
                </button>
              )}
              <button
                type="button"
                className="build-clock-randomise-button"
                onClick={handleRandomise}
                title="Give every variation a random set of colors, dial and second hand"
              >
                <span aria-hidden="true">⚄</span> Randomise
              </button>
            </div>
          </div>
          <p className="build-clock-hint" aria-live="polite">
            {randomGroups
              ? 'Random mixes. Click one to load its settings, or Randomise again.'
              : 'Click a variation to load its settings, or Randomise for new mixes.'}
          </p>
          {variationGroups.map(({ face: f, samples }) => (
            <div key={f.id} className="build-clock-variation-group">
              <h4 className="build-clock-variation-title">{f.label}</h4>
              <div className="build-clock-variations-grid">
                {samples.map((s) => {
                  const selected = matchesSample(s);
                  return (
                    <button
                      key={`${s.id}-${randomGroups ? shuffleCount : 0}`}
                      type="button"
                      title={s.props.label ? `${s.name} · ${s.props.label}` : s.name}
                      className={`build-clock-face-card${selected ? ' is-selected' : ''}`}
                      aria-pressed={selected}
                      onClick={() => applySample(s)}
                    >
                      <span className="build-clock-face-name">
                        {s.name.split(' · ').slice(1).join(' · ') || s.name}
                      </span>
                      <Clock
                        {...s.props}
                        theme={theme}
                        radius={64}
                        timezone={s.props.timezone ?? (timezone || null)}
                        showDigital={false}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      </main>
      <Footer />
    </div>
  );
}
