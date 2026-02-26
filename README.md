# Studio Toolkit

A monorepo containing color-related React components and utilities.

## Packages

### Components

- **@studiotoolkit/color-from-image** - Extract colors from images
- **@studiotoolkit/color-palette** - Display and manage color palettes
- **@studiotoolkit/color-wheel** - Interactive color wheel component

### Libraries

- **@studiotoolkit/color-palette-generator** - Generate color palettes using various algorithms

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Installation

```bash
pnpm install
```

### Build

```bash
pnpm build
```

### Development

```bash
pnpm dev
```

## Project Structure

```
studiotoolkit/
├── packages/
│   ├── color-from-image/
│   ├── color-palette/
│   ├── color-wheel/
│   └── color-palette-generator/
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## License

MIT
