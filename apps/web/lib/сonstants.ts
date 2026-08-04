
/**
 * Общие константы анимаций.
 * Единый easing для всех framer-motion переходов проекта.
 */
export const EASE = [0.22, 1, 0.36, 1] as const;

/** Генерация уникального ID с фолбэком для сред без crypto.randomUUID */
export function generateId(prefix = "id"): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}