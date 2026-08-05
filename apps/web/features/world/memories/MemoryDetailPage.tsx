"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useMemories } from "./useMemories";
import { MemoryPolaroid } from "./MemoryPolaroid";
import { MemoryGallery } from "./MemoryGallery";
import { routes } from "@/routes";
import { ChevronLeftIcon, TrashIcon } from "./icons";
import styles from "./MemoryDetailPage.module.css";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Страница воспоминания: hero-полароид, дата-чип, история, галерея,
 * удаление с подтверждением. До гидрации пользовательского воспоминания
 * показывается нейтральный плейсхолдер (не notFound) — на сервере
 * доступны только seeds.
 */
export function MemoryDetailPage({ id }: { id: string }) {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const router = useRouter();

  const { memories, deleteMemory, updateMemory } = useMemories();
  const memory = memories.find((m) => m.id === id);

  useEffect(() => {
    // После первого кадра — чтобы не синхронно менять состояние в эффекте.
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  /* Ещё не отгидрировались — ждём, не решаем «не найдено» */
  if (!mounted) {
    return (
      <div className={styles.page}>
        <div className={styles.backRow}>
          <span className={styles.backLink}>
            <ChevronLeftIcon className={styles.backIcon} />
            Все воспоминания
          </span>
        </div>
        <div className={styles.placeholderCard} aria-hidden>
          <CameraGhost />
        </div>
      </div>
    );
  }

  if (!memory) notFound();

  // Алиас с не-null типом: сужение не проникает в замыкание handleDelete
  // (function declaration хоистится до guard-а).
  const current = memory;
  const index = memories.findIndex((m) => m.id === current.id);

  async function handleDelete() {
    setConfirmingDelete(false);
    await deleteMemory(id); // чистит локальные Blob-ы, реестр и метаданные
    router.push(routes.memories.path);
  }

  return (
    <motion.div
      className={styles.page}
      initial={reduced ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
    >
      {/* Назад */}
      <div className={styles.backRow}>
        <Link href={routes.memories.path} className={styles.backLink}>
          <ChevronLeftIcon className={styles.backIcon} />
          Все воспоминания
        </Link>
      </div>

      {/* Hero-полароид */}
      <div className={styles.hero}>
        <MemoryPolaroid
          memory={memory}
          index={index}
          className={styles.heroPolaroid}
        />
      </div>

      {/* История */}
      <div className={styles.storyWrap}>
        {memory.story ? (
          <p className={styles.story}>{memory.story}</p>
        ) : (
          <p className={styles.storyEmpty}>
            Пока нет истории — добавь фото или видео ниже
          </p>
        )}
      </div>

      {/* Галерея */}
      <MemoryGallery
        memory={memory}
        onChange={(patch) => void updateMemory(id, patch)}
      />

      {/* Удаление */}
      <div className={styles.dangerZone}>
        <AnimatePresence mode="wait">
          {confirmingDelete ? (
            <motion.div
              key="confirm"
              className={styles.confirmBox}
              initial={reduced ? false : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.2 }}
            >
              <p className={styles.confirmText}>
                Удалить воспоминание «{memory.title}»? Это необратимо.
              </p>
              <div className={styles.confirmBtns}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setConfirmingDelete(false)}
                >
                  Отмена
                </button>
                <button
                  type="button"
                  className={styles.deleteBtn}
                  onClick={() => void handleDelete()}
                >
                  Удалить
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="delete"
              type="button"
              className={styles.deleteGhost}
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmingDelete(true)}
            >
              <TrashIcon className={styles.deleteIcon} />
              Удалить воспоминание
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/** Нейтральный плейсхолдер-«камера» до гидрации — без пульсаций. */
function CameraGhost() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={styles.placeholderIcon}
      aria-hidden
    >
      <path d="M4 7.5h3l1.5-2h7l1.5 2h3A1.5 1.5 0 0 1 21 9v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18V9a1.5 1.5 0 0 1 1.5-1.5Z" />
      <circle cx="12" cy="13" r="3.4" />
    </svg>
  );
}
