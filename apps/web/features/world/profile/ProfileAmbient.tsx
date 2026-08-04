"use client";

import type { Gender } from "@/lib/theme";
import styles from "./ProfileAmbient.module.css";

interface ProfileAmbientProps {
  /** Пол фокусной карточки — им и окрашивается вся страница профиля. */
  gender: Gender;
}

/**
 * Локальный фон страницы профиля.
 *
 * Перекрашивает ВСЮ страницу профиля в цвет фокусной карточки — тот же эффект,
 * что на экране регистрации. В отличие от глобального AmbientBackground (он
 * читает пол пользователя и используется всеми страницами мира), этот фон живёт
 * внутри профиля и управляется активной карточкой: при клике перекрашивается
 * только эта страница, а хедер, вкладки и другие страницы остаются на глобальном
 * цвете. В глобальный пол (heartwood.gender) ничего не пишется.
 */
export function ProfileAmbient({ gender }: ProfileAmbientProps) {
  const layers = [
    { name: styles.bgBoy, visible: gender === "boy" },
    { name: styles.bgGirl, visible: gender === "girl" },
  ];

  return (
    <div aria-hidden data-profile-ambient className={styles.bg}>
      {layers.map((layer) => (
        <div
          key={layer.name}
          className={`${layer.name} ${styles.layer} ${layer.visible ? styles.layerVisible : ""}`}
        />
      ))}

      {/* Мягкие цветные пятна — подкрашиваются вместе с активной карточкой. */}
      <span className={styles.blob} style={{ top: "6%", left: "-8%", animationDuration: "26s" }} />
      <span
        className={styles.blob}
        style={{ top: "58%", left: "72%", animationDuration: "32s", animationDelay: "-8s" }}
      />
      <span
        className={styles.blob}
        style={{ top: "-12%", left: "46%", animationDuration: "36s", animationDelay: "-14s" }}
      />
    </div>
  );
}
