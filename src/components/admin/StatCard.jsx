// Icon bubble colors of the legacy `.stat-icon.bg-primary / .bg-warning / .bg-info` overrides.
const TONES = {
  accent: 'bg-accent-muted text-accent',
  warning: 'bg-[rgba(240,160,48,0.15)] text-warning',
  info: 'bg-[rgba(91,155,213,0.15)] text-info',
};

export default function StatCard({ icon, tone, value, label }) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex items-center gap-4 rounded-lg border border-border-subtle bg-bg-secondary p-6 shadow-sm transition-all duration-300 ease-[ease] hover:-translate-y-0.5 hover:border-border hover:shadow-md lte-md:flex-col lte-md:text-center"
    >
      <div
        className={`flex size-[60px] items-center justify-center rounded-full text-[1.5rem] lte-md:mb-4 ${TONES[tone]}`}
      >
        <i aria-hidden="true" className={icon} />
      </div>
      <div>
        <h3 className="m-0 font-display text-2xl font-bold text-text-primary">{value}</h3>
        <p className="m-0 text-sm leading-loose text-text-secondary">{label}</p>
      </div>
    </div>
  );
}
