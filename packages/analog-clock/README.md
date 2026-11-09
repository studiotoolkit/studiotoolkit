# Analog Clock

A live analog clock React component, drawn in SVG. It supports any IANA time zone, light and dark themes, and an optional digital readout. There are no runtime dependencies besides React and no stylesheet to import.

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
| `theme`       | `"light" \| "dark"`   | `"light"`      | Dial colour scheme.                                             |
| `borderColor` | `string`              | theme colour   | Bezel colour.                                                   |
| `showSeconds` | `boolean`             | `true`         | Show the second hand (and seconds in the digital readout).      |
| `showDigital` | `boolean`             | `true`         | Show the digital time below the dial.                           |

## Helpers

```ts
import { getTimeInZone, formatDigitalTime } from '@studiotoolkit/analog-clock';

getTimeInZone('Asia/Kolkata');              // { hours: 15, minutes: 45, seconds: 30 }
formatDigitalTime({ hours: 15, minutes: 45, seconds: 30 }); // "03:45:30 PM"
```

## Accessibility

The SVG has `role="img"` and an `aria-label` with the label and current time, for example `"London: 10:15:30 AM"`.

## License

MIT
