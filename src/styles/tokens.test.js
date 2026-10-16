import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const css = read('../index.css');
const prelineTheme = read('../../node_modules/@preline/dropdown/theme.css');

// Every semantic Preline token the table / toast / loading / spinner markup relies on must resolve
// to a Tailwind color utility (theme.css `--color-*`) AND to a palette value (index.css `:root`).
const TOKENS = [
  'layer', 'layer-line', 'layer-foreground', 'primary', 'primary-hover', 'primary-focus',
  'primary-foreground', 'foreground', 'muted-foreground-1', 'table-line', 'scrollbar-track',
  'scrollbar-thumb', 'surface-4',
];

describe('Preline tokens used by the table / toast / loading / spinner markup', () => {
  it.each(TOKENS)('%s is exposed as a color utility and mapped to the app palette', (token) => {
    expect(prelineTheme).toContain(`--color-${token}: var(--${token});`);
    expect(css).toMatch(new RegExp(`^\\s*--${token}:`, 'm'));
  });

  it('defines the spinner-wave keyframes and a reduced-motion rule for the bars', () => {
    expect(css).toMatch(/@keyframes spinner-wave\s*{/);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*spinner-wave-bar/);
  });
});
