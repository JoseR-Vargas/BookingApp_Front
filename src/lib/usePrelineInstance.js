import { useEffect } from 'react';
import { loadPreline } from './preline.js';

/**
 * Preline registers every instance's keyboard handlers in a global accessibility observer and
 * `destroy()` leaves them there (only the combobox cleans up). A leftover registration keeps reacting
 * to Enter/Escape on the same element (a rebuilt select, a sidebar whose overlay was destroyed) and
 * calls into the destroyed instance, so it is removed here.
 */
function unregisterKeyboardHandlers(instance) {
  const observer = window.HSAccessibilityObserver;
  if (instance && instance.accessibilityComponent && observer && observer.unregisterComponent) {
    observer.unregisterComponent(instance.accessibilityComponent);
  }
}

/**
 * Binds one Preline plugin instance to the element held by `ref`.
 *
 * React renders the markup; once the plugin chunk is loaded the instance is constructed on that
 * element, and it is destroyed again when the effect is cleaned up (unmount, StrictMode
 * double-invoke, or a change in `deps`). A cancelled flag covers the window where the chunk is
 * still loading when the component goes away.
 *
 * @param {'dropdown'|'overlay'|'select'|'combobox'|'datepicker'|'datatable'} name
 * @param {{ current: HTMLElement|null }} ref  element the plugin attaches to
 * @param {object} config
 * @param {object|(() => object)} [config.options]  constructor options (merged over the element's
 *        data-hs-* JSON). A function is evaluated when the instance is actually built, i.e. AFTER the
 *        cleanup of whatever it replaces, so it can read state saved by that cleanup
 * @param {(instance: object) => (void|(() => void))} [config.setup]  runs once the instance exists;
 *        may return its own cleanup (event unsubscription, state capture, ...)
 * @param {boolean} [config.enabled=true]
 * @param {Array} deps  effect dependencies: a change tears the instance down and builds a new one
 */
export function usePrelineInstance(name, ref, { options, setup, enabled = true } = {}, deps = []) {
  useEffect(() => {
    if (!enabled) return undefined;

    let cancelled = false;
    let instance = null;
    let teardown;

    loadPreline(name)
      .then((Plugin) => {
        const element = ref.current;
        if (cancelled || !element) return;
        instance = new Plugin(element, typeof options === 'function' ? options() : options);
        teardown = setup ? setup(instance) : undefined;
      })
      .catch((error) => {
        console.error(`Failed to initialize Preline ${name}`, error);
      });

    return () => {
      cancelled = true;
      if (typeof teardown === 'function') teardown();
      try {
        if (instance) instance.destroy();
      } catch (error) {
        console.error(`Failed to destroy Preline ${name}`, error);
      }
      unregisterKeyboardHandlers(instance);
      instance = null;
    };
  }, [name, enabled, ...deps]);
}
