/**
 * safeStoragePolyfill.ts
 * In-memory fallback polyfill for localStorage to prevent security exceptions in sandboxed iframes.
 * This must be imported at the very top of the entry point file.
 */

(function initSafeStorage() {
  if (typeof window === 'undefined') return;

  // 1. Check and Mock localStorage
  let isStorageAccessible = false;
  try {
    const testKey = '__optic_test_storage__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    isStorageAccessible = true;
  } catch (e) {
    console.warn('[SECURITY] Direct localStorage access is blocked or restricted. Implementing in-memory fallback.');
  }

  if (!isStorageAccessible) {
    const memoryStore: Record<string, string> = {};
    
    const mockStorage = {
      getItem(key: string): string | null {
        return Object.prototype.hasOwnProperty.call(memoryStore, key) ? memoryStore[key] : null;
      },
      setItem(key: string, value: any): void {
        memoryStore[key] = String(value);
      },
      removeItem(key: string): void {
        delete memoryStore[key];
      },
      clear(): void {
        for (const key in memoryStore) {
          if (Object.prototype.hasOwnProperty.call(memoryStore, key)) {
            delete memoryStore[key];
          }
        }
      },
      key(index: number): string | null {
        const keys = Object.keys(memoryStore);
        return keys[index] || null;
      },
      get length(): number {
        return Object.keys(memoryStore).length;
      }
    };

    try {
      Object.defineProperty(window, 'localStorage', {
        value: mockStorage,
        writable: true,
        configurable: true
      });
      console.log('[SECURITY] window.localStorage successfully mocked with in-memory store.');
    } catch (err) {
      console.error('[SECURITY] Critical: Failed to redefine window.localStorage. Individual safeguards must be used.', err);
    }
  }

  // 2. Check and Mock sessionStorage
  let isSessionStorageAccessible = false;
  try {
    const testKey = '__optic_test_session__';
    window.sessionStorage.setItem(testKey, '1');
    window.sessionStorage.removeItem(testKey);
    isSessionStorageAccessible = true;
  } catch (e) {
    console.warn('[SECURITY] Direct sessionStorage access is blocked or restricted. Implementing in-memory fallback.');
  }

  if (!isSessionStorageAccessible) {
    const sessionMemoryStore: Record<string, string> = {};
    
    const mockSessionStorage = {
      getItem(key: string): string | null {
        return Object.prototype.hasOwnProperty.call(sessionMemoryStore, key) ? sessionMemoryStore[key] : null;
      },
      setItem(key: string, value: any): void {
        sessionMemoryStore[key] = String(value);
      },
      removeItem(key: string): void {
        delete sessionMemoryStore[key];
      },
      clear(): void {
        for (const key in sessionMemoryStore) {
          if (Object.prototype.hasOwnProperty.call(sessionMemoryStore, key)) {
            delete sessionMemoryStore[key];
          }
        }
      },
      key(index: number): string | null {
        const keys = Object.keys(sessionMemoryStore);
        return keys[index] || null;
      },
      get length(): number {
        return Object.keys(sessionMemoryStore).length;
      }
    };

    try {
      Object.defineProperty(window, 'sessionStorage', {
        value: mockSessionStorage,
        writable: true,
        configurable: true
      });
      console.log('[SECURITY] window.sessionStorage successfully mocked with in-memory store.');
    } catch (err) {
      console.error('[SECURITY] Critical: Failed to redefine window.sessionStorage.', err);
    }
  }
})();
