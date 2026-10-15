// Decorative divider: line, diamond, line. Static class names so Tailwind can detect them.
const SIZES = {
  hero: {
    wrapper: 'my-6 max-w-[300px]',
    line: 'to-accent',
    diamond: 'text-[0.9rem]',
  },
  footer: {
    wrapper: 'mb-8 max-w-[400px]',
    line: 'to-border',
    diamond: 'text-[0.8rem]',
  },
};

export default function Ornament({ size = 'hero' }) {
  const s = SIZES[size];

  return (
    <div
      aria-hidden="true"
      className={`mx-auto flex items-center justify-center gap-4 ${s.wrapper}`}
    >
      <span className={`h-px flex-1 bg-linear-to-r from-transparent ${s.line}`} />
      <span className={`shrink-0 text-accent ${s.diamond}`}>◆</span>
      <span className={`h-px flex-1 bg-linear-to-l from-transparent ${s.line}`} />
    </div>
  );
}
