import { useState, useCallback, useRef, useEffect } from 'react';

interface UseDropdownOptions {
  onOpen?: () => void;
  onClose?: () => void;
  closeOnEscape?: boolean;
  closeOnClickOutside?: boolean;
}

interface UseDropdownReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
  triggerProps: {
    ref: React.RefObject<HTMLButtonElement | null>;
    onClick: () => void;
    'aria-expanded': boolean;
    'aria-haspopup': 'menu';
  };
  contentProps: {
    ref: React.RefObject<HTMLDivElement | null>;
    role: 'menu';
    'aria-hidden': boolean;
  };
}

/**
 * Hook to manage dropdown state with keyboard navigation and click outside
 */
export function useDropdown(options: UseDropdownOptions = {}): UseDropdownReturn {
  const {
    onOpen,
    onClose,
    closeOnEscape = true,
    closeOnClickOutside = true,
  } = options;

  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const open = useCallback(() => {
    setIsOpen(true);
    onOpen?.();
  }, [onOpen]);

  const close = useCallback(() => {
    setIsOpen(false);
    onClose?.();
    // Return focus to trigger
    triggerRef.current?.focus();
  }, [onClose]);

  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);

  // Handle escape key
  useEffect(() => {
    if (!closeOnEscape || !isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, close]);

  // Handle click outside
  useEffect(() => {
    if (!closeOnClickOutside || !isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        contentRef.current &&
        !contentRef.current.contains(target)
      ) {
        close();
      }
    };

    // Use setTimeout to avoid immediate close on the same click that opened
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen, closeOnClickOutside, close]);

  return {
    isOpen,
    open,
    close,
    toggle,
    triggerRef,
    contentRef,
    triggerProps: {
      ref: triggerRef,
      onClick: toggle,
      'aria-expanded': isOpen,
      'aria-haspopup': 'menu' as const,
    },
    contentProps: {
      ref: contentRef,
      role: 'menu' as const,
      'aria-hidden': !isOpen,
    },
  };
}
