/**
 * Static, decorative service card (icon, title, blurb) with L-shaped accent corners.
 * Not interactive: booking starts from the CTA buttons.
 */
export default function ServiceDecoCard({ icon, title, text }) {
  return (
    <div className="relative h-full border border-border bg-bg-primary px-6 py-10 text-center transition-all duration-300 ease-[ease] before:absolute before:top-2 before:left-2 before:size-4 before:border-t-2 before:border-l-2 before:border-accent before:transition-all before:duration-300 after:absolute after:right-2 after:bottom-2 after:size-4 after:border-r-2 after:border-b-2 after:border-accent after:transition-all after:duration-300 hover:-translate-y-1 hover:border-accent hover:shadow-accent hover:before:size-6 hover:after:size-6 lte-md:px-5 lte-md:py-8">
      <div aria-hidden="true" className="mb-5 block text-[2.5rem] text-accent">
        <i className={`fas ${icon}`} />
      </div>
      <h3 className="mb-3 font-display text-lg font-bold tracking-wider text-accent uppercase">
        {title}
      </h3>
      <p className="text-sm leading-loose text-text-secondary">{text}</p>
    </div>
  );
}
