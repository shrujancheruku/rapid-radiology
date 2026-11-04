import type { AppUser, AuthService } from "@/backend/types";

/** Every demo key starts with this, so logout can wipe them all. */
export const DEMO_PREFIX = "rr-demo:";
const USER_KEY = `${DEMO_PREFIX}user`;

function clearDemoStorage() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(DEMO_PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    // Storage blocked: nothing persisted, nothing to clear.
  }
}

function readUser(): AppUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AppUser) : null;
  } catch {
    return null;
  }
}

/** Accepts any credentials; the user survives a reload via localStorage. */
export function createDemoAuth(): AuthService {
  const listeners = new Set<(user: AppUser | null) => void>();
  let current = readUser();

  const set = (user: AppUser | null) => {
    current = user;
    listeners.forEach((cb) => cb(user));
  };

  return {
    async getUser() {
      return current;
    },

    onChange(cb) {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },

    async signIn(email) {
      const user = { email };
      try {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      } catch {
        // Storage blocked: the session just won't survive a reload.
      }
      set(user);
    },

    async signOut() {
      clearDemoStorage();
      set(null);
    },

    async getAccessToken() {
      return null;
    },
  };
}
