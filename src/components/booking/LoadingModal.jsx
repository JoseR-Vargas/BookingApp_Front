import { DialogTitle } from '@headlessui/react';
import Button from '../ui/Button.jsx';
import Modal from '../ui/Modal.jsx';

// Legacy `#loadingModal`: the framework modal-content is transparent, the modal-body carries the surface.
const BARE_CONTENT = 'flex w-full flex-col';

/**
 * "Processing" dialog shown while the booking request is in flight.
 * Like legacy, "Cerrar" only hides it: the submission itself keeps going.
 */
export default function LoadingModal({ open, onClose, message = 'Procesando tu reserva...' }) {
  return (
    <Modal open={open} onClose={onClose} contentClassName={BARE_CONTENT}>
      <div className="rounded-lg border border-border bg-bg-secondary p-4 text-center shadow-xl">
        <div
          role="status"
          className="mb-4 inline-block size-8 animate-spin rounded-full border-[0.25em] border-accent border-r-transparent align-[-0.125em] [animation-duration:0.75s]"
        >
          <span className="sr-only">Cargando...</span>
        </div>
        <DialogTitle as="h5" className="mb-2 text-[1.25rem] font-bold text-text-primary">
          {message}
        </DialogTitle>
        <p className="mb-4 leading-loose text-text-secondary">Por favor espera un momento</p>
        <Button variant="outlineSecondary" size="xs" onClick={onClose}>
          Cerrar
        </Button>
      </div>
    </Modal>
  );
}
