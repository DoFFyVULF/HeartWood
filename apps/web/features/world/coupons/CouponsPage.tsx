"use client";

import { useCallback, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useGender } from "@/lib/theme";
import { coupleProfile, findPersonByGender } from "@/features/world/profile/couple";
import { useHearts } from "@/features/world/hearts/useHearts";
import { HeartsHistoryModal } from "@/features/world/hearts/HeartsHistoryModal";
import { useCoupons, type NewCouponInput } from "./useCoupons";
import type { AuthorId, Coupon } from "@/lib/data/coupons";
import { CouponConfirm } from "./CouponConfirm";
import { CouponComposer } from "./CouponComposer";
import { CouponSendDialog } from "./CouponSendDialog";
import { CheckIcon, HeartIcon, PlaneIcon, PlusIcon, TicketIcon } from "./icons";
import { couponNumber } from "./number";
import styles from "./CouponsPage.module.css";

/**
 * Страница «Купоны» — купонная книжка пары + личные черновики.
 *
 * Две вкладки со скользящей пилюлей (layoutId): «Книжка» — активные и
 * погашенные купоны, «Черновики» — созданные, но ещё не отправленные. Кнопка
 * «Создать» открывает CouponComposer (название, описание, цена, эмодзи);
 * черновик можно отправить партнёру (CouponSendDialog) или удалить.
 *
 * Выкуп: по тапу на активный купон — CouponConfirm. Цена списывается из
 * ЛИЧНЫХ сердечек выкупающего и сгорает (см. docs/hearts-economy.md). Если
 * баланса не хватает, подтверждение недоступно.
 *
 * Карточки — «билеты» с корешком и перфорацией: слева цветной корешок
 * (акцент темы), в нём номер купона в типографике; справа основная часть.
 * Вся гамма — из токенов темы (--hwd-primary-*), перекрашивается по гендеру.
 */

// Стаггер на первичный вход — купоны всплывают каскадом снизу.
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

type Tab = "book" | "drafts";

