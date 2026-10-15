/*
 * Preline UI runtime strategy: SINGLE-PLUGIN packages, loaded lazily and only when a component
 * that needs them mounts (https://preline.co/docs/guides/react-vite.html).
 *
 *  - Each plugin comes from its own `@preline/<plugin>/non-auto.mjs` entry: nothing runs on import,
 *    the component decides when to construct an instance (`new HSX(element)`) and destroys it on
 *    unmount (see usePrelineInstance). `autoInit()` is not used: it scans the DOM once per route,
 *    but this app mounts Preline markup late (lazy admin chunk, dialogs that open on demand).
 *  - The FULL `preline` package is deliberately not installed/imported: loading it together with
 *    the single-plugin entries would duplicate constructors, collections and global listeners.
 *  - Third-party globals required by a plugin are loaded first, in their own lazy modules.
 *  - Every plugin gets its own chunk, so the public site pays for datepicker + select only and
 *    the admin panel for dropdown + datatable + datepicker + combobox + overlay.
 */

const loaders = {
  dropdown: () => import('@preline/dropdown/non-auto.mjs'),
  overlay: () => import('@preline/overlay/non-auto.mjs'),
  select: () => import('@preline/select/non-auto.mjs'),
  combobox: () => import('@preline/combobox/non-auto.mjs'),
  datepicker: async () => {
    await import('../vendor-globals-datepicker.js');
    return import('@preline/datepicker/non-auto.mjs');
  },
  datatable: async () => {
    await import('../vendor-globals.js');
    return import('@preline/datatable/non-auto.mjs');
  },
};

// Global registries each plugin keeps its instances in. The plugins only create them inside
// `autoInit()` (never called here) and later read them in `destroy()`, so they are created up front.
const COLLECTIONS = {
  dropdown: ['$hsDropdownCollection'],
  overlay: ['$hsOverlayCollection'],
  select: ['$hsSelectCollection'],
  combobox: ['$hsComboBoxCollection'],
  datepicker: ['$hsDatepickerCollection', '$hsSelectCollection'],
  datatable: ['$hsDataTableCollection'],
};

function ensureCollections(name) {
  COLLECTIONS[name].forEach((key) => {
    if (!Array.isArray(window[key])) window[key] = [];
  });
}

const cache = new Map();

/** Resolves to the plugin class (HSDropdown, HSSelect, ...). Loaded once, shared by every caller. */
export function loadPreline(name) {
  const load = loaders[name];
  if (!load) return Promise.reject(new Error(`Unknown Preline plugin: ${name}`));

  if (!cache.has(name)) {
    const promise = load().then((module) => {
      ensureCollections(name);
      return module.default;
    });
    // A failed chunk (offline) must be retried by the next mount instead of being cached forever.
    promise.catch(() => cache.delete(name));
    cache.set(name, promise);
  }
  return cache.get(name);
}
