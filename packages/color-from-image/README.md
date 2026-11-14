# Color From Image for React

[![npm version](https://img.shields.io/npm/v/@studiotoolkit/color-from-image.svg)](https://www.npmjs.com/package/@studiotoolkit/color-from-image)
[![npm downloads](https://img.shields.io/npm/dm/@studiotoolkit/color-from-image.svg)](https://www.npmjs.com/package/@studiotoolkit/color-from-image)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@studiotoolkit/color-from-image)](https://bundlephobia.com/package/@studiotoolkit/color-from-image)
[![types](https://img.shields.io/npm/types/@studiotoolkit/color-from-image)](https://www.npmjs.com/package/@studiotoolkit/color-from-image)
[![license](https://img.shields.io/npm/l/@studiotoolkit/color-from-image.svg)](./LICENSE)
[![live demo](https://img.shields.io/badge/demo-live-ff9800)](https://studiotoolkit.github.io/build-color-from-image)

A **React component that pulls the dominant colours out of an image**. Paste, drop or pass in an image and it returns a 16-colour palette, found with K-Means++ clustering in the OKLab colour space. It is written in TypeScript and needs nothing besides React.

**Live demo:** [https://studiotoolkit.github.io/build-color-from-image](https://studiotoolkit.github.io/build-color-from-image). Try every option, then copy the generated code.

- **All components together:** [https://studiotoolkit.github.io/demo-all](https://studiotoolkit.github.io/demo-all)
- **How it works:** [https://studiotoolkit.github.io/color-from-image-help](https://studiotoolkit.github.io/color-from-image-help)

<p align="center">
  <img src="https://cdn.jsdelivr.net/gh/studiotoolkit/studiotoolkit@main/packages/color-from-image/assets/Empty-Canvas.png" width="200" alt="Empty canvas"/>
  <img src="https://cdn.jsdelivr.net/gh/studiotoolkit/studiotoolkit@main/packages/color-from-image/assets/Image-Pasted.png" width="200" alt="Image pasted"/>
  <img src="https://cdn.jsdelivr.net/gh/studiotoolkit/studiotoolkit@main/packages/color-from-image/assets/Settings.png" width="200" alt="Settings"/>
</p>

## Features

- **Perceptual colour extraction.** Clustering runs in OKLab, so colours that look alike are grouped together.
- **Keeps small vivid colours.** Saturated pixels are weighted up, so a bright accent isn't swallowed by a large muted background.
- **Three ways in.** Paste with Ctrl+V / Cmd+V, drag and drop a file, or pass an `imageUrl` or `imageFile`.
- **CORS-aware.** Remote images are loaded with `crossOrigin="anonymous"`, with a fallback when the server doesn't allow it.
- **Clear on demand** with the `clearTrigger` prop.
- **Light.** There are no runtime dependencies, and it works with React 18 and 19.

## Installation

```bash
npm install @studiotoolkit/color-from-image
# or
pnpm add @studiotoolkit/color-from-image
# or
yarn add @studiotoolkit/color-from-image
```

## Quick start

```tsx
import { ColorFromImage } from '@studiotoolkit/color-from-image';
import '@studiotoolkit/color-from-image/style.css';

export default function App() {
  return <ColorFromImage onColorsExtracted={(colors) => console.log(colors.palette)} />;
}
```

Paste an image anywhere on the page, or drop one onto the canvas. `onColorsExtracted` receives the palette:

```json
{
  "palette": [
    "#627bb8", "#53689e", "#4c597d", "#6c6d67",
    "#6b3d18", "#657092", "#43311b", "#494b4e",
    "#81889e", "#965528", "#bc773f", "#221b15",
    "#808748", "#615d2a", "#cdab71", "#f1d85d"
  ]
}
```

Colours are sorted by a mix of how much of the image they cover and how vivid they are.

## Examples

### Load from a URL

```tsx
<ColorFromImage
  imageUrl="https://example.com/photo.jpg"
  width={320}
  height={240}
  onColorsExtracted={({ palette }) => setPalette(palette)}
/>
```

The server must send CORS headers for the pixels to be readable.

### File input and a clear button

```tsx
import { useState } from 'react';
import { ColorFromImage, type ColorEntry } from '@studiotoolkit/color-from-image';
import '@studiotoolkit/color-from-image/style.css';

export function Extractor() {
  const [file, setFile] = useState<File | null>(null);
  const [clear, setClear] = useState(0);
  const [colors, setColors] = useState<string[]>([]);

  return (
    <>
      <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      <button onClick={() => setClear((n) => n + 1)}>Clear</button>
      <ColorFromImage
        imageFile={file}
        clearTrigger={clear}
        borderColor="#888"
        borderThickness={2}
        onColorsExtracted={(c: ColorEntry) => setColors(c.palette)}
      />
      <div style={{ display: 'flex' }}>
        {colors.map((hex) => (
          <div key={hex} style={{ background: hex, width: 24, height: 24 }} />
        ))}
      </div>
    </>
  );
}
```

### Pair with Color Palette

Feed the result straight into [`@studiotoolkit/color-palette`](https://www.npmjs.com/package/@studiotoolkit/color-palette) to display it:

```tsx
<ColorFromImage onColorsExtracted={setPaletteData} />
<ColorPalette paletteData={paletteData} displayType="square" showCopyButton />
```

## Props

Every prop is optional.

| Prop                | Type                            | Default     | Description                                                       |
| ------------------- | ------------------------------- | ----------- | ----------------------------------------------------------------- |
| `width`             | `number`                        | `200`       | Canvas width in pixels.                                           |
| `height`            | `number`                        | `200`       | Canvas height in pixels.                                          |
| `borderColor`       | `string`                        | `"#cccccc"` | Canvas border colour.                                             |
| `borderThickness`   | `number`                        | `1`         | Canvas border width in pixels.                                    |
| `imageUrl`          | `string`                        | —           | Load and analyse an image from a URL.                             |
| `imageFile`         | `File \| null`                  | —           | Load and analyse a `File`, e.g. from an `<input type="file">`.    |
| `clearTrigger`      | `number`                        | —           | Change this number to clear the canvas.                           |
| `onColorsExtracted` | `(colors: ColorEntry) => void`  | —           | Called with `{ palette: string[] }` after each image is analysed. |

The `ColorEntry` type is exported.

## Contributing

Issues and pull requests are welcome on [GitHub](https://github.com/studiotoolkit/studiotoolkit/issues).

## License

[MIT](./LICENSE)