export function CouponsPage() {
  const reduced = useReducedMotion();
  const { gender } = useGender();

  // «Я» — тот, чей мир сейчас в цвете; его сердечки платят за выкуп.
  const me = findPersonByGender(gender);
  const partner = coupleProfile.members.find((m) => m.id !== me.id) ?? me;

  const { coupons, create, send, remove, redeem } = useCoupons();
  const { balance, history, spend } = useHearts(me.id);

  const [tab, setTab] = useState<Tab>("book");
  const [pending, setPending] = useState<Coupon | null>(null); // подтверждение выкупа
  const [sending, setSending] = useState<Coupon | null>(null); // отправка черновика
  const [composing, setComposing] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const drafts = coupons.filter((c) => c.status === "draft");
  const book = coupons.filter((c) => c.status !== "draft");
  const activeCount = book.filter((c) => c.status === "active").length;
  const redeemedCount = book.length - activeCount;

  /**
   * Гасит активный купон: списывает цену из сердечек «я» (сгорают), затем
   * помечает купон погашенным. True, если выкуп произошёл.
   */
  const handleRedeem = useCallback(
    (coupon: Coupon): boolean => {
      if (balance < coupon.price) return false;
      const ok = spend(coupon.price, "coupon_redeem", coupon.title);
      if (!ok) return false;
      return redeem(coupon.id, me.id as AuthorId);
    },
    [balance, spend, redeem, me.id],
  );

  /** Создаёт черновик и переключает на вкладку «Черновики». */
  const handleCreate = useCallback(
    (input: NewCouponInput): boolean => {
      const created = create(input, me.id as AuthorId);
      if (!created) return false;
      setComposing(false);
      setTab("drafts");
      return true;
    },
    [create, me.id],
  );

  /** Отправляет черновик партнёру (draft → active). */
  const handleSend = useCallback(
    (coupon: Coupon): boolean => send(coupon.id, partner.id as AuthorId),
    [send, partner.id],
  );

  const openConfirm = useCallback((coupon: Coupon) => setPending(coupon), []);
  const closeConfirm = useCallback(() => setPending(null), []);
  const openSend = useCallback((coupon: Coupon) => setSending(coupon), []);
  const closeSend = useCallback(() => setSending(null), []);

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div
          className={`${styles.eyebrow} ${styles.entranceRise}`}
          style={{ animationDelay: "0.05s" }}
        >
          <span className={styles.eyebrowDot} aria-hidden />
          Купонная книжка
        </div>

        <h1
          className={`${styles.title} ${styles.entranceRise}`}
          style={{ animationDelay: "0.1s" }}
        >
          Наши купоны
        </h1>

        <p
          className={`${styles.subtitle} ${styles.entranceRise}`}
          style={{ animationDelay: "0.15s" }}
        >
          Обещания в долг — погасить можно в любой момент
        </p>

        {/* Сводка: активные / погашено / личный баланс (кликабельный). */}
        <div className={styles.summary} role="list" aria-label="Купоны в книжке">
          <div className={styles.summaryItem} role="listitem">
            <span className={styles.summaryIcon} aria-hidden>
              <TicketIcon className={styles.summarySvg} />
            </span>
            <span className={styles.summaryBody}>
              <strong className={styles.summaryNum}>{activeCount}</strong>
              <span className={styles.summaryLabel}>активных</span>
            </span>
          </div>
          <div className={styles.summaryItem} role="listitem">
            <span className={styles.summaryIcon} aria-hidden>
              <CheckIcon className={styles.summarySvg} />
            </span>
            <span className={styles.summaryBody}>
              <strong className={styles.summaryNum}>{redeemedCount}</strong>
              <span className={styles.summaryLabel}>погашено</span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className={cn(styles.summaryItem, styles.balanceItem)}
            role="listitem"
            aria-label={`У меня ${balance} сердечек. Открыть историю за 30 дней`}
          >
            <span className={styles.summaryIcon} aria-hidden>
              <HeartIcon className={styles.summarySvg} />
            </span>
            <span className={styles.summaryBody}>
              <strong className={styles.summaryNum}>{balance}</strong>
              <span className={styles.summaryLabel}>у меня</span>
            </span>
          </button>
        </div>

        <div
          className={`${styles.divider} ${styles.entranceStretch}`}
          style={{ animationDelay: "0.3s" }}
          aria-hidden
        />
      </header>

      {/* Вкладки + создание */}
      <div className={styles.toolbar}>
        <div className={styles.tabs} role="tablist" aria-label="Разделы купонов">
          {(
            [
              { id: "book" as const, label: "Книжка", count: book.length },
              { id: "drafts" as const, label: "Черновики", count: drafts.length },
            ]
          ).map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                className={cn(styles.tab, active && styles.tabActive)}
              >
                {active && (
                  <motion.span
                    aria-hidden
                    layoutId="coupons-tab-pill"
                    className={styles.tabPill}
                    transition={
                      reduced ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 32 }
                    }
                  />
                )}
                <span className={styles.tabLabel}>{t.label}</span>
                {t.id === "drafts" && drafts.length > 0 && (
                  <span className={styles.tabCount}>{drafts.length}</span>
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setComposing(true)}
          className={styles.addBtn}
          aria-label="Создать купон"
        >
          <PlusIcon className={styles.addIcon} />
          <span className={styles.addLabel}>Создать</span>
        </button>
      </div>

      {/* Контент вкладки */}
      {tab === "book" ? (
        <>
          <motion.ul
            className={styles.grid}
            variants={gridVariants}
            initial={reduced ? false : "hidden"}
            animate="show"
            aria-label="Купоны пары"
          >
            {book.map((coupon) => (
              <motion.li
                key={coupon.id}
                layout
                variants={itemVariants}
                className={styles.gridItem}
              >
                <CouponCard coupon={coupon} onOpen={() => openConfirm(coupon)} />
              </motion.li>
            ))}
          </motion.ul>

          <p className={styles.footnote}>
            Сгорают только от обиды. Лучше не проверять
          </p>
        </>
      ) : (
        <>
          {drafts.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyBadge} aria-hidden>
                <TicketIcon className={styles.emptyIcon} />
              </span>
              <p className={styles.emptyTitle}>Черновиков пока нет</p>
              <p className={styles.emptySub}>
                Нажмите «Создать», придумайте обещание — и отправьте его своей
                половинке
              </p>
              <button
                type="button"
                onClick={() => setComposing(true)}
                className={styles.emptyBtn}
              >
                <PlusIcon className={styles.emptyBtnIcon} />
                Первый купон
              </button>
            </div>
          ) : (
            <motion.ul
              className={styles.grid}
              variants={gridVariants}
              initial={reduced ? false : "hidden"}
              animate="show"
              aria-label="Черновики купонов"
            >
              {drafts.map((coupon) => (
                <motion.li
                  key={coupon.id}
                  layout
                  variants={itemVariants}
                  className={styles.gridItem}
                >
                  <DraftCard
                    coupon={coupon}
                    partnerName={partner.name}
                    onSend={() => openSend(coupon)}
                    onDelete={() => remove(coupon.id)}
                  />
                </motion.li>
              ))}
            </motion.ul>
          )}
        </>
      )}

      {/* Подтверждение выкупа */}
      {pending && (
        <CouponConfirm
          coupon={pending}
          canAfford={balance >= pending.price}
          onClose={closeConfirm}
          onConfirm={() => handleRedeem(pending)}
        />
      )}

      {/* Отправка черновика */}
      {sending && (
        <CouponSendDialog
          coupon={sending}
          to={partner.id as AuthorId}
          onSend={() => handleSend(sending)}
          onClose={closeSend}
        />
      )}

      {/* Создание купона */}
      {composing && (
        <CouponComposer
          onCreate={handleCreate}
          onClose={() => setComposing(false)}
        />
      )}

      {/* История сердечек — переиспользуется из профиля */}
      {historyOpen && (
        <HeartsHistoryModal
          balance={balance}
          history={history}
          onClose={() => setHistoryOpen(false)}
        />
      )}
    </div>
  );
}

