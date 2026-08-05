// Небольшой набор SVG-иконок для страницы «Календарь» — инлайн, без
// зависимостей. Все штриховые иконки наследуют цвет через currentColor.
// Размер задаётся снаружи (className). Стиль повторяет иконки целей и
// купонов: контур, без эмодзи.

import type { ComponentType } from "react";
import type { EventKind } from "@/lib/types";

interface IconProps {
  className?: string;
}

/** Календарь — общая иконка страницы и сводки. */
export function CalendarIcon({ className }: IconProps) {
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
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" />
      <path d="M8.5 14.5 11 16.5l4.5-4.5" />
    </svg>
  );
}

/** Сердце — годовщины и тёплые даты. */
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

/** Билет — предстоящие свидания. */
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
      <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h11A2.5 2.5 0 0 1 20 8.5v1.6a2 2 0 0 0 0 3.8v1.6a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 15.5v-1.6a2 2 0 0 0 0-3.8Z" />
      <path d="M12 6v12M12 10.8c-.9.7-2.1.7-3 0M12 13.2c-.9-.7-2.1-.7-3 0" />
    </svg>
  );
}

/** Звезда — важные даты-вехи из истории. */
export function StarIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m12 3.5 2.5 5.4 5.9.7-4.4 4 1.2 5.9L12 16.7l-5.2 2.8 1.2-5.9-4.4-4 5.9-.7Z" />
    </svg>
  );
}

/** Плюс — «добавить дату». */
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

/** Корзина — удалить созданное событие. */
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

/** Галочка — выполненные вехи-галочки в подписях. */
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

/** Стрелка влево — навигация по месяцам. */
export function ChevronLeftIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m15 5-7 7 7 7" />
    </svg>
  );
}

/** Стрелка вправо — навигация по месяцам. */
export function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}

/** Иконка типа события — общая для сетки, панели дня и сводки. */
export const KIND_ICON: Record<EventKind, ComponentType<IconProps>> = {
  date: TicketIcon,
  anniversary: HeartIcon,
  milestone: StarIcon,
};
