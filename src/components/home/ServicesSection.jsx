import Container from '../layout/Container.jsx';
import Button from '../ui/Button.jsx';
import SectionHeading from '../ui/SectionHeading.jsx';
import ServiceDecoCard from './ServiceDecoCard.jsx';

const SERVICES = [
  {
    icon: 'fa-clipboard-list',
    title: 'Consultoría',
    text: 'Evaluación personalizada y asesoramiento profesional para encontrar la mejor solución',
  },
  {
    icon: 'fa-star',
    title: 'Servicios Estándar',
    text: 'Atención completa con seguimiento y garantía de resultados en cada sesión',
  },
  {
    icon: 'fa-gem',
    title: 'Premium',
    text: 'Experiencia exclusiva con prioridad de agenda y acompañamiento dedicado',
  },
];

export default function ServicesSection({ onReserve }) {
  return (
    <section
      id="servicios"
      aria-labelledby="servicios-heading"
      className="bg-bg-secondary py-24 lte-md:py-16 lte-sm:py-12"
    >
      <Container>
        <SectionHeading
          id="servicios-heading"
          label="Nuestros Servicios"
          title="Profesionales a tu servicio"
          subtitle="Soluciones adaptadas a tus necesidades"
        />

        <div className="grid gap-6 md:grid-cols-3">
          {SERVICES.map((service) => (
            <ServiceDecoCard key={service.title} {...service} />
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button onClick={onReserve}>Reservar Cita Ahora</Button>
        </div>
      </Container>
    </section>
  );
}
