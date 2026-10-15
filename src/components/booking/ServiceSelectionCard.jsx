import { formatMoney } from '../../utils/format.js';

// Icon rules of the legacy `.service-selection-card i` (they also hit the clock inside `.duration`).
// Font Awesome makes `<i class="fas">` inline-block, so the legacy `margin-bottom: 1rem` does apply to both icons.
const ICON_SIZE =
  'text-[3rem] text-accent lte-md:text-[2rem] lte-sm:text-[1.75rem] lte-400:text-[1.5rem]';

/**
 * One selectable service in step 1 (legacy renderServiceSelectionCard).
 * `professionals` is the full catalog, used only to turn professional ids into names.
 */
export default function ServiceSelectionCard({ service, professionals, selected, onSelect }) {
  const professionalNames = service.professionals
    .map((id) => {
      const professional = professionals.find((p) => p.id === id);
      return professional ? professional.name : id;
    })
    .join(', ');

  return (
    <button
      type="button"
      data-testid={`service-card-${service.id}`}
      aria-pressed={selected}
      onClick={() => onSelect(service)}
      className={`flex h-full w-full cursor-pointer items-start rounded-lg border-2 p-6 text-center text-text-primary transition-all duration-300 ease-[ease] hover:-translate-y-[3px] hover:border-accent hover:shadow-md pointer-coarse:min-h-11 pointer-coarse:min-w-11 lte-md:p-4 lte-sm:mb-3 lte-sm:p-3 ${
        selected
          ? 'border-accent bg-accent-muted shadow-accent hover:shadow-accent'
          : 'border-border-subtle bg-bg-tertiary'
      }`}
    >
      {/* One wrapper so the content stays top-aligned (a <button> would center it vertically). */}
      <div className="w-full">
        <i aria-hidden="true" className={`${service.icon} mb-4 ${ICON_SIZE}`} />
        <h5 className="mb-2 text-[1.25rem] font-semibold text-text-primary lte-sm:text-base">
          {service.name}
        </h5>
        <p className="mb-4 leading-loose text-text-secondary lte-sm:text-[0.9rem]">
          {service.description}
        </p>
        <div className="mb-2 text-[1.2rem] font-bold text-accent lte-sm:text-[1.1rem]">
          {formatMoney(service.price)}
        </div>
        <div className="text-[0.9rem] text-text-muted lte-sm:text-[0.8rem]">
          <i aria-hidden="true" className={`fas fa-clock mr-1 mb-4 ${ICON_SIZE}`} />
          {service.duration} minutos
        </div>
        <small className="text-[0.875em] text-text-secondary">
          Profesionales: {professionalNames}
        </small>
      </div>
    </button>
  );
}
