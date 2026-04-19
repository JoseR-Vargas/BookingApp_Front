// ===== SERVICIO DE AUDIO =====
// Maneja Web Audio API para notificaciones sonoras.
// SRP: aísla toda la lógica de audio del panel admin.

const audioService = {
  _audioContext: null,

  init: function() {
    try {
      if (!this._audioContext) {
        this._audioContext = new (window.AudioContext || window.webkitAudioContext)();
        if (this._audioContext.state === 'suspended') {
          this._showEnableButton();
        }
      }
    } catch (error) {
      this._showEnableButton();
    }
  },

  activate: function() {
    const self = this;
    try {
      if (!this._audioContext) {
        this._audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this._audioContext.state === 'suspended') {
        this._audioContext.resume()
          .then(function() {
            self._hideEnableButton();
            self.play();
          })
          .catch(function() { self._showEnableButton(); });
      } else {
        this._hideEnableButton();
      }
    } catch (error) {
      this._showEnableButton();
    }
  },

  play: function() {
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

  playNotification: function() {
    const self = this;
    try {
      if (!this._audioContext) {
        this._audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      const doPlay = function() {
        try { self.play(); } catch (e) {}
      };
      if (this._audioContext.state === 'suspended') {
        this._audioContext.resume()
          .then(doPlay)
          .catch(function() {
            try {
              self._audioContext = new (window.AudioContext || window.webkitAudioContext)();
              doPlay();
            } catch (e) {}
          });
      } else if (this._audioContext.state === 'running') {
        doPlay();
      } else {
        this._audioContext.resume().then(doPlay).catch(function() {});
      }
    } catch (error) {}
  },

  _playTone: function(ctx) {
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

  _playFallback: function() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      this._playTone(ctx);
      if (ctx.state === 'suspended') ctx.resume();
    } catch (e) {}
  },

  _showEnableButton: function() {
    const btn = document.getElementById('enableSoundBtn');
    if (btn) btn.classList.remove('enable-sound-btn-hidden');
  },

  _hideEnableButton: function() {
    const btn = document.getElementById('enableSoundBtn');
    if (btn) btn.classList.add('enable-sound-btn-hidden');
  },
};

window.audioService = audioService;
