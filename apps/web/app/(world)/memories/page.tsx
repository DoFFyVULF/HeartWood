import type { Metadata } from "next";
import { MemoriesPage } from "@/features/world/memories/MemoriesPage";

export const metadata: Metadata = {
  title: "Воспоминания — Heartwood",
  description:
    "Ваши мгновения в виде полароидов: сохраняйте воспоминания пары, добавляйте фото и видео.",
};

export default function MemoriesRoute() {
  return <MemoriesPage />;
}
