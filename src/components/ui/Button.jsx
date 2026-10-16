const BASE =
  'inline-flex cursor-pointer touch-manipulation items-center justify-center font-semibold no-underline transition-all duration-300 ease-[ease] hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

const VARIANTS = {
  // Disabled look = legacy `.btn-primary:disabled` (muted fill, half opacity, no hover effects).
  primary:
    'border-0 bg-accent text-text-inverse hover:bg-accent-light hover:shadow-accent disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-text-muted disabled:text-bg-primary disabled:opacity-50',
  outline:
    'border border-accent bg-transparent text-accent hover:border-accent-light hover:bg-accent-muted hover:text-accent-light',
  // Legacy `.btn-secondary`: tertiary surface, no lift on hover.
  secondary:
    'border border-border-subtle bg-bg-tertiary text-text-secondary hover:translate-y-0! hover:border-border hover:bg-bg-secondary hover:text-text-primary',
  // Legacy `.btn-outline-secondary`.
  outlineSecondary:
    'border border-border bg-transparent text-text-secondary hover:translate-y-0! hover:border-accent hover:bg-accent-muted hover:text-accent',
  // Legacy `.btn-outline-danger` (admin logout).
  outlineDanger:
    'border border-error bg-transparent text-error hover:translate-y-0! hover:bg-error/15',
  // Legacy `.btn-danger` (admin delete). Its hover transform is overridden per use (scale), so no lift here.
  danger: 'border-0 bg-error text-text-primary hover:translate-y-0! hover:bg-[#c43c3c]',
};

const SIZES = {
  // Hero / section call-to-action (legacy `.btn-hero-primary` / `.btn-hero-outline`).
  lg: 'rounded-sm px-10 py-4 text-sm uppercase tracking-widest lte-md:w-full',
  // Compact navbar button (legacy framework `.btn.btn-primary`).
  sm: 'rounded-md px-3 py-1.5 text-base tracking-wide touch:min-h-11',
  // Legacy `.btn.btn-sm`.
  xs: 'rounded-md px-2 py-1 text-sm tracking-wide',
  // Full-width call to action (legacy `.btn.btn-lg.w-100`, e.g. the confirmation "Entendido").
  cta: 'w-full rounded-md px-4 py-2 text-lg tracking-wide',
};

/**
 * Renders a <button>, or an <a> when `href` is given (in-page links such as
 * "Conocer Más" must stay links for semantics and middle-click).
 */
export default function Button({
  variant = 'primary',
  size = 'lg',
  href,
  className = '',
  children,
  ...props
}) {
  const classes = `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`;

  if (href !== undefined) {
    return (
      <a href={href} className={classes} {...props}>
        {children}
      </a>
    );
  }

  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  );
}
