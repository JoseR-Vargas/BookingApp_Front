/** Centered section header: diamond label, display heading and optional subtitle. */
export default function SectionHeading({ id, label, title, subtitle }) {
  return (
    <div className="mb-12 text-center">
      <p className="mb-3 flex items-center justify-center gap-2 text-xs leading-loose font-semibold tracking-widest text-accent uppercase">
        <span aria-hidden="true" className="text-[0.7rem]">
          ◆
        </span>{' '}
        {label}
      </p>
      <h2
        id={id}
        className="mb-2 font-display text-[length:clamp(1.8rem,4vw,2.5rem)] font-bold tracking-[0.04em] text-text-primary uppercase"
      >
        {title}
      </h2>
      {subtitle && <p className="text-base leading-loose text-text-secondary">{subtitle}</p>}
    </div>
  );
}
