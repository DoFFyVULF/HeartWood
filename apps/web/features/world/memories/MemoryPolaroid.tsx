"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatMemoryDate, type Memory } from "./memoryModel";
import { coverGradient, idRotation } from "./geometry";
import styles from "./MemoryPolaroid.module.css";

interface MemoryPolaroidProps {
  memory: Memory;
  /** Позиция в сетке — для стабильной градиентной обложки. */
  index?: number;
  /** Если передан — карточка оборачивается в Link на страницу воспоминания. */
  href?: string;
  className?: string;
}

/**
 * Полароидная карточка воспоминания: тёпло-белая рамка, фото 1:1 (или
 * градиент с эмодзи), красная рукописная подпись внизу и скотч сверху.
 * Поворот детерминированный — из id, чтобы сетка и детальная страница
 * совпадали и гидрация не плыла.
 */
export function MemoryPolaroid({ memory, index = 0, href, className }: MemoryPolaroidProps) {
  const rot = idRotation(memory.id);

  const card = (
    <div className={styles.link}>
      {/* Рукописная дата «на скотче» — приклеенная аннотация вверху */}
      <span className={styles.tape}>{formatMemoryDate(memory.date)}</span>

      <div className={styles.photo}>
        {memory.cover ? (
          <img
            src={memory.cover}
            alt={memory.title}
            className={styles.photoImg}
            loading="lazy"
          />
        ) : (
          <div
            className={styles.placeholder}
            style={{ background: coverGradient(index) }}
            aria-hidden
          >
            <span className={styles.placeholderEmoji}>{memory.emoji}</span>
          </div>
        )}
      </div>

      <div className={styles.caption}>{memory.title}</div>
    </div>
  );

  return (
    <div
      className={cn(styles.frame, className)}
      style={{ "--rot": `${rot}deg` } as React.CSSProperties}
    >
      {href ? (
        <Link
          href={href}
          className={styles.linkWrap}
          aria-label={`Воспоминание: ${memory.title}, ${formatMemoryDate(memory.date)}`}
        >
          {card}
        </Link>
      ) : (
        card
      )}
    </div>
  );
}
