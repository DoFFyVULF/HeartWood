import type { Metadata } from "next";
import { CouponsPage } from "@/features/world/coupons/CouponsPage";

export const metadata: Metadata = {
  title: "Купоны пары — Heartwood",
  description:
    "Купонная книжка пары: тёплые обещания в долг, которые можно погасить в любой момент.",
};

export default function CouponsRoute() {
  return <CouponsPage />;
}
