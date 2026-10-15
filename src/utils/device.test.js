import { describe, it, expect, vi, afterEach } from 'vitest';
import { isMobileDevice, isSlowConnection } from './device.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('isMobileDevice', () => {
  it('detects mobile user agents', () => {
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)' });
    vi.stubGlobal('innerWidth', 1280);
    expect(isMobileDevice()).toBe(true);
  });

  it('detects narrow viewports (<= 768px)', () => {
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (X11; Linux x86_64)' });
    vi.stubGlobal('innerWidth', 768);
    expect(isMobileDevice()).toBe(true);
  });

  it('is false for wide desktop viewports', () => {
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (X11; Linux x86_64)' });
    vi.stubGlobal('innerWidth', 1280);
    expect(isMobileDevice()).toBe(false);
  });
});

describe('isSlowConnection', () => {
  it('is true for 2g / slow-2g effective types', () => {
    vi.stubGlobal('navigator', { connection: { effectiveType: '2g' } });
    expect(isSlowConnection()).toBe(true);
    vi.stubGlobal('navigator', { connection: { effectiveType: 'slow-2g' } });
    expect(isSlowConnection()).toBe(true);
  });

  it('is false for faster connections or when the API is missing', () => {
    vi.stubGlobal('navigator', { connection: { effectiveType: '4g' } });
    expect(isSlowConnection()).toBe(false);
    vi.stubGlobal('navigator', {});
    expect(isSlowConnection()).toBe(false);
  });
});
