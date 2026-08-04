"use client";

// Страница «Список желаний» — самый «игровой» хаб пары.
//
// Здесь живут мечты и подарки. Три раздела — три шага желания:
//   «В списке» — открытые мечты (можно загадать свою или партнёра),
//   «Готовятся подарки» — партнёр взял мечту в работу (claim),
//   «Подарено» — мечта сбылась.
//
// Игровая механика: взять желание партнёра в подарок можно тайно — мечтатель
// видит только «кто-то готовит», имя заклеймившего скрыто (сюрприз дороже
// учёта). Даритель видит себя и может вернуть мечту в список или отметить
// исполнение. Дата «сегодня» здесь не нужна — в отличие от календаря,
// желания безвременны, поэтому страница SSR-чистая без useEffect.
//
// Карточки — «стекло», гамма из токенов темы (--hwd-*), по гендеру.

import { useCallback, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useGender } from "@/lib/theme";
import { findPersonByGender } from "@/features/world/profile/couple";
import { pluralRu } from "@/lib/data/events";
import { statusOf, type AuthorId, type Wish, type WishStatus } from "@/lib/data/wishlist";
import { useWishlist, toAuthorId, type NewWishInput } from "./useWishlist";
import { WishlistComposer } from "./WishlistComposer";
import {
  BoxIcon,
  CheckIcon,
  DreamIcon,
  GiftIcon,
  PlusIcon,
  SparklesIcon,
  TrashIcon,
} from "./icons";
import styles from "./WishlistPage.module.css";

// Стаггер на первичный вход — желания всплывают каскадом снизу.
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

/** Иконка статуса желания. */
const STATUS_ICON: Record<WishStatus, (props: { className?: string }) => React.ReactElement> = {
  open: DreamIcon,
  claimed: BoxIcon,
  fulfilled: CheckIcon,
};

/** Русские имена участников — для подписей «Мечта Димы» / «Добавила Аня». */
const PERSON_NAME: Record<string, string> = {
  dima: "Дима",
  anya: "Аня",
};

/**
 * Страница «Список желаний».
 */
export function WishlistPage() {
  const reduced = useReducedMotion();
  const { gender } = useGender();

  const me = findPersonByGender(gender);
  const meId = toAuthorId(me.id) ?? "dima";

  const { wishes, add, claim, unclaim, fulfill, remove } = useWishlist();

  const [composing, setComposing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Три раздела — по статусу желания.
  const sections = useMemo(() => {
    const open: Wish[] = [];
    const claimed: Wish[] = [];
    const fulfilled: Wish[] = [];
    for (const w of wishes) {
      const s = statusOf(w);
      if (s === "open") open.push(w);
      else if (s === "claimed") claimed.push(w);
      else fulfilled.push(w);
    }
    return { open, claimed, fulfilled };
  }, [wishes]);

  /** Добавляет желание и закрывает композер. */
  const handleCreate = useCallback(
    (input: NewWishInput): boolean => {
      const id = add(input, meId);
      if (!id) return false;
      setComposing(false);
      setNotice(`Мечта «${input.title}» в списке`);
      return true;
    },
    [add, meId],
  );

  const handleClaim = useCallback(
    (wish: Wish) => {
      if (!claim(wish.id, meId)) return;
      setNotice(`«${wish.title}» — ты даришь, и это секрет`);
    },
    [claim, meId],
  );

  const handleUnclaim = useCallback(
    (wish: Wish) => {
      if (!unclaim(wish.id, meId)) return;
      setNotice(`«${wish.title}» вернулось в список`);
    },
    [unclaim, meId],
  );

  const handleFulfill = useCallback(
    (wish: Wish) => {
      if (!fulfill(wish.id, meId)) return;
      setNotice(`«${wish.title}» исполнено — вы чудо`);
    },
    [fulfill, meId],
  );

  const handleRemove = useCallback(
    (wish: Wish) => {
      if (!remove(wish.id, meId)) return;
      setNotice(`«${wish.title}» убрано из списка`);
    },
    [remove, meId],
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
          Список желаний
        </div>

        <h1
          className={`${styles.title} ${styles.entranceRise}`}
          style={{ animationDelay: "0.1s" }}
        >
          Наши мечты
        </h1>

        <p
          className={`${styles.subtitle} ${styles.entranceRise}`}
          style={{ animationDelay: "0.15s" }}
        >
          Загадывайте желания и дарите друг другу сюрпризы — тихо, но по любви
        </p>

        {/* Сводка: в списке / в работе / подарено */}
        <div className={styles.summary} role="list" aria-label="Желания в списке">
          <div className={styles.summaryItem} role="listitem">
            <span className={styles.summaryIcon} aria-hidden>
              <DreamIcon className={styles.summarySvg} />
            </span>
            <span className={styles.summaryBody}>
              <strong className={styles.summaryNum}>{sections.open.length}</strong>
              <span className={styles.summaryLabel}>в списке</span>
            </span>
          </div>
          <div className={styles.summaryItem} role="listitem">
            <span className={styles.summaryIcon} aria-hidden>
              <BoxIcon className={styles.summarySvg} />
            </span>
            <span className={styles.summaryBody}>
              <strong className={styles.summaryNum}>{sections.claimed.length}</strong>
              <span className={styles.summaryLabel}>в работе</span>
            </span>
          </div>
          <div className={styles.summaryItem} role="listitem">
            <span className={styles.summaryIcon} aria-hidden>
              <CheckIcon className={styles.summarySvg} />
            </span>
            <span className={styles.summaryBody}>
              <strong className={styles.summaryNum}>{sections.fulfilled.length}</strong>
              <span className={styles.summaryLabel}>подарено</span>
            </span>
          </div>
        </div>

        <div
          className={`${styles.divider} ${styles.entranceStretch}`}
          style={{ animationDelay: "0.3s" }}
          aria-hidden
        />
      </header>

      {/* Герой-подсказка: предлагает взять мечту партнёра в подарок */}
      <GiftHero wishes={wishes} meId={meId} reduced={reduced} onClaim={handleClaim} />

      {/* Кнопка новой мечты */}
      <div className={styles.toolbar}>
        <button
          type="button"
          onClick={() => setComposing(true)}
          className={styles.addBtn}
          aria-label="Добавить желание"
        >
          <PlusIcon className={styles.addIcon} />
          <span className={styles.addLabel}>Новая мечта</span>
        </button>
      </div>

      {/* Уведомление */}
      {notice && (
        <div className={styles.notice} role="status">
          <span className={styles.noticeDot} aria-hidden />
          <span>{notice}</span>
        </div>
      )}

      {/* В списке */}
      <Section
        title="В списке"
        count={sections.open.length}
        plural={(n) => pluralRu(n, "желание", "желания", "желаний")}
        empty="Пока ни одной мечты — загадайте первую"
      >
        <motion.ul
          className={styles.grid}
          variants={gridVariants}
          initial={reduced ? false : "hidden"}
          animate="show"
          aria-label="Открытые желания"
        >
          {sections.open.map((wish) => (
            <motion.li key={wish.id} layout variants={itemVariants} className={styles.gridItem}>
              <WishCard
                wish={wish}
                meId={meId}
                reduced={reduced}
                onClaim={handleClaim}
                onUnclaim={handleUnclaim}
                onFulfill={handleFulfill}
                onRemove={handleRemove}
              />
            </motion.li>
          ))}
        </motion.ul>
      </Section>

      {/* Готовятся подарки */}
      <Section
        title="Готовятся подарки"
        count={sections.claimed.length}
        plural={(n) => pluralRu(n, "подарок", "подарка", "подарков")}
        empty="Пока никто не взялся за подарок — исполните мечту партнёра"
      >
        <motion.ul
          className={styles.grid}
          variants={gridVariants}
          initial={reduced ? false : "hidden"}
          animate="show"
          aria-label="Желания в работе"
        >
          {sections.claimed.map((wish) => (
            <motion.li key={wish.id} layout variants={itemVariants} className={styles.gridItem}>
              <WishCard
                wish={wish}
                meId={meId}
                reduced={reduced}
                onClaim={handleClaim}
                onUnclaim={handleUnclaim}
                onFulfill={handleFulfill}
                onRemove={handleRemove}
              />
            </motion.li>
          ))}
        </motion.ul>
      </Section>

      {/* Подарено */}
      <Section
        title="Подарено"
        count={sections.fulfilled.length}
        plural={(n) => pluralRu(n, "желание", "желания", "желаний")}
        empty="Исполненные мечты появятся здесь"
      >
        <motion.ul
          className={styles.grid}
          variants={gridVariants}
          initial={reduced ? false : "hidden"}
          animate="show"
          aria-label="Исполненные желания"
        >
          {sections.fulfilled.map((wish) => (
            <motion.li key={wish.id} layout variants={itemVariants} className={styles.gridItem}>
              <WishCard
                wish={wish}
                meId={meId}
                reduced={reduced}
                onClaim={handleClaim}
                onUnclaim={handleUnclaim}
                onFulfill={handleFulfill}
                onRemove={handleRemove}
              />
            </motion.li>
          ))}
        </motion.ul>
      </Section>

      <p className={styles.footnote}>
        Взяли мечту партнёра — готовьте тайно: мечтатель увидит только «кто-то
        готовит». Сюрприз — это и есть любовь
      </p>

      {/* Новая мечта */}
      {composing && (
        <WishlistComposer onCreate={handleCreate} onClose={() => setComposing(false)} />
      )}
    </div>
  );
}

/** Раздел с заголовком, счётчиком и пустым состоянием. */
function Section({
  title,
  count,
  plural,
  empty,
  children,
}: {
  title: string;
  count: number;
  plural: (n: number) => string;
  empty: string;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.section} aria-label={title}>
      <h2 className={styles.sectionTitle}>
        {title}
        <span className={styles.sectionCount}>
          {count} {plural(count)}
        </span>
      </h2>
      {count > 0 ? children : <p className={styles.sectionEmpty}>{empty}</p>}
    </section>
  );
}

/**
 * Герой-подсказка. Подкидывает игровую идею: если у партнёра есть открытая
 * мечта — зовёт взять её в подарок; если все мечты в работе или сбылись —
 * хвалит пару.
 */
function GiftHero({
  wishes,
  meId,
  reduced,
  onClaim,
}: {
  wishes: Wish[];
  meId: AuthorId;
  reduced: boolean | null;
  onClaim: (w: Wish) => void;
}) {
  const partnerWish = useMemo(
    () => wishes.find((w) => statusOf(w) === "open" && w.wisherId !== meId) ?? null,
    [wishes, meId],
  );
  const myOpen = useMemo(
    () => wishes.find((w) => statusOf(w) === "open" && w.wisherId === meId) ?? null,
    [wishes, meId],
  );
  const allDone = !partnerWish && !myOpen;

  const partnerName = meId === "dima" ? "Аня" : "Дима";

  return (
    <div className={styles.hero} role="group" aria-label="Подсказка">
      <span className={styles.heroMedallion} aria-hidden>
        <GiftIcon className={styles.heroIcon} />
      </span>

      <div className={styles.heroBody}>
        <span className={styles.heroEyebrow}>
          {partnerWish ? "Можно подарить" : allDone ? "Всё сбывается" : "Ожидание"}
        </span>
        <h2 className={styles.heroTitle}>
          {partnerWish ? (
            <>«{partnerWish.title}» — мечта {partnerName}</>
          ) : allDone ? (
            "Все мечты в работе или уже исполнились"
          ) : (
            <>«{myOpen!.title}» ждёт подарка</>
          )}
        </h2>
        <p className={styles.heroDesc}>
          {partnerWish
            ? `Возьми эту мечту в подарок — ${partnerName} не узнает, кто готовит`
            : allDone
              ? "Вы прекрасная пара — мечты сбываются сами"
              : "Скоро кто-то возьмётся за исполнение"}
        </p>
      </div>

      <div className={styles.heroRight}>
        {partnerWish ? (
          <motion.button
            type="button"
            onClick={() => onClaim(partnerWish)}
            initial={reduced ? undefined : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25, duration: 0.4, ease: "easeOut" }}
            className={styles.heroChip}
          >
            <CheckIcon className={styles.heroChipIcon} />
            Исполнилось
          </motion.button>
        ) : (
          <motion.span
            className={cn(styles.heroChip, styles.heroChipGhost)}
            initial={reduced ? undefined : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25, duration: 0.4, ease: "easeOut" }}
          >
            <SparklesIcon className={styles.heroChipIcon} />
            {allDone ? "Сбылось" : "Ожидание"}
          </motion.span>
        )}
      </div>
    </div>
  );
}

