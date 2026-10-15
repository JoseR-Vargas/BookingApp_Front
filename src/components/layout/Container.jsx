/**
 * Centered page container. Reproduces the legacy grid framework's `.container` used by the
 * legacy pages: 12px side gutters (16px at <=576px) and max-widths that snap at
 * 576/720/960/1140/1320px. The breakpoints come from `--breakpoint-*` in index.css.
 */
export default function Container({ as: Tag = 'div', className = '', children, ...props }) {
  return (
    <Tag
      className={`mx-auto w-full px-3 lte-sm:px-4 sm:max-w-[540px] md:max-w-[720px] lg:max-w-[960px] xl:max-w-[1140px] 2xl:max-w-[1320px] ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}
