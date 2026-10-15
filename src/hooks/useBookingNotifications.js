// ===== NOTIFICACIONES DE RESERVAS EN TIEMPO REAL =====
// Owns the live side of the admin panel: socket connection, unread counter, notification sound and
// the "enable sound" state. Port of legacy notification-service + the audio wiring of admin-app.js.

import { useCallback, useEffect, useRef, useState } from 'react';
import { APP_CONFIG } from '../config/appConfig.js';
import { audioService } from '../services/audioService.js';
import { connectBookingSocket } from '../services/realtimeService.js';
import { toast } from '../ui/toast.js';

const SOUND_DELAY_MS = 100;

/**
 * @param {(booking: object) => void | Promise<void>} onNewBooking called after the counter and the
 *   sound were handled; always the latest callback, so changing it never reconnects the socket.
 */
export function useBookingNotifications(onNewBooking) {
  const [count, setCount] = useState(0);
  const [needsSoundActivation, setNeedsSoundActivation] = useState(false);
  const handlerRef = useRef(onNewBooking);

  useEffect(() => {
    handlerRef.current = onNewBooking;
  });

  useEffect(() => {
    const timers = new Set();

    // Subscribe BEFORE init(): init() may emit 'needs-activation' synchronously.
    const unsubscribe = audioService.subscribe((event) => {
      if (event === 'needs-activation') setNeedsSoundActivation(true);
      else if (event === 'activated') setNeedsSoundActivation(false);
    });
    audioService.init();

    // Browsers block audio until a gesture: the first click anywhere unlocks it (once).
    const activateOnInteraction = () => audioService.activate();
    document.addEventListener('click', activateOnInteraction, { once: true });

    const connection = connectBookingSocket(APP_CONFIG.BACKEND_URL, {
      onNewBooking: (booking) => {
        setCount((current) => current + 1);
        const timer = setTimeout(() => {
          timers.delete(timer);
          audioService.playNotification();
        }, SOUND_DELAY_MS);
        timers.add(timer);
        return handlerRef.current && handlerRef.current(booking);
      },
    });

    // StrictMode mounts, unmounts and mounts again: tear everything down so only one socket stays live.
    return () => {
      unsubscribe();
      document.removeEventListener('click', activateOnInteraction);
      timers.forEach(clearTimeout);
      connection.disconnect();
    };
  }, []);

  const clearCount = useCallback(() => setCount(0), []);

  const activateSound = useCallback(() => {
    audioService.activate();
    toast.success('Sonido de notificaciones activado');
  }, []);

  return { count, clearCount, needsSoundActivation, activateSound };
}
