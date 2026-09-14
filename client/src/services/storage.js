/**
 * Servicio de almacenamiento local seguro con fallback y claves por usuario
 */

export function loadData(key, defaultValue) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch (err) {
    console.warn(`[Storage] Error al leer clave "${key}":`, err);
    return defaultValue;
  }
}

export function saveData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`[Storage] Error al guardar clave "${key}":`, err);
  }
}

export function getUserStorageKey(prefix, username) {
  const safeUser = (username || 'default').toLowerCase();
  return `dy_${prefix}_${safeUser}`;
}
