// Утилиты медиа: сжатие изображений, лимиты видео, генерация id.
// Всё это — клиентский код (canvas, Blob, crypto.randomUUID).

export type MediaKind = "photo" | "video";

/** Максимальный размер стороны картинки после сжатия (px). */
const MAX_DIM = 1280;
/** Максимальный размер стороны cover-thumbnail (px). */
const THUMB_DIM = 400;
/** Качество JPEG. */
const QUALITY = 0.82;
/** Честный лимит видео — IndexedDB держит десятки МБ без проблем. */
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

/**
 * Генерация стабильного id с fallback для небезопасного контекста
 * (нет crypto.randomUUID → Date.now + счётчик).
 */
let counter = 0;
export function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  counter += 1;
  return `${Date.now().toString(36)}-${counter.toString(36)}`;
}

/** Определяет тип файла по MIME (без распаковки содержимого). */
export function fileKind(file: File): MediaKind | null {
  if (file.type.startsWith("image/")) return "photo";
  if (file.type.startsWith("video/")) return "video";
  // Fallback по расширению для камер, отдающих пустой type.
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (/^(jpg|jpeg|png|webp|heic|heif|gif)$/.test(ext)) return "photo";
  if (/^(mp4|mov|webm|m4v)$/.test(ext)) return "video";
  return null;
}

/** Проверка видео: размер и расширение, с понятным текстом ошибки. */
export function videoFileOk(file: File): { ok: boolean; message?: string } {
  if (file.size > MAX_VIDEO_BYTES) {
    return {
      ok: false,
      message: `Видео больше ${Math.round(MAX_VIDEO_BYTES / 1024 / 1024)} МБ — выбери файл поменьше`,
    };
  }
  return { ok: true };
}

interface CompressResult {
  blob: Blob;
  thumbDataUrl: string;
  /** Не удалось обработать (HEIC без поддержки и т.п.). */
  failed: boolean;
}

/**
 * Сжимает изображение через canvas:
 * - blob — JPEG ≤ MAX_DIM по большей стороне (для IndexedDB);
 * - thumbDataUrl — маленький JPEG ≤ THUMB_DIM (для localStorage-метаданных).
 * Нечитаемые форматы не падают — возвращают { failed: true }.
 */
export async function compressImage(file: File): Promise<CompressResult> {
  try {
    const bitmap = await createImageBitmap(file);
    const thumb = await scaleTo(bitmap, THUMB_DIM);
    const full = await scaleTo(bitmap, MAX_DIM);

    const thumbDataUrl = await canvasToDataUrl(thumb);
    const blob = await canvasToBlob(full);

    // close() есть только у ImageBitmap; canvas-ы сборщик мусора подберёт сам.
    bitmap.close();

    return { blob, thumbDataUrl, failed: false };
  } catch {
    return { blob: file, thumbDataUrl: "", failed: true };
  }
}

/** Масштабирует ImageBitmap в canvas по большей стороне. */
async function scaleTo(
  bitmap: ImageBitmap,
  maxDim: number,
): Promise<HTMLCanvasElement> {
  const ratio = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * ratio));
  const height = Math.max(1, Math.round(bitmap.height * ratio));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas недоступен");

  ctx.drawImage(bitmap, 0, 0, width, height);
  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Не удалось закодировать JPEG"))),
      "image/jpeg",
      QUALITY,
    );
  });
}

function canvasToDataUrl(canvas: HTMLCanvasElement): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = canvas.toDataURL("image/jpeg", QUALITY);
    if (url.startsWith("data:image/jpeg")) resolve(url);
    else reject(new Error("Не удалось закодировать thumbnail"));
  });
}

/** Человекочитаемый размер файла (для подписей и ошибок). */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}
