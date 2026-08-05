"use client";

import { useMemo } from "react";
import { DateStats } from "./DateStats";
import { LetterComposer, type LetterData } from "./LetterComposer";
import { envelopeOptions, type EnvelopeOption } from "./envelope";
import { useDates, useCouple, useLetters } from "@/lib/api-data";
import styles from "./DatesPage.module.css";

function sealEmoji(key: string): string {
  const opts = envelopeOptions("seal") as EnvelopeOption[];
  return opts.find((o) => o.key === key)?.emoji ?? "💌";
}

/** Иконки для quick-stats — чтобы пилюли выглядели «живыми». */
const QUICK_STAT_ICONS: Record<string, string> = {
  "свиданий": "💕",
  "часов вместе": "⏱️",
  "приглашений": "💌",
};

/** Грустная плашка, пока вторая половинка не вступила по коду. */
function NoPartnerCard() {
  return (
    <div className={styles.noPartnerCard}>
      <span className={styles.noPartnerEmoji} aria-hidden>
        🥺
      </span>
      <h2 className={styles.noPartnerTitle}>Половинка ещё не рядом</h2>
      <p className={styles.noPartnerText}>
        Когда она вступит по коду — письма и приглашения заработают.
      </p>
    </div>
  );
}

export function DatesPage() {
  const { data } = useDates();
  const couple = useCouple().data;
  const letters = useLetters();

  // Половинка привязана, если в паре два участника. Пока её нет — студия
  // письма и история скрыты, вместо них грустная плашка.
  const hasPartner = (couple?.couple.members.length ?? 0) >= 2;

  // «Отправленные письма» — это исходящие (incoming=false) из почты пары.
  const sent = useMemo(
    () =>
      (letters.data ?? [])
        .filter((l) => !l.incoming)
        .map((l) => ({
          id: l.id,
          to: l.recipient.name,
          from: l.sender.name,
          message: l.message,
          ps: l.ps ?? "",
          paper: l.paper,
          seal: l.seal,
          stamp: l.stamp,
          sentAt: new Date(l.createdAt),
        })),
    [letters.data],
  );

  // Отправка через API: письмо улетает в почту партнёра, кэш обновляется.
  const handleSend = async (_data: LetterData): Promise<boolean> => {
    return letters.send({
      message: _data.message,
      ps: _data.ps || undefined,
      paper: _data.paper,
      seal: _data.seal,
      stamp: _data.stamp,
    });
  };

  const invited = data
    ? Object.values(data.inviteScore).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerRow}>
          <div>
            <div className={`${styles.eyebrow} ${styles.entranceRise}`}>
              <span className={styles.eyebrowDot} aria-hidden />
              Календарь любви
            </div>
            <div className={styles.titleWrap}>
            </div>
            <p
              className={`${styles.subtitle} ${styles.entranceRise}`}
              style={{ animationDelay: "0.1s" }}
            >
              Каждое свидание — новая глава вашей истории
            </p>
          </div>

          <div
            className={`${styles.quickStats} ${styles.entrancePop}`}
            style={{ animationDelay: "0.2s" }}
          >
            {[
              { value: data ? String(data.total) : "—", label: "свиданий" },
              { value: data ? String(data.hoursTogether) : "—", label: "часов вместе" },
              { value: data ? String(invited) : "—", label: "приглашений" },
            ].map((s) => (
              <span key={s.label} className={styles.quickStat}>
                <span className={styles.quickStatIcon} aria-hidden>
                  {QUICK_STAT_ICONS[s.label] ?? "💕"}
                </span>
                <span className={styles.quickStatBody}>
                  <strong className={styles.quickStatVal}>{s.value}</strong>
                  <small className={styles.quickStatLbl}>{s.label}</small>
                </span>
              </span>
            ))}
          </div>
        </div>

        <div
          className={`${styles.divider} ${styles.entranceStretch}`}
          style={{ animationDelay: "0.3s" }}
          aria-hidden
        />
      </header>

      {/* Stats */}
      <section className={styles.entranceRise} style={{ animationDelay: "0.2s" }}>
        <DateStats />
      </section>

      {/* Письмо. Пока половинки нет — грустная плашка вместо студии. */}
      {!hasPartner ? (
        <NoPartnerCard />
      ) : (
        <section
          className={`${styles.composerSection} ${styles.entranceRise}`}
          style={{ animationDelay: "0.3s" }}
          aria-label="Студия письма"
        >
          <LetterComposer onSend={handleSend} />
        </section>
      )}

      {/* History */}
      {hasPartner && sent.length > 0 && (
        <section className={styles.entranceRise} aria-label="Отправленные приглашения">
          <h2 className={styles.historyTitle}>
            <span className={styles.historyTitleIcon} aria-hidden>📬</span>
            <span className={styles.historyTitleText}>Отправленные письма</span>
          </h2>
          <ul className={styles.historyList}>
            {sent.slice(-5).reverse().map((inv, i) => (
              <li
                key={inv.id}
                className={styles.historyItem}
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <span className={styles.historyEmoji} aria-hidden>
                  {sealEmoji(inv.seal)}
                </span>
                <div className={styles.historyInfo}>
                  <span className={styles.historyTo}>Кому: {inv.to}</span>
                  <span className={styles.historyMeta}>
                    {new Date(inv.sentAt).toLocaleDateString("ru-RU", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}{" "}
                    ·{" "}
                    {new Date(inv.sentAt).toLocaleTimeString("ru-RU", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <span className={styles.historyCheck} aria-label="Отправлено">
                  ✓
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Ambient — три слоя с разной глубиной и скоростью */}
      <div className={styles.ambient} aria-hidden>
        {/* Дальний план — крупные, медленные, размытые */}
        <span className={styles.ambientFar} style={{ top: "12%", left: "6%",  animationDelay: "0s" }}>💕</span>
        <span className={styles.ambientFar} style={{ top: "68%", right: "8%", animationDelay: "4s" }}>🌹</span>

        {/* Средний план */}
        <span className={styles.ambientMid} style={{ top: "28%", right: "5%",  animationDelay: "1.5s" }}>✨</span>
        <span className={styles.ambientMid} style={{ top: "55%", left: "3%",   animationDelay: "3s" }}>💌</span>
        <span className={styles.ambientMid} style={{ top: "82%", right: "14%", animationDelay: "5.5s" }}>🥂</span>

        {/* Ближний план — чёткие, быстрее */}
        <span className={styles.ambientNear} style={{ top: "40%", left: "7%",  animationDelay: "0.8s" }}>🌿</span>
        <span className={styles.ambientNear} style={{ top: "72%", left: "11%", animationDelay: "2.4s" }}>❀</span>
      </div>
    </div>
  );
}