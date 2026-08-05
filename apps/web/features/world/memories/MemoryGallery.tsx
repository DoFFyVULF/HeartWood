"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { Memory, MemoryMedia } from "./memoryModel";
import { compressImage, fileKind, videoFileOk } from "./mediaUtils";
import { deleteMedia, getMedia, putMedia } from "./mediaStore";
import { AlertIcon, CameraIcon, CloseIcon } from "./icons";
import styles from "./MemoryGallery.module.css";

interface LoadedItem {
  id: string;
  kind: MemoryMedia["kind"];
  url: string;
}

interface MemoryGalleryProps {
  memory: Memory;
  /** Сообщает об изменении media — родитель обновляет метаданные. */
  onChange: (patch: { media: MemoryMedia[] }) => void;
}

/**
 * Галерея воспоминания: загрузка фото (сжатие → IndexedDB) и видео
 * (Blob → IndexedDB), drag&drop, мини-полароиды, удаление.
 * Спокойная зона загрузки с волосяной рамкой, без пунктиров и декора.
 */
export function MemoryGallery({ memory, onChange }: MemoryGalleryProps) {
  const [items, setItems] = useState<LoadedItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const urlsRef = useRef<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const mediaKey = memory.media.map((m) => m.id).join("|");

  /* Загрузка Blob-ов из IndexedDB → object URLs для превью */
  useEffect(() => {
    let cancelled = false;
    const urls: string[] = [];

    void (async () => {
      const loaded: LoadedItem[] = [];
      for (const m of memory.media) {
        const blob = await getMedia(m.id);
        if (cancelled) break;
        if (blob) {
          const url = URL.createObjectURL(blob);
          urls.push(url);
          loaded.push({ id: m.id, kind: m.kind, url });
        }
      }
      if (cancelled) {
        urls.forEach((u) => URL.revokeObjectURL(u));
        return;
      }
      setItems(loaded);
      urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      urlsRef.current = urls;
    })();

    return () => {
      cancelled = true;
      urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      urlsRef.current = [];
    };
  }, [mediaKey]);

  async function handleFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0) return;

    setBusy(true);
    setError(null);
    const added: MemoryMedia[] = [];

    try {
      for (const file of list) {
        const kind = fileKind(file);
        if (!kind) {
          setError("Формат файла не поддерживается");
          continue;
        }

        if (kind === "video") {
          const check = videoFileOk(file);
          if (!check.ok) {
            setError(check.message ?? "Слишком большое видео");
            continue;
          }
          const id = await putMedia(file);
          added.push({ id, kind });
        } else {
          const { blob, failed } = await compressImage(file);
          if (failed) {
            setError("Не удалось обработать изображение — попробуй другое фото");
            continue;
          }
          const id = await putMedia(blob);
          added.push({ id, kind });
        }
      }
    } catch {
      setError("Не удалось загрузить файл");
    } finally {
      setBusy(false);
    }

    if (added.length > 0) {
      onChange({ media: [...memory.media, ...added] });
    }
  }

  async function removeItem(id: string) {
    try {
      await deleteMedia(id);
    } catch {
      // Blob может отсутствовать — удаляем метаданные в любом случае
    }
    onChange({ media: memory.media.filter((m) => m.id !== id) });
  }

  return (
    <section className={styles.section} aria-labelledby="gallery-title">
      <h2 id="gallery-title" className={styles.title}>
        <CameraIcon className={styles.titleIcon} />
        Фото и видео
      </h2>

      {/* Загрузка */}
      <div
        className={cn(styles.dropzone, dragging && styles.dropzoneActive, busy && styles.busy)}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!busy) void handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Загрузить фото или видео"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className={styles.srOnly}
          disabled={busy}
          onChange={(e) => {
            if (e.target.files) void handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <span className={styles.dropIcon} aria-hidden>
          <CameraIcon className={styles.dropIconSvg} />
        </span>
        <p className={styles.dropText}>
          {busy ? "Загружаем…" : "Перетащи сюда фото или видео, или нажми для выбора"}
        </p>
        <span className={styles.dropHint}>Фото и видео сжимаются автоматически</span>
      </div>

      {error && (
        <p role="alert" className={styles.error}>
          <AlertIcon className={styles.errorIcon} />
          <span>{error}</span>
        </p>
      )}

      {/* Превью */}
      {items.length > 0 && (
        <ul className={styles.grid}>
          {items.map((item) => (
            <li key={item.id} className={styles.item}>
              <div className={styles.itemFrame}>
                {item.kind === "video" ? (
                  <video
                    src={item.url}
                    controls
                    preload="metadata"
                    playsInline
                    className={styles.media}
                  />
                ) : (
                  <img src={item.url} alt="Фото воспоминания" className={styles.media} />
                )}
              </div>
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => void removeItem(item.id)}
                aria-label="Удалить медиа"
              >
                <CloseIcon className={styles.removeIcon} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
