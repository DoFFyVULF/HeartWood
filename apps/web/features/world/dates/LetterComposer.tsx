"use client";

/* ════════════════════════════════════════════════════════════════
   Интерактивная студия письма: написать → сложить → запечатать → отправить.

   Переработано из автономного демо в компонент страницы «Свидания»:
   - светлая тема на токенах приложения (--hwd-*), шрифты Nunito/Caveat;
   - данные оформления (бумага/печать/марка) из datesStatus.envelopeCustomizations;
   - «кому/от» предзаполняются из профиля пары по выбранному полу;
   - письмо считается отправленным через onSend → страница ведёт историю.

   Хореография вложения: сгиб листа втрое → стопка → полёт в конверт →
   «поимка» конвертом → закрытие клапана → шаг печати.
   ════════════════════════════════════════════════════════════════ */

import { useState, useEffect, useRef, useCallback, useSyncExternalStore } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  animate,
  type Variants,
} from "framer-motion";
import { cn } from "@/lib/utils";
import { EASE } from "@/lib/сonstants";
import { datesStatus, type EnvelopeOption } from "@/lib/data/datesStatus";
import {
  coupleProfile,
  findPersonByGender,
} from "@/features/world/profile/couple";
import { useGender } from "@/lib/theme";
import styles from "./LetterComposer.module.css";

/* ─── Types ─────────────────────────────────────────────────── */

/** Данные готового письма — то, что уходит в историю страницы. */
export interface LetterData {
  to: string;
  from: string;
  message: string;
  ps: string;
  /** Ключи опций из datesStatus.envelopeCustomizations */
  paper: string;
  seal: string;
  stamp: string;
}

interface LetterComposerProps {
  onSend?: (data: LetterData) => void;
}

/* ─── Константы хореографии ──────────────────────────────────── */

const T = {
  flap: 0.62,
  flapEdge: 0.31,
  closeWait: 0.4,
};

const ROUTE = [
  { key: "write", label: "написать" },
  { key: "fold", label: "сложить" },
  { key: "seal", label: "запечатать" },
  { key: "send", label: "отправить" },
];
const STEP_IDX: Record<string, number> = { write: 0, fold: 1, seal: 2, send: 3, sent: 4 };
const STEP_TITLES: Record<string, [string, string]> = {
  write: ["шаг 1 · чернила", "Напиши письмо"],
  fold: ["шаг 2 · бумага", "Выбери конверт"],
  seal: ["шаг 3 · сургуч", "Прижми печать"],
  send: ["шаг 4 · почта", "Марка и адрес"],
};
const STAGE_HINTS: Record<string, string> = {
  write: "пиши — лист всё стерпит",
  fold: "письмо сложится само, только скажи",
  seal: "воск уже капнул — держи печать",
  send: "марка на месте, адрес твой",
};

const MSG_MAX = 420;

/* ─── Варианты оформления — единый источник: datesStatus ─────── */

function getOptions(catKey: string): EnvelopeOption[] {
  return (
    datesStatus.envelopeCustomizations.find((c) => c.key === catKey)?.options ?? []
  );
}

const PAPER_OPTS = getOptions("paper");
const SEAL_OPTS = getOptions("seal");
const STAMP_OPTS = getOptions("stamp");

/** Воск — в цветах приложения; оттиски различаются иконкой-эмодзи. */
const SEAL_COLORS: Record<string, { a: string; b: string }> = {
  heart:   { a: "var(--hwd-primary)", b: "var(--hwd-primary-deep)" },
  wax:     { a: "var(--hwd-primary)", b: "var(--hwd-primary-deep)" },
  initial: { a: "var(--hwd-primary)", b: "var(--hwd-primary-deep)" },
  star:    { a: "var(--hwd-primary)", b: "var(--hwd-primary-deep)" },
  flower:  { a: "var(--hwd-primary)", b: "var(--hwd-primary-deep)" },
  custom:  { a: "var(--hwd-primary)", b: "var(--hwd-primary-deep)" },
};
const DEFAULT_WAX = { a: "var(--hwd-primary)", b: "var(--hwd-primary-deep)" };

const SPARKS = Array.from({ length: 10 }, (_, i) => ({
  id: i,
  emoji: ["✨", "💛", "⭐"][i % 3],
  x: Math.round(Math.sin(i * 2.1) * 70),
  y: -30 - (i % 4) * 22,
  d: i * 0.04,
}));

const TRAIL = Array.from({ length: 7 }, (_, i) => ({
  id: i,
  e: ["💗", "✨", "💌", "💫"][i % 4],
  x: 60 + i * 52,
  y: -70 - i * 46,
  r: (i % 2 ? 1 : -1) * (14 + i * 9),
}));

