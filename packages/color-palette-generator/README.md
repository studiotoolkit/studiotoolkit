# @studiotoolkit/color-palette-generator

Generate color palettes (Total 57) using various algorithms including Algorithmic (11), Contrast (7), Data visualization (7), Harmony (11), Image (10), Perceptual (10), and design specific (60-30-10) generators.

**Play around and Generate component code here:**  
https://studiotoolkit.github.io/build-palette-generator

**Complete Demo:**  
https://studiotoolkit.github.io/demo-all

**Complete Documentation:**  
https://studiotoolkit.github.io/color-palettes

**60-30-10 Design Documentation:**  
https://studiotoolkit.github.io/60-30-10

**Radium Colors Generation Documentation:**  
https://studiotoolkit.github.io/radium-help

## Installation

```bash
pnpm add @studiotoolkit/color-palette-generator
```

## Usage

```typescript
import {
  AlgorithmicGenerator,
  ContrastGenerator,
  HarmonyGenerator,
  ImageGenerator,
  PerceptualGenerator,
  RadiumGenerator,
  DataVisualsGenerator,
  Select603010,
} from '@studiotoolkit/color-palette-generator';

// Generate a harmony-based palette
const harmonyPalette = HarmonyGenerator.generate('#FF5733');

// Generate a contrast palette
const contrastPalette = ContrastGenerator.generate('#FF5733');

// Generate from an image
const imagePalette = await ImageGenerator.extractFromImage(imageElement);
```

## Generators

- **AlgorithmicGenerator** - Mathematical color generation algorithms
- **ContrastGenerator** - Generate high-contrast color combinations
- **DataVisualsGenerator** - Palettes optimized for data visualization
- **HarmonyGenerator** - Color harmony-based palettes (complementary, triadic, etc.)
- **ImageGenerator** - Extract color palettes from images
- **PerceptualGenerator** - Perceptually uniform color palettes
- **RadiumGenerator** - Design system color generation
- **Select603010** - 60-30-10 color rule generator

## License

MIT
