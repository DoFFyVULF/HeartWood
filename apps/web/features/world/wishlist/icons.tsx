// Небольшой набор SVG-иконок для «Списка желаний» — инлайн, без
// зависимостей. Все штриховые иконки наследуют цвет через currentColor.
// Размер задаётся снаружи (className). Стиль повторяет иконки целей и
// календаря: контур, без эмодзи.

interface IconProps {
  className?: string;
}

/** Бант / коробка — «мечты» и главная иконка страницы. */
export function GiftIcon({ className }: IconProps) {
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
      <rect x="4" y="9.5" width="16" height="11" rx="2" />
      <path d="M4 9.5h16M12 9.5V20.5M3 6h18v3.5H3Z" />
      <path d="M12 6c-1.5-2.6-5.5-2.2-5 1 1.8.2 4.6.2 5-1ZM12 6c1.5-2.6 5.5-2.2 5 1-1.8.2-4.6.2-5-1Z" />
    </svg>
  );
}

/** Облако-мечта — открытые желания в списке. */
export function DreamIcon({ className }: IconProps) {
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
      <path d="M6 17.5h9a4.5 4.5 0 0 0 .6-9A5.5 5.5 0 0 0 6.7 9a4 4 0 0 0-.7 8.5Z" />
      <path d="M9 21h6M10 12.5l1.4 1.4L14.8 10" />
    </svg>
  );
}

/** Упаковка с бантом — «готовится подарок». */
export function BoxIcon({ className }: IconProps) {
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
      <path d="M4 8.5h16M4 8.5l1.3 9.2A2 2 0 0 0 7.3 19.5h9.4a2 2 0 0 0 2-1.8l1.3-9.2" />
      <path d="M4 8.5 12 6l8 2.5M12 6v13.5" />
    </svg>
  );
}

/** Галочка — «подарено», желание сбылось. */
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

/** Плюс — «добавить желание». */
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

/** Корзина — удалить своё желание. */
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

/** Звёздочки — «исполненные мечты», тёплая мелочь в подписях. */
export function SparklesIcon({ className }: IconProps) {
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
      <path d="M12 4.5c.6 2.5 2.3 4.2 4.8 4.8-2.5.6-4.2 2.3-4.8 4.8-.6-2.5-2.3-4.2-4.8-4.8 2.5-.6 4.2-2.3 4.8-4.8Z" />
      <path d="M18.5 15.5c.4 1.6 1.4 2.6 3 3-1.6.4-2.6 1.4-3 3-.4-1.6-1.4-2.6-3-3 1.6-.4 2.6-1.4 3-3Z" />
    </svg>
  );
}