/* ─── SSR-safe mounted flag ──────────────────────────────────── */

const noopSubscribe = () => () => {};
const getServerSnapshot = () => false;
const getClientSnapshot = () => true;

/** true после гидрации — защита от hydration-mismatch (например, даты). */
function useMounted(): boolean {
  return useSyncExternalStore(noopSubscribe, getClientSnapshot, getServerSnapshot);
}

/* ─── Hold-to-seal ───────────────────────────────────────────── */

function useHoldToSeal({
  duration = 1.15,
  onComplete,
}: { duration?: number; onComplete?: () => void } = {}) {
  const progress = useMotionValue(0);
  const [holding, setHolding] = useState(false);
  const [sealedNow, setSealedNow] = useState(false);
  const animRef = useRef<ReturnType<typeof animate> | null>(null);
  const completeRef = useRef(onComplete);
  useEffect(() => {
    completeRef.current = onComplete;
  });

  const start = useCallback(() => {
    if (sealedNow) return;
    setHolding(true);
    animRef.current?.stop();
    animRef.current = animate(progress, 1, {
      duration,
      ease: "linear",
      onComplete: () => {
        setHolding(false);
        setSealedNow(true);
        completeRef.current?.();
      },
    });
  }, [progress, duration, sealedNow]);

  const cancel = useCallback(() => {
    if (sealedNow) return;
    setHolding(false);
    animRef.current?.stop();
    animRef.current = animate(progress, 0, { duration: 0.35, ease: "easeOut" });
  }, [progress, sealedNow]);

  const reset = useCallback(() => {
    animRef.current?.stop();
    setHolding(false);
    setSealedNow(false);
    progress.set(0);
  }, [progress]);

  useEffect(() => () => animRef.current?.stop(), []);
  return { progress, holding, sealedNow, start, cancel, reset };
}

function HoldRing({ progress, size = 88, stroke = 5 }: { progress: ReturnType<typeof useMotionValue<number>>; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = useTransform(progress, [0, 1], [c, 0]);
  return (
    <svg className={styles.holdRing} width={size} height={size} aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} className={styles.ringTrack} strokeWidth={stroke} fill="none" />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r}
        className={styles.ringFill} strokeWidth={stroke} fill="none"
        strokeLinecap="round"
        strokeDasharray={c}
        style={{ strokeDashoffset: offset }}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}

/* ─── Содержимое листа ───────────────────────────────────────── */

function SheetInner({ letter, dateStr }: { letter: LetterData; dateStr: string }) {
  const to = letter.to.trim();
  const from = letter.from.trim();
  const msg = letter.message.trim();
  return (
    <div className={styles.sheetInner}>
      <div className={styles.sheetHead} aria-hidden>
        <span>{dateStr}</span>
        <span>вечером, при свечах</span>
      </div>
      <p className={styles.sheetGreet}>Здравствуй, {to || "…"}!</p>
      <p className={cn(styles.sheetMsg, !msg && styles.sheetMsgGhost)}>
        {msg || "начни здесь — перо уже готово…"}
      </p>
      {letter.ps.trim() && <p className={styles.sheetPs}>P.S. {letter.ps}</p>}
      <p className={styles.sheetSign}>— {from || "твой кто-то"}</p>
    </div>
  );
}

/* ─── Тройной сгиб ─────────────────────────────────────────────
   Сгиб жив только на фазах folding/stack: дальше риг невидим и не
   мешает стопке лететь в конверт. */

function FoldRig({ letter, phase, dateStr }: { letter: LetterData; phase: string; dateStr: string }) {
  const holdFold = phase === "folding" || phase === "stack";

  const seg = (i: number) => {
    const isTop = i === 0;
    const isBot = i === 2;
    const rotated = holdFold && (isTop || isBot);
    return (
      <motion.div
        key={i}
        className={cn(styles.seg, isTop ? styles.seg0 : isBot ? styles.seg2 : styles.seg1)}
        style={{ transformOrigin: isTop ? "bottom center" : "top center" }}
        initial={false}
        animate={{
          rotateX: rotated ? (isTop ? 178 : -178) : 0,
          zIndex: rotated ? (isTop ? 3 : 2) : 1,
        }}
        transition={{
          rotateX: { duration: 0.5, ease: EASE, delay: isTop ? 0.45 : 0 },
          zIndex: { duration: 0.001, delay: isTop ? 0.7 : 0.25 },
        }}
      >
        <div className={styles.segFace}>
          <div className={styles.segSlice} style={{ top: `calc(var(--segH) * ${-i})` }}>
            <SheetInner letter={letter} dateStr={dateStr} />
          </div>
        </div>
        <div className={styles.segBack} aria-hidden />
      </motion.div>
    );
  };

  return (
    <motion.div
      className={styles.foldRig}
      initial={{ opacity: 0 }}
      animate={{ opacity: holdFold ? 1 : 0 }}
      transition={{ duration: 0.18 }}
      aria-hidden
    >
      {seg(0)}
      {seg(1)}
      {seg(2)}
    </motion.div>
  );
}

