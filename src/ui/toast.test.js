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

const lastOptions = (index = 0) => Toastify.mock.calls[index][0];
const nodeOf = (index = 0) => lastOptions(index).node;

describe('toast', () => {
  it.each([
    ['success', 'text-teal-500'],
    ['error', 'text-red-500'],
    ['warning', 'text-yellow-500'],
    ['info', 'text-primary'],
  ])('%s renders a Preline toast node with its %s icon', (type, iconColor) => {
    toast[type]('hello');

    expect(Toastify).toHaveBeenCalledTimes(1);
    expect(showToast).toHaveBeenCalledTimes(1);
    expect(lastOptions()).toMatchObject({
      duration: 3000,
      gravity: 'top',
      position: 'right',
      stopOnFocus: true,
    });

    const node = nodeOf();
    expect(node.getAttribute('role')).toBe('alert');
    expect(node).toHaveClass('max-w-xs', 'w-full', 'p-4', 'bg-layer', 'border', 'border-layer-line', 'rounded-xl', 'shadow-lg');

    const content = node.firstElementChild;
    expect(content).toHaveClass('flex', 'gap-x-3');

    const icon = content.querySelector('svg');
    expect(icon).toHaveClass('shrink-0', 'size-4', 'mt-0.5', iconColor);
    expect(icon.getAttribute('viewBox')).toBe('0 0 16 16');
    expect(icon.getAttribute('fill')).toBe('currentColor');
    expect(icon.getAttribute('aria-hidden')).toBe('true');
    expect(icon.querySelectorAll('path')).toHaveLength(1);

    const message = content.querySelector('.grow');
    expect(message).toHaveClass('grow');
    expect(message.firstElementChild.tagName).toBe('P');
    expect(message.firstElementChild).toHaveClass('text-sm', 'text-layer-foreground');
    expect(message.textContent).toBe('hello');
  });

  it('draws a different icon shape per type', () => {
    ['info', 'success', 'error', 'warning'].forEach((type) => toast[type]('x'));

    const paths = [0, 1, 2, 3].map((i) => nodeOf(i).querySelector('path').getAttribute('d'));
    expect(new Set(paths).size).toBe(4);
    expect(paths[0]).toMatch(/^M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16z/);
    expect(paths[1]).toMatch(/^M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3\.97-3\.03/);
    expect(paths[2]).toMatch(/^M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5\.354 4\.646/);
    expect(paths[3]).toMatch(/^M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a\.905/);
  });

  it('neutralizes the Toastify default look so only the Preline card shows', () => {
    toast.success('hello');

    const { style, escapeMarkup, className } = lastOptions();
    expect(style).toMatchObject({ background: 'transparent', boxShadow: 'none', padding: '0' });
    expect(style.width).toBe('min(20rem, calc(100vw - 2rem))');
    expect(style.maxWidth).toBe('calc(100vw - 2rem)');
    expect(escapeMarkup).not.toBe(false);
    expect(typeof className).toBe('string');
  });

  it('renders the message as TEXT: markup in it is never parsed', () => {
    toast.error('<b>bold</b> <img src=x onerror=alert(1)>');

    const node = nodeOf();
    expect(node.querySelector('b')).toBeNull();
    expect(node.querySelector('img')).toBeNull();
    expect(node.querySelector('p').textContent).toBe('<b>bold</b> <img src=x onerror=alert(1)>');
  });

  it('allows overriding the duration', () => {
    toast.error('boom', 5000);
    expect(lastOptions().duration).toBe(5000);
  });

  it('show() defaults to the info icon when the type is missing or unknown', () => {
    toast.show('a');
    toast.show('b', 'nope');
    [0, 1].forEach((i) => {
      expect(nodeOf(i).querySelector('svg')).toHaveClass('text-primary');
      expect(nodeOf(i).querySelector('path').getAttribute('d')).toMatch(/^M8 16A8 8 0 1 0 8 0/);
    });
  });

  it('works when destructured (no reliance on `this`)', () => {
    const { warning } = toast;
    warning('careful', 10000);
    expect(lastOptions()).toMatchObject({ duration: 10000 });
    expect(nodeOf().querySelector('svg')).toHaveClass('text-yellow-500');
  });
});

describe('toast placement by viewport', () => {
  it('keeps the top/right placement on wide viewports', () => {
    stubViewport(false);

    toast.success('hello');

    expect(lastOptions()).toMatchObject({ gravity: 'top', position: 'right' });
  });

  it('moves to the bottom center on phones (<= 576px) so it never covers the modal header or first fields', () => {
    stubViewport(true);

    toast.error('boom');

    expect(window.matchMedia).toHaveBeenCalledWith('(max-width: 576px), (pointer: coarse) and (max-height: 500px)');
    expect(lastOptions()).toMatchObject({
      gravity: 'bottom',
      position: 'center',
      duration: 3000,
      stopOnFocus: true,
    });
    expect(nodeOf().textContent).toBe('boom');
  });
});
