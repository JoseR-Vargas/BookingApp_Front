import { useEffect, useRef, useState } from 'react';
import { usePrelineInstance } from '../../lib/usePrelineInstance.js';
import { CONTROL_CLASSES } from '../ui/controls.js';

const OUTPUT =
  'absolute z-50 max-h-72 w-full overflow-y-auto rounded-md border border-select-line bg-select p-1 shadow-lg';
const ITEM =
  'cursor-pointer rounded-md px-4 py-2 text-base text-select-item-foreground hover:bg-select-item-hover focus:bg-select-item-focus focus:outline-hidden';
const EMPTY_TEMPLATE =
  '<div class="w-full rounded-md px-4 py-2 text-sm text-text-secondary">Sin resultados</div>';

function FilterBody({ professionals, value, onReport }) {
  const rootRef = useRef(null);

  usePrelineInstance(
    'combobox',
    rootRef,
    {
      options: { keepOriginalOrder: true, outputEmptyTemplate: EMPTY_TEMPLATE },
      setup: (instance) => {
        // `currentData` is the item's stored payload; "Todos" carries an empty professional.
        instance.on('select', (data) => onReport((data && data.professional) || ''));
      },
    },
    [],
  );

  return (
    <div ref={rootRef} className="relative" data-hs-combo-box>
      <div className="relative">
        <input
          type="text"
          role="combobox"
          aria-label="Filtrar por profesional"
          aria-expanded="false"
          autoComplete="off"
          placeholder="Todos los profesionales"
          defaultValue={value}
          data-hs-combo-box-input
          // Emptying the text means "no professional": the plugin has no event for that.
          onInput={(event) => {
            if (event.target.value.trim() === '') onReport('');
          }}
          className={`${CONTROL_CLASSES} pr-9`}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label="Mostrar profesionales"
          aria-expanded="false"
          data-hs-combo-box-toggle=""
          className="absolute top-1/2 right-3 flex -translate-y-1/2 cursor-pointer items-center text-text-secondary touch:right-0 touch:h-11 touch:w-11 touch:justify-end touch:pr-3"
        >
          {/* Inline SVG: the control must stay clickable even if the icon font CDN is unreachable. */}
          <svg aria-hidden="true" className="size-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m2 5 6 6 6-6" />
          </svg>
        </button>
      </div>

      <div className={OUTPUT} role="listbox" style={{ display: 'none' }} data-hs-combo-box-output>
        {['', ...professionals].map((name) => (
          <div
            key={name || 'all'}
            className={ITEM}
            role="option"
            tabIndex={0}
            data-hs-combo-box-output-item
            data-hs-combo-box-item-stored-data={JSON.stringify({ professional: name })}
          >
            <div className="flex w-full items-center justify-between">
              <span data-hs-combo-box-search-text={name || 'Todos'} data-hs-combo-box-value>
                {name || 'Todos'}
              </span>
              <span className="hidden hs-combo-box-selected:block">
                <i aria-hidden="true" className="fas fa-check text-xs text-accent" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Professional filter (Preline combobox): type to narrow the list or open it with the chevron,
 * pick a name or "Todos". NEW, additive admin capability (not part of the legacy panel).
 *
 * DOM ownership: the plugin reads the items once, moves/hides them and writes the input text, so
 * the body is remounted (keyed) when the list of professionals changes or when the value is reset
 * from outside (the "Actualizar" button): the new DOM starts clean and the old plugin is destroyed.
 * A pick made inside the plugin never remounts it.
 */
export default function ProfessionalFilter({ professionals, value, onChange }) {
  const [epoch, setEpoch] = useState(0);
  // The value this component last reported; anything else coming in is an external change.
  const known = useRef(value);
  // The plugin callbacks are bound once; they must reach the latest handler.
  const latestOnChange = useRef(onChange);
  latestOnChange.current = onChange;

  const report = (next) => {
    if (next === known.current) return;
    known.current = next;
    latestOnChange.current(next);
  };

  useEffect(() => {
    if (value === known.current) return;
    known.current = value;
    setEpoch((current) => current + 1);
  }, [value]);

  return (
    <FilterBody
      key={`${epoch}|${professionals.join('|')}`}
      professionals={professionals}
      value={value}
      onReport={report}
    />
  );
}
