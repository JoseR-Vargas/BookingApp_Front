// Preline button look: pill shape, medium weight, semantic tokens (mapped to the gold palette in
// index.css). `focus:outline-hidden` hides the default ring, so focus-visible restores an accent
// outline for keyboard users and the fill still changes on focus like on hover.
const BASE =
  'inline-flex cursor-pointer touch-manipulation items-center justify-center gap-x-2 rounded-full font-medium no-underline transition-colors duration-300 ease-[ease] focus:outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 touch:min-h-11';

const PRIMARY =
  'border border-primary-line bg-primary text-primary-foreground hover:bg-primary-hover focus:bg-primary-hover';
const LAYER =
  'border border-layer-line bg-layer text-layer-foreground shadow-2xs hover:bg-layer-hover focus:bg-layer-hover';

const VARIANTS = {
  primary: PRIMARY,
  // Neutral actions share the layer look.
  outline: LAYER,
  secondary: LAYER,
  outlineSecondary: LAYER,
  // Destructive actions keep their red, with the same shape and states.
  outlineDanger:
    'border border-error bg-layer text-error shadow-2xs hover:bg-error/15 focus:bg-error/15',
  danger: 'border border-transparent bg-error text-text-primary hover:bg-[#c43c3c] focus:bg-[#c43c3c]',
};

const SIZES = {
  // Hero / section call-to-action; full width on phones.
  lg: 'px-4 py-3 text-sm lte-md:w-full',
  sm: 'px-4 py-3 text-sm',
  // Compact (icon buttons, table actions, "Cerrar" in the loading modal).
  xs: 'px-3 py-2 text-sm',
  // Full-width call to action (e.g. the confirmation "Entendido").
  cta: 'w-full px-4 py-3 text-sm',
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
