// ===== HORARIOS DISPONIBLES =====
// Hook port of legacy `loadAvailableTimes` + `updateAvailableTimesForProfessional` (+ retry flow)
// from js/booking-app.js. It owns the availability fetch and returns what the time <select> renders.
//
// Deliberate improvement over legacy: availability is recomputed whenever BOTH the date and the
// professional are set and EITHER changes (legacy only refreshed on a professional change, leaving
// stale/unfiltered slots after a date change). Responses of superseded requests are ignored.

import { useEffect, useState } from 'react';
import { getBookings } from '../services/bookingService.js';
import { toast } from '../ui/toast.js';
import { isMobileDevice, isSlowConnection } from '../utils/device.js';
import { buildTimeSlots, getBookedTimes } from '../utils/schedule.js';

const MAX_RETRIES = 2;
const WARNING_DURATION = 10000;

const NO_DATE_TEXT = 'Selecciona una fecha primero';

const loadingText = (mobile) => (mobile ? 'Cargando horarios...' : 'Verificando horarios disponibles');
const retryText = (mobile, attempt) => (mobile
  ? '📱 Reintentando conexión... (' + attempt + '/' + MAX_RETRIES + ')'
  : '🔄 Reintentando... (' + attempt + '/' + MAX_RETRIES + ')');
const retryDelay = (mobile) => (mobile ? 2500 : 1500);

const FALLBACK_MESSAGE = {
  mobile: 'No se pueden verificar las reservas. Se muestran todos los horarios. Te recomendamos llamar para confirmar.',
  desktop: 'No se pudieron verificar las reservas existentes. Se muestran todos los horarios disponibles. Te recomendamos confirmar por teléfono.',
};

// Legacy retry rule: timeouts, aborted requests and network failures are worth another try.
function isRetryable(error) {
  const message = String((error && error.message) || '');
  return (error && error.name === 'AbortError')
    || message.includes('Failed to fetch')
    || message.includes('Timeout');
}

/**
 * @param {string|null} date  'YYYY-MM-DD' or null
 * @param {string|null} professionalId
 * @returns {{
 *   placeholder: string,                       // text of the empty first <option>
 *   slots: {value: string, booked: boolean}[], // the selectable hours
 *   settled: boolean,                          // true when `slots` is final (not loading / retrying)
 * }}
 */
export function useAvailableTimes(date, professionalId) {
  const [remote, setRemote] = useState(null);
  const key = date && professionalId ? date + '|' + professionalId : null;

  useEffect(() => {
    if (!key) return undefined;

    let cancelled = false;
    let retryTimer = null;

    const load = async (attempt) => {
      const mobile = isMobileDevice();
      const timeout = (mobile || isSlowConnection()) ? 15000 : 10000;
      setRemote({ key, phase: 'loading', mobile, attempt, bookedTimes: null });

      try {
        const bookings = await getBookings({ timeout });
        if (cancelled) return;
        setRemote({
          key,
          phase: 'ready',
          mobile,
          attempt,
          bookedTimes: getBookedTimes(bookings, date, professionalId),
        });
      } catch (error) {
        if (cancelled) return;

        if (attempt < MAX_RETRIES && isRetryable(error)) {
          setRemote({ key, phase: 'retrying', mobile, attempt: attempt + 1, bookedTimes: null });
          retryTimer = setTimeout(() => load(attempt + 1), retryDelay(mobile));
          return;
        }

        toast.warning(mobile ? FALLBACK_MESSAGE.mobile : FALLBACK_MESSAGE.desktop, WARNING_DURATION);
        setRemote({ key, phase: 'ready', mobile, attempt, bookedTimes: [] });
      }
    };

    load(0);

    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
    };
  }, [key, date, professionalId]);

  if (!date) {
    return { placeholder: NO_DATE_TEXT, slots: [], settled: true };
  }

  if (!professionalId) {
    // Legacy loadAvailableTimes(date): structure only, nothing is checked against the backend yet.
    const times = buildTimeSlots(date, null);
    return { placeholder: times.headerText, slots: times.slots, settled: true };
  }

  // `remote` may still describe the previous date/professional for one render: treat it as loading.
  const current = remote && remote.key === key ? remote : null;
  if (!current || current.phase === 'loading') {
    const mobile = current ? current.mobile : isMobileDevice();
    return { placeholder: loadingText(mobile), slots: [], settled: false };
  }
  if (current.phase === 'retrying') {
    return { placeholder: retryText(current.mobile, current.attempt), slots: [], settled: false };
  }

  const times = buildTimeSlots(date, current.bookedTimes);
  return { placeholder: times.headerText, slots: times.slots, settled: true };
}
