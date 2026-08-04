import type { Metadata } from "next";
import { MemoryDetailPage } from "@/features/world/memories/MemoryDetailPage";

export const metadata: Metadata = {
  title: "Воспоминание — Heartwood",
  description:
    "Страница одного воспоминания: история, фото и видео вашего мига.",
};

// Server-обёртка: параметр-маршрут в Next 16 — Promise, его нужно await.
// Контент — клиентский MemoryDetailPage, чтобы читать localStorage/IndexedDB.
export default async function MemoryDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MemoryDetailPage id={id} />;
}
