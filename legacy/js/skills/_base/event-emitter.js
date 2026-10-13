// ===== EVENT EMITTER =====
// Comunicación desacoplada entre skills y el orquestador.
// Principio: Dependency Inversion — las skills no se conocen entre sí,
// solo emiten y escuchan eventos a través de esta abstracción.

class EventEmitter {
  constructor() {
    this._listeners = new Map();
  }

  on(event, callback) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, []);
    }
    this._listeners.get(event).push(callback);
    return this;
  }

  off(event, callback) {
    if (!this._listeners.has(event)) return this;
    const updated = this._listeners.get(event).filter(fn => fn !== callback);
    this._listeners.set(event, updated);
    return this;
  }

  emit(event, payload) {
    if (!this._listeners.has(event)) return;
    this._listeners.get(event).forEach(fn => fn(payload));
  }

  destroy() {
    this._listeners.clear();
  }
}

window.EventEmitter = EventEmitter;
