"use client";

import { useCallback, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useGender } from "@/lib/theme";
import { useCouple, useGoals } from "@/lib/api-data";
import type { GoalKind, GoalView } from "@/lib/types";
import { GoalComposer } from "./GoalComposer";
import {
  CheckIcon,
  PiggyIcon,
  PlaneIcon,
  PlusIcon,
  RubleIcon,
  SofaIcon,
  SunsetIcon,
  TrashIcon,
} from "./icons";
import styles from "./GoalsPage.module.css";

// Стаггер на первичный вход — цели поднимаются каскадом снизу.
const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.12 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 26, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", bounce: 0.32, duration: 0.6 } as const,
  },
};

/** Иконка категории цели. */
const KIND_ICON: Record<GoalKind, (props: { className?: string }) => React.ReactElement> = {
  trip: PlaneIcon,
  home: SofaIcon,
  celebration: SunsetIcon,
};

/** Фиксированный вклад за один клик — в общую копилку пары. */
const GOAL_CONTRIBUTION = 500;

/** Сумма по-русски с неразрывными пробелами: 37200 → «37 200». */
function formatRubles(n: number): string {
  return n.toLocaleString("ru-RU");
}

/**
 * Страница «Цели» — копилки пары в рублях.
 *
 * Цели приходят с /goals (useGoals) — каждая карточка с иконкой категории,
 * прогресс-баром, вехами и суммой в копилке. Кнопка «В копилку» добавляет
 * фиксированную сумму (GOAL_CONTRIBUTION) в общий кошелёк — без списания
 * сердечек: копилка ведётся в настоящих деньгах, а не во внутренней валюте.
 *
 * Карточки — «копилки»: стекло, волосяные рамки, одна мягкая тень. Вся
 * гамма — из токенов темы (--hwd-*), перекрашивается по гендеру.
 */
export function GoalsPage() {
  const reduced = useReducedMotion();
  const { gender } = useGender();

  const { data: coupleData } = useCouple();
  const viewerId = coupleData?.me.id;
  const { data: goalsData, contribute, create, remove } = useGoals();
  const goals = goalsData?.goals ?? [];
  const totalSaved = goalsData?.totalSaved ?? 0;
  const totalRemaining = goalsData?.totalRemaining ?? 0;

  const [composing, setComposing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const activeCount = goals.length;

  /** Вклад в копилку: кладёт GOAL_CONTRIBUTION рублей на общую цель. */
  const handleContribute = useCallback(
    async (goal: GoalView): Promise<boolean> => {
      if (!viewerId) return false;
      const ok = await contribute(goal.id, GOAL_CONTRIBUTION);
      if (!ok) return false;
      setNotice(`${formatRubles(GOAL_CONTRIBUTION)} ₽ в копилке «${goal.title}»`);
      return true;
    },
    [contribute, viewerId],
  );

  /** Создаёт новую цель и закрывает композер. */
  const handleCreate = useCallback(
    async (input: { kind: GoalKind; title: string; target: number }): Promise<boolean> => {
      const ok = await create(input);
      if (!ok) return false;
      setComposing(false);
      setNotice(`Новая цель «${input.title}» в копилке`);
      return true;
    },
    [create],
  );

  const handleRemove = useCallback(
    async (goal: GoalView) => {
      await remove(goal.id);
      setNotice(`Цель «${goal.title}» удалена`);
    },
    [remove],
  );

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div
          className={`${styles.eyebrow} ${styles.entranceRise}`}
          style={{ animationDelay: "0.05s" }}
        >
          <span className={styles.eyebrowDot} aria-hidden />
          Общая копилка
        </div>

        <h1
          className={`${styles.title} ${styles.entranceRise}`}
          style={{ animationDelay: "0.1s" }}
        >
          Наши цели
        </h1>

        <p
          className={`${styles.subtitle} ${styles.entranceRise}`}
          style={{ animationDelay: "0.15s" }}
        >
          Куда мы идём — по шагам и в рублях
        </p>

        {/* Сводка: цели / в копилке / до мечты */}
        <div className={styles.summary} role="list" aria-label="Цели пары">
          <div className={styles.summaryItem} role="listitem">
            <span className={styles.summaryIcon} aria-hidden>
              <PiggyIcon className={styles.summarySvg} />
            </span>
            <span className={styles.summaryBody}>
              <strong className={styles.summaryNum}>{activeCount}</strong>
              <span className={styles.summaryLabel}>цели</span>
            </span>
          </div>
          <div className={styles.summaryItem} role="listitem">
            <span className={styles.summaryIcon} aria-hidden>
              <RubleIcon className={styles.summarySvg} />
            </span>
            <span className={styles.summaryBody}>
              <strong className={styles.summaryNum}>{formatRubles(totalSaved)}</strong>
              <span className={styles.summaryLabel}>в копилке</span>
            </span>
          </div>
          <div className={styles.summaryItem} role="listitem">
            <span className={styles.summaryIcon} aria-hidden>
              <RubleIcon className={styles.summarySvg} />
            </span>
            <span className={styles.summaryBody}>
              <strong className={styles.summaryNum}>{formatRubles(totalRemaining)}</strong>
              <span className={styles.summaryLabel}>до мечты</span>
            </span>
          </div>
        </div>

        <div
          className={`${styles.divider} ${styles.entranceStretch}`}
          style={{ animationDelay: "0.3s" }}
          aria-hidden
        />
      </header>

      {/* Кнопка новой цели */}
      <div className={styles.toolbar}>
        <button
          type="button"
          onClick={() => setComposing(true)}
          className={styles.addBtn}
          aria-label="Создать цель"
        >
          <PlusIcon className={styles.addIcon} />
          <span className={styles.addLabel}>Новая цель</span>
        </button>
      </div>

      {/* Ошибка/уведомление */}
      {notice && (
        <div className={styles.notice} role="status">
          <span className={styles.noticeDot} aria-hidden />
          <span>{notice}</span>
        </div>
      )}

      {/* Сетка целей */}
      {goals.length === 0 ? (
        <EmptyState onCreate={() => setComposing(true)} />
      ) : (
        <motion.ul
          className={styles.grid}
          variants={gridVariants}
          initial={reduced ? false : "hidden"}
          animate="show"
          aria-label="Цели пары"
        >
          {goals.map((goal) => (
            <motion.li key={goal.id} layout variants={itemVariants} className={styles.gridItem}>
              <GoalCard
                goal={goal}
                meId={viewerId}
                onContribute={() => handleContribute(goal)}
                onRemove={() => handleRemove(goal)}
              />
            </motion.li>
          ))}
        </motion.ul>
      )}

      <p className={styles.footnote}>
        Каждый вклад кладёт {formatRubles(GOAL_CONTRIBUTION)} ₽ в общую копилку
      </p>

      {/* Создание цели */}
      {composing && (
        <GoalComposer onCreate={handleCreate} onClose={() => setComposing(false)} />
      )}
    </div>
  );
}

