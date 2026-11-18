const AUTH_REDIRECT_STORAGE_KEY = 'amyaro:authRedirect';
const AUTH_REDIRECT_MAX_AGE_MS = 60 * 60 * 1000; // 1 Stunde

interface StoredAuthRedirect {
  path: string;
  createdAt: number;
}

const toSafePath = (value: string | null | undefined): string | null => {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return null;
  }

  return value;
};

/**
 * Merkt sich das ursprüngliche Ziel, damit der Nutzer nach Login bzw.
 * E-Mail-Verifizierung wieder dorthin zurückkehrt.
 */
export const rememberAuthRedirect = (path: string): void => {
  const safePath = toSafePath(path);
  if (!safePath) return;

  try {
    const stored: StoredAuthRedirect = {
      path: safePath,
      createdAt: Date.now(),
    };
    localStorage.setItem(AUTH_REDIRECT_STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // localStorage kann z. B. im privaten Modus nicht verfügbar sein.
  }
};

export const peekAuthRedirect = (): string | null => {
  try {
    const raw = localStorage.getItem(AUTH_REDIRECT_STORAGE_KEY);
    if (!raw) return null;

    const stored = JSON.parse(raw) as StoredAuthRedirect;
    if (
      !stored ||
      typeof stored.createdAt !== 'number' ||
      Date.now() - stored.createdAt > AUTH_REDIRECT_MAX_AGE_MS
    ) {
      localStorage.removeItem(AUTH_REDIRECT_STORAGE_KEY);
      return null;
    }

    return toSafePath(stored.path);
  } catch {
    return null;
  }
};

export const clearAuthRedirect = (): void => {
  try {
    localStorage.removeItem(AUTH_REDIRECT_STORAGE_KEY);
  } catch {
    // localStorage kann z. B. im privaten Modus nicht verfügbar sein.
  }
};