/* Стопка после сгиба — улетает в конверт */
const STACK_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 0, x: 0, scale: 0.96, rotate: -1 },
  stack: { opacity: 1, y: 0, x: 0, scale: 0.96, rotate: -1, transition: { duration: 0.16 } },
  flying: (d: { x: number; y: number }) => ({
    opacity: 1, y: d.y - 16, x: d.x, scale: 0.8, rotate: 1.5,
    transition: { duration: 0.62, ease: [0.45, 0, 0.25, 1] },
  }),
  in: (d: { x: number; y: number }) => ({
    opacity: 0, y: d.y + 36, x: d.x, scale: 0.72, rotate: 0.5,
    transition: { duration: 0.26, ease: "easeIn" },
  }),
};

/* ─── Конверт ────────────────────────────────────────────────── */

interface HoldState {
  progress: ReturnType<typeof useMotionValue<number>>;
  holding: boolean;
  sealedNow: boolean;
  start: () => void;
  cancel: () => void;
  reset: () => void;
}

interface EnvelopeRigProps {
  paper: EnvelopeOption;
  seal: EnvelopeOption;
  stamp: EnvelopeOption;
  to: string;
  from: string;
  flapClosed: boolean;
  step: string;
  hold: HoldState;
  sending: boolean;
  caught: boolean;
  mouthRef: React.RefObject<HTMLSpanElement | null>;
}

