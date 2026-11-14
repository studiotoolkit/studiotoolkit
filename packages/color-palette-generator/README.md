# Color Palette Generator

[![npm version](https://img.shields.io/npm/v/@studiotoolkit/color-palette-generator.svg)](https://www.npmjs.com/package/@studiotoolkit/color-palette-generator)
[![npm downloads](https://img.shields.io/npm/dm/@studiotoolkit/color-palette-generator.svg)](https://www.npmjs.com/package/@studiotoolkit/color-palette-generator)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@studiotoolkit/color-palette-generator)](https://bundlephobia.com/package/@studiotoolkit/color-palette-generator)
[![types](https://img.shields.io/npm/types/@studiotoolkit/color-palette-generator)](https://www.npmjs.com/package/@studiotoolkit/color-palette-generator)
[![license](https://img.shields.io/npm/l/@studiotoolkit/color-palette-generator.svg)](./LICENSE)
[![live demo](https://img.shields.io/badge/demo-live-ff9800)](https://studiotoolkit.github.io/build-palette-generator)

A **colour palette generator library** with 57 algorithms: harmony, contrast and accessibility, perceptual colour spaces, data visualisation, image quantisation, generative, Radium design-system colours and the 60-30-10 rule. It is framework-agnostic, written in TypeScript, tree-shakeable and has no runtime dependencies.

**Live demo:** [https://studiotoolkit.github.io/build-palette-generator](https://studiotoolkit.github.io/build-palette-generator). Try every generator, then copy the generated code.

- **All components together:** [https://studiotoolkit.github.io/demo-all](https://studiotoolkit.github.io/demo-all)
- **Every palette explained:** [https://studiotoolkit.github.io/color-palettes](https://studiotoolkit.github.io/color-palettes)
- **60-30-10 rule:** [https://studiotoolkit.github.io/60-30-10](https://studiotoolkit.github.io/60-30-10)
- **Radium colours:** [https://studiotoolkit.github.io/radium-help](https://studiotoolkit.github.io/radium-help)

## Features

| Generator | Function                      | Palettes |
| --------- | ----------------------------- | -------- |
| Harmony   | `generateHarmonyPalettes`     | 12: `harmonyPalette`, `analogous`, `complementary`, `splitComplementary`, `triadic`, `tetradic`, `square`, `accentedAnalogous`, `doubleSplitComplementary`, `ambiguous`, `monochromatic`, `monochromaticTintShade` |
| Contrast  | `generateContrastPalettes`    | 7: `contrastScale`, `accessible`, `wcag`, `apca`, `colorBlindSafe`, `colorTokenized`, `highContrast` |
| Perceptual | `generatePerceptualPalettes` | 10 colour spaces: `lab`, `lch`, `oklab`, `oklch`, `hct`, `cam16`, `hsl`, `hsv`, `jzazbz`, `ipt` |
| Data visualisation | `generateDataVisuals` | 7: `sequential`, `diverging`, `qualitative`, `bivariate`, `cyclical`, `spectral`, `stepped` |
| Image     | `generateImagePalettes`       | 10: `kmeans`, `medianCut`, `dominant`, `vibrant`, `muted`, `octree`, `colorMoments`, `neuralQuant`, `histogram`, `deltaE` |
| Algorithmic | `generateAlgorithmic`       | 11: `random`, `goldenRatio`, `noise`, `temperature`, `bezierInterpolation`, `easeInOut`, `blackbody`, `fibonacci`, `harmonicSeries`, `sinusoidal`, `cubehelix` |
| Radium    | `generateRadiumColors`        | Design-system colours keyed by role (primary, success, warning, …) |
| 60-30-10  | `select60_30_10`              | Five roles: neutral light, neutral dark, main, main shade, accent |

## Installation

```bash
npm install @studiotoolkit/color-palette-generator
# or
pnpm add @studiotoolkit/color-palette-generator
# or
yarn add @studiotoolkit/color-palette-generator
```

## Quick start

Most generators take a palette map, `{ name: string[] }`, and use the first colour they find as the base:

```ts
import { generateHarmonyPalettes } from '@studiotoolkit/color-palette-generator';

const palettes = generateHarmonyPalettes({ base: ['#3b82f6'] });

palettes.triadic;       // ["#3b82f6", "#f63b82", "#82f63b"]
palettes.complementary; // ["#3b82f6", "#f6af3b"]
```

The output is the same `{ name: string[] }` shape, so it can go straight into [`@studiotoolkit/color-palette`](https://www.npmjs.com/package/@studiotoolkit/color-palette) to display.

## Examples

### Harmony, contrast and perceptual

The second argument sets how many colours the scalable palettes return (default 9):

```ts
import {
  generateHarmonyPalettes,
  generateContrastPalettes,
  generatePerceptualPalettes,
} from '@studiotoolkit/color-palette-generator';

generateHarmonyPalettes({ base: ['#3b82f6'] }, 5).monochromatic;
// ["#031e49", "#07419e", "#0b64f4", "#619af8", "#b6d0fc"]

generateContrastPalettes({ base: ['#3b82f6'] }).wcag;

// One colour fades to white; several are interpolated between.
generatePerceptualPalettes({ ramp: ['#3b82f6', '#f97316'] }, 7).oklch;
```

### Data visualisation and algorithmic

```ts
import { generateDataVisuals, generateAlgorithmic } from '@studiotoolkit/color-palette-generator';

const charts = generateDataVisuals({ square: ['#3b82f6', '#f97316'] });
charts.sequential;  // light → dark single-hue ramp
charts.diverging;   // colour A → neutral → colour B

generateAlgorithmic({ square: ['#3b82f6'] }).goldenRatio;
```

### From an image

```ts
import { generateImagePalettes } from '@studiotoolkit/color-palette-generator';

const ctx = canvas.getContext('2d')!;
const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);

const result = generateImagePalettes({ square: [] }, 6, data);
result.vibrant;
result.medianCut;
```

`k` (the second argument) is the number of colours per palette. Without pixel data, the `square` colours are used as hints.

### Radium design-system colours

Each key is read as a role, and the output keeps the same keys and the same number of colours per key:

```ts
import { generateRadiumColors } from '@studiotoolkit/color-palette-generator';

generateRadiumColors({ primary: ['#3b82f6', '#3b82f6', '#3b82f6'] });
// { primary: ["#3b82f6", "#e24956", "#3ba01b"] }
```

### 60-30-10 rule

```ts
import { select60_30_10, toObject, toCssVars } from '@studiotoolkit/color-palette-generator';

const roles = select60_30_10(['#ee5034', '#4d7627', '#f5f0e6', '#222222']);

toObject(roles);
// { neutralLight: "#f5f0e6", neutralDark: "#222222", mainColor: "#ee5034", ... }

toCssVars(roles);
// :root {
//   --color-neutral-light: #f5f0e6;
//   --color-main         : #ee5034;
//   ...
// }
```

Each role also carries its LCH values, a readable text colour and its contrast ratio. `toHexArray` returns the five hex strings in role order.

## Utilities

| Function                         | Returns                                          |
| -------------------------------- | ------------------------------------------------ |
| `hexToRgb(hex)`                  | `{ r, g, b }` in 0–255                           |
| `hexToRgba(hex, alpha)`          | `"rgba(r, g, b, a)"`                             |
| `getLuminance(hex)`              | WCAG relative luminance, 0–1                     |
| `getContrastRatio(a, b)`         | WCAG contrast ratio, 1–21                        |
| `wcagContrast(a, b)`             | WCAG contrast ratio, 1–21                        |
| `getReadableTextColor(bg)`       | `"#000000"` or `"#ffffff"`                       |
| `bestTextOn(bg)`                 | The more readable text colour for a background   |

## Contributing

Issues and pull requests are welcome on [GitHub](https://github.com/studiotoolkit/studiotoolkit/issues).

## License

[MIT](./LICENSE)
