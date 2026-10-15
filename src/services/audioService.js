// ===== SERVICIO DE AUDIO =====
// Maneja Web Audio API para notificaciones sonoras.
// SRP: aísla toda la lógica de audio del panel admin.
// The legacy "enable sound" button is replaced by a subscription: listeners receive
// 'needs-activation' (legacy: show the button) or 'activated' (legacy: hide it).

const listeners = new Set();

function emit(event) {
  listeners.forEach((listener) => listener(event));
}

function createContext() {
  const Ctx = globalThis.AudioContext || globalThis.webkitAudioContext;
  return new Ctx();
}

export const audioService = {
  _audioContext: null,

  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  init() {
    try {
      if (!this._audioContext) {
        this._audioContext = createContext();
        if (this._audioContext.state === 'suspended') {
          emit('needs-activation');
        }
      }
    } catch (error) {
      emit('needs-activation');
    }
  },

  activate() {
    try {
      if (!this._audioContext) {
        this._audioContext = createContext();
      }
      if (this._audioContext.state === 'suspended') {
        this._audioContext.resume()
          .then(() => {
            emit('activated');
            this.play();
          })
          .catch(() => { emit('needs-activation'); });
      } else {
        emit('activated');
      }
    } catch (error) {
      emit('needs-activation');
    }
  },

  play() {
    try {
      if (!this._audioContext || this._audioContext.state !== 'running') {
        this._playFallback();
        return;
      }
      this._playTone(this._audioContext);
    } catch (error) {
      this._playFallback();
    }
  },

  playNotification() {
    try {
      if (!this._audioContext) {
        this._audioContext = createContext();
      }
      const doPlay = () => {
        try { this.play(); } catch (e) { /* ignore */ }
      };
      if (this._audioContext.state === 'suspended') {
        this._audioContext.resume()
          .then(doPlay)
          .catch(() => {
            try {
              this._audioContext = createContext();
              doPlay();
            } catch (e) { /* ignore */ }
          });
      } else if (this._audioContext.state === 'running') {
        doPlay();
      } else {
        this._audioContext.resume().then(doPlay).catch(() => {});
      }
    } catch (error) { /* ignore */ }
  },

  _playTone(ctx) {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    const t = ctx.currentTime;
    oscillator.frequency.setValueAtTime(880, t);
    oscillator.frequency.exponentialRampToValueAtTime(1320, t + 0.15);
    oscillator.frequency.exponentialRampToValueAtTime(1100, t + 0.3);
    gainNode.gain.setValueAtTime(0.4, t);
    gainNode.gain.exponentialRampToValueAtTime(0.2, t + 0.2);
    gainNode.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
    oscillator.type = 'sine';
    oscillator.start(t);
    oscillator.stop(t + 0.9);
  },

  _playFallback() {
    try {
      const ctx = createContext();
      this._playTone(ctx);
      if (ctx.state === 'suspended') ctx.resume();
    } catch (e) { /* ignore */ }
  },

  // Test-only: drops the cached context and all subscribers.
  _reset() {
    this._audioContext = null;
    listeners.clear();
  },
};
