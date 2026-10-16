import { useId } from 'react';
import { FIELD_LABEL, INPUT_LG, INVALID_FEEDBACK, TEXTAREA } from './fieldStyles.js';
import StepHeading from './StepHeading.jsx';

// On phones the checkbox grows to 24px (WCAG 2.5.8 minimum) and is centered in a 44px-high row; the whole
// row (checkbox included) is covered by the label, so it is one big tap area.
const CHECKBOX =
  'peer absolute top-[0.25em] left-0 size-[1em] touch:top-1/2 touch:size-6 touch:-translate-y-1/2 appearance-none rounded-[0.25em] border border-border bg-bg-tertiary bg-contain bg-center bg-no-repeat checked:border-accent checked:bg-accent checked:bg-(image:--icon-check) focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-muted)] focus:outline-none group-data-[validated=true]/form:invalid:border-[#dc3545] group-data-[validated=true]/form:valid:border-[#198754] group-data-[validated=true]/form:valid:checked:bg-[#198754]';

/**
 * Step 3: client data. The inputs are uncontrolled and read through the form element
 * (legacy getFormData); `validated` reproduces the legacy `was-validated` class.
 * The form stays mounted (hidden) while the user is on another step, so typed values survive "Anterior".
 */
export default function ClientFormStep({ formRef, validated }) {
  const termsId = useId();

  return (
    <div>
      <StepHeading title="Tus Datos" subtitle="Necesitamos esta información para tu reserva" />

      <form
        ref={formRef}
        noValidate
        data-testid="client-form"
        data-validated={validated ? 'true' : undefined}
        onSubmit={(event) => event.preventDefault()}
        className="group/form"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className={FIELD_LABEL}>Nombre Completo *</label>
            <input
              type="text"
              name="name"
              className={`peer ${INPUT_LG}`}
              required
              placeholder="Tu nombre completo"
              aria-label="Nombre completo"
            />
            <div className={INVALID_FEEDBACK}>Por favor ingresa tu nombre completo</div>
          </div>

          {/* Legacy keeps this column in the DOM but never shows it (`display: none`). */}
          <div hidden>
            <label className={FIELD_LABEL}>Cédula</label>
            <input
              type="text"
              name="id"
              className={INPUT_LG}
              placeholder="Tu número de cédula"
              aria-label="Número de cédula"
            />
          </div>

          <div>
            <label className={FIELD_LABEL}>Email *</label>
            <input
              type="email"
              name="email"
              className={`peer ${INPUT_LG}`}
              required
              placeholder="tu@email.com"
              aria-label="Dirección de email"
            />
            <div className={INVALID_FEEDBACK}>Por favor ingresa un email válido</div>
          </div>

          <div>
            <label className={FIELD_LABEL}>Teléfono *</label>
            <input
              type="tel"
              name="phone"
              className={`peer ${INPUT_LG}`}
              required
              placeholder="+598 98 114 696"
              aria-label="Número de teléfono"
            />
            <div className={INVALID_FEEDBACK}>Por favor ingresa tu teléfono</div>
          </div>

          <div className="md:col-span-2">
            <label className={FIELD_LABEL}>Notas (Opcional)</label>
            <textarea
              name="notes"
              rows={3}
              className={TEXTAREA}
              placeholder="Cualquier comentario especial..."
              aria-label="Notas adicionales"
            />
          </div>

          <div className="md:col-span-2">
            <div className="relative mb-0.5 block min-h-6 pl-[1.5em] touch:min-h-11 touch:pl-0">
              <input id={termsId} type="checkbox" name="terms" required className={CHECKBOX} />
              <label
                htmlFor={termsId}
                className="text-text-secondary group-data-[validated=true]/form:peer-invalid:text-[#dc3545] group-data-[validated=true]/form:peer-valid:text-[#198754] touch:flex touch:min-h-11 touch:items-center touch:pl-9"
              >
                <span>
                  Acepto los{' '}
                  <a
                    href="#"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent transition-colors duration-150 hover:text-accent-light"
                  >
                    términos y condiciones
                  </a>
                </span>
              </label>
              <div className={INVALID_FEEDBACK}>Debes aceptar los términos y condiciones</div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
