'use client';
import { useEffect, useRef } from 'react';
import { XIcon as X } from '@phosphor-icons/react/ssr';
import { Button } from './ui/button';
export function Modal({
  title,
  children,
  onClose,
  variant = 'dialog',
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  variant?: 'dialog' | 'drawer';
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    const previous = document.activeElement as HTMLElement | null;
    dialog.showModal();
    return () => {
      dialog.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={variant === 'drawer' ? 'dialog nav-drawer' : 'dialog'}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return;
        const dialog = ref.current!;
        const controls = Array.from(
          dialog.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        ).filter((el) => el.getClientRects().length > 0);
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (!first) {
          event.preventDefault();
          dialog.focus();
          return;
        }
        if (
          event.shiftKey &&
          (document.activeElement === first || document.activeElement === dialog)
        ) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="dialog-heading">
        <h2>{title}</h2>
        <Button variant="ghost" size="icon" aria-label="Close dialog" onClick={onClose}>
          <X aria-hidden="true" size={18} />
        </Button>
      </div>
      {children}
    </dialog>
  );
}
