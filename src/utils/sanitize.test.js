import { describe, it, expect } from 'vitest';
import { sanitizeInput, decodeEntities } from './sanitize.js';

describe('sanitizeInput', () => {
  it('returns an empty string for falsy input', () => {
    expect(sanitizeInput('')).toBe('');
    expect(sanitizeInput(null)).toBe('');
    expect(sanitizeInput(undefined)).toBe('');
  });

  it('escapes the five HTML-significant characters exactly like the legacy app', () => {
    expect(sanitizeInput(`<script>alert("x")</script>`)).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;'
    );
    expect(sanitizeInput("O'Brien & Sons")).toBe('O&#x27;Brien &amp; Sons');
  });

  it('escapes ampersands first so entities are not double-mangled in the wrong order', () => {
    expect(sanitizeInput('<')).toBe('&lt;');
    expect(sanitizeInput('&lt;')).toBe('&amp;lt;');
  });

  it('coerces non-string truthy values to string', () => {
    expect(sanitizeInput(42)).toBe('42');
  });
});

describe('decodeEntities', () => {
  it('returns an empty string for falsy input', () => {
    expect(decodeEntities('')).toBe('');
    expect(decodeEntities(null)).toBe('');
    expect(decodeEntities(undefined)).toBe('');
  });

  it('reverses exactly the five sanitize entities', () => {
    expect(decodeEntities('&amp; &lt; &gt; &quot; &#x27;')).toBe(`& < > " '`);
  });

  it('decodes &amp; last so "&amp;lt;" becomes "&lt;" and not "<"', () => {
    expect(decodeEntities('&amp;lt;')).toBe('&lt;');
    expect(decodeEntities('&amp;amp;')).toBe('&amp;');
  });

  it('round-trips arbitrary user input', () => {
    const samples = [
      `<script>alert("xss")</script>`,
      `Tom & Jerry's "show"`,
      '&lt;already&gt; escaped-looking text &amp;',
      'plain text',
    ];
    for (const sample of samples) {
      expect(decodeEntities(sanitizeInput(sample))).toBe(sample);
    }
  });

  it('leaves unrelated entities untouched', () => {
    expect(decodeEntities('&nbsp;&copy;')).toBe('&nbsp;&copy;');
  });
});