/** Карточка-копилка: иконка, прогресс, вехи и вклад в рублях. */
function GoalCard({
  goal,
  meId,
  onContribute,
  onRemove,
}: {
  goal: GoalView;
  /** id текущего пользователя — для строки «я: +N ₽». */
  meId?: string;
  onContribute: () => void;
  onRemove: () => void;
}) {
  const reduced = useReducedMotion();
  const progress = goal.progress;
  const done = progress >= 100;
  const Icon = KIND_ICON[goal.kind] ?? PlaneIcon;

  // Вклад текущего пользователя из истории вкладов цели.
  const myContribution = (meId ? goal.contributions.filter((c) => c.userId === meId) : []).reduce(
    (n, c) => n + c.amount,
    0,
  );

  const hasMilestones = goal.milestones.length > 0;

  return (
    <article
      className={cn(styles.card, done && styles.cardDone)}
      aria-label={done ? `Цель «${goal.title}» выполнена` : `Цель «${goal.title}», ${progress}%`}
    >
      {/* Верх: иконка категории + срок */}
      <div className={styles.cardTop}>
        <span className={styles.cardIcon} aria-hidden>
          <Icon className={styles.cardIconSvg} />
        </span>
        <div className={styles.cardTopRight}>
          {done ? (
            <span className={styles.cardDoneBadge}>
              <CheckIcon className={styles.cardDoneIcon} />
              Выполнено
            </span>
          ) : (
            <span className={styles.cardDeadline}>{goal.deadline}</span>
          )}
          <button
            type="button"
            onClick={onRemove}
            className={styles.cardTrash}
            aria-label={`Удалить цель «${goal.title}»`}
          >
            <TrashIcon className={styles.cardTrashIcon} />
          </button>
        </div>
      </div>

      <h3 className={styles.cardTitle}>{goal.title}</h3>
      {goal.description && <p className={styles.cardDesc}>{goal.description}</p>}

      {/* Прогресс */}
      <div className={styles.progressBlock}>
        <div className={styles.progressHead}>
          <span className={styles.progressPct}>{progress}%</span>
          <span className={styles.progressAmount} aria-hidden>
            <RubleIcon className={styles.progressUnit} />
            {formatRubles(goal.saved)} из {formatRubles(goal.target)}
          </span>
        </div>
        <span
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Цель «${goal.title}»: ${progress}%`}
          className={styles.progressTrack}
        >
          <motion.span
            className={styles.progressFill}
            initial={reduced ? undefined : { width: 0 }}
            whileInView={reduced ? undefined : { width: `${progress}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
          />
        </span>
      </div>

      {/* Вехи */}
      {hasMilestones && (
        <div className={styles.milestones} aria-label="Вехи цели">
          {goal.milestones.map((m) => (
            <div key={m.label} className={styles.milestone} title={m.label}>
              <span className={styles.milestoneLabel}>{m.label}</span>
              <span className={styles.milestoneTrack} aria-hidden>
                <span className={styles.milestoneFill} style={{ width: `${m.progress}%` }} />
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Низ: вклады + кнопка */}
      <div className={styles.cardFooter}>
        <div className={styles.contribLine}>
          <span className={styles.contribText}>
            {goal.contributions
              .filter((c) => c.amount > 0)
              .map((c) => `${c.name} · ${formatRubles(c.amount)} ₽`)
              .join("   ")}
          </span>
          {meId && myContribution > 0 && (
            <span className={styles.contribMine}>я: +{formatRubles(myContribution)} ₽</span>
          )}
        </div>

        {done ? (
          <span className={styles.cardDoneHint}>Копилка полна — мечта уже близко</span>
        ) : (
          <motion.button
            type="button"
            onClick={onContribute}
            whileTap={reduced ? undefined : { scale: 0.97 }}
            className={styles.contribute}
            aria-label={`Внести ${formatRubles(GOAL_CONTRIBUTION)} ₽ в «${goal.title}»`}
          >
            <RubleIcon className={styles.contributeIcon} />
            В копилку · {formatRubles(GOAL_CONTRIBUTION)} ₽
          </motion.button>
        )}
      </div>
    </article>
  );
}

/** Пустое состояние — мягкая карточка-приглашение. */
function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className={styles.empty}>
      <span className={styles.emptyBadge} aria-hidden>
        <PiggyIcon className={styles.emptyIcon} />
      </span>
      <h2 className={styles.emptyTitle}>Пока ни одной цели</h2>
      <p className={styles.emptyText}>
        Придумайте общую мечту — и копите на неё по рублю
      </p>
      <button type="button" onClick={onCreate} className={styles.emptyBtn}>
        <PlusIcon className={styles.emptyBtnIcon} />
        Первая цель
      </button>
    </div>
  );
}
