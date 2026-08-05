"use client";

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { EASE } from "@/lib/сonstants";
import { useCouple, useLetters } from "@/lib/api-data";
import { envelopeOptions, type EnvelopeOption } from "@/features/world/dates/envelope";
import type { LetterView } from "@/lib/types";
import styles from "./MailboxEnvelope.module.css";

/* Тайминги механики конверта — единый источник правды (конверт v2) */
const T = {
  flap: 0.62,        // длительность поворота клапана
  flapEdge: 0.31,    // момент «ребром» — тут переключаем z-index
  letterUp: 0.75,    // письмо поднимается
  letterDown: 0.42,  // письмо опускается
  closeWait: 0.4,    // клапан ждёт письмо перед закрытием
};

interface MailLetter {
  id: string;
  fromEmoji: string;
  seal: string;
  stamp: string;
  subject: string;
  message: string;
  ps?: string;
  date: string;
  read: boolean;
  /** true, если письмо пришло половинке (я отправил). Входящие — от неё. */
  incoming: boolean;
  /** Кто писал: для подписи адресной строки в списке. */
  fromName: string;
}

/** Эмодзи опции-кастомизации (печать/марка) по ключу — с fallback. */
function optionEmoji(catKey: string, key: string, fallback: string): string {
  const opts = envelopeOptions(catKey) as EnvelopeOption[];
  return opts.find((o) => o.key === key)?.emoji ?? fallback;
}

/** Приводим письмо из API к форме почты. Тема — первая строка письма. */
function toMailLetter(l: LetterView, partnerName: string): MailLetter {
  const firstLine = l.message.split("\n").find((s) => s.trim().length > 0) ?? l.message;
  const who = l.incoming ? partnerName : "вы";
  return {
    id: l.id,
    fromEmoji: l.sender.emoji ?? (l.incoming ? "💌" : "✉️"),
    seal: optionEmoji("seal", l.seal, "💌"),
    stamp: optionEmoji("stamp", l.stamp, "💕"),
    subject: firstLine,
    message: l.message,
    ps: l.ps ?? undefined,
    date: new Date(l.createdAt).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
    }),
    read: l.read,
    incoming: l.incoming,
    fromName: l.incoming ? partnerName : "вам",
  };
}

/* Брызги эмодзи в момент вскрытия конверта */
const BURST = Array.from({ length: 10 }, (_, i) => ({
  id: i,
  emoji: ["✨", "💗", "🌸", "💫"][i % 4],
  x: Math.round(Math.sin(i * 2.4) * 70 + ((i % 3) - 1) * 16),
  y: -56 - (i % 4) * 24,
  s: 0.6 + (i % 4) * 0.16,
  d: i * 0.05,
}));

function pluralUnread(n: number): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m100 >= 11 && m100 <= 14) return "непрочитанных";
  if (m10 === 1) return "непрочитанное";
  return "непрочитанных";
}

/* ─── Typewriter: setState только в колбэке таймера ──────────── */

function TypewriterText({
  text,
  speed = 22,
  motionless = false,
}: {
  text: string;
  speed?: number;
  motionless?: boolean;
}) {
  const [chars, setChars] = useState(() => (motionless ? text.length : 0));
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (motionless) return;

    let i = 0;
    const tick = () => {
      i += 1;
      setChars(i);
      if (i < text.length) {
        timerRef.current = window.setTimeout(tick, speed + Math.random() * 26);
      }
    };
    timerRef.current = window.setTimeout(tick, speed + 80);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [text, speed, motionless]);

  const writing = chars < text.length;

  return (
    <div className={styles.letterText}>
      {text.slice(0, chars)}
      {writing && <span className={styles.caret} aria-hidden />}
    </div>
  );
}

/**
 * Почта в шапке WorldShell: кнопка с бейджем непрочитанных открывает
 * полноэкранный оверлей, где по центру стоит большой интерактивный
 * конверт — как в «конверте v2»: клик ломает сургуч, клапан откидывается,
 * письмо поднимается и печатается строчка за строчкой, затем читается целиком.
 * Письма — реальные из АПИ (входящие от половинки и исходящие от меня);
 * адрес подставляется из профиля пары.
 */
