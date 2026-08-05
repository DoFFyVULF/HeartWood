"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useMemories, type AddMemoryInput } from "./useMemories";
import { MemoryPolaroid } from "./MemoryPolaroid";
import { MemoryComposer } from "./MemoryComposer";
import { AlertIcon, CameraIcon, ImageIcon, PlusIcon } from "./icons";
import styles from "./MemoriesPage.module.css";

/** Русское склонение: 1 воспоминание, 2 воспоминания, 5 воспоминаний. */
function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

// Полароиды «ложатся» на стол каскадом: каждый входит слегка наклонённым и
// мягко садится в свой поворот, выпрямляясь. Направление наклона чередуется
// по индексу — как если бы фото раскладывали рукой, по одному. Одна спокойная
// пружина, без декоративного отскока; reduced-motion отключает всё целиком.
const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: (dir: number) => ({
    opacity: 0,
    y: -22,
    rotate: 6 * dir,
    scale: 0.97,
  }),
  show: {
    opacity: 1,
    y: 0,
    rotate: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 260, damping: 24, mass: 0.9 } as const,
  },
};

/**
 * Страница «Воспоминания»: сетка полароидов со stagger-входом, layout-
 * анимациями при добавлении, композер-модалкой и мягкой вспышкой «камеры».
 * Вся гамма — из токенов темы (--hwd-*), перекрашивается по гендеру.
 * Без градиентного заголовка, спарклов и декоративных анимаций.
 */
export function MemoriesPage() {
  const reduced = useReducedMotion();
  const { memories, addMemory, storageNearFull, loading } = useMemories();

  const [composerOpen, setComposerOpen] = useState(false);
  const [flash, setFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // После первого кадра — чтобы не синхронно менять состояние в эффекте
    // (React рекомендуют не звать setState прямо в теле эффекта).
    const t = requestAnimationFrame(() => setMounted(true));
    return () => {
      cancelAnimationFrame(t);
      if (flashTimer.current) clearTimeout(flashTimer.current);
      if (errorTimer.current) clearTimeout(errorTimer.current);
    };
  }, []);

  const triggerFlash = useCallback(() => {
    setFlash(true);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(false), 500);
  }, []);

  const showError = useCallback((message: string) => {
    setError(message);
    if (errorTimer.current) clearTimeout(errorTimer.current);
    errorTimer.current = setTimeout(() => setError(null), 4200);
  }, []);

  async function handleSave(draft: AddMemoryInput): Promise<boolean> {
    const result = await addMemory(draft);
    if (!result.ok) {
      showError("Не удалось сохранить воспоминание — попробуйте ещё раз");
      return false;
    }
    setComposerOpen(false);
    triggerFlash();
    return true;
  }

  const mediaCount = memories.reduce((n, m) => n + m.media.length, 0);

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerRow}>
          <div className={styles.heading}>
            <div className={`${styles.eyebrow} ${styles.entranceRise}`}>
              <span className={styles.eyebrowDot} aria-hidden />
              Глава воспоминаний
            </div>
            <h1
              className={`${styles.title} ${styles.entranceRise}`}
              style={{ animationDelay: "0.1s" }}
            >
              Воспоминания
            </h1>
            <p
              className={`${styles.subtitle} ${styles.entranceRise}`}
              style={{ animationDelay: "0.15s" }}
            >
              Ваши мгновения, остановленные навсегда
            </p>
          </div>

          <button
            type="button"
            className={`${styles.createBtn} ${styles.entranceRise}`}
            style={{ animationDelay: "0.2s" }}
            onClick={() => setComposerOpen(true)}
          >
            <PlusIcon className={styles.createIcon} />
            Создать
          </button>
        </div>

        {/* Сводка: всего воспоминаний и медиа — одна стеклянная панель */}
        <div
          className={`${styles.summary} ${styles.entranceRise}`}
          style={{ animationDelay: "0.25s" }}
          role="list"
          aria-label="Воспоминания в коллекции"
        >
          <div className={styles.summaryItem} role="listitem">
            <span className={styles.summaryIcon} aria-hidden>
              <CameraIcon className={styles.summarySvg} />
            </span>
            <span className={styles.summaryBody}>
              <strong className={styles.summaryNum}>{memories.length}</strong>
              <span className={styles.summaryLabel}>
                {plural(memories.length, "воспоминание", "воспоминания", "воспоминаний")}
              </span>
            </span>
          </div>
          <div className={styles.summaryItem} role="listitem">
            <span className={styles.summaryIcon} aria-hidden>
              <ImageIcon className={styles.summarySvg} />
            </span>
            <span className={styles.summaryBody}>
              <strong className={styles.summaryNum}>{mediaCount}</strong>
              <span className={styles.summaryLabel}>фото и видео</span>
            </span>
          </div>
        </div>

        <div
          className={`${styles.divider} ${styles.entranceStretch}`}
          style={{ animationDelay: "0.3s" }}
          aria-hidden
        />
      </header>

      {/* Предупреждение о заполнении хранилища — в токенах темы */}
      {mounted && storageNearFull && (
        <div className={styles.storageWarn} role="status">
          <AlertIcon className={styles.storageWarnIcon} />
          <span>Хранилище почти заполнено — удали старые фото или видео</span>
        </div>
      )}

      {/* Ошибка */}
      <AnimatePresence>
        {error && (
          <motion.div
            key="error"
            className={styles.errorToast}
            role="alert"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <AlertIcon className={styles.errorToastIcon} />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Сетка полароидов */}
      {memories.length === 0 ? (
        // Пока метаданные грузятся с сервера — не решаем «пусто»
        !loading && <EmptyState onCreate={() => setComposerOpen(true)} />
      ) : (
        <motion.ul
          className={styles.grid}
          variants={gridVariants}
          initial={reduced ? false : "hidden"}
          whileInView={reduced ? undefined : "show"}
          viewport={{ once: true, amount: 0.12 }}
          aria-label="Воспоминания пары"
        >
          <AnimatePresence mode="popLayout">
            {memories.map((memory, i) => (
              <motion.li
                key={memory.id}
                layout
                custom={i % 2 === 0 ? -1 : 1}
                variants={itemVariants}
                exit={{
                  opacity: 0,
                  scale: 0.7,
                  transition: { duration: 0.18 },
                }}
                className={styles.gridItem}
              >
                <MemoryPolaroid
                  memory={memory}
                  index={i}
                  href={`/memories/${memory.id}`}
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}

      {/* Композер */}
      <MemoryComposer
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        onSave={handleSave}
      />

      {/* Вспышка «камеры» при создании */}
      <AnimatePresence>
        {flash && (
          <motion.div
            key="flash"
            className={styles.flash}
            initial={{ opacity: 0.85 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            aria-hidden
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/** Пустое состояние — мягкая карточка-приглашение, как у купонов. */
function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className={styles.empty}>
      <span className={styles.emptyBadge} aria-hidden>
        <CameraIcon className={styles.emptyIcon} />
      </span>
      <h2 className={styles.emptyTitle}>Пока нет ни одного воспоминания</h2>
      <p className={styles.emptyText}>
        Сохраните первый миг вашей истории — как тёплый полароид
      </p>
      <button type="button" className={styles.emptyBtn} onClick={onCreate}>
        <PlusIcon className={styles.emptyBtnIcon} />
        Создать воспоминание
      </button>
    </div>
  );
}
