// Preline "wave" spinner: five bars scaling in sequence (keyframes `spinner-wave` in index.css).
// `spinner-wave-bar` is a hook for the prefers-reduced-motion rule in index.css, not a utility.
// Complete class literals so Tailwind can detect every one of them.
const BARS = [
  'h-2.5 [animation:spinner-wave_0.9s_ease-in-out_infinite_0s]',
  'h-3.5 [animation:spinner-wave_0.9s_ease-in-out_infinite_0.12s]',
  'h-4.5 [animation:spinner-wave_0.9s_ease-in-out_infinite_0.24s]',
  'h-3.5 [animation:spinner-wave_0.9s_ease-in-out_infinite_0.36s]',
  'h-2.5 [animation:spinner-wave_0.9s_ease-in-out_infinite_0.48s]',
];

/**
 * @param {string} [className] extra classes for the root (e.g. a negative margin inside a button).
 * @param {string} [barClassName] bar color; override it on backgrounds where `bg-surface-4`
 *   lacks contrast (e.g. `bg-primary-foreground` on the gold primary button).
 */
export default function Spinner({ className = '', barClassName = 'bg-surface-4' }) {
  return (
    <div className={`inline-flex ${className}`.trim()} role="status" aria-label="loading">
      <span className="flex h-6 items-center justify-center gap-0.5" aria-hidden="true">
        {BARS.map((bar) => (
          <span
            key={bar}
            className={`spinner-wave-bar w-1 rounded-full origin-center ${barClassName} ${bar}`}
          />
        ))}
      </span>
      <span className="sr-only">Loading...</span>
    </div>
  );
}
