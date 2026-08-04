import type { Metadata } from "next";
import { EventsPage } from "@/features/world/events/EventsPage";

export const metadata: Metadata = {
  title: "Календарь — Heartwood",
  description:
    "Общий календарь пары: годовщины, предстоящие свидания и важные даты — всё, что мы отмечаем вместе.",
};

export default function EventsRoute() {
  return <EventsPage />;
}
