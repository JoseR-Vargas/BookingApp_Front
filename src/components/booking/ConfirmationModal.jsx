import { DialogTitle } from '@headlessui/react';
import { formatLongDateUTC, formatMoney } from '../../utils/format.js';
import Button from '../ui/Button.jsx';
import Modal from '../ui/Modal.jsx';

function Row({ icon, label, children, last = false }) {
  return (
    <div className={`flex items-start text-[0.95rem] text-text-primary ${last ? '' : 'mb-2'}`}>
      <i aria-hidden="true" className={`${icon} mt-[0.15rem] mr-2 shrink-0 text-accent`} />
      <span className="mr-1 text-text-secondary">{label}</span>
      <strong>{children}</strong>
    </div>
  );
}

/**
 * Success dialog shown after the booking was created (legacy #confirmationModal).
 * `details`: { serviceName, professionalName, date ('YYYY-MM-DD'), time, price, email }.
 * Legacy flags: static backdrop and `data-bs-keyboard="false"`: only the button closes it.
 */
export default function ConfirmationModal({ open, onClose, details }) {
  return (
    <Modal open={open} onClose={onClose} keyboard={false}>
      {details && (
        <div className="p-6 text-center md:p-12">
          <div
            aria-hidden="true"
            className="mx-auto mb-6 flex size-[90px] items-center justify-center rounded-full border-3 border-[rgba(76,175,80,0.3)] bg-[rgba(76,175,80,0.15)] text-[3rem] text-success"
          >
            <i className="fas fa-check-circle" />
          </div>
          <DialogTitle
            as="h4"
            className="mb-1 text-[length:calc(1.275rem+0.3vw)] leading-tight font-bold xl:text-xl"
          >
            ¡Reserva Confirmada!
          </DialogTitle>
          <p className="mb-6 leading-loose text-text-secondary">Te esperamos en tu cita</p>

          <div className="mb-6 rounded-lg border border-border bg-bg-tertiary p-4 text-left">
            <Row icon="fas fa-concierge-bell" label="Servicio:">
              {details.serviceName}
            </Row>
            <Row icon="fas fa-user-tie" label="Profesional:">
              {details.professionalName}
            </Row>
            <Row icon="fas fa-calendar-alt" label="Fecha:">
              {formatLongDateUTC(details.date)}
            </Row>
            <Row icon="fas fa-clock" label="Hora:">
              {details.time}
            </Row>
            <Row icon="fas fa-tag" label="Precio:" last>
              {formatMoney(details.price)}
            </Row>
          </div>

          <p className="mb-6 text-[0.875em] leading-loose text-text-secondary">
            <i aria-hidden="true" className="fas fa-envelope mr-1" /> Te enviamos la confirmación a <strong>{details.email}</strong>
          </p>

          <Button size="cta" onClick={onClose} aria-label="Cerrar confirmación">
            Entendido
            <i aria-hidden="true" className="fas fa-check ml-3.5" />
          </Button>
        </div>
      )}
    </Modal>
  );
}
