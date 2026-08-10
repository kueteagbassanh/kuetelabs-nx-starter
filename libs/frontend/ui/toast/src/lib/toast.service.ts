import { Injectable } from '@angular/core';
import { toast } from '@spartan-ng/brain/sonner';

export interface ToastOptions {
  description?: string;
  /** Milliseconds before auto-dismiss. Errors default to staying longer. */
  duration?: number;
  action?: { label: string; onClick: () => void };
}

/**
 * Transient on-screen messages.
 *
 * Features call this rather than importing sonner directly, so the toast library
 * is swappable in one file and every toast in the app shares defaults. Requires
 * `<hlm-toaster />` in the app shell — without it, calls are silently dropped.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  success(message: string, options?: ToastOptions): void {
    toast.success(message, this.map(options));
  }

  error(message: string, options?: ToastOptions): void {
    // Errors linger: the user usually needs to read and act on them.
    toast.error(message, this.map({ duration: 8000, ...options }));
  }

  info(message: string, options?: ToastOptions): void {
    toast(message, this.map(options));
  }

  warning(message: string, options?: ToastOptions): void {
    toast.warning(message, this.map(options));
  }

  /** Shows loading, then resolves to success or error with one toast. */
  promise<T>(
    work: Promise<T>,
    messages: { loading: string; success: string; error: string },
  ): void {
    toast.promise(work, messages);
  }

  private map(options?: ToastOptions) {
    if (!options) {
      return undefined;
    }
    return {
      description: options.description,
      duration: options.duration,
      action: options.action
        ? { label: options.action.label, onClick: options.action.onClick }
        : undefined,
    };
  }
}
