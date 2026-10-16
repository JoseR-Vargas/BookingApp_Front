import Container from '../layout/Container.jsx';
import Button from '../ui/Button.jsx';
import SectionHeading from '../ui/SectionHeading.jsx';

const CONTACT_ITEMS = [
  {
    icon: 'fa-map-marker-alt',
    label: 'Dirección',
    values: ['Av. Demo 1234, Ciudad Ejemplo'],
  },
  {
    icon: 'fa-phone',
    label: 'Teléfono',
    values: ['+XX XXX XXX XXXX'],
  },
  {
    icon: 'fa-clock',
    label: 'Horario',
    values: ['Lun – Vie: 9:00 – 19:00', 'Sáb: 9:00 – 15:00'],
  },
];

const OPENING_HOURS = [
  { day: 'Lunes – Viernes', hours: '9:00 – 19:00' },
  { day: 'Sábado', hours: '9:00 – 15:00' },
  { day: 'Domingo', hours: 'Cerrado', closed: true },
];

export default function ContactSection({ onReserve }) {
  return (
    <section
      id="contacto"
      aria-labelledby="contacto-heading"
      className="scroll-mt-16 bg-bg-primary py-24 lte-md:py-16 lte-sm:py-12"
    >
      <Container>
        <SectionHeading id="contacto-heading" label="Contacto" title="Encuéntranos" />

        <div className="grid items-start gap-6 lg:grid-cols-2">
          <ul className="flex list-none flex-col gap-4">
            {CONTACT_ITEMS.map(({ icon, label, values }) => (
              <li
                key={label}
                className="flex items-start gap-5 rounded-md border border-l-2 border-border-subtle border-l-accent bg-bg-secondary p-5 transition-all duration-300 ease-[ease] hover:translate-x-1 hover:border-accent hover:shadow-accent"
              >
                <div
                  aria-hidden="true"
                  className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-accent-muted text-base text-accent"
                >
                  <i className={`fas ${icon}`} />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold tracking-wider text-accent uppercase">
                    {label}
                  </span>
                  {values.map((value) => (
                    <span key={value} className="block text-sm text-text-secondary">
                      {value}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>

          <div className="rounded-lg border border-border bg-bg-secondary p-6 shadow-md lte-sm:mt-6 lte-sm:p-4">
            <h3 className="mb-6 font-display text-xl tracking-wide text-text-primary lte-sm:text-[1.1rem]">
              Horarios de Atención
            </h3>
            <dl>
              {OPENING_HOURS.map(({ day, hours, closed }) => (
                <div
                  key={day}
                  className="mb-2 flex justify-between border-b border-border-subtle py-[0.6rem] text-sm text-text-secondary"
                >
                  <dt>{day}</dt>
                  <dd className={`font-bold ${closed ? 'text-error' : 'text-text-primary'}`}>
                    {hours}
                  </dd>
                </div>
              ))}
            </dl>
            <div
              aria-hidden="true"
              className="my-4 h-px bg-linear-to-r from-transparent via-border to-transparent"
            />
            <div className="mt-6 text-center">
              <Button onClick={onReserve} className="w-full">
                Reservar Cita
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
