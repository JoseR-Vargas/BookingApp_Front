import { useEffect, useRef } from 'react';
import { usePrelineInstance } from '../../lib/usePrelineInstance.js';

const DROPDOWN =
  'z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-md border border-select-line bg-select p-1 shadow-lg focus:outline-hidden';
const OPTION =
  'hs-selected:bg-accent-muted flex w-full cursor-pointer rounded-md px-4 py-2 text-base hover:bg-select-item-hover focus:bg-select-item-focus focus:outline-hidden hs-select-disabled:pointer-events-none hs-select-disabled:opacity-60';
// Preline renders each entry as a bare <div>; role="option" completes the listbox it creates.
const OPTION_TAG = '<div role="option"></div>';
const OPTION_TEMPLATE =
  '<div class="flex w-full items-center justify-between"><span data-title></span><span class="hidden hs-selected:block"><i class="fas fa-check text-xs text-accent"></i></span></div>';
const CHEVRON =
  '<div class="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-text-secondary"><i class="fas fa-chevron-down"></i></div>';

// Legacy `.form-select option` colors: free slots green, booked (disabled) slots red. They are set per
// option (not in OPTION) so two competing `text-*` utilities never depend on stylesheet order.
const optionLook = (disabled) => JSON.stringify({
  additionalClasses: [[null, [disabled ? 'text-error' : 'text-success']]],
});

const escapeAttribute = (text) => String(text).replace(/&/g, '&amp;').replace(/"/g, '&quot;');

/**
 * Controlled select backed by Preline's advanced select. The native <select> stays in the DOM (the
 * plugin hides it) as the source of truth for the markup and for forms/tests.
 *
 * DOM ownership: Preline reads the <option>s once, moves the <select> into a wrapper it creates
 * (inside this component's container) and builds its own toggle/list from them. React keeps owning
 * the <select> and its <option>s, so when the options or the placeholder change (availability
 * refreshing) React updates them in place and the plugin instance is destroyed and rebuilt on the
 * SAME element: `destroy()` puts the <select> back where React expects it. Changes of the selected
 * value alone never rebuild; they are pushed with `setValue`.
 *
 * Until the plugin chunk has loaded (or if it never does) the native <select> stays visible with
 * `nativeClassName`, so the field never disappears; the plugin hides it once its own toggle exists.
 *
 * @param {{value: string, label: string, disabled?: boolean}[]} options
 */
export default function Select({
  value,
  onChange,
  options,
  placeholder,
  ariaLabel,
  describedBy,
  required,
  toggleClassName,
  nativeClassName = '',
}) {
  const selectRef = useRef(null);
  const pluginRef = useRef(null);
  const latest = useRef({ onChange, value });
  latest.current = { onChange, value };
  // Last value this component has seen or reported: the plugin's `change` event and the native
  // one fired on the <select> describe the same pick and must not be reported twice.
  const known = useRef(value);
  // Placeholder + options: what the plugin read when it was built. A change means a rebuild.
  const signature = [
    placeholder,
    ...options.map((option) => `${option.value}|${option.label}|${option.disabled ? 1 : 0}`),
  ].join('\n');

  const report = (next) => {
    if (next === known.current) return;
    known.current = next;
    latest.current.onChange(next);
  };

  const toggleTag = `<button type="button" aria-haspopup="listbox" aria-expanded="false" aria-label="${escapeAttribute(ariaLabel)}"${describedBy ? ` aria-describedby="${escapeAttribute(describedBy)}"` : ''}></button>`;
  const config = JSON.stringify({
    placeholder,
    toggleTag,
    toggleClasses: toggleClassName,
    dropdownClasses: DROPDOWN,
    optionTag: OPTION_TAG,
    optionClasses: OPTION,
    optionTemplate: OPTION_TEMPLATE,
    extraMarkup: CHEVRON,
  });

  usePrelineInstance(
    'select',
    selectRef,
    {
      // Lazy: the chunk may still be loading when the value changes, the plugin must start from the latest.
      options: () => ({ value: latest.current.value }),
      setup: (instance) => {
        pluginRef.current = instance;
        instance.on('change', (next) => report(next));
        return () => {
          pluginRef.current = null;
        };
      },
    },
    [signature],
  );

  // A value changed from outside (form reset, a slot that stopped being free) must reach the toggle.
  useEffect(() => {
    if (value === known.current) return;
    known.current = value;
    if (pluginRef.current) pluginRef.current.setValue(value);
  }, [value]);

  return (
    <div>
      <select
        ref={selectRef}
        className={nativeClassName}
        required={required}
        aria-label={ariaLabel}
        aria-describedby={describedBy}
        data-hs-select={config}
        value={value}
        onChange={(event) => report(event.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            data-hs-select-option={optionLook(option.disabled)}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
