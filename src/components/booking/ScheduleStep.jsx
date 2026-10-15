import { useEffect, useId } from 'react';
import { APP_CONFIG } from '../../config/appConfig.js';
import { useAvailableTimes } from '../../hooks/useAvailableTimes.js';
import { useBooking } from '../../state/bookingState.jsx';
import { formatLongDateUTC, formatMoney } from '../../utils/format.js';
import { DATE_INPUT_RESET, FIELD_LABEL, HELP_TEXT, INPUT_LG, SELECT_LG } from './fieldStyles.js';
import ProfessionalCard from './ProfessionalCard.jsx';
import StepHeading from './StepHeading.jsx';

// Legacy setupDateValidation: the earliest selectable date is "today" (as an ISO date).
const todayISO = () => new Date().toISOString().split('T')[0];

// Legacy updateServiceInfo(): recap of what has been chosen so far.
function SelectedServiceInfo({ service, date, time, professional }) {
  const dateText = date ? formatLongDateUTC(date) : 'No seleccionada';

  return (
    <div
      data-testid="selected-service-info"
      className="mb-4 grid rounded-[0.375rem] border border-border bg-bg-tertiary p-4 text-text-secondary md:grid-cols-2 md:gap-x-6"
    >
      <div>
        <strong>Servicio:</strong> {service.name}
        <br />
        <strong>Profesional:</strong> {professional ? professional.name : 'No seleccionado'}
        <br />
        <strong>Precio:</strong> {formatMoney(service.price)}
      </div>
      <div>
        <strong>Fecha:</strong> {dateText}
        <br />
        <strong>Hora:</strong> {time || 'No seleccionada'}
        <br />
        <strong>Duración:</strong> {service.duration} minutos
      </div>
    </div>
  );
}

/** Step 2: date, hour and professional. */
export default function ScheduleStep() {
  const { state, setDate, setTime, setProfessional } = useBooking();
  const { selectedService, selectedDate, selectedTime, selectedProfessional } = state;
  const helperId = useId();

  const times = useAvailableTimes(selectedDate, selectedProfessional ? selectedProfessional.id : null);

  // Deliberate improvement: legacy kept a stale time in its state while the rebuilt <select>
  // showed nothing. Once the slots are final, a time that is no longer free is dropped.
  const freeTimes = times.slots.filter((slot) => !slot.booked).map((slot) => slot.value).join(',');
  useEffect(() => {
    if (times.settled && selectedTime && !freeTimes.split(',').includes(selectedTime)) {
      setTime(null);
    }
  }, [times.settled, freeTimes, selectedTime, setTime]);

  const professionals = selectedService
    ? APP_CONFIG.PROFESSIONALS.filter((p) => selectedService.professionals.includes(p.id))
    : [];

  return (
    <div>
      <StepHeading title="Fecha y Hora" subtitle="Selecciona cuándo quieres tu cita" />

      <div className="grid md:grid-cols-2 md:gap-x-6">
        <div>
          <label className={FIELD_LABEL}>Fecha de la Cita</label>
          <input
            type="date"
            className={`${INPUT_LG} ${DATE_INPUT_RESET}`}
            min={todayISO()}
            required
            aria-label="Fecha de la cita"
            value={selectedDate || ''}
            onChange={(event) => setDate(event.target.value || null)}
          />
        </div>
        <div>
          <label className={FIELD_LABEL}>Hora Disponible</label>
          <select
            className={SELECT_LG}
            required
            aria-label="Hora de la cita"
            aria-describedby={helperId}
            value={selectedTime || ''}
            onChange={(event) => setTime(event.target.value || null)}
          >
            <option value="">{times.placeholder}</option>
            {times.slots.map((slot) => (
              <option key={slot.value} value={slot.value} disabled={slot.booked}>
                {slot.booked ? `${slot.value} — Ocupado` : slot.value}
              </option>
            ))}
          </select>
          <div id={helperId} className={HELP_TEXT}>
            Los horarios se actualizarán después de seleccionar un profesional
          </div>
        </div>
      </div>

      <div className="mt-4">
        <label className={FIELD_LABEL}>Elige tu Profesional</label>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {professionals.map((professional) => (
            <ProfessionalCard
              key={professional.id}
              professional={professional}
              selected={selectedProfessional?.id === professional.id}
              onSelect={setProfessional}
            />
          ))}
        </div>
      </div>

      <div className="mt-4">
        {selectedService && (
          <SelectedServiceInfo
            service={selectedService}
            date={selectedDate}
            time={selectedTime}
            professional={selectedProfessional}
          />
        )}
      </div>
    </div>
  );
}
