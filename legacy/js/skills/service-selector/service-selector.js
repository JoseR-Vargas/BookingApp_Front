// ===== SKILL: SELECTOR DE SERVICIOS =====
// Responsabilidad única: renderizar y manejar la selección de un servicio.
// Principio Open/Closed — se extiende via `options`, no modificando esta clase.

class ServiceSelectorSkill extends Skill {
  /**
   * @param {{ bookingService: object }} deps
   * @param {{ onSelect?: Function, services?: Array }} options
   */
  constructor(deps, options = {}) {
    super(deps, options);
    this._selected  = null;
    this._container = null;
    this._emitter   = new EventEmitter();
    this._handlers  = [];
  }

  // ── Ciclo de vida ────────────────────────────────────────────────────────

  mount(container) {
    this._container = container;
    this._render(this._options.services ?? []);
    this._mounted = true;
    return this;
  }

  destroy() {
    this._handlers.forEach(({ el, type, fn }) => el.removeEventListener(type, fn));
    this._handlers = [];
    this._emitter.destroy();
    if (this._container) this._container.innerHTML = '';
    this._mounted = false;
  }

  getState() {
    return { selected: this._selected };
  }

  // ── API pública ──────────────────────────────────────────────────────────

  /** Suscribirse al evento de selección. */
  onSelect(callback) {
    this._emitter.on('select', callback);
    return this;
  }

  /** Cargar servicios desde el backend y re-renderizar. */
  async loadServices() {
    const services = await this._deps.bookingService.getServices();
    this._render(services);
    return this;
  }

  // ── Renderizado (privado) ────────────────────────────────────────────────

  _render(services) {
    if (!this._container) return;

    this._container.innerHTML = services.length
      ? services.map(s => this._buildCard(s)).join('')
      : '<p class="text-muted">No hay servicios disponibles.</p>';

    this._attachListeners(services);
  }

  _buildCard({ _id, name, price, duration }) {
    return `
      <div class="service-card" data-id="${_id}" role="button" tabindex="0"
           aria-label="Seleccionar servicio ${name}">
        <h5>${name}</h5>
        <p>$${price} &bull; ${duration} min</p>
      </div>`;
  }

  _attachListeners(services) {
    const cards = this._container.querySelectorAll('.service-card');

    cards.forEach(card => {
      const onClick = () => this._select(services, card.dataset.id);
      const onKey   = (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); };

      card.addEventListener('click', onClick);
      card.addEventListener('keydown', onKey);

      this._handlers.push(
        { el: card, type: 'click',   fn: onClick },
        { el: card, type: 'keydown', fn: onKey   },
      );
    });
  }

  _select(services, id) {
    this._selected = services.find(s => s._id === id) ?? null;

    this._container.querySelectorAll('.service-card').forEach(card => {
      card.classList.toggle('selected', card.dataset.id === id);
    });

    this._emitter.emit('select', this._selected);
    this._options.onSelect?.(this._selected);
  }
}

window.ServiceSelectorSkill = ServiceSelectorSkill;
