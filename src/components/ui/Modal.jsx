import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';

// Legacy `.modal-content` (legacy framework + base.css overrides): dark surface, subtle border, big shadow.
export const MODAL_CONTENT_CLASSES =
  'flex w-full flex-col rounded-lg border border-border-subtle bg-bg-secondary text-text-primary shadow-xl';

const noop = () => {};

/**
 * Thin wrapper over the Headless UI Dialog that reproduces the legacy framework modal:
 *  - centered dialog box, 900px max width (legacy `.modal-dialog`), full width and flush on <=768px;
 *  - STATIC backdrop (legacy `data-bs-backdrop="static"`): clicking outside the box never closes it;
 *  - `keyboard` mirrors `data-bs-keyboard`: Escape closes unless it is `false`;
 *  - the box scrolls inside the viewport when it is taller than the screen;
 *  - Headless UI provides the focus trap, scroll lock, inert siblings and `aria-labelledby`
 *    (render a <DialogTitle> inside to label the dialog).
 *
 * The full-viewport scroller is the Dialog "panel": every pointer event around the box lands INSIDE
 * the panel, so the Dialog never sees an "outside click". The only close request left is Escape,
 * which is why `onClose` can be swapped for a no-op when `keyboard` is off.
 */
export default function Modal({
  open,
  onClose,
  keyboard = true,
  contentClassName = MODAL_CONTENT_CLASSES,
  children,
}) {
  return (
    <Dialog
      transition
      open={open}
      onClose={keyboard ? onClose : noop}
      className="group relative z-1055 transition-opacity duration-150 ease-linear data-closed:opacity-0"
    >
      {/* The legacy framework default backdrop: black at 50%. */}
      <DialogBackdrop className="fixed inset-0 bg-black/50" />
      <DialogPanel data-testid="modal-viewport" className="fixed inset-0 overflow-y-auto overflow-x-hidden">
        <div className="mx-auto my-2 flex min-h-[calc(100%-1rem)] w-full max-w-[900px] items-center transition-transform duration-300 ease-out group-data-closed:-translate-y-12 sm:my-7 sm:min-h-[calc(100%-3.5rem)] lte-md:my-0 lte-md:max-w-full">
          <div className={contentClassName}>{children}</div>
        </div>
      </DialogPanel>
    </Dialog>
  );
}
