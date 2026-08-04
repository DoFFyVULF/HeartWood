import type { Metadata } from "next";
import { ProfileScreen } from "@/features/world/profile/ProfileScreen";

export const metadata: Metadata = {
  title: "Профиль пары — Heartwood",
  description:
    "Карточки вашей пары: выберите, чей мир сейчас в цвете — перекрашивание как на странице регистрации.",
};

export default function ProfilePage() {
  return <ProfileScreen />;
}
