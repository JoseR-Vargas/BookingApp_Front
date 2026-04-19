// ===== INTERFAZ BASE DE SKILLS =====
// Define el contrato que toda skill debe cumplir.
// Principio: Liskov Substitution — cualquier skill puede reemplazar a otra
// sin romper el código que la consume.

class Skill {
  /**
   * @param {object} deps  - Dependencias inyectadas (apiClient, config, etc.)
   * @param {object} options - Configuración de la instancia
   */
  constructor(deps = {}, options = {}) {
    if (new.target === Skill) {
      throw new Error('Skill es una clase abstracta. Extendé esta clase para crear una skill.');
    }
    this._deps    = deps;
    this._options = options;
    this._mounted = false;
  }

  /** Monta la skill en un elemento del DOM. Debe retornar `this` para chaining. */
  mount(container) { // eslint-disable-line no-unused-vars
    throw new Error(`${this.constructor.name} debe implementar mount(container)`);
  }

  /** Desmonta la skill y limpia listeners/recursos. */
  destroy() {
    throw new Error(`${this.constructor.name} debe implementar destroy()`);
  }

  /** Retorna el estado actual de la skill. */
  getState() {
    throw new Error(`${this.constructor.name} debe implementar getState()`);
  }
}

window.Skill = Skill;