/** Билет-карточка купона: активный — кнопка, открывающая выкуп. */
function CouponCard({ coupon, onOpen }: { coupon: Coupon; onOpen: () => void }) {
  const reduced = useReducedMotion();
  const isActive = coupon.status === "active";
  const payerName = coupon.redeemedBy === "dima" ? "Дима" : "Аня";
  const className = cn(
    styles.card,
    isActive ? styles.cardActive : styles.cardRedeemed,
  );

  const content = (
    <>
      {/* Корешок: цветной акцент + номер купона, справа — перфорация. */}
      <span
        className={cn(styles.stub, !isActive && styles.stubRedeemed)}
        aria-hidden
      >
        <TicketIcon className={styles.stubIcon} />
        <span className={styles.stubNo}>№ {couponNumber(coupon.id)}</span>
      </span>

      <span className={styles.cardBody}>
        <span className={styles.cardTop}>
          <span className={styles.cardEmoji} aria-hidden>
            {coupon.emoji}
          </span>
          {isActive && coupon.price > 0 ? (
            <span className={styles.cardPrice} aria-hidden>
              <HeartIcon className={styles.priceHeart} />
              {coupon.price}
            </span>
          ) : (
            !isActive && (
              <span className={styles.cardDone} aria-hidden>
                <CheckIcon className={styles.cardDoneIcon} />
                Погашено
              </span>
            )
          )}
        </span>
        <span className={styles.cardTitle}>{coupon.title}</span>
        <p className={styles.cardDesc}>{coupon.description}</p>
        <span className={styles.cardFooter}>
          {isActive ? (
            <span className={styles.cardHint}>
              {coupon.price > 0 ? (
                <>
                  Выкупить за
                  <HeartIcon className={styles.hintHeart} />
                  {coupon.price}
                </>
              ) : (
                "Нажми, чтобы использовать"
              )}
            </span>
          ) : (
            <span className={styles.cardUsed}>
              Погашен {coupon.redeemedAt} · {payerName}
            </span>
          )}
        </span>
      </span>
    </>
  );

  if (!isActive) {
    return <div className={className}>{content}</div>;
  }

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      whileTap={reduced ? undefined : { scale: 0.97 }}
      whileHover={reduced ? undefined : { y: -4 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      aria-label={`Выкупить купон «${coupon.title}» за ${coupon.price} сердечек`}
      className={className}
    >
      {content}
    </motion.button>
  );
}

/** Карточка черновика: ещё не отправлен — можно отправить или удалить. */
function DraftCard({
  coupon,
  partnerName,
  onSend,
  onDelete,
}: {
  coupon: Coupon;
  partnerName: string;
  onSend: () => void;
  onDelete: () => void;
}) {
  const reduced = useReducedMotion();

  return (
    <div className={cn(styles.card, styles.cardDraft)}>
      <span className={cn(styles.stub, styles.stubDraft)} aria-hidden>
        <TicketIcon className={styles.stubIcon} />
        <span className={styles.stubNo}>№ {couponNumber(coupon.id)}</span>
      </span>

      <div className={styles.cardBody}>
        <div className={styles.cardTop}>
          <span className={styles.cardEmoji} aria-hidden>
            {coupon.emoji}
          </span>
          <span className={styles.draftBadge}>Черновик</span>
        </div>
        <h3 className={styles.cardTitle}>{coupon.title}</h3>
        <p className={styles.cardDesc}>{coupon.description}</p>
        <div className={styles.draftPrice} aria-hidden>
          <HeartIcon className={styles.draftPriceHeart} />
          {coupon.price} при выкупе
        </div>
        <div className={styles.draftActions}>
          <button
            type="button"
            onClick={onDelete}
            className={styles.draftDelete}
            aria-label={`Удалить черновик «${coupon.title}»`}
          >
            Удалить
          </button>
          <motion.button
            type="button"
            onClick={onSend}
            whileTap={reduced ? undefined : { scale: 0.96 }}
            whileHover={reduced ? undefined : { y: -2 }}
            className={styles.draftSend}
          >
            <PlaneIcon className={styles.draftSendIcon} />
            Отправить {partnerName}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
