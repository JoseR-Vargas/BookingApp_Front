// ===== WRAPPER DE TOASTIFY =====
// Centraliza tipos, iconos y duración por defecto. Cada toast es un nodo con el look del toast de
// Preline (card `bg-layer` + icono + texto); Toastify solo lo posiciona y lo anima.

import Toastify from 'toastify-js';
import 'toastify-js/src/toastify.css';
import { APP_CONFIG } from '../config/appConfig.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

// Preline toast icons (16x16, filled). `color` is a Tailwind text color: the icon uses currentColor.
const ICONS = {
  info: {
    color: 'text-primary',
    path: 'M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z',
  },
  success: {
    color: 'text-teal-500',
    path: 'M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z',
  },
  error: {
    color: 'text-red-500',
    path: 'M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z',
  },
  warning: {
    color: 'text-yellow-500',
    path: 'M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z',
  },
};

// Phones (<= 576px, the `lte-sm` breakpoint, or a touch device in landscape): a top-right toast covers the booking modal's Close
// button and its first fields, so it goes to the bottom center instead. index.css makes it
// click-through there.
const PHONE_QUERY = '(max-width: 576px), (pointer: coarse) and (max-height: 500px)';
const isPhone = () => typeof window !== 'undefined'
  && typeof window.matchMedia === 'function'
  && window.matchMedia(PHONE_QUERY).matches;

function createIcon({ color, path }) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', `shrink-0 size-4 mt-0.5 ${color}`);
  svg.setAttribute('xmlns', SVG_NS);
  svg.setAttribute('width', '16');
  svg.setAttribute('height', '16');
  svg.setAttribute('fill', 'currentColor');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('aria-hidden', 'true');
  const shape = document.createElementNS(SVG_NS, 'path');
  shape.setAttribute('d', path);
  svg.appendChild(shape);
  return svg;
}

// The message is always set as TEXT (never innerHTML): callers pass user-derived strings.
function createToastNode(message, type) {
  const node = document.createElement('div');
  node.className = 'max-w-xs w-full p-4 bg-layer border border-layer-line rounded-xl shadow-lg';
  node.setAttribute('role', 'alert');

  const content = document.createElement('div');
  content.className = 'flex gap-x-3';

  const body = document.createElement('div');
  body.className = 'grow';
  const text = document.createElement('p');
  text.className = 'text-sm text-layer-foreground';
  text.textContent = String(message ?? '');
  body.appendChild(text);

  content.append(createIcon(ICONS[type] || ICONS.info), body);
  node.appendChild(content);
  return node;
}

function show(message, type, duration) {
  const phone = isPhone();
  Toastify({
    node: createToastNode(message, type),
    duration: duration || APP_CONFIG.TOAST_DURATION || 3000,
    gravity: phone ? 'bottom' : 'top',
    position: phone ? 'center' : 'right',
    className: 'toast-preline',
    // Toastify's `.toastify` rules are unlayered and beat Tailwind utilities, so the default gradient,
    // padding and shadow are neutralized inline; the Preline card inside draws the toast.
    // Definite width = Preline's max-w-xs (20rem), capped to the viewport minus 1rem per side so the card
    // fits 320px phones; the same width for every toast also keeps the centered phone placement centered.
    style: {
      background: 'transparent',
      boxShadow: 'none',
      padding: '0',
      borderRadius: '0',
      width: 'min(20rem, calc(100vw - 2rem))',
      maxWidth: 'calc(100vw - 2rem)',
    },
    // The card already has role="alert": no second live region on the wrapper.
    ariaLive: 'off',
    stopOnFocus: true,
  }).showToast();
}

export const toast = {
  show,
  success: (message, duration) => show(message, 'success', duration),
  error: (message, duration) => show(message, 'error', duration),
  warning: (message, duration) => show(message, 'warning', duration),
  info: (message, duration) => show(message, 'info', duration),
};
