import { toast, ExternalToast } from 'sonner';

type ToastOptions = ExternalToast;

export const useToast = () => {
  return {
    toast: {
      success: (message: string, options?: ToastOptions) => toast.success(message, options),
      error: (message: string, options?: ToastOptions) => toast.error(message, options),
      info: (message: string, options?: ToastOptions) => toast.info(message, options),
      warning: (message: string, options?: ToastOptions) => toast.warning(message, options),
      custom: (message: string, options?: ToastOptions) => toast(message, options),
    },
  };
};

// Export langsung fungsi toast untuk kemudahan
export { toast };