import { DialogTitle } from '@headlessui/react';
import Button from '../ui/Button.jsx';
import Modal from '../ui/Modal.jsx';

// The Modal box is transparent here: the Preline loading-toast card below is the surface. The side
// padding keeps the card clear of the screen edges on 320px phones.
const BARE_CONTENT = 'flex w-full flex-col items-center px-4';

/**
 * "Processing" dialog shown while the booking request is in flight (Preline loading-toast card).
 * Like legacy, "Cerrar" only hides it: the submission itself keeps going.
 */
export default function LoadingModal({ open, onClose, message = 'Procesando tu reserva...' }) {
  return (
    <Modal open={open} onClose={onClose} contentClassName={BARE_CONTENT}>
      <div role="alert" className="w-full max-w-xs rounded-xl border border-layer-line bg-layer shadow-lg">
        <div className="flex items-center gap-x-3 p-4">
          <div
            role="status"
            aria-label="loading"
            className="animate-spin inline-block size-4 shrink-0 border-3 border-current border-t-transparent text-primary rounded-[999px]"
          >
            <span className="sr-only">Loading...</span>
          </div>
          <div className="grow">
            <DialogTitle as="p" className="text-sm text-layer-foreground">
              {message}
            </DialogTitle>
            <p className="mt-1 text-xs text-muted-foreground-1">Por favor espera un momento</p>
          </div>
        </div>
        <div className="flex justify-end border-t border-layer-line px-4 py-3">
          <Button variant="outlineSecondary" size="xs" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
