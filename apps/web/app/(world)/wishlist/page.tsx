import type { Metadata } from "next";
import { WishlistPage } from "@/features/world/wishlist/WishlistPage";

export const metadata: Metadata = {
  title: "Список желаний — Heartwood",
  description:
    "Мечты и подарки пары: загадывайте желания, тайно готовьте сюрпризы и отмечайте исполненные мечты.",
};

export default function WishlistRoute() {
  return <WishlistPage />;
}
