// Маленький набор SVG-иконок для купонов — инлайн, без зависимостей.
// Все штриховые иконки наследуют цвет через currentColor и stroke;
// заливные (сердце) — через fill. Размер задаётся снаружи (className).

interface IconProps {
  className?: string;
}

/** Заливное сердце — «сердечки» в цене, балансе и подсказках. */
export function HeartIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 21s-7.5-4.9-9.3-9.2C1.3 8.2 3.6 5 6.8 5c1.9 0 3.4 1 4.2 2.4C11.8 6 13.3 5 15.2 5c3.2 0 5.5 3.2 4.1 6.8C19.5 16.1 12 21 12 21Z" />
    </svg>
  );
}

/** Галочка — «погашено», успех. */
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

/** Билет — корешок карточки и пустые состояния. */
export function TicketIcon({ className }: IconProps) {
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
      <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h13A1.5 1.5 0 0 1 20 8.5a2 2 0 0 0 0 7 1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 15.5a2 2 0 0 0 0-7Z" />
      <path d="M12 7v10" />
    </svg>
  );
}

/** Плюс — кнопки создания. */
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

/** Бумажный самолётик — отправка черновика. */
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
