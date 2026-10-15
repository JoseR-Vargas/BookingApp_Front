// ===== ORQUESTADOR DEL FLUJO DE RESERVA =====
// React port of the legacy `bookingApp` (js/booking-app.js): the 3-step modal plus the loading and
// confirmation dialogs it drives. Mount it once (inside <BookingProvider>) and toggle `open`.

import { DialogTitle } from '@headlessui/react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { buildBookingPayload, checkAvailability, createBooking } from '../../services/bookingService.js';
import { useBooking } from '../../state/bookingState.jsx';
import { toast } from '../../ui/toast.js';
import Button from '../ui/Button.jsx';
import Modal from '../ui/Modal.jsx';
import ClientFormStep from './ClientFormStep.jsx';
import ConfirmationModal from './ConfirmationModal.jsx';
import LoadingModal from './LoadingModal.jsx';
import ScheduleStep from './ScheduleStep.jsx';
import ServiceSelectionStep from './ServiceSelectionStep.jsx';

const LAST_STEP = 3;
const AUTO_ADVANCE_DELAY = 400;
const CONFIRMATION_DELAY = 150;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Legacy getFormData(): raw values (escaping happens in buildBookingPayload).
function readClientForm(form) {
  const data = new FormData(form);
  const value = (key) => String(data.get(key) || '');
  return {
    name: value('name'),
    id: value('id'),
    email: value('email'),
    phone: value('phone'),
    notes: value('notes'),
  };
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className="size-4">
      <path d="M.293.293a1 1 0 0 1 1.414 0L8 6.586 14.293.293a1 1 0 1 1 1.414 1.414L9.414 8l6.293 6.293a1 1 0 0 1-1.414 1.414L8 9.414l-6.293 6.293a1 1 0 0 1-1.414-1.414L6.586 8 .293 1.707a1 1 0 0 1 0-1.414z" />
    </svg>
  );
}

