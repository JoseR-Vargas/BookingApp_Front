import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const showToast = vi.fn();
vi.mock('toastify-js', () => ({ default: vi.fn(() => ({ showToast })) }));

import Toastify from 'toastify-js';
import { toast } from './toast.js';

beforeEach(() => {
  Toastify.mockClear();
  showToast.mockClear();
});

afterEach(() => {
  delete window.matchMedia;
});

const stubViewport = (matches) => {
  window.matchMedia = vi.fn(() => ({ matches }));
};

describe('toast', () => {
  it.each([
    ['success', '#28a745'],
    ['error', '#dc3545'],
    ['warning', '#ffc107'],
    ['info', '#17a2b8'],
  ])('%s uses its legacy color and layout options', (type, color) => {
    toast[type]('hello');

    expect(Toastify).toHaveBeenCalledWith({
      text: 'hello',
      duration: 3000,
      gravity: 'top',
      position: 'right',
      style: { background: color },
      stopOnFocus: true,
    });
    expect(showToast).toHaveBeenCalledTimes(1);
  });

  it('allows overriding the duration', () => {
    toast.error('boom', 5000);
    expect(Toastify.mock.calls[0][0].duration).toBe(5000);
  });

  it('show() defaults to the info color when the type is missing or unknown', () => {
    toast.show('a');
    toast.show('b', 'nope');
    expect(Toastify.mock.calls[0][0].style.background).toBe('#17a2b8');
    expect(Toastify.mock.calls[1][0].style.background).toBe('#17a2b8');
  });

  it('works when destructured (no reliance on `this`)', () => {
    const { warning } = toast;
    warning('careful', 10000);
    expect(Toastify.mock.calls[0][0]).toMatchObject({ duration: 10000, style: { background: '#ffc107' } });
  });
});

describe('toast placement by viewport', () => {
  it('keeps the top/right placement on wide viewports', () => {
    stubViewport(false);

    toast.success('hello');

    expect(Toastify.mock.calls[0][0]).toMatchObject({ gravity: 'top', position: 'right' });
  });

  it('moves to the bottom center on phones (<= 576px) so it never covers the modal header or first fields', () => {
    stubViewport(true);

    toast.error('boom');

    expect(window.matchMedia).toHaveBeenCalledWith('(max-width: 576px), (pointer: coarse) and (max-height: 500px)');
    expect(Toastify.mock.calls[0][0]).toMatchObject({
      gravity: 'bottom',
      position: 'center',
      text: 'boom',
      duration: 3000,
      stopOnFocus: true,
      style: { background: '#dc3545' },
    });
  });
});
