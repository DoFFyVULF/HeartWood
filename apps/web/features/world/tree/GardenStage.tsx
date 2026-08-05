"use client";

import { LivingTree } from "@/features/world/tree/LivingTree";
import type { Season, TimeOfDay, TreeMood } from "@/lib/types";
import { useWorld } from "@/lib/api-data";
import styles from "./GardenStage.module.css";

/**
 * Садовая сцена главной страницы. Никакой панели тестирования: вид дерева,
 * стадия, прогресс, сезон, время суток и настроение приходят готовыми с
 * сервера (WorldView.tree) и растут за действия обеих половинок.
 *
 * Без второй половинки — семечка нет: вместо сцены заблюрённый сад-намёк с
 * плашкой «Половинка ещё не рядом», как на странице свиданий.
 */
export function GardenStage() {
  const { data: world } = useWorld();
  const tree = world?.tree;

  // Нет половинки → семечка нет, вместо него грустная плашка на блюре.
  if (tree && !tree.hasPartner) {
    return (
      <section aria-labelledby="garden-nopartner-title" className={styles.noPartner}>
        {/* Заблюрённый силуэт будущего сада — намёк на то, что вырастет. */}
        <div className={styles.noPartnerScene} aria-hidden>
          <div className={styles.noPartnerTree}>
            <LivingTree
              seedKey={world?.couple ?? "heartwood"}
              species="oak"
              level={1}
              season="summer"
              timeOfDay="day"
              mood="clear"
              showProgress={false}
            />
          </div>
        </div>
        <div className={styles.noPartnerCard}>
          <span className={styles.noPartnerEmoji} aria-hidden>
            🥺
          </span>
          <h2 id="garden-nopartner-title" className={styles.noPartnerTitle}>
            Половинка ещё не рядом
          </h2>
          <p className={styles.noPartnerText}>
            Когда она вступит по коду — здесь вырастет ваше общее дерево.
          </p>
        </div>
      </section>
    );
  }

  const level = tree?.level ?? 0;
  const levelProgress = tree?.levelProgress ?? 0;
  const species = tree?.species ?? "auto";
  const speciesLabel = tree?.speciesLabel ?? "Семечко";
  const speciesEmoji = tree?.speciesEmoji ?? "🌰";
  const season: Season = tree?.season ?? "summer";
  const timeOfDay: TimeOfDay = tree?.timeOfDay ?? "day";
  const mood: TreeMood = tree?.mood ?? "clear";
  const nextLabel = tree?.nextSpeciesLabel ?? null;
  const pct = Math.round(levelProgress * 100);

  return (
    <section aria-labelledby="garden-title" className={styles.card}>
      <header className={styles.header}>
        <h3 id="garden-title" className={styles.title}>
          Ваш сад
        </h3>
        <span className={styles.speciesChip}>
          {speciesEmoji} {speciesLabel}
        </span>
      </header>

      {/* Живое дерево: вид по уровню, сезон/время/настроение — с сервера. */}
      <div className={styles.stage}>
        <LivingTree
          seedKey={world?.couple ?? "heartwood"}
          species={species}
          level={level}
          levelProgress={levelProgress}
          season={season}
          timeOfDay={timeOfDay}
          mood={mood}
          showProgress={false}
        />
      </div>

      {/* Прогресс роста: сколько до следующего вида. */}
      <div className={styles.progress}>
        <div className={styles.bar}>
          <div className={styles.fill} style={{ width: `${Math.max(3, pct)}%` }} />
        </div>
        <p className={styles.progressText}>
          {nextLabel ? (
            <>Ещё {100 - pct}% до «{nextLabel}»</>
          ) : (
            <>Вершина — «{speciesLabel}» ✦</>
          )}
        </p>
      </div>
    </section>
  );
}