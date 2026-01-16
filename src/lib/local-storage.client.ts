export function setLocalStorageValue(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[localStorage] Failed to write value:', error);
    }
  }
}

export function getLocalStorageValue(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function deleteLocalStorageValue(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[localStorage] Failed to delete value:', error);
    }
  }
}
