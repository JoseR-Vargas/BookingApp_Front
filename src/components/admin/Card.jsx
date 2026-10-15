// Legacy `.card` (+ `.card-header` / `.card-body`) on the dark theme. Hover only adds the large
// shadow: base.css forces the card border color with !important, so it never changed on hover.
export default function Card({ title, children }) {
  return (
    <section className="relative flex flex-col rounded-lg border border-border-subtle bg-bg-secondary text-text-primary transition-[border-color,box-shadow] duration-300 ease-[ease] hover:shadow-lg">
      {title && (
        <div className="border-b border-border-subtle px-4 py-2">
          <h3 className="mb-2 font-display text-lg font-bold text-text-primary">{title}</h3>
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}
