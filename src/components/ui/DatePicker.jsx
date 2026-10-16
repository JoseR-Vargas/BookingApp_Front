import { useEffect, useLayoutEffect, useRef } from 'react';
import { usePrelineInstance } from '../../lib/usePrelineInstance.js';

// vanilla-calendar-pro positions its popup with inline document coordinates (it is appended to
// <body>). The popup is moved inside the host (see onShow) and anchored below the input instead:
// `!` utilities beat those inline coordinates.
// Phones/tablets in portrait (<= 768px): the popup is centered under the field with a viewport-aware
// width (the field's width clamped to 18-24rem, never wider than the screen minus 1rem per side)
// instead of being anchored to one edge, so it stays symmetric whether the field is narrower
// (admin filter) or wider than the calendar.
const POPUP_POSITION =
  'left-0! top-full! z-50 mt-1 min-w-72 ' +
  'lte-md:left-1/2! lte-md:min-w-0 lte-md:w-[min(clamp(18rem,100%,24rem),calc(100vw_-_2rem))] lte-md:-translate-x-1/2';
const NO_MIN_DATE = '1970-01-01';

/**
 * Date field backed by Preline's datepicker. It is a controlled component whose value is always
 * an ISO date ('YYYY-MM-DD') or '', exactly like the native <input type="date"> it replaces.
 *
 * DOM ownership: Preline's `destroy()` swaps the <input> for a clone and the plugin writes the
 * input's value behind React's back, so React must not own that element. React renders only the
 * empty host <div>; the <input> is created, configured and removed imperatively. Everything else
 * (selection, popup) lives inside the host as well, so unmounting the host removes it all.
 *
 * Accessibility: the field is read-only (typing dates is replaced by the calendar), keeps its
 * accessible name and `required`, and Escape closes the calendar before anything around it
 * (e.g. a dialog) reacts.
 */
export default function DatePicker({
  value,
  onChange,
  min,
  required = false,
  ariaLabel,
  placeholder = '',
  className = '',
}) {
  const hostRef = useRef(null);
  const inputRef = useRef(null);
  const pluginRef = useRef(null);
  const latest = useRef({ value, onChange });
  latest.current = { value, onChange };

  useLayoutEffect(() => {
    const host = hostRef.current;
    const input = document.createElement('input');
    input.type = 'text';
    input.readOnly = true;
    input.required = required;
    input.className = `hs-datepicker ${className}`;
    input.setAttribute('aria-label', ariaLabel);
    input.setAttribute('aria-expanded', 'false');
    if (min) input.setAttribute('min', min);
    if (placeholder) input.setAttribute('placeholder', placeholder);
    input.setAttribute('data-hs-datepicker', JSON.stringify({
      type: 'default',
      mode: 'default',
      selectionDatesMode: 'single',
      dateMin: min || NO_MIN_DATE,
      locale: 'es',
      // The plugin formats the input text as <year><separator><month><separator><day>.
      inputModeOptions: { dateSeparator: '-' },
      styles: { calendar: POPUP_POSITION },
    }));
    input.value = latest.current.value || '';

    // Not fired by the plugin (it reports through its own `change` event); fired by assistive
    // technology / programmatic edits and by tests.
    const handleNativeChange = (event) => latest.current.onChange(event.target.value);
    input.addEventListener('change', handleNativeChange);

    host.appendChild(input);
    inputRef.current = input;

    return () => {
      input.removeEventListener('change', handleNativeChange);
      host.replaceChildren();
      inputRef.current = null;
    };
  }, [min, required, ariaLabel, placeholder, className]);

  usePrelineInstance(
    'datepicker',
    inputRef,
    {
      // Lazy: the chunk may still be loading when the value changes, so read it at construction time.
      options: () => ({
        selectedDates: latest.current.value ? [latest.current.value] : [],
        onShow: (calendar) => {
          const popup = calendar.context.mainElement;
          if (hostRef.current && popup.parentElement !== hostRef.current) hostRef.current.appendChild(popup);
        },
      }),
      setup: (instance) => {
        pluginRef.current = instance;
        instance.on('change', ({ selectedDates }) => {
          const picked = (selectedDates && selectedDates[0]) || '';
          latest.current.onChange(picked);
          // A single date is a finished interaction: close the calendar (the plugin keeps it open).
          // `hide()` also hands the focus back to the input when it was inside the calendar.
          if (picked && instance.vanillaCalendar) instance.vanillaCalendar.hide();
        });

        // Capture phase on window: runs before the dialog's / calendar's own document listeners.
        const closeCalendarOnEscape = (event) => {
          const calendar = instance.vanillaCalendar;
          if (event.key !== 'Escape' || !calendar || !calendar.context.isShowInInputMode) return;
          event.stopPropagation();
          calendar.hide();
        };
        window.addEventListener('keydown', closeCalendarOnEscape, true);

        return () => {
          window.removeEventListener('keydown', closeCalendarOnEscape, true);
          pluginRef.current = null;
        };
      },
    },
    [min, required, ariaLabel, placeholder, className],
  );

  // External changes (a form reset, the "Actualizar" button) must reach the input and the calendar.
  useEffect(() => {
    const input = inputRef.current;
    const next = value || '';
    if (!input || input.value === next) return;

    input.value = next;
    try {
      if (pluginRef.current && pluginRef.current.vanillaCalendar) {
        pluginRef.current.vanillaCalendar.set({ selectedDates: next ? [next] : [] });
      }
    } catch (error) {
      console.error('Failed to sync the datepicker selection', error);
    }
  }, [value]);

  return <div ref={hostRef} className="relative" />;
}