export default function BookingModal({ open, onClose }) {
  const booking = useBooking();
  const { state, setStep, setService, setSubmitting, reset } = booking;
  const { currentStep, selectedService, selectedDate, selectedTime, selectedProfessional, isSubmitting } = state;

  const [validated, setValidated] = useState(false);
  const [loadingOpen, setLoadingOpen] = useState(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  // Kept after the confirmation closes so its content does not vanish during the fade-out.
  const [confirmation, setConfirmation] = useState(null);

  const formRef = useRef(null);
  const submitLock = useRef(false);
  const advanceTimer = useRef(null);
  const latest = useRef(state);
  latest.current = state;

  // Legacy openModal -> resetState: every opening starts from step 1 with a clean form.
  useLayoutEffect(() => {
    if (!open) return;
    clearTimeout(advanceTimer.current);
    reset();
    setValidated(false);
    if (formRef.current) formRef.current.reset();
  }, [open, reset]);

  useEffect(() => () => clearTimeout(advanceTimer.current), []);

  // Legacy validateCurrentStep(): `false` means a toast was shown and the flow must stop.
  const validateStep = useCallback((step, current) => {
    switch (step) {
      case 1:
        if (!current.selectedService) {
          toast.error('Por favor selecciona un servicio');
          return false;
        }
        break;
      case 2:
        if (!current.selectedDate) {
          toast.error('Por favor selecciona una fecha');
          return false;
        }
        if (!current.selectedTime) {
          toast.error('Por favor selecciona una hora');
          return false;
        }
        if (!current.selectedProfessional) {
          toast.error('Por favor selecciona un profesional');
          return false;
        }
        break;
      case 3:
        if (formRef.current && !formRef.current.checkValidity()) {
          setValidated(true);
          toast.error('Por favor completa todos los campos requeridos');
          return false;
        }
        break;
      default:
        break;
    }
    return true;
  }, []);

  // Legacy click on a service card: select it and move on 400ms later.
  const handleSelectService = (service) => {
    setService(service);
    clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(() => {
      // Hardening: only advance if the user is still on step 1 (legacy could skip a step).
      if (latest.current.currentStep === 1 && validateStep(1, latest.current)) {
        setStep(2);
      }
    }, AUTO_ADVANCE_DELAY);
  };

  // Legacy submitBooking(). `isSubmitting` is raised as soon as the button is pressed, so the
  // button already shows "Procesando..." while the availability pre-check runs (legacy did the same
  // visually); `submitLock` makes a double click impossible even before React re-renders.
  const submitBooking = async () => {
    submitLock.current = true;
    setSubmitting(true);

    try {
      const { selectedService: service, selectedDate: date, selectedTime: time, selectedProfessional: professional } = latest.current;
      const formData = readClientForm(formRef.current);

      // Last-second check. A failing check must not block the booking (legacy behavior).
      let available = true;
      try {
        available = await checkAvailability(date, time, professional.id);
      } catch {
        available = true;
      }
      if (!available) {
        toast.error(
          '❌ Lo sentimos, ' + professional.name + ' ya tiene una reserva para ' + date + ' a las ' + time
            + '. Por favor selecciona otra hora o profesional.',
        );
        return;
      }

      setLoadingOpen(true);
      try {
        await createBooking(buildBookingPayload({ formData, service, professional, date, time }));
        setLoadingOpen(false);

        await wait(CONFIRMATION_DELAY);

        // Deliberate improvement: the confirmation shows the email exactly as typed (legacy showed
        // the HTML-escaped value). The payload sent to the backend is still the escaped one.
        setConfirmation({
          serviceName: service.name,
          professionalName: professional.name,
          date,
          time,
          price: service.price,
          email: formData.email,
        });
        setConfirmationOpen(true);
        onClose();
      } catch (error) {
        setLoadingOpen(false);
        toast.error('Error al procesar la reserva: ' + error.message, 5000);
      }
    } finally {
      submitLock.current = false;
      setSubmitting(false);
    }
  };

  // Legacy nextStep()
  const handleNext = () => {
    if (isSubmitting || submitLock.current) return;
    if (!validateStep(currentStep, state)) return;

    if (currentStep < LAST_STEP) {
      setStep(currentStep + 1);
    } else {
      submitBooking();
    }
  };

  // Legacy previousStep()
  const handleBack = () => {
    if (currentStep > 1) setStep(currentStep - 1);
  };

  return (
    <>
      <Modal open={open} onClose={onClose}>
        <div className="flex shrink-0 items-center justify-between rounded-t-lg border-b border-border bg-bg-primary p-4">
          <DialogTitle
            as="h5"
            className="mb-0 text-[1.25rem] leading-normal font-bold text-text-primary lte-md:text-[1.1rem]"
          >
            <i aria-hidden="true" className="fas fa-calendar-alt mr-2 text-accent" />
            Reservar tu Cita
          </DialogTitle>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="-my-2 -mr-2 box-content size-4 cursor-pointer rounded-md border-0 bg-transparent p-1 text-[#ccc] opacity-70 transition-opacity duration-150 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-accent"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="flex-auto bg-bg-secondary p-4">
          {/* All steps stay mounted (only hidden) like legacy: values typed in a step survive "Anterior". */}
          <div hidden={currentStep !== 1}>
            <ServiceSelectionStep onSelect={handleSelectService} />
          </div>
          <div hidden={currentStep !== 2}>
            <ScheduleStep />
          </div>
          <div hidden={currentStep !== 3}>
            <ClientFormStep formRef={formRef} validated={validated} />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end border-t border-border-subtle bg-bg-secondary p-3 lte-sm:flex-col-reverse *:m-1 lte-sm:*:mx-0 lte-sm:*:w-full">
          {currentStep > 1 && (
            <Button variant="secondary" size="sm" onClick={handleBack}>
              <i aria-hidden="true" className="fas fa-arrow-left mr-2" />
              Anterior
            </Button>
          )}
          <Button size="sm" onClick={handleNext} disabled={isSubmitting}>
            {currentStep === LAST_STEP ? (
              isSubmitting ? (
                <>
                  <i aria-hidden="true" className="fas fa-spinner fa-spin mr-2" />
                  Procesando...
                </>
              ) : (
                <>
                  <i aria-hidden="true" className="fas fa-check mr-2" />
                  Confirmar Reserva
                </>
              )
            ) : (
              <>
                Siguiente
                {/* ml-3.5 = legacy `ms-2` + the whitespace a flex button would otherwise swallow. */}
                <i aria-hidden="true" className="fas fa-arrow-right ml-3.5" />
              </>
            )}
          </Button>
        </div>
      </Modal>

      <LoadingModal open={loadingOpen} onClose={() => setLoadingOpen(false)} />
      <ConfirmationModal
        open={confirmationOpen}
        onClose={() => setConfirmationOpen(false)}
        details={confirmation}
      />
    </>
  );
}
