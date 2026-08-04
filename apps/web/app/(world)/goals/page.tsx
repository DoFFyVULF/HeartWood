import type { Metadata } from "next";
import { GoalsPage } from "@/features/world/goals/GoalsPage";

export const metadata: Metadata = {
  title: "Цели пары — Heartwood",
  description:
    "Общие копилки пары в рублях: цели, вехи и вклад каждого — шаг за шагом к мечте.",
};

export default function GoalsRoute() {
  return <GoalsPage />;
}
