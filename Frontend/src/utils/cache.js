/**
 * Vinsup Academy LMS - Client-Side Cache Helper
 * Uses sessionStorage with TTL (Time-To-Live) and safe serialization.
 */

const CACHE_PREFIX = 'vinsup_cache_';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes default

export const getCache = (key, maxAgeMs = DEFAULT_TTL) => {
  try {
    const raw = sessionStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.timestamp) return null;

    const isExpired = Date.now() - parsed.timestamp > maxAgeMs;
    if (isExpired) {
      sessionStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }

    return parsed.data;
  } catch (err) {
    console.warn(`[Cache] Error reading cache for key "${key}":`, err);
    return null;
  }
};

export const setCache = (key, data) => {
  try {
    const payload = {
      data,
      timestamp: Date.now()
    };
    sessionStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(payload));
  } catch (err) {
    console.warn(`[Cache] Error setting cache for key "${key}":`, err);
  }
};

export const clearCache = (key) => {
  try {
    sessionStorage.removeItem(`${CACHE_PREFIX}${key}`);
  } catch (err) {
    console.warn(`[Cache] Error clearing cache for key "${key}":`, err);
  }
};

export const clearAllCache = () => {
  try {
    const keysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const storageKey = sessionStorage.key(i);
      if (storageKey && storageKey.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(storageKey);
      }
    }
    keysToRemove.forEach(k => sessionStorage.removeItem(k));
  } catch (err) {
    console.warn('[Cache] Error clearing all caches:', err);
  }
};

export default {
  get: getCache,
  set: setCache,
  clear: clearCache,
  clearAll: clearAllCache
};
