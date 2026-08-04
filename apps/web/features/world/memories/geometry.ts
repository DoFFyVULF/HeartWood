// Детерминированная геометрия полароидов.
//
// Поворот каждой карточки считается из её id (хеш), а не из индекса или
// Math.random — так сетка и детальная страница совпадают, и гидрация
// не плывёт (сервер и клиент видят одинаковые углы).

const ROTATIONS = [-3.5, -1.5, 2, 3.5, -2.5, 1.5, -4, 2.5, -1, 3] as const;

/** Хеш строки → число в [0, 1), стабильный между рендерами. */
function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

/** Угол поворота полароида в градусах для заданного id. */
export function idRotation(id: string): number {
  const idx = Math.floor(hashString(id) * ROTATIONS.length);
  return ROTATIONS[idx % ROTATIONS.length];
}

/** Мягкие пастельные градиенты для обложек без фото. */
const GRADIENTS = [
  "linear-gradient(135deg, #fde7c8 0%, #fbd3e0 100%)",
  "linear-gradient(135deg, #d9e8ff 0%, #e6d9ff 100%)",
  "linear-gradient(135deg, #d9fbee 0%, #d3ecff 100%)",
  "linear-gradient(135deg, #ffe9f2 0%, #fff0d4 100%)",
] as const;

/** Градиент обложки — стабильный по позиции в сетке. */
export function coverGradient(index: number): string {
  return GRADIENTS[index % GRADIENTS.length];
}
