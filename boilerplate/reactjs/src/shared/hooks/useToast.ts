import { useState, useCallback } from 'react';
import type { AppError } from '../api/errorHandler';

interface Toast {
  id: string;
  message: string;
  type: 'error' | 'success' | 'warning' | 'info';
  duration?: number;
}

interface UseToastReturn {
  toasts: Toast[];
  showToast: (message: string, type?: Toast['type'], duration?: number) => void;
  showError: (error: AppError | string) => void;
  dismissToast: (id: string) => void;
}

/**
 * Toast notification hook for user-facing error/success messages.
 *
 * @example
 * ```tsx
 * const { showToast, showError, dismissToast, toasts } = useToast();
 *
 * // Success
 * showToast('Order created successfully', 'success');
 *
 * // Error from API
 * showError({ code: 'ORDER_NOT_FOUND', message: 'Order not found', status: 404 });
 *
 * // Inline in component
 * <ToastContainer toasts={toasts} onDismiss={dismissToast} />
 * ```
 */
export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (message: string, type: Toast['type'] = 'info', duration = 5000) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const toast: Toast = { id, message, type, duration };
      setToasts((prev) => [...prev, toast]);

      // Auto-dismiss after duration
      if (duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
      }
    },
    [],
  );

  const showError = useCallback(
    (error: AppError | string) => {
      const message = typeof error === 'string' ? error : error.message;
      showToast(message, 'error', 8000); // Errors stay visible longer
    },
    [showToast],
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, showToast, showError, dismissToast };
}
