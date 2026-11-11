import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import config from '../configuration.json';
import {
  CLOCK_FACES,
  SECOND_HAND_MOTIONS,
  SECOND_HAND_STYLES,
  DIAL_NUMBERS,
  DIAL_NUMERALS,
  DIAL_MARKERS,
  DIAL_MINUTE_TICKS,
} from '../src/index';

// configuration.json documents every <Clock> prop; these tests keep it in
// step with the code.
const props = config.groups.flatMap((g) => g.props);
const byName = Object.fromEntries(props.map((p) => [p.name, p]));

/** Prop names declared in the ClockProps interface. */
function clockPropNames(): string[] {
  const src = readFileSync(join(__dirname, '../src/Clock.tsx'), 'utf8');
  const body = src.match(/export interface ClockProps \{([\s\S]*?)\n\}/)![1];
  return [...body.matchAll(/^ {2}(\w+)\?:/gm)].map((m) => m[1]);
}

describe('configuration.json', () => {
  it('documents every ClockProps prop exactly once', () => {
    const names = props.map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
    expect([...names].sort()).toEqual(clockPropNames().sort());
  });

  it.each([
    ['face', CLOCK_FACES],
    ['secondHandMotion', SECOND_HAND_MOTIONS],
    ['secondHandStyle', SECOND_HAND_STYLES],
    ['numbers', DIAL_NUMBERS],
    ['numerals', DIAL_NUMERALS],
    ['mainMarker', DIAL_MARKERS],
    ['marker12', DIAL_MARKERS],
    ['hourMarker', DIAL_MARKERS],
    ['minuteTicks', DIAL_MINUTE_TICKS],
  ] as const)('lists the same %s values and labels as the code', (name, list) => {
    const values = (byName[name] as { values: { value: string; label: string }[] }).values;
    expect(values.map(({ value, label }) => ({ id: value, label }))).toEqual(
      list.map(({ id, label }) => ({ id, label })),
    );
  });

  it('gives every prop a type and a description', () => {
    for (const p of props) {
      expect(p.type, p.name).toBeTruthy();
      expect(p.description, p.name).toBeTruthy();
      expect('default' in p, p.name).toBe(true);
    }
  });

  it('uses only documented props and values in the example', () => {
    for (const [name, value] of Object.entries(config.example.props)) {
      const p = byName[name] as { values?: { value: unknown }[] };
      expect(p, name).toBeDefined();
      if (p.values) expect(p.values.map((v) => v.value), name).toContain(value);
    }
  });
});
