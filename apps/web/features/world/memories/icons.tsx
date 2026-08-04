// Маленький набор SVG-иконок для воспоминаний — инлайн, без зависимостей.
// Штриховые иконки наследуют цвет через currentColor и stroke; заливное
// сердце — через fill. Размер задаётся снаружи (className).

interface IconProps {
  className?: string;
}

/** Заливное сердце — «сохранить», тёплое отношение к воспоминанию. */
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

/** Камера — пустые состояния, dropzone и шапка галереи. */
export function CameraIcon({ className }: IconProps) {
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
      <path d="M4 7.5h3l1.5-2h7l1.5 2h3A1.5 1.5 0 0 1 21 9v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18V9a1.5 1.5 0 0 1 1.5-1.5Z" />
      <circle cx="12" cy="13" r="3.4" />
    </svg>
  );
}

/** Изображение — сводка «фото и видео». */
export function ImageIcon({ className }: IconProps) {
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
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <circle cx="8.5" cy="10" r="1.6" />
      <path d="m21 15.5-4.5-4.5-8 8" />
    </svg>
  );
}

/** Крестик — закрытие композера и удаление медиа. */
export function CloseIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

/** Корзина — удаление воспоминания. */
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
      <path d="M4 7h16" />
      <path d="M9.5 7V5.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5V7" />
      <path d="M6.5 7l.8 12a2 2 0 0 0 2 1.9h5.4a2 2 0 0 0 2-1.9l.8-12" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

/** Предупреждение — хранилище почти заполнено, ошибки. */
export function AlertIcon({ className }: IconProps) {
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
      <path d="M12 4 2.7 20h18.6L12 4Z" />
      <path d="M12 10v4.5" />
      <path d="M12 17.6h.01" />
    </svg>
  );
}

/** Стрелка назад — на странице воспоминания. */
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
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}
