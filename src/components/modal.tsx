import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";

/**
 * A modal dialog component that uses the native <dialog> element.
 * It is controlled by the `open` prop and calls `onClose` when closed.
 * The modal can be closed by clicking outside of it or pressing the Escape key.
 * @param open - Whether the modal is open or not.
 * @param onClose - A callback function that is called when the modal is closed.
 * @param title - The title of the modal, used for accessibility.
 * @param children - The content of the modal.
 * @returns A react component that renders a modal dialog.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        ) {
          event.currentTarget.close();
        }
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[min(90vw,40rem)] overflow-y-auto rounded-lg border border-border bg-background p-5 text-foreground shadow-xl backdrop:bg-black/60"
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 id={titleId} className="text-xl font-semibold">
          {title}
        </h2>
        <button
          type="button"
          className="button button-secondary"
          aria-label="Close"
          onClick={() => dialogRef.current?.close()}
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>
      {children}
    </dialog>
  );
}
