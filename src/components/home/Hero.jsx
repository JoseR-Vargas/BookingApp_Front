import Container from '../layout/Container.jsx';
import Button from '../ui/Button.jsx';
import Ornament from '../ui/Ornament.jsx';

// Faint dot grid (accent color at 6% opacity) laid over the hero gradient.
// Kept as an inline style: an SVG data URI is not practical as a Tailwind class.
const DOT_PATTERN =
  "url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 200\"><defs><pattern id=\"dots\" width=\"20\" height=\"20\" patternUnits=\"userSpaceOnUse\"><circle cx=\"10\" cy=\"10\" r=\"0.8\" fill=\"rgba(201,169,110,0.06)\"/></pattern></defs><rect width=\"200\" height=\"200\" fill=\"url(%23dots)\"/></svg>')";

export default function Hero({ onReserve }) {
  return (
    <section
      id="inicio"
      aria-labelledby="hero-heading"
      className="relative flex min-h-screen items-center overflow-hidden bg-bg-primary bg-[linear-gradient(135deg,rgba(13,13,13,0.96)_0%,rgba(28,28,28,0.92)_100%)] lte-lg:pt-20 lte-md:pt-[100px] lte-md:pb-[60px] lte-sm:pt-20 lte-sm:pb-10"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{ background: DOT_PATTERN }}
      />

      <Container className="relative z-1">
        <div className="flex min-h-screen items-center">
          <div className="w-full text-center">
            <p className="mb-4 text-xs leading-loose font-semibold tracking-widest text-accent uppercase">
              Reservas Online
            </p>
            <h1
              id="hero-heading"
              className="mb-6 font-display text-[length:clamp(3rem,8vw,6rem)] leading-[1.05] font-bold tracking-tight text-text-primary uppercase lte-md:text-[length:clamp(2.2rem,10vw,3.5rem)] lte-sm:text-[length:clamp(2rem,12vw,2.8rem)]"
            >
              Tu tiempo,{' '}
              <br />
              nuestra{' '}
              <br />
              <span className="text-accent">prioridad</span>
            </h1>

            <Ornament size="hero" />

            <p className="mx-auto mb-8 max-w-[480px] text-md leading-loose text-text-secondary lte-sm:text-sm">
              Reserva tu cita de forma rápida y sencilla.
              <br />
              Profesionales certificados y atención personalizada.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <Button onClick={onReserve}>Reservar Cita</Button>
              <Button variant="outline" href="#servicios">
                Conocer Más
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