export function MailboxEnvelope() {
  const motionless = useReducedMotion() === true;

  const [overlayOpen, setOverlayOpen] = useState(false);
  const [envOpen, setEnvOpen] = useState(false);
  // Оверлей рендерится порталом в <body>: так он вырывается из стекового
  // контекста и containing block шапки (transform + backdrop-filter), которые
  // превращали position:fixed в привязку к боксу шапки.
  // Порталов на сервере нет (там document отсутствует) — флаг без эффекта.
  const [isClient] = useState(() => typeof document !== "undefined");
  const [readerId, setReaderId] = useState<string | null>(null);

  // «Я» и партнёр — из профиля пары (API). Письма — из АПИ (реальные данные).
  const { data: coupleData } = useCouple();
  const me = coupleData?.me;
  const members = coupleData?.couple.members ?? [];
  const viewer = me ? { id: me.id, name: me.name } : { id: "me", name: "половинка" };
  const partner =
    members.find((m) => m.id !== me?.id) ??
    members[0] ?? { id: "partner", name: "половинка", gender: null, emoji: null, tagline: null, role: "", mood: null, presence: { state: "away", label: "" }, reactions: [] };

  // Письма пары: входящие + исходящие, отсортированы по дате (новые сверху).
  const { data: lettersData } = useLetters();
  const letters = useMemo(
    () =>
      (lettersData ?? [])
        .slice()
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
        .map((l) => toMailLetter(l, partner.name)),
    [lettersData, partner.name],
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Непрочитанные — только входящие, которые ещё не открывали.
  const unread = useMemo(
    () => letters.filter((l) => l.incoming && !l.read).length,
    [letters],
  );
  const selected = letters.find((l) => l.id === selectedId) ?? letters[0] ?? null;
  const readerLetter = letters.find((l) => l.id === readerId) ?? null;

  const panelId = useId();
  const readerTitleId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const readerCloseRef = useRef<HTMLButtonElement>(null);

  /* Лёгкий 3D-наклон конверта за указателем — как в оригинале */
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const tiltX = useSpring(useTransform(py, [0, 1], [6, -6]), { stiffness: 120, damping: 16 });
  const tiltY = useSpring(useTransform(px, [0, 1], [-7, 7]), { stiffness: 120, damping: 16 });

  const closeOverlay = useCallback(() => {
    setOverlayOpen(false);
    setEnvOpen(false);
    setReaderId(null);
    triggerRef.current?.focus();
  }, []);

  const { markRead } = useLetters();

  // Прочитано — помечаем на сервере и локально (чтобы закрыть читалку).
  // markRead не вызывает reload-пессимистически: бейдж обновится при следующей
  // загрузке списка (после отправки или повторного открытия оверлея).
  const closeReader = useCallback(() => {
    if (readerId) void markRead(readerId);
    setReaderId(null);
  }, [readerId, markRead]);

  // Esc: сначала читалка, потом оверлей.
  useEffect(() => {
    if (!overlayOpen && !readerId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (readerId) closeReader();
      else closeOverlay();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [overlayOpen, readerId, closeReader, closeOverlay]);

  // Блокировка скролла под оверлеем + фокус на крестик.
  useEffect(() => {
    if (!overlayOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, [overlayOpen]);

  // В читалке фокус на её крестике (скролл уже заблокирован оверлеем).
  useEffect(() => {
    if (!readerId) return;
    readerCloseRef.current?.focus();
  }, [readerId]);

  const handleMove = useCallback(
    (e: React.PointerEvent) => {
      if (motionless) return;
      const r = e.currentTarget.getBoundingClientRect();
      px.set((e.clientX - r.left) / r.width);
      py.set((e.clientY - r.top) / r.height);
    },
    [px, py, motionless]
  );

  const handleLeave = useCallback(() => {
    px.set(0.5);
    py.set(0.5);
  }, [px, py]);

  const toggleEnv = useCallback(() => setEnvOpen((v) => !v), []);

  return (
    <>
      {/* Кнопка почты: бейдж с числом непрочитанных + пульс */}
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={overlayOpen}
        aria-controls={panelId}
        aria-haspopup="dialog"
        aria-label={
          unread > 0
            ? `Почта: ${unread} ${pluralUnread(unread)} — открыть письма`
            : "Почта: всё прочитано — открыть"
        }
        title="Почта"
        onClick={() => setOverlayOpen(true)}
        className="relative flex size-10 items-center justify-center rounded-full border border-white/60 bg-white/55 text-lg shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/80 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--hwd-glow)"
      >
        <span aria-hidden className="leading-none">
          💌
        </span>
        {unread > 0 && (
          <span className={styles.buttonBadge} aria-hidden>
            {unread}
          </span>
        )}
        <span className="sr-only">
          {unread > 0 ? "Есть непрочитанные письма" : "Непрочитанных писем нет"}
        </span>
      </button>

      {isClient &&
        createPortal(
          <>
            <AnimatePresence>
              {overlayOpen && (
                <motion.div
                  ref={overlayRef}
                  key="mailbox-overlay"
                  className={styles.overlay}
                  initial={false}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  onMouseDown={(e) => {
                    if (e.target === e.currentTarget) closeOverlay();
                  }}
                >
                  <motion.div
                    id={panelId}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Почта"
                    className={styles.panel}
                    initial={false}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 240, damping: 26 }}
                  >
                    {/* Шапка оверлея */}
                    <div className={styles.head}>
                      <span className={styles.headTitle}>
                        <span aria-hidden>📬</span> Почта
                      </span>
                      <div className={styles.headRight}>
                        {unread > 0 ? (
                          <span className={styles.countPill}>
                            {unread} {pluralUnread(unread)}
                          </span>
                        ) : (
                          <span className={styles.countPill}>всё прочитано 💛</span>
                        )}
                        <button
                          ref={closeBtnRef}
                          type="button"
                          className={styles.closeBtn}
                          onClick={closeOverlay}
                          aria-label="Закрыть почту"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* Сцена с конвертом по центру (пусто — пока письма нет) */}
                    {selected ? (
                      <>
                    <div className={styles.stage}>
                      <div
                        role="button"
                        tabIndex={0}
                        aria-expanded={envOpen}
                        aria-label={
                          envOpen
                            ? `Закрыть письмо от ${partner.name}`
                            : `Открыть письмо от ${partner.name}: ${selected.subject}`
                        }
                        onClick={toggleEnv}
                        onKeyDown={(e) => {
                          if ((e.key === "Enter" || e.key === " ") && !e.repeat) {
                            e.preventDefault();
                            toggleEnv();
                          }
                        }}
                        onPointerMove={handleMove}
                        onPointerLeave={handleLeave}
                        className={styles.envHit}
                      >
                        <motion.div
                          className={styles.env}
                          style={{ rotateX: motionless ? 0 : tiltX, rotateY: motionless ? 0 : tiltY }}
                        >
                          {/* Спинка */}
                          <div className={styles.envBody} aria-hidden>
                            <span className={styles.envHeart}>♥</span>
                          </div>

                          {/* Письмо: поднимается ПЕРВЫМ, печатается по буквам */}
                          <motion.div
                            className={styles.letter}
                            initial={false}
                            animate={{ y: envOpen ? -56 : 0 }}
                            style={{ pointerEvents: envOpen ? "auto" : "none" }}
                            transition={
                              envOpen
                                ? { duration: T.letterUp, ease: [0.16, 1, 0.3, 1], delay: 0.36 }
                                : { duration: T.letterDown, ease: EASE, delay: 0 }
                            }
                            onClick={
                              envOpen
                                ? (e) => {
                                    e.stopPropagation();
                                    setReaderId(selected.id);
                                  }
                                : undefined
                            }
                          >
                            <div className={styles.letterPaper}>
                              <div className={styles.letterHead} aria-hidden>
                                <span className={styles.letterDate}>{selected.date}</span>
                                <span className={styles.letterStamp}>{selected.stamp}</span>
                              </div>
                              {envOpen && (
                                <TypewriterText
                                  key={selected.id}
                                  text={selected.message}
                                  motionless={motionless}
                                />
                              )}
                            </div>
                          </motion.div>

                          {/* Кармашек */}
                          <div className={styles.pocket} aria-hidden>
                            <div className={styles.foldL} />
                            <div className={styles.foldR} />
                            <div className={styles.foldB} />
                            <div className={styles.addr}>
                              <span className={styles.addrLine}>Кому: {viewer.name}</span>
                              <span className={cn(styles.addrLine, styles.addrFrom)}>
                                От: {partner.name}
                              </span>
                            </div>
                            <span className={styles.micro}>heartwood post · отд. № 7</span>
                          </div>

                          {/* Клапан: стартует ТОЛЬКО после письма,
                              z-index переключается на его собственном «ребре» */}
                          <motion.div
                            className={styles.flap}
                            initial={false}
                            animate={{ rotateX: envOpen ? -176 : 0, zIndex: envOpen ? 2 : 50 }}
                            transition={{
                              rotateX: {
                                duration: motionless ? 0.01 : T.flap,
                                ease: EASE,
                                delay: motionless ? 0 : envOpen ? 0 : T.closeWait,
                              },
                              zIndex: {
                                duration: 0.001,
                                delay: motionless ? 0 : envOpen ? T.flapEdge : T.closeWait + T.flapEdge,
                              },
                            }}
                          >
                            <div className={styles.flapFace} />
                            <div className={styles.flapBack} />
                            <div className={styles.seal} aria-hidden>
                              <span>{selected.seal}</span>
                            </div>
                          </motion.div>
                        </motion.div>

                        {/* Брызги в момент вскрытия */}
                        <AnimatePresence>
                          {envOpen && (
                            <div className={styles.burst} aria-hidden>
                              {BURST.map((p) => (
                                <motion.span
                                  key={p.id}
                                  className={styles.burstP}
                                  style={{ left: "50%", top: "20%" }}
                                  initial={{ x: 0, y: 12, opacity: 0, scale: 0 }}
                                  animate={{
                                    x: p.x,
                                    y: p.y,
                                    opacity: [0, 1, 1, 0],
                                    scale: [0, p.s, p.s, p.s * 0.4],
                                  }}
                                  transition={{ duration: 1.4, delay: p.d, ease: "easeOut" }}
                                >
                                  {p.emoji}
                                </motion.span>
                              ))}
                            </div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Статус + действие под конвертом */}
                      <div className={styles.statusLine} data-open={envOpen}>
                        <i aria-hidden />
                        {envOpen ? "распечатано" : "запечатано"}
                      </div>

                      {envOpen ? (
                        <motion.div
                          className={styles.actions}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.25,
                            ease: EASE,
                            delay: motionless ? 0 : T.flap,
                          }}
                        >
                          <button
                            type="button"
                            className={styles.readBtn}
                            onClick={() => setReaderId(selected.id)}
                          >
                            Прочесть целиком <span aria-hidden>→</span>
                          </button>
                        </motion.div>
                      ) : (
                        <p className={styles.hint}>
                          <i aria-hidden /> нажми на конверт — сургуч сломается
                        </p>
                      )}
                    </div>

                    <div className={styles.divider} aria-hidden />

                    {/* Список писем */}
                    <div className={styles.list} role="list" aria-label="Все письма">
                      {letters.map((l) => (
                        <button
                          key={l.id}
                          type="button"
                          role="listitem"
                          onClick={() => {
                            setSelectedId(l.id);
                            setEnvOpen(true);
                          }}
                          className={cn(
                            styles.listItem,
                            selectedId === l.id && styles.listItemActive
                          )}
                        >
                          <span className={styles.listEmoji} aria-hidden>
                            {l.fromEmoji}
                          </span>
                          <span className={styles.listInfo}>
                            <span className={styles.listSubject}>{l.subject}</span>
                            <span className={styles.listDate}>
                              {l.date} · {l.incoming ? `от ${partner.name}` : "от вас"}
                            </span>
                          </span>
                          {l.incoming && !l.read ? (
                            <span className={styles.unreadDot} aria-label="Непрочитано" />
                          ) : (
                            <span className={styles.readCheck} aria-label="Прочитано">
                              ✓
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                      </>
                    ) : (
                      <div className={styles.emptyState}>
                        <span className={styles.emptyEmoji} aria-hidden>📭</span>
                        <p className={styles.emptyTitle}>Почта пока пуста</p>
                        <p className={styles.emptyText}>
                          Письма из Студии письма появятся здесь — входящие и исходящие.
                        </p>
                      </div>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Чтение письма целиком */}
            <AnimatePresence>
              {readerLetter && (
                <motion.div
                  key="mailbox-reader"
                  className={styles.readerOverlay}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onMouseDown={(e) => {
                    if (e.target === e.currentTarget) closeReader();
                  }}
                >
                  <motion.div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={readerTitleId}
                    className={styles.readerCard}
                    initial={{ opacity: 0, y: 24, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 24, scale: 0.96 }}
                    transition={{ duration: 0.28, ease: EASE }}
                  >
                    <button
                      ref={readerCloseRef}
                      type="button"
                      className={styles.readerClose}
                      onClick={closeReader}
                      aria-label="Закрыть письмо"
                    >
                      ✕
                    </button>

                    <div className={styles.readerHead}>
                      <span className={styles.readerEmoji} aria-hidden>
                        {readerLetter.fromEmoji}
                      </span>
                      <div>
                        <h2 id={readerTitleId} className={styles.readerTitle}>
                          {readerLetter.subject}
                        </h2>
                        <p className={styles.readerMeta}>
                          {readerLetter.incoming ? `от ${partner.name}` : "от вас"} · {readerLetter.date}
                        </p>
                      </div>
                    </div>

                    <div className={styles.readerBody}>
                      <p className={styles.readerGreeting}>Привет, {viewer.name}!</p>
                      <p className={styles.readerText}>{readerLetter.message}</p>
                      {readerLetter.ps && (
                        <p className={styles.readerPs}>P.S. {readerLetter.ps}</p>
                      )}
                      <p className={styles.readerSign}>
                        {readerLetter.incoming ? `Твой ${partner.name}` : "С любовью"} · {readerLetter.seal}
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
            )}
            </AnimatePresence>
          </>,
          document.body
        )}
    </>
  );
}
