// Development-only logging utility
export const logger = {
  error: (message: string, error?: any) => {
    if (import.meta.env.DEV) {
      console.error(message, error);
    }
  },
  warn: (message: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.warn(message, data);
    }
  },
  log: (message: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.log(message, data);
    }
  }
};