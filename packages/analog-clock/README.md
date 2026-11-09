# Analog Clock

A live analog clock React component, drawn in SVG. It supports any IANA time zone, twelve watch faces, light and dark themes, and an optional digital readout. There are no runtime dependencies besides React.

## Installation

```bash
npm install @studiotoolkit/analog-clock
# or
pnpm add @studiotoolkit/analog-clock
```

## Usage

```tsx
import { Clock } from '@studiotoolkit/analog-clock';

export default function App() {
  return (
    <>
      <Clock />
      <Clock label="London" timezone="Europe/London" />
      <Clock label="Tokyo" timezone="Asia/Tokyo" theme="dark" radius={80} />
      <Clock label="Geneva" timezone="Europe/Zurich" face="gold" />
      <Clock
        label="Paris"
        timezone="Europe/Paris"
        timeFormat="24h"
        hourHandColor="#2e7d32"
        minuteHandColor="#ef6c00"
        secondHandColor="#d81b60"
      />
    </>
  );
}
```

## Props

| Prop          | Type                  | Default        | Description                                                     |
| ------------- | --------------------- | -------------- | --------------------------------------------------------------- |
| `radius`      | `number`              | `100`          | Dial radius in pixels. The SVG is `radius * 2 + 36` px square.  |
| `label`       | `string`              | `""`           | Text on the dial, shown uppercase. Hidden when `radius < 50`.   |
| `timezone`    | `string \| null`      | `null`         | IANA zone such as `"America/New_York"`. Local time when unset or invalid. |
| `face`        | `ClockFace`           | `"default"`    | Watch face. See [Watch faces](#watch-faces).                    |
| `theme`       | `"light" \| "dark"`   | `"light"`      | Dial colour scheme.                                             |
| `borderColor` | `string`              | face colour    | Bezel colour.                                                   |
| `showSeconds` | `boolean`             | `true`         | Show the second hand (and seconds in the digital readout).      |
| `secondHandMotion` | `SecondHandMotion` | `"tick"`      | How the second hand moves. See [Second hand motion](#second-hand-motion). |
| `showDigital` | `boolean`             | `true`         | Show the digital time below the dial.                           |
| `timeFormat`  | `"12h" \| "24h"`      | `"12h"`        | Digital time as `hh:mm:ss AM` or `HH:mm:ss`.                    |
| `tickColor`   | `string`              | face colour    | Tick marks. Minute ticks are drawn lighter.                     |
| `numberColor` | `string`              | face colour    | The 1-12 numbers.                                               |
| `hourHandColor`   | `string`          | face colour    | Hour hand and centre cap.                                       |
| `minuteHandColor` | `string`          | face colour    | Minute hand.                                                    |
| `secondHandColor` | `string`          | `#e03a3a`      | Second hand and centre dot.                                     |
| `digitalColor`    | `string`          | face colour    | Digital time text.                                              |

Colour props always win over the face, so you can start from a face and change just the second hand, for example.

## Watch faces

| Face      | Look                                                                 |
| --------- | -------------------------------------------------------------------- |
| `default` | The original clock: black and white (or slate in dark mode), all 12 numbers. |
| `gold`    | Polished gold case, white dial, thin gold hour sticks, numbers at 12/3/6/9, slim gold hands. |
| `blue`    | Brushed steel case, navy dial, slim white markers with double lines at 12/3/6/9, pointed white hands, no numbers. |
| `wall-black` | Black wall-clock case, numbers around the edge, a tick ring inside them with hour dots, red second hand with a bar tail. |
| `wall-white` | Slim white case, heavy black numbers, ticks around the outer edge, red second hand with a bar tail. |
| `roman`   | Thick black case, Roman numerals facing outward in a ringed band, black spade hands, no ticks. |
| `steel`   | Polished steel case, silver dial, upright Roman XII and VI, applied batons, slim faceted dauphine hands. |
| `navy`    | Polished steel case, blue dial darkening to the edge, 12/3/6/9 numbers, batons, sword hands with a bright stripe. |
| `spectrum` | Gunmetal case, white dial, ticks in the color-wheel colours (red at 12, clockwise through yellow, green, cyan, blue, magenta), bold lines at the quarters, near-black hands. |
| `chrono`  | Steel case, black dial, minute track, small numbers, white batons, a triangle at 12, sword hands with a bright stripe. |
| `ocean`   | Dive style: thick dark-teal case, deep teal dial, large mint dots for the hours, bars at 3/6/9, triangle at 12, mint-striped sword hands, orange second hand. |
| `blush`   | Dress style: rose-gold case, blush-pink dial, serif 12/3/6/9, slim rose-gold markers, dotted minutes, faceted lance hands, burgundy second hand. |

`CLOCK_FACES` lists them (`[{ id, label }]`), which is handy for a picker.

Each face's colours and fonts are CSS variables in its own stylesheet in `src/faces/` (for example `gold.css`).

**No CSS import is needed.** The first clock on a page adds the face styles to `<head>` once. They go first in `<head>`, so your own CSS still overrides them. The same styles are also published as `style.css`. Import it instead if your site's Content Security Policy blocks inline `<style>` tags, or to have the colours in place before any JavaScript runs:

```tsx
import '@studiotoolkit/analog-clock/style.css'; // optional
```

To restyle a face, override its variables:

```css
.analog-clock--blue {
  --ac-face-inner: #1f5133;
  --ac-face-outer: #0e2a1a; /* now a green dial */
}
```

| Variable | Used for |
| --- | --- |
| `--ac-bezel`, `--ac-bezel-2` | Case colour (two stops for a metallic sheen) |
| `--ac-face-inner`, `--ac-face-outer` | Dial gradient |
| `--ac-tick`, `--ac-minor-tick` | Hour and minute marks |
| `--ac-number`, `--ac-number-font`, `--ac-number-weight` | Dial numbers |
| `--ac-label`, `--ac-label-font`, `--ac-label-weight` | Label text |
| `--ac-hour-hand`, `--ac-minute-hand`, `--ac-second-hand` | Hands |
| `--ac-hand-shine` | Lighter half of faceted hands (`facet`) |
| `--ac-hand-inlay` | Stripe down the middle of hands with `inlay` |
| `--ac-ring` | Rings drawn on the dial (defaults to the tick colour) |
| `--ac-tick-hue`, `--ac-tick-hue-step`, `--ac-tick-sat`, `--ac-tick-light` | Spectrum ticks: hue at 12 o'clock, degrees per minute, saturation, lightness |
| `--ac-cap`, `--ac-cap-dot` | Centre cap (defaults to the hour and second hand colours) |
| `--ac-digital`, `--ac-digital-font` | Digital time |

### Adding a face

1. In `src/faces.ts`, add the id to `ClockFace` and `CLOCK_FACES`, and its shapes to `FACE_GEOMETRY`:
   - **Numbers:** `numbers` is `"all"`, `"quarters"`, `"none"` or a list of hours like `[12, 6]`; `numerals` is `"arabic"` or `"roman"`; `rotateNumbers` turns them to face the bezel; `hideMarksAtNumbers` drops the hour mark under each number.
   - **Marks:** `quarterMark`, `hourMark`, `minuteMark` take `shape` `line`, `double`, `dot`, `square` or `triangle`, or `null` for none. `markOverrides` swaps the mark at given hours, e.g. `{ 12: triangle }`. `spectrumTicks: true` colours marks by position.
   - **Hands:** `shape` is `taper`, `bar`, `spade`, `dauphine` or `sword`; add `facet: true` for a two-tone ridge or `inlay: true` for a centre stripe. The second hand's tail is a `filled` or `ring` circle, or a `bar`.
2. Add `src/faces/<id>.css` with the `--ac-*` variables under `.analog-clock--<id>`.
3. Rebuild. Every file in `src/faces/` is included in both the built-in styles and `style.css`.

`FACE_GEOMETRY` is internal and not exported, so face shapes can change in any release without breaking apps that use the clock.

## Second hand motion

| Motion       | Movement                                                                 |
| ------------ | ------------------------------------------------------------------------ |
| `tick`       | One jump per second (the default).                                       |
| `smooth`     | Glides continuously, updated every frame.                                |
| `sweep`      | 8 small steps per second, like an automatic watch.                       |
| `stop-to-go` | Stop-to-go: one lap in 58 s, a 2 s pause at 12, then the minute hand jumps. The minute hand only moves on the minute. |
| `bounce`     | Springs to each second, overshoots and wobbles before settling.          |
| `ease`       | Soft ease-in-out move to each second.                                    |
| `anticipate` | Dips back slightly, then snaps forward.                                  |

```tsx
<Clock secondHandMotion="stop-to-go" />
```

Every motion except `tick` uses `requestAnimationFrame`. Only the second hand's transform changes each frame, and the component still re-renders once a second. `bounce`, `ease` and `anticipate` are timed so the hand reaches each mark exactly when the second changes, in step with the digital time.

When the user's system asks for reduced motion (`prefers-reduced-motion: reduce`), `bounce`, `ease` and `anticipate` fall back to `tick`. `smooth`, `sweep` and `stop-to-go` don't wobble, so they stay as chosen. In a hidden browser tab the hand pauses with the page, but the digital time and `aria-label` keep updating. `SECOND_HAND_MOTIONS` lists the motions (`[{ id, label }]`) for a picker, and `secondHandAngle(motion, seconds, ms)` returns the angle in degrees.

## Helpers

```ts
import { getTimeInZone, formatDigitalTime } from '@studiotoolkit/analog-clock';

getTimeInZone('Asia/Kolkata');              // { hours: 15, minutes: 45, seconds: 30 }
formatDigitalTime({ hours: 15, minutes: 45, seconds: 30 });              // "03:45:30 PM"
formatDigitalTime({ hours: 15, minutes: 45, seconds: 30 }, true, '24h'); // "15:45:30"
```

## Server rendering

The clock works with server rendering (Next.js, Remix and similar). On the server, and on the browser's first render, it draws the dial without hands or time, so both renders match and React reports no hydration error. The hands and time appear as soon as the component mounts. A hidden placeholder keeps the digital time's space, so nothing shifts.

## Accessibility

The SVG has `role="img"` and an `aria-label` with the label and current time, for example `"London: 10:15:30 AM"`. Before the time is known, it reads `"London: Clock"`.

## License

MIT