function EnvelopeRig({
  paper, seal, stamp, to, from,
  flapClosed, step, hold, sending, caught, mouthRef,
}: EnvelopeRigProps) {
  const sealed = hold.sealedNow;
  const showStamp = step === "send";
  const waxColor = SEAL_COLORS[seal.value] ?? DEFAULT_WAX;
  const waxScale = useTransform(hold.progress, [0, 0.75, 1], [0.55, 0.85, 1]);

  return (
    <motion.div
      className={styles.envScale}
      initial={false}
      animate={
        sending
          ? {
              rotate: [0, -3, 2.5, -1, 16],
              x: [0, 0, 0, 0, 460],
              y: [-96, -90, -92, -96, -480],
              scale: [1, 1.03, 1.03, 1, 0.42],
              opacity: [1, 1, 1, 1, 0],
            }
          : {
              rotate: 0, x: 0,
              scale: sealed ? 1 : hold.holding ? 0.985 : 1,
              y: step === "fold" ? 0 : -96,
              opacity: 1,
            }
      }
      transition={
        sending
          ? { duration: 1.25, times: [0, 0.18, 0.32, 0.46, 1], ease: "easeIn" }
          : { type: "spring", stiffness: 120, damping: 17 }
      }
    >
      {/* «тумк» при запечатывании + лёгкая поимка письма при вложении */}
      <motion.div
        className={styles.envThud}
        animate={
          sealed
            ? { scale: [1, 0.962, 1.012, 1] }
            : caught
              ? { scale: [1, 0.975, 1.01, 1] }
              : { scale: 1 }
        }
        transition={{ duration: 0.45 }}
      >
        <div className={styles.env} style={{ "--pb": paper.value } as React.CSSProperties}>
          <div className={styles.envBack} aria-hidden>
            <span className={styles.envHeart}>♥</span>
          </div>

          <div className={styles.pocket} aria-hidden>
            <div className={cn(styles.fold, styles.foldL)} />
            <div className={cn(styles.fold, styles.foldR)} />
            <div className={cn(styles.fold, styles.foldB)} />
            <div className={styles.addr}>
              <span className={styles.addrLine}>Кому: {to.trim() || "самой любимой"}</span>
              <span className={cn(styles.addrLine, styles.addrFrom)}>От: {from.trim() || "твоего сердца"}</span>
            </div>
            <span className={styles.micro}>heartwood post · отд. № 7</span>

            <AnimatePresence>
              {showStamp && (
                <motion.span
                  className={styles.envStamp}
                  initial={{ scale: 0, rotate: -30, opacity: 0 }}
                  animate={{ scale: 1, rotate: 4, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 16 }}
                >
                  {stamp.emoji}
                  <span className={styles.envPostmark} />
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <motion.div
            className={styles.flap}
            initial={{ rotateX: 0, zIndex: 50 }}
            animate={{ rotateX: flapClosed ? 0 : -176, zIndex: flapClosed ? 50 : 2 }}
            transition={{
              rotateX: { duration: T.flap, ease: EASE, delay: flapClosed ? T.closeWait : 0.15 },
              zIndex: { duration: 0.001, delay: flapClosed ? T.closeWait + T.flapEdge : 0.15 + T.flapEdge },
            }}
          >
            <div className={styles.flapFace} />
            <div className={styles.flapBack} />
            {!sealed && <div className={styles.sealBlank} aria-hidden />}
          </motion.div>

          {/* Воск на кончике клапана */}
          {step === "seal" && (
            <div
              className={styles.waxTarget}
              role="button"
              tabIndex={0}
              aria-label="Прижми печать и держи, пока воск не схватится"
              onPointerDown={hold.start}
              onPointerUp={hold.cancel}
              onPointerLeave={hold.cancel}
              onPointerCancel={hold.cancel}
              onKeyDown={(e) => {
                if ((e.key === " " || e.key === "Enter") && !e.repeat) {
                  e.preventDefault();
                  hold.start();
                }
              }}
              onKeyUp={(e) => {
                if (e.key === " " || e.key === "Enter") hold.cancel();
              }}
              onContextMenu={(e) => e.preventDefault()}
            >
              <AnimatePresence mode="wait">
                {sealed ? (
                  <motion.span
                    key="stamped"
                    className={styles.seal}
                    style={{ background: `radial-gradient(circle at 34% 28%, ${waxColor.a}, ${waxColor.b} 70%)` }}
                    initial={{ scale: 0.3, opacity: 0 }}
                    animate={{ scale: [1.3, 0.9, 1.06, 1], opacity: 1 }}
                    transition={{ duration: 0.5, times: [0, 0.35, 0.7, 1] }}
                  >
                    {seal.emoji}
                  </motion.span>
                ) : (
                  <motion.span key="puddle" className={styles.waxPuddleWrap} exit={{ opacity: 0, scale: 0.6 }}>
                    <motion.span
                      className={styles.waxPuddle}
                      style={{
                        scale: waxScale,
                        background: `radial-gradient(circle at 36% 30%, ${waxColor.a}, ${waxColor.b} 72%)`,
                      }}
                    />
                    <HoldRing progress={hold.progress} />
                    {!hold.holding && <span className={styles.waxHint}>прижми и держи</span>}
                  </motion.span>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {sealed && (
                  <div className={styles.sparks} aria-hidden>
                    {SPARKS.map((p) => (
                      <motion.span
                        key={p.id}
                        className={styles.spark}
                        initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                        animate={{ x: p.x, y: p.y, opacity: [0, 1, 0], scale: [0, 1, 0.4] }}
                        transition={{ duration: 0.9, delay: p.d, ease: "easeOut" }}
                      >
                        {p.emoji}
                      </motion.span>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>
          )}

          <span className={styles.mouth} ref={mouthRef} aria-hidden />
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Квитанция ──────────────────────────────────────────────── */

interface SentReceiptProps {
  letter: LetterData;
  paper: EnvelopeOption;
  seal: EnvelopeOption;
  stamp: EnvelopeOption;
  sentAt: Date;
  onReset: () => void;
}

function SentReceipt({ letter, paper, seal, stamp, sentAt, onReset }: SentReceiptProps) {
  const num = `${String(sentAt.getDate()).padStart(2, "0")}${String(sentAt.getMonth() + 1).padStart(2, "0")}-${String(sentAt.getHours()).padStart(2, "0")}${String(sentAt.getMinutes()).padStart(2, "0")}`;
  return (
    <motion.div
      className={styles.receipt}
      initial={{ opacity: 0, y: 70, rotate: 2 }}
      animate={{ opacity: 1, y: 0, rotate: -0.6 }}
      transition={{ type: "spring", stiffness: 170, damping: 20, delay: 0.15 }}
    >
      <div className={styles.receiptStamp} aria-hidden>отправлено</div>
      <p className={styles.receiptTitle}>Почтовая квитанция</p>
      <p className={styles.receiptNum}>№ {num} · heartwood post</p>

      <dl className={styles.receiptRows}>
        <div><dt>Получатель</dt><dd>{letter.to.trim() || "самая любимая"}</dd></div>
        <div><dt>Отправитель</dt><dd>{letter.from.trim() || "твоё сердце"}</dd></div>
        <div><dt>Вложено</dt><dd>письмо, 1 лист, от руки</dd></div>
        <div><dt>Бумага</dt><dd>«{paper.label.toLowerCase()}»</dd></div>
        <div><dt>Печать</dt><dd>{seal.emoji} {seal.label.toLowerCase()}, сургуч</dd></div>
        <div><dt>Марка</dt><dd>{stamp.emoji} {stamp.label.toLowerCase()}</dd></div>
        <div><dt>Оплачено</dt><dd>любовью, без сдачи</dd></div>
      </dl>

      <button className={cn(styles.btn, styles.btnPrimary, styles.receiptBtn)} onClick={onReset}>
        Написать ещё письмо <span aria-hidden>✍️</span>
      </button>
    </motion.div>
  );
}

/* ─── Панели шагов ───────────────────────────────────────────── */

function WritePanel({
  letter,
  setLetter,
  onNext,
}: {
  letter: LetterData;
  setLetter: React.Dispatch<React.SetStateAction<LetterData>>;
  onNext: () => void;
}) {
  const ready = letter.message.trim().length > 0 && letter.to.trim().length > 0;
  return (
    <>
      <div className={styles.field}>
        <label className={styles.flabel} htmlFor="lc-to">Кому</label>
        <input
          id="lc-to" className={styles.input} maxLength={24}
          placeholder="имя получателя"
          value={letter.to}
          onChange={(e) => setLetter({ ...letter, to: e.target.value })}
        />
      </div>
      <div className={styles.field}>
        <label className={styles.flabel} htmlFor="lc-msg">Текст письма</label>
        <textarea
          id="lc-msg" className={cn(styles.input, styles.inputHand)} rows={7} maxLength={MSG_MAX}
          placeholder="пиши от руки, как есть…"
          value={letter.message}
          onChange={(e) => setLetter({ ...letter, message: e.target.value })}
        />
        <span className={cn(styles.counter, letter.message.length > MSG_MAX - 40 && styles.counterWarm)}>
          🖋 {MSG_MAX - letter.message.length}
        </span>
      </div>
      <div className={styles.fieldRow}>
        <div className={styles.field}>
          <label className={styles.flabel} htmlFor="lc-from">От кого</label>
          <input
            id="lc-from" className={styles.input} maxLength={24}
            placeholder="твоё имя"
            value={letter.from}
            onChange={(e) => setLetter({ ...letter, from: e.target.value })}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.flabel} htmlFor="lc-ps">P.S.</label>
          <input
            id="lc-ps" className={styles.input} maxLength={60}
            placeholder="необязательно"
            value={letter.ps}
            onChange={(e) => setLetter({ ...letter, ps: e.target.value })}
          />
        </div>
      </div>
      <button className={cn(styles.btn, styles.btnPrimary)} onClick={onNext} disabled={!ready}>
        Сложить письмо <span aria-hidden>✧</span>
      </button>
      {!ready && <p className={styles.fnote}>нужно имя получателя и хотя бы пара строк</p>}
    </>
  );
}

function FoldPanel({
  paper,
  setPaper,
  phase,
  onInsert,
  onBack,
}: {
  paper: EnvelopeOption;
  setPaper: React.Dispatch<React.SetStateAction<EnvelopeOption>>;
  phase: string;
  onInsert: () => void;
  onBack: () => void;
}) {
  const busy = phase !== "flat";
  return (
    <>
      <div className={styles.custGroup}>
        <span className={styles.custLabel}>Бумага конверта</span>
        <div className={styles.custRow}>
          {PAPER_OPTS.map((p) => (
            <button
              key={p.key} type="button"
              className={cn(styles.swatch, paper.key === p.key && styles.swatchOn)}
              style={{ background: `linear-gradient(145deg, ${p.value}, ${p.value})` }}
              aria-pressed={paper.key === p.key}
              aria-label={`Бумага: ${p.label}`}
              title={p.label}
              onClick={() => setPaper(p)}
              disabled={busy}
            />
          ))}
        </div>
      </div>
      <p className={styles.fbody}>
        Конверт уже раскрыт и ждёт. Письмо сложится втрое и ляжет внутрь — только скажи.
      </p>
      <button className={cn(styles.btn, styles.btnPrimary)} onClick={onInsert} disabled={busy}>
        {busy ? "Вкладываем…" : "Вложить в конверт"} <span aria-hidden>💌</span>
      </button>
      {!busy && (
        <button className={cn(styles.btn, styles.btnGhost)} onClick={onBack}>
          ← Развернуть письмо
        </button>
      )}
    </>
  );
}

function SealPanel({
  seal,
  setSeal,
  hold,
}: {
  seal: EnvelopeOption;
  setSeal: React.Dispatch<React.SetStateAction<EnvelopeOption>>;
  hold: HoldState;
}) {
  const sealed = hold.sealedNow;
  const waxColor = SEAL_COLORS[seal.value] ?? DEFAULT_WAX;
  return (
    <>
      <div className={styles.custGroup}>
        <span className={styles.custLabel}>Оттиск печати</span>
        <div className={styles.custRow}>
          {SEAL_OPTS.map((s) => (
            <button
              key={s.key} type="button"
              className={cn(styles.chip, seal.key === s.key && styles.chipOn)}
              aria-pressed={seal.key === s.key}
              onClick={() => setSeal(s)}
              disabled={sealed}
            >
              <span aria-hidden>{s.emoji}</span>
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <p className={styles.fbody}>
        Воск уже капнул на клапан. Прижми печать — на конверте или кнопкой ниже — и держи
        примерно секунду, пока не схватится.
      </p>
      <div className={styles.holdZone}>
        <button
          className={styles.holdBtn}
          aria-label="Прижми печать и держи, пока воск не схватится"
          onPointerDown={hold.start}
          onPointerUp={hold.cancel}
          onPointerLeave={hold.cancel}
          onPointerCancel={hold.cancel}
          onKeyDown={(e) => {
            if ((e.key === " " || e.key === "Enter") && !e.repeat) {
              e.preventDefault();
              hold.start();
            }
          }}
          onKeyUp={(e) => {
            if (e.key === " " || e.key === "Enter") hold.cancel();
          }}
          onContextMenu={(e) => e.preventDefault()}
          style={{ touchAction: "none" }}
        >
          <HoldRing progress={hold.progress} size={104} stroke={6} />
          <span
            className={styles.holdCore}
            style={{ background: `radial-gradient(circle at 34% 28%, ${waxColor.a}, ${waxColor.b} 72%)` }}
            aria-hidden
          >
            {seal.emoji}
          </span>
        </button>
        <p className={styles.holdCap} aria-live="polite">
          {sealed ? "печать схватилась ✓" : hold.holding ? "держи, почти…" : "нажми и держи"}
        </p>
      </div>
      <p className={styles.fnote}>сургуч обратно не отклеить — в этом и ритуал</p>
    </>
  );
}

function SendPanel({
  stamp,
  setStamp,
  letter,
  onSend,
  sending,
}: {
  stamp: EnvelopeOption;
  setStamp: React.Dispatch<React.SetStateAction<EnvelopeOption>>;
  letter: LetterData;
  onSend: () => void;
  sending: boolean;
}) {
  return (
    <>
      <div className={styles.custGroup}>
        <span className={styles.custLabel}>Марка</span>
        <div className={styles.custRow}>
          {STAMP_OPTS.map((s) => (
            <button
              key={s.key} type="button"
              className={cn(styles.chip, stamp.key === s.key && styles.chipOn)}
              aria-pressed={stamp.key === s.key}
              onClick={() => setStamp(s)}
              disabled={sending}
            >
              <span aria-hidden>{s.emoji}</span>
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.addrCard} aria-label="Адрес на конверте">
        <span className={styles.addrCardLine}>Кому: <strong>{letter.to.trim() || "самой любимой"}</strong></span>
        <span className={styles.addrCardLine}>От: <strong>{letter.from.trim() || "твоего сердца"}</strong></span>
      </div>
      <button className={cn(styles.btn, styles.btnPrimary)} onClick={onSend} disabled={sending}>
        {sending ? "Летит…" : "Отправить"} <span aria-hidden>🕊️</span>
      </button>
      <p className={styles.fnote}>голубь уже разминает крылья</p>
    </>
  );
}

/* ─── Компонент ──────────────────────────────────────────────── */

export function LetterComposer({ onSend }: LetterComposerProps) {
  const { gender } = useGender();
  const mounted = useMounted();

  const [step, setStep] = useState("write");
  const [paper, setPaper] = useState<EnvelopeOption>(PAPER_OPTS[0]);
  const [seal, setSeal] = useState<EnvelopeOption>(SEAL_OPTS[0]);
  const [stamp, setStamp] = useState<EnvelopeOption>(STAMP_OPTS[0]);
  const [foldPhase, setFoldPhase] = useState("flat");
  const [flapClosed, setFlapClosed] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentAt, setSentAt] = useState<Date | null>(null);
  const [flyDelta, setFlyDelta] = useState({ x: 0, y: 210 });

  /* «Кому/от» предзаполнены из профиля пары по выбранному полу */
  const [letter, setLetter] = useState<LetterData>(() => {
    const me = findPersonByGender(gender);
    const partner = coupleProfile.members.find((m) => m.id !== me.id) ?? coupleProfile.members[0];
    return {
      to: partner.name,
      from: me.name,
      message: "",
      ps: "",
      paper: PAPER_OPTS[0].key,
      seal: SEAL_OPTS[0].key,
      stamp: STAMP_OPTS[0].key,
    };
  });

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const stackRef = useRef<HTMLDivElement>(null);
  const mouthRef = useRef<HTMLSpanElement>(null);
  const stageRef = useRef<HTMLElement>(null);
  const onSendRef = useRef(onSend);
  useEffect(() => {
    onSendRef.current = onSend;
  });

  const hold = useHoldToSeal({
    duration: 1.15,
    onComplete: () => {
      timersRef.current.push(setTimeout(() => setStep("send"), 1100));
    },
  });

  const t = useCallback((ms: number, fn: () => void) => {
    timersRef.current.push(setTimeout(fn, ms));
  }, []);

  useEffect(() => {
    return () => timersRef.current.forEach(clearTimeout);
  }, []);

  /* Дата на листе — только после гидрации (без hydration-mismatch) */
  const dateStr = mounted
    ? new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })
    : "";

  /* Хореография вложения: сгиб → стопка → полёт → поимка → клапан */
  const runInsert = useCallback(() => {
    if (foldPhase !== "flat" || step !== "fold") return;
    const s = stackRef.current?.getBoundingClientRect();
    const m = mouthRef.current?.getBoundingClientRect();
    if (s && m) {
      setFlyDelta({
        x: m.left + m.width / 2 - (s.left + s.width / 2),
        y: m.top - s.top,
      });
    }
    setFoldPhase("folding");
    t(1000, () => setFoldPhase("stack"));
    t(1240, () => setFoldPhase("flying"));
    t(1900, () => setFoldPhase("in"));
    t(2080, () => setFlapClosed(true));
    t(2900, () => {
      setFoldPhase("done");
      setStep("seal");
    });
  }, [foldPhase, step, t]);

  const runSend = useCallback(() => {
    if (sending || step !== "send") return;
    setSending(true);
    t(1300, () => {
      setSending(false);
      const at = new Date();
      setSentAt(at);
      setStep("sent");
      onSendRef.current?.({
        to: letter.to,
        from: letter.from,
        message: letter.message,
        ps: letter.ps,
        paper: paper.key,
        seal: seal.key,
        stamp: stamp.key,
      });
    });
  }, [sending, step, t, letter, paper, seal, stamp]);

  const handleReset = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setFoldPhase("flat");
    setFlapClosed(false);
    setSending(false);
    setSentAt(null);
    hold.reset();
    setStep("write");
  }, [hold]);

  useEffect(() => {
    if (window.innerWidth < 920 && stageRef.current) {
      stageRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [step]);

  const idx = STEP_IDX[step];
  const sceneVisible = step === "fold" || step === "seal" || step === "send";
  const sheetVisible = step === "write" || (step === "fold" && foldPhase === "flat");
  const rigVisible = sceneVisible && foldPhase !== "done";

  return (
    <div className={styles.studio}>
      {/* Шаги: написать → сложить → запечатать → отправить.
          Компактный маршрут: рукописные номера + подпись текущего шага. */}
      <div className={styles.top}>
        <ol className={styles.route} aria-label="Этапы отправки письма">
          {ROUTE.map((r, i) => {
            const done = idx > i;
            const active = idx === i;
            return (
              <li
                key={r.key}
                className={styles.routeItem}
                aria-current={active ? "step" : undefined}
              >
                {i > 0 && <span className={styles.routeSep} aria-hidden />}
                <span
                  className={cn(
                    styles.routeMark,
                    active && styles.routeActive,
                    done && styles.routeDone,
                  )}
                  aria-hidden
                >
                  {done ? "✓" : String(i + 1).padStart(2, "0")}
                </span>
              </li>
            );
          })}
        </ol>
        <p className={styles.routeCaption} aria-hidden>
          {step === "sent" ? "письмо в пути" : ROUTE[idx]?.label}
        </p>
      </div>

      <div className={cn(styles.layout, step === "sent" && styles.layoutSent)}>
        {/* Сцена: лист, сгиб, конверт */}
        <section
          className={cn(styles.stage, step === "sent" && styles.stageSent)}
          ref={stageRef}
          aria-label="Письменный стол"
        >
          <AnimatePresence>
            {sheetVisible && (
              <motion.div
                key="sheet"
                className={styles.sheetScene}
                initial={{ opacity: 0, y: 26, rotate: 0 }}
                animate={{ opacity: 1, y: 0, rotate: -0.8 }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                transition={{ duration: 0.45, ease: EASE }}
              >
                <div className={styles.sheet}>
                  <SheetInner letter={letter} dateStr={dateStr} />
                </div>
                <div className={styles.sheetShadow} aria-hidden />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {sceneVisible && (
              <motion.div
                key="scene"
                className={styles.scene}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.25 } }}
                transition={{ duration: 0.35 }}
              >
                {rigVisible && <FoldRig letter={letter} phase={foldPhase} dateStr={dateStr} />}

                {(foldPhase === "flat" || foldPhase === "folding") && (
                  <div ref={stackRef} className={cn(styles.stack, styles.stackGhost)} aria-hidden>
                    <div className={styles.stackTop} style={{ "--pb": paper.value } as React.CSSProperties} />
                  </div>
                )}
                {(foldPhase === "stack" || foldPhase === "flying" || foldPhase === "in") && (
                  <motion.div
                    ref={stackRef}
                    className={styles.stack}
                    variants={STACK_VARIANTS}
                    custom={flyDelta}
                    initial="hidden"
                    animate={foldPhase}
                    aria-hidden
                  >
                    <div className={styles.stackTop} style={{ "--pb": paper.value } as React.CSSProperties} />
                  </motion.div>
                )}

                <div className={styles.envPos}>
                  <EnvelopeRig
                    paper={paper} seal={seal} stamp={stamp}
                    to={letter.to} from={letter.from}
                    flapClosed={flapClosed}
                    step={step} hold={hold} sending={sending}
                    caught={foldPhase === "in" || foldPhase === "done"}
                    mouthRef={mouthRef}
                  />
                </div>

                {sending && (
                  <div className={styles.trailZone} aria-hidden>
                    {TRAIL.map((p, i) => (
                      <motion.span
                        key={p.id}
                        className={styles.trail}
                        style={{ left: "50%", top: "46%" }}
                        initial={{ x: 0, y: 0, opacity: 0, scale: 0.4, rotate: 0 }}
                        animate={{
                          x: [0, p.x * 0.45, p.x],
                          y: [0, p.y * 0.5, p.y],
                          opacity: [0, 1, 0],
                          scale: [0.4, 1, 0.6],
                          rotate: p.r,
                        }}
                        transition={{ duration: 1.15, delay: 0.09 * i, ease: "easeOut" }}
                      >
                        {p.e}
                      </motion.span>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {step === "sent" && sentAt && (
              <SentReceipt
                key="receipt"
                letter={letter} paper={paper} seal={seal} stamp={stamp}
                sentAt={sentAt} onReset={handleReset}
              />
            )}
          </AnimatePresence>

          {step !== "sent" && (
            <p className={styles.stageHint}>
              <i aria-hidden />
              {STAGE_HINTS[step]}
            </p>
          )}
        </section>

        {/* Панель шага */}
        {step !== "sent" && (
        <aside className={styles.panelSide}>
          <div className={styles.panel}>
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 26 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }}
                transition={{ duration: 0.28, ease: EASE }}
              >
                <>
                  <p className={styles.eyebrow}>{STEP_TITLES[step][0]}</p>
                  <h1 className={styles.ptitle}>{STEP_TITLES[step][1]}</h1>
                {step === "write" && (
                  <WritePanel
                    letter={letter} setLetter={setLetter}
                    onNext={() => setStep("fold")}
                  />
                )}
                {step === "fold" && (
                  <FoldPanel
                    paper={paper} setPaper={setPaper} phase={foldPhase}
                    onInsert={runInsert} onBack={() => setStep("write")}
                  />
                )}
                {step === "seal" && <SealPanel seal={seal} setSeal={setSeal} hold={hold} />}
                {step === "send" && (
                  <SendPanel
                    stamp={stamp} setStamp={setStamp} letter={letter}
                    onSend={runSend} sending={sending}
                  />
                )}
              </>
              </motion.div>
            </AnimatePresence>
          </div>
        </aside>
        )}
      </div>

      <p className={styles.srOnly} aria-live="polite">
        {step === "sent" ? "Письмо отправлено" : `Шаг: ${ROUTE[idx]?.label ?? ""}`}
      </p>
    </div>
  );
}
