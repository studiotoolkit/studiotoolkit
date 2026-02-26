// Type definitions for color palette generator

export interface Color {
  hex: string;
  rgb?: { r: number; g: number; b: number };
  hsl?: { h: number; s: number; l: number };
}

export interface PaletteGeneratorOptions {
  baseColor?: string;
  count?: number;
  algorithm?: string;
}

export interface Palette {
  colors: Color[];
  name?: string;
  metadata?: Record<string, unknown>;
}
