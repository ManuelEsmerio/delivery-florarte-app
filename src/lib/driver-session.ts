export type DriverSession = {
  user: {
    id: number;
    name: string;
    email: string;
    role?: string;
  };
};

const LEGACY_DRIVER_USER_KEY = 'driver_user';
const LEGACY_DRIVER_SESSION_KEY = 'driver_session';

export async function fetchDriverSession(): Promise<DriverSession | null> {
  try {
    const res = await fetch('/api/auth/session', {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-store',
      },
    });

    if (!res.ok) {
      clearDriverSession();
      return null;
    }

    const data = await res.json();

    if (!data?.authenticated || !data?.user?.id) {
      clearDriverSession();
      return null;
    }

    return {
      user: data.user,
    };
  } catch {
    clearDriverSession();
    return null;
  }
}

export function clearDriverSession() {
  if (typeof window === 'undefined') return;

  window.localStorage.removeItem(LEGACY_DRIVER_USER_KEY);
  window.localStorage.removeItem(LEGACY_DRIVER_SESSION_KEY);
}