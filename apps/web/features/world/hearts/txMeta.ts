// Оформление причин транзакций сердечек — UI-каталог для истории.
// Экономика (правила начисления) живёт на сервере (hearts.service.ts);
// здесь — только человекочитаемые подписи и эмодзи для отрисовки.

import type { HeartReason } from "@/lib/types";

export const TX_META: Record<HeartReason, { emoji: string; title: string }> = {
  daily: { emoji: "🌅", title: "Ежедневный вход" },
  memory: { emoji: "📸", title: "Воспоминание" },
  date: { emoji: "🎠", title: "Свидание" },
  coupon_send: { emoji: "🎫", title: "Купон отправлен" },
  reaction: { emoji: "💬", title: "Реакция" },
  streak: { emoji: "🔥", title: "Серия дней" },
  coupon_redeem: { emoji: "💛", title: "Выкуп купона" },
};