/** Карточка желания: статус, мечта, описание и действия по роли. */
function WishCard({
  wish,
  meId,
  reduced,
  onClaim,
  onUnclaim,
  onFulfill,
  onRemove,
}: {
  wish: Wish;
  meId: AuthorId;
  reduced: boolean | null;
  onClaim: (w: Wish) => void;
  onUnclaim: (w: Wish) => void;
  onFulfill: (w: Wish) => void;
  onRemove: (w: Wish) => void;
}) {
  const status = statusOf(wish);
  const Icon = STATUS_ICON[status];
  const isWisher = wish.wisherId === meId;
  const isClaimer = wish.claimerId === meId;
  const wisherName = PERSON_NAME[wish.wisherId] ?? wish.wisherId;

  // Удалять можно только своё пользовательское желание (seed-мечты целы).
  const canDelete = wish.id.startsWith("wsh-") && (wish.createdBy === meId || isWisher);

  // Кто добавил желание (только для пользовательских).
  const who = wish.createdBy
    ? `Добавил${wish.createdBy === "anya" ? "а" : ""} ${PERSON_NAME[wish.createdBy] ?? wish.createdBy}`
    : null;

  // Бейдж статуса. У заклеймившего — «Ты даришь», у мечтателя имя скрыто.
  const badge =
    status === "open"
      ? "В списке"
      : status === "claimed"
        ? isClaimer
          ? "Ты даришь"
          : "Готовится"
        : "Подарено";

  // Статусная строка с анонимизацией заклеймившего.
  const statusNote =
    status === "claimed"
      ? isWisher
        ? "Кто-то готовит тебе подарок — секрет до конца"
        : "Ты готовишь — не раскрывай себя"
      : status === "fulfilled"
        ? "Мечта сбылась"
        : null;

  // Действия по роли и статусу.
  let actions: React.ReactNode = null;
  if (status === "open" && !isWisher) {
    actions = (
      <motion.button
        type="button"
        whileTap={reduced ? undefined : { scale: 0.96 }}
        onClick={() => onClaim(wish)}
        className={cn(styles.actionBtn, styles.actionPrimary)}
      >
        <CheckIcon className={styles.actionIcon} />
        Исполнилось
      </motion.button>
    );
  } else if (status === "claimed" && isClaimer) {
    actions = (
      <>
        <button
          type="button"
          onClick={() => onUnclaim(wish)}
          className={cn(styles.actionBtn, styles.actionGhost)}
        >
          Вернуть
        </button>
        <motion.button
          type="button"
          whileTap={reduced ? undefined : { scale: 0.96 }}
          onClick={() => onFulfill(wish)}
          className={cn(styles.actionBtn, styles.actionPrimary)}
        >
          <CheckIcon className={styles.actionIcon} />
          Подарено
        </motion.button>
      </>
    );
  } else if (status === "claimed" && isWisher) {
    actions = (
      <button
        type="button"
        onClick={() => onFulfill(wish)}
        className={cn(styles.actionBtn, styles.actionGhost)}
      >
        <CheckIcon className={styles.actionIcon} />
        Уже получил
      </button>
    );
  }

  return (
    <article
      className={cn(styles.card, status === "fulfilled" && styles.cardDone)}
      aria-label={`${wish.title} — мечта ${wisherName}`}
    >
      <span className={styles.cardTop}>
        <span
          className={cn(styles.cardMedallion, status === "fulfilled" && styles.cardMedallionDone)}
          aria-hidden
        >
          <Icon className={styles.cardIcon} />
        </span>

        <span className={styles.cardTopRight}>
          <span className={styles.cardBadge}>{badge}</span>
          {canDelete && (
            <button
              type="button"
              onClick={() => onRemove(wish)}
              className={styles.cardTrash}
              aria-label={`Удалить желание «${wish.title}»`}
            >
              <TrashIcon className={styles.cardTrashIcon} />
            </button>
          )}
        </span>
      </span>

      <h3 className={styles.cardTitle}>{wish.title}</h3>
      {wish.description && <p className={styles.cardDesc}>{wish.description}</p>}

      {statusNote && <p className={styles.cardStatus}>{statusNote}</p>}

      {actions && (
        <span className={styles.cardActions} role="group" aria-label="Действия с желанием">
          {actions}
        </span>
      )}

      <span className={styles.cardFooter}>
        <span className={styles.cardWho}>Мечта {wisherName}</span>
        {who && <span className={styles.cardWho}>{who}</span>}
      </span>
    </article>
  );
}
