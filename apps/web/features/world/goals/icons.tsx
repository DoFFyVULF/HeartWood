// Маленький набор SVG-иконок для страницы «Цели» — инлайн, без зависимостей.
// Все штриховые иконки наследуют цвет через currentColor; заливные (сердце) —
// через fill. Размер задаётся снаружи (className). Стиль повторяет иконки
// купонов и воспоминаний: контур, без эмодзи.

interface IconProps {
  className?: string;
}

/** Галочка — выполненная цель, пройденные вехи. */
export function CheckIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

/** Плюс — «новая цель». */
export function PlusIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

/** Бумажный самолётик — путешествие («на море»). */
export function PlaneIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}

/** Диван — дом и уют. */
export function SofaIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 11a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3" />
      <path d="M4 11h16a1.5 1.5 0 0 1 1.5 1.5v3A1.5 1.5 0 0 1 20 17H4a1.5 1.5 0 0 1-1.5-1.5v-3A1.5 1.5 0 0 1 4 11Z" />
      <path d="M5.5 17v2.5M18.5 17v2.5" />
    </svg>
  );
}

/** Закат — годовщина, праздник. */
export function SunsetIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 4v2.5" />
      <path d="M5.6 6.6l1.6 1.6M18.4 6.6l-1.6 1.6" />
      <path d="M4 14.5c2.5-1.2 4.5-1.8 6.5-1.8M20 14.5c-2.5-1.2-4.5-1.8-6.5-1.8" />
      <path d="M3 18.5h18M3 18.5c1-1.8 2-3 3-3.5M21 18.5c-1-1.8-2-3-3-3.5M12 12.7V14" />
      <path d="M8.5 20.5c.9-1.5 2.2-2.5 3.5-2.5s2.6 1 3.5 2.5" />
    </svg>
  );
}

/** Рубль — копилки целей ведутся в рублях. */
export function RubleIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.5 8h3.4a2 2 0 0 1 0 4H9.5" />
      <path d="M9.5 8v8" />
      <path d="M9.5 13.5h4.6" />
    </svg>
  );
}

/** Копилка-свинка — сводка «в копилке» и пустые состояния. */
export function PiggyIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 12c0-1.7 1.3-3 3-3 .3-1.8 1.9-3 4-3h4.5c1.9 0 3.5 1.6 3.5 3.5 0 .3 0 .6-.1.9l1.1.6v3l-1.6.3c-.8 1.5-2.3 2.7-4 3H8c-2.2 0-4-1.8-4-4v-1.3Z" />
      <path d="M8.5 9a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1Z" />
      <path d="M5.5 15.5 4 17M18.5 15.5 20 17" />
      <path d="M14.5 9.5h3" />
    </svg>
  );
}

/** Корзина — удалить созданную цель. */
export function TrashIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 6.5h14M9.5 6.5V5h5v1.5M7 6.5l.8 12a2 2 0 0 0 2 1.9h4.4a2 2 0 0 0 2-1.9l.8-12" />
      <path d="M10 10.5v5M14 10.5v5" />
    </svg>
  );
}
