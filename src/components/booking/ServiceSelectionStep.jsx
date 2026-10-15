import { APP_CONFIG } from '../../config/appConfig.js';
import { useBooking } from '../../state/bookingState.jsx';
import ServiceSelectionCard from './ServiceSelectionCard.jsx';
import StepHeading from './StepHeading.jsx';

/** Step 1: pick the service. The parent decides what happens after a selection (auto-advance). */
export default function ServiceSelectionStep({ onSelect }) {
  const { state } = useBooking();

  return (
    <div>
      <StepHeading title="Elige tu Servicio" subtitle="Selecciona el servicio que deseas reservar" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {APP_CONFIG.SERVICES.map((service) => (
          <ServiceSelectionCard
            key={service.id}
            service={service}
            professionals={APP_CONFIG.PROFESSIONALS}
            selected={state.selectedService?.id === service.id}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
