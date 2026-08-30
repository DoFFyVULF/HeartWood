"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthProvider, useAuth } from "@/lib/auth";
import { GenderProvider, useGender } from "@/lib/theme";
import { MoodProvider } from "@/lib/mood";
import { AmbientBackground } from "@/components/AmbientBackground";
import { Logo } from "@/components/Logo";
import { WorldArt } from "@/features/auth/WorldArt";
import { Greeting } from "@/features/world/tree/Greeting";
import { OrbitalStage } from "@/features/world/tree/OrbitalStage";
import { RecentHistory } from "@/features/world/tree/RecentHistory";
import { StatsStrip } from "@/features/world/tree/StatsStrip";
import { WorldShell } from "@/features/world/WorldShell";
import {
  MemoryIcon,
  CouponIcon,
  StarIcon,
  DateIcon,
  HeartIcon,
  MoodIcon,
  SurpriseIcon,
  MessageIcon,
  LeafIcon,
} from "@/features/world/tree/components/icons";
import motion from "@/components/motion.module.css";
import { routes } from "@/routes";

// ——— Данные лендинга — в тон продукту: те же разделы, что в мире ———

const FEATURES = [
  {
    icon: MemoryIcon,
    accent: "from-violet-500/20 to-fuchsia-500/20",
    title: "Воспоминания",
    desc: "Сохраняйте моменты с фото, историей и датой. Каждый — новая веточка на дереве.",
    hint: "💌 с медиа в IndexedDB",
  },
  {
    icon: DateIcon,
    accent: "from-sky-500/20 to-indigo-500/20",
    title: "Свидания",
    desc: "Планируйте встречи, отмечайте любимые места и смотрите статистику вместе.",
    hint: "📅 8+ типов встреч",
  },
  {
    icon: CouponIcon,
    accent: "from-amber-500/20 to-orange-500/20",
    title: "Купоны",
    desc: "Создавайте нежные задания-купоны: «Завтрак в постель» — и дарите половинке.",
    hint: "🎫 draft → active → redeemed",
  },
  {
    icon: StarIcon,
    accent: "from-emerald-500/20 to-teal-500/20",
    title: "Цели и копилки",
    desc: "Копите вместе на поездку, дом или праздник. Прогресс и вехи — на виду.",
    hint: "⭐ 3 вида целей",
  },
  {
    icon: MessageIcon,
    accent: "from-rose-500/20 to-pink-500/20",
    title: "Письма от руки",
    desc: "Студия письма: бумага, печать и сургуч. Письма попадают в общую почту.",
    hint: "✉️ бумага · печать · постскриптум",
  },
  {
    icon: SurpriseIcon,
    accent: "from-violet-500/20 to-indigo-500/20",
    title: "Список желаний",
    desc: "Загадывайте, бронируйте и исполняйте мечты друг друга.",
    hint: "🎁 claim → fulfill",
  },
  {
    icon: LeafIcon,
    accent: "from-green-500/20 to-emerald-500/20",
    title: "Живое дерево",
    desc: "6 стадий роста от семечка до сакуры. Сезон, время суток и погода — живые.",
    hint: "🌳 0 → 5 уровень",
  },
  {
    icon: HeartIcon,
    accent: "from-pink-500/20 to-rose-500/20",
    title: "Сердечки и серия",
    desc: "Получайте сердечки за действия, держите огненную серию дней без пропусков.",
    hint: "🔥 streak + daily",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Создайте мир",
    text: "Придумайте название пары — это имя вашего общего сада. Выберите, чей это мир, и палитра оживёт.",
  },
  {
    n: "02",
    title: "Позовите половинку",
    text: "Поделитесь кодом пары. Когда партнёр вступит, семечко появится и начнётся рост.",
  },
  {
    n: "03",
    title: "Растите вместе",
    text: "Каждое свидание, письмо и купон дают очки. Дерево меняет вид, сезон и погоду.",
  },
];

const TESTIMONIALS = [
  {
    name: "Аня и Лёва",
    role: "127 дней вместе · Москва",
    quote: "Дерево стало нашим ритуалом. Каждый вечер отмечаем, поливаем — и оно реально растёт!",
    avatar: "🌸",
  },
  {
    name: "Маша и Кирилл",
    role: "8 месяцев · Берлин",
    quote: "Купоны спасли быт — «Массаж 15 мин» и «Завтрак в постель» теперь на вес золота.",
    avatar: "💙",
  },
  {
    name: "Соня и Даня",
    role: "2 года · Тбилиси",
    quote: "Письма от руки — самое тёплое. Открываешь конверт и слышишь голос любимого.",
    avatar: "💌",
  },
];

// ——— Вспомогательные SVG иконки для лендинга (стрелки, галочки, декоратив) ———

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}
function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}
function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="M12 0l1.6 7.4L21 9l-7.4 1.6L12 18l-1.6-7.4L3 9l7.4-1.6L12 0z" />
    </svg>
  );
}

// ——— Header лендинга — стеклянная шапка ———

function LandingHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-white/50 bg-white/60 backdrop-blur-xl">
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,var(--hwd-primary)_30%,var(--hwd-primary-deep)_70%,transparent)] opacity-60" aria-hidden />
      <div className="mx-auto flex h-[68px] max-w-[1280px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
        <Link href={routes.home.path} aria-label="HeartWood — на главную" className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--hwd-glow)">
          <Logo />
        </Link>

        <nav aria-label="Разделы" className="hidden items-center gap-1 rounded-full border border-white/70 bg-white/55 p-1.5 backdrop-blur-md lg:flex">
          <a href="#features" className="rounded-full px-4 py-1.5 text-sm font-extrabold text-(--hwd-ink-soft) transition hover:text-(--hwd-ink) focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--hwd-glow)">
            Возможности
          </a>
          <a href="#tree" className="rounded-full px-4 py-1.5 text-sm font-extrabold text-(--hwd-ink-soft) transition hover:text-(--hwd-ink) focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--hwd-glow)">
            Дерево
          </a>
          <a href="#how" className="rounded-full px-4 py-1.5 text-sm font-extrabold text-(--hwd-ink-soft) transition hover:text-(--hwd-ink) focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--hwd-glow)">
            Как это работает
          </a>
        </nav>

        <div className="hidden items-center gap-2 sm:flex">
          <Link
            href={routes.login.path}
            className="rounded-full px-4 py-2 text-sm font-extrabold text-(--hwd-ink) transition hover:bg-white/70 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--hwd-glow)"
          >
            Войти
          </Link>
          <Link
            href={routes.register.path}
            className="inline-flex items-center gap-2 rounded-full bg-(--hwd-primary) px-5 py-2.5 text-sm font-black text-white shadow-[0_10px_24px_-12px_var(--hwd-glow),0_4px_12px_-6px_var(--hwd-glow)] transition hover:translate-y-[-1px] hover:bg-(--hwd-primary-deep) focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--hwd-glow)"
          >
            Создать мир <ArrowIcon className="size-4" />
          </Link>
        </div>

        <button
          type="button"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex size-10 items-center justify-center rounded-full border border-white/70 bg-white/70 text-(--hwd-ink) backdrop-blur-md transition hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--hwd-glow) lg:hidden"
        >
          <span className="sr-only">{open ? "Закрыть меню" : "Открыть меню"}</span>
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {open && (
        <div id="mobile-nav" className="border-t border-white/60 bg-white/70 px-5 py-4 backdrop-blur-xl sm:px-8 lg:hidden">
          <div className="flex flex-col gap-2">
            <a onClick={() => setOpen(false)} href="#features" className="rounded-2xl px-4 py-3 text-sm font-extrabold text-(--hwd-ink) hover:bg-white/80">
              Возможности
            </a>
            <a onClick={() => setOpen(false)} href="#tree" className="rounded-2xl px-4 py-3 text-sm font-extrabold text-(--hwd-ink) hover:bg-white/80">
              Дерево
            </a>
            <a onClick={() => setOpen(false)} href="#how" className="rounded-2xl px-4 py-3 text-sm font-extrabold text-(--hwd-ink) hover:bg-white/80">
              Как это работает
            </a>
            <div className="mt-2 flex gap-2">
              <Link href={routes.login.path} className="flex-1 rounded-full border border-(--hwd-primary)/20 bg-white px-4 py-3 text-center text-sm font-black text-(--hwd-ink)">
                Войти
              </Link>
              <Link href={routes.register.path} className="flex-1 rounded-full bg-(--hwd-primary) px-4 py-3 text-center text-sm font-black text-white">
                Создать мир
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

// ——— Hero — минимал, editorial: воздух, типографика, одно сердце ———

function Hero() {
  return (
    <section className="relative">
      {/* Тонкий верхный градиент-луч, как в шапке мира */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(70%_60%_at_50%_0%,rgba(255,255,255,0.9),transparent_65%)]" />
      <div className="relative mx-auto flex max-w-[760px] flex-col items-center px-5 pb-10 pt-10 text-center sm:px-8 sm:pb-12 sm:pt-14">
        {/* Сердце — лёгкий ореол */}
        <div className="relative">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 scale-[1.35] rounded-full bg-[radial-gradient(circle_at_50%_50%,var(--hwd-glow)_0%,transparent_62%)] opacity-70 blur-2xl"
          />
          <div className={`${motion.float} scale-[0.9] sm:scale-100`}>
            <WorldArt />
          </div>
          {/* Единственная пилюля под сердцем — как в AuthShell */}
          <div className="absolute -bottom-1 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-white/80 bg-white/90 px-4 py-2 shadow-[0_12px_28px_-14px_rgba(0,0,0,0.18)] backdrop-blur-md">
            <span aria-hidden className="text-sm">🔥</span>
            <span className="text-xs font-black tracking-wide text-(--hwd-ink)">уже 127 дней</span>
            <span className="hidden text-[11px] font-bold text-(--hwd-ink-soft) sm:inline">· ваш мир растёт</span>
          </div>
        </div>

        <span className="mt-10 inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--hwd-primary)_18%,transparent)] bg-white/70 px-3.5 py-1 text-xs font-extrabold tracking-wide text-(--hwd-primary-deep) backdrop-blur-md">
          <span aria-hidden className="size-1.5 rounded-full bg-(--hwd-primary) shadow-[0_0_8px_var(--hwd-glow)]" />
          Живой мир для вашей пары
        </span>

        <h1 className="mt-4 max-w-[18ch] text-balance text-[2.45rem] font-black leading-[0.9] tracking-tight text-(--hwd-ink) sm:text-[3rem] lg:text-[3.35rem]">
          Ваш мир <span className="bg-[linear-gradient(90deg,var(--hwd-primary),var(--hwd-primary-deep))] bg-clip-text text-transparent">растёт</span>
          <br />
          вместе с вами
          <span className="mt-1 block font-[var(--font-caveat)] text-[1.05em] font-bold leading-none text-(--hwd-primary-deep)">— каждый день, по-чуть-чуть</span>
        </h1>

        <p className="mx-auto mt-4 max-w-[46ch] text-pretty text-[15px] font-semibold leading-relaxed text-(--hwd-ink-soft) sm:text-[16px]">
          Свидания, воспоминания, купоны, письма от руки и общее дерево — всё в одном уютном месте. Без ленты и шума. Только вы двое.
        </p>

        <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href={routes.register.path}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-(--hwd-primary) px-8 py-3.5 text-[15px] font-black text-white shadow-[0_16px_32px_-16px_var(--hwd-glow)] transition hover:translate-y-[-1px] hover:bg-(--hwd-primary-deep) focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--hwd-glow) sm:w-auto"
          >
            Создать ваш мир <ArrowIcon className="size-4" />
          </Link>
          <a
            href="#features"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/70 bg-white/70 px-7 py-3.5 text-sm font-extrabold text-(--hwd-ink) backdrop-blur-md transition hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--hwd-glow) sm:w-auto"
          >
            Посмотреть возможности
          </a>
        </div>

        <p className="mt-3 text-xs font-bold text-(--hwd-ink-soft)">Бесплатно · без рекламы · приватно для двоих · за 2 минуты</p>

        <div className="mt-7 flex items-center gap-3 rounded-full border border-white/70 bg-white/65 px-4 py-2.5 backdrop-blur-md">
          <span className="flex -space-x-2">
            <span className="flex size-7 items-center justify-center rounded-full border-2 border-white bg-violet-100 text-[13px]">🌸</span>
            <span className="flex size-7 items-center justify-center rounded-full border-2 border-white bg-sky-100 text-[13px]">💙</span>
            <span className="flex size-7 items-center justify-center rounded-full border-2 border-white bg-amber-100 text-[13px]">✨</span>
          </span>
          <span className="h-4 w-px bg-[color-mix(in_srgb,var(--hwd-ink-soft)_18%,transparent)]" aria-hidden />
          <span className="flex items-center gap-1.5 text-xs font-black text-(--hwd-ink)">
            <span className="text-amber-400">★★★★★</span> 4.9/5
            <span className="hidden text-[11px] font-bold text-(--hwd-ink-soft) sm:inline">— пары растят свой сад</span>
          </span>
        </div>
      </div>
    </section>
  );
}

// ——— Features ———

function Features() {
  return (
    <section id="features" className="mx-auto max-w-[1280px] px-5 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-2xl text-center">
        <p className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-black uppercase tracking-widest text-(--hwd-primary-deep) backdrop-blur-md">
          <SparkleIcon className="size-3.5" /> Возможности
        </p>
        <h2 className="mt-3 text-[2rem] font-black leading-tight tracking-tight text-(--hwd-ink) sm:text-[2.4rem]">
          Всё, что делает пару ближе — <span className="font-[var(--font-caveat)] text-[1.25em] font-bold text-(--hwd-primary-deep)">в одном мире</span>
        </h2>
        <p className="mx-auto mt-3 max-w-[48ch] text-sm font-semibold leading-relaxed text-(--hwd-ink-soft) sm:text-[15px]">
          Не соцсеть и не трекер. HeartWood — это уютный дом для ваших историй, ритуалов и маленьких сюрпризов.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f, i) => {
          const Icon = f.icon;
          return (
            <article
              key={f.title}
              className={`${motion.popIn} group relative overflow-hidden rounded-[1.7rem] border border-white/70 bg-white/65 p-5 backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/80 hover:shadow-[0_18px_40px_-22px_color-mix(in_srgb,var(--hwd-primary)_45%,transparent)] focus-within:ring-4 focus-within:ring-(--hwd-glow)`}
              style={{ animationDelay: `${0.05 + i * 0.04}s` }}
            >
              <div className={`absolute inset-0 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(255,255,255,0.9),transparent_55%)] opacity-0 transition group-hover:opacity-100`} aria-hidden />
              <div className={`absolute -right-10 -top-10 size-28 rounded-full bg-gradient-to-br ${f.accent} blur-2xl opacity-60`} aria-hidden />
              <span className="relative flex size-11 items-center justify-center rounded-2xl border border-white/70 bg-white text-(--hwd-primary-deep) shadow-sm">
                <Icon className="size-5" />
              </span>
              <h3 className="relative mt-4 text-[15px] font-black text-(--hwd-ink)">{f.title}</h3>
              <p className="relative mt-1.5 text-[13px] font-semibold leading-relaxed text-(--hwd-ink-soft)">{f.desc}</p>
              <p className="relative mt-3 inline-flex rounded-full bg-(--hwd-primary-soft)/70 px-2.5 py-1 text-[11px] font-bold text-(--hwd-primary-deep)">{f.hint}</p>
            </article>
          );
        })}
      </div>

      {/* доп строка — цифры */}
      <div className="mt-6 grid grid-cols-3 gap-3 rounded-[1.7rem] border border-white/70 bg-white/60 p-4 backdrop-blur-xl sm:grid-cols-6">
        {[
          { v: "8", l: "разделов" },
          { v: "6", l: "стадий дерева" },
          { v: "4", l: "сезона" },
          { v: "∞", l: "писем" },
          { v: "127", l: "дней серия" },
          { v: "2", l: "сердца = 1 мир" },
        ].map((s) => (
          <div key={s.l} className="text-center">
            <div className="text-xl font-black text-(--hwd-ink) sm:text-2xl">{s.v}</div>
            <div className="text-xs font-bold uppercase tracking-widest text-(--hwd-ink-soft)">{s.l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ——— Дерево ———

function TreeStory() {
  const levels = [
    { lvl: 0, name: "Семечко", emoji: "🌰", color: "bg-stone-100 text-stone-600", desc: "Начало. Ждёт вторую половинку." },
    { lvl: 1, name: "Росток", emoji: "🌱", color: "bg-green-100 text-green-700", desc: "Первые очки — первые листочки." },
    { lvl: 2, name: "Саженец", emoji: "🌿", color: "bg-emerald-100 text-emerald-700", desc: "Крепнет с каждым свиданием." },
    { lvl: 3, name: "Дерево", emoji: "🌳", color: "bg-green-100 text-green-800", desc: "Крона раскрывается." },
    { lvl: 4, name: "Цветение", emoji: "🌸", color: "bg-pink-100 text-pink-700", desc: "Плоды совместных целей." },
    { lvl: 5, name: "Сакура", emoji: "🌸", color: "bg-fuchsia-100 text-fuchsia-700", desc: "Вершина вашей истории." },
  ];
  return (
    <section id="tree" className="mx-auto max-w-[1280px] px-5 py-8 sm:px-8 lg:px-12">
      <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.85),rgba(255,255,255,0.6))] p-6 shadow-[0_18px_44px_-22px_rgba(30,27,60,0.25)] backdrop-blur-xl sm:p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-widest text-emerald-700">
              <LeafIcon className="size-3.5" /> Живое дерево
            </p>
            <h2 className="mt-3 text-[1.9rem] font-black leading-tight text-(--hwd-ink) sm:text-[2.2rem]">
              Растёт за <span className="bg-[linear-gradient(90deg,#16a34a,#059669)] bg-clip-text text-transparent">ваши действия</span>
            </h2>
            <p className="mt-3 max-w-[44ch] text-sm font-semibold leading-relaxed text-(--hwd-ink-soft)">
              Каждое свидание, письмо, купон и взнос в цель дают очки. Дерево меняет вид, а настроение партнёра меняет погоду: ясно, дождь, гроза, радуга или лунный свет.
            </p>

            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { icon: MoodIcon, label: "Сезоны", sub: "весна → зима" },
                { icon: HeartIcon, label: "Погода", sub: "от настроения" },
                { icon: StarIcon, label: "Время", sub: "рассвет · день · вечер · ночь" },
              ].map((b) => {
                const I = b.icon;
                return (
                  <div key={b.label} className="rounded-2xl border border-white/70 bg-white/70 px-3 py-3 text-center backdrop-blur-md">
                    <span className="mx-auto flex size-8 items-center justify-center rounded-xl bg-(--hwd-primary-soft) text-(--hwd-primary-deep)">
                      <I className="size-4" />
                    </span>
                    <div className="mt-2 text-xs font-black text-(--hwd-ink)">{b.label}</div>
                    <div className="text-[11px] font-bold text-(--hwd-ink-soft)">{b.sub}</div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-(--hwd-ink-soft)">+1 за свидание</span>
              <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-(--hwd-ink-soft)">+1 за купон</span>
              <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-(--hwd-ink-soft)">+2 за письмо</span>
              <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-(--hwd-ink-soft)">+1 за желание</span>
            </div>
          </div>

          <div className="relative">
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6 lg:grid-cols-3">
              {levels.map((l) => (
                <div key={l.lvl} className="rounded-2xl border border-white/70 bg-white/80 p-3 text-center backdrop-blur-md">
                  <div className={`mx-auto flex size-10 items-center justify-center rounded-xl text-lg ${l.color}`}>{l.emoji}</div>
                  <div className="mt-2 text-xs font-black text-(--hwd-ink)">{l.name}</div>
                  <div className="text-[11px] font-bold text-(--hwd-ink-soft)">{l.desc}</div>
                  <div className="mt-1 text-[10px] font-black uppercase tracking-widest text-(--hwd-ink-soft)/70">ур. {l.lvl}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-2xl bg-(--hwd-primary) p-4 text-white shadow-lg">
              <div className="flex items-center gap-2 text-sm font-black">
                <SparkleIcon className="size-4" /> До сакуры — всего 5 уровней
              </div>
              <p className="mt-1 text-xs font-semibold leading-relaxed text-white/85">
                Прогресс внутри уровня — полоска под деревом. Чем больше вы вместе, тем пышнее крона и ярче свечение.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ——— Как работает ———

function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-[1280px] px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-[2rem] font-black tracking-tight text-(--hwd-ink) sm:text-[2.2rem]">Как это работает</h2>
        <p className="mt-2 text-sm font-semibold text-(--hwd-ink-soft)">Три шага — и ваш мир уже живёт. Дальше — только добавлять истории.</p>
      </div>
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {STEPS.map((s, i) => (
          <div key={s.n} className="relative rounded-[1.7rem] border border-white/70 bg-white/70 p-6 backdrop-blur-xl">
            <div className="flex items-start justify-between">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-(--hwd-primary) text-sm font-black text-white shadow-md">{s.n}</span>
              {i < 2 && <span className="hidden text-(--hwd-ink-soft) lg:block"><ArrowIcon className="size-5 translate-y-2 rotate-0 opacity-40" /></span>}
            </div>
            <h3 className="mt-4 text-[16px] font-black text-(--hwd-ink)">{s.title}</h3>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-(--hwd-ink-soft)">{s.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ——— Отзывы ———

function Testimonials() {
  return (
    <section className="mx-auto max-w-[1280px] px-5 py-8 sm:px-8 lg:px-12">
      <div className="rounded-[2rem] border border-white/70 bg-white/60 p-6 backdrop-blur-xl sm:p-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-xl font-black text-(--hwd-ink) sm:text-2xl">Пары уже растят свои миры</h2>
          <span className="text-xs font-bold text-(--hwd-ink-soft)">отзывы · реальные истории</span>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="rounded-2xl border border-white/70 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-(--hwd-primary-soft) text-lg">{t.avatar}</span>
                <div>
                  <figcaption className="text-sm font-black text-(--hwd-ink)">{t.name}</figcaption>
                  <p className="text-xs font-semibold text-(--hwd-ink-soft)">{t.role}</p>
                </div>
              </div>
              <blockquote className="mt-3 text-sm font-semibold leading-relaxed text-(--hwd-ink)">&ldquo;{t.quote}&rdquo;</blockquote>
              <div className="mt-3 text-amber-400 text-sm">★★★★★</div>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

// ——— Финальный CTA ———

function FinalCTA() {
  return (
    <section className="mx-auto max-w-[1280px] px-5 py-8 sm:px-8 lg:px-12">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.9),rgba(255,255,255,0.6))] p-8 text-center backdrop-blur-xl sm:p-10">
        <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-[radial-gradient(circle_at_30%_30%,var(--hwd-glow),transparent_70%)] opacity-60 blur-2xl" aria-hidden />
        <div className="pointer-events-none absolute -left-16 -bottom-16 size-64 rounded-full bg-[radial-gradient(circle_at_30%_30%,var(--hwd-primary-soft),transparent_70%)] opacity-60 blur-2xl" aria-hidden />

        <h2 className="relative text-[1.9rem] font-black leading-tight text-(--hwd-ink) sm:text-[2.2rem]">
          Готовы посадить <span className="font-[var(--font-caveat)] text-[1.2em] text-(--hwd-primary-deep)">ваше семечко</span>?
        </h2>
        <p className="relative mx-auto mt-3 max-w-[48ch] text-sm font-semibold leading-relaxed text-(--hwd-ink-soft)">
          Создайте мир за минуту, пригласите половинку по коду — и начните собирать историю, к которой захочется возвращаться.
        </p>
        <div className="relative mt-6 flex flex-wrap justify-center gap-3">
          <Link href={routes.register.path} className="inline-flex items-center gap-2 rounded-full bg-(--hwd-primary) px-8 py-3.5 text-sm font-black text-white shadow-[0_16px_30px_-14px_var(--hwd-glow)] transition hover:translate-y-[-1px] hover:bg-(--hwd-primary-deep) focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--hwd-glow)">
            Создать мир — бесплатно <ArrowIcon className="size-4" />
          </Link>
          <Link href={routes.login.path} className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-7 py-3.5 text-sm font-extrabold text-(--hwd-ink) backdrop-blur-md transition hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--hwd-glow)">
            У меня уже есть аккаунт
          </Link>
        </div>
        <p className="relative mt-4 text-xs font-bold text-(--hwd-ink-soft)">Без карты · без спама · только вы двое 💛</p>
      </div>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer className="mx-auto max-w-[1280px] px-5 pb-10 pt-2 sm:px-8 lg:px-12">
      <div className="flex flex-col items-center justify-between gap-4 border-t border-white/60 pt-6 text-center sm:flex-row sm:text-left">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="text-xs font-bold text-(--hwd-ink-soft)">© {new Date().getFullYear()} HeartWood · ваша история</span>
        </div>
        <p className="text-xs font-semibold text-(--hwd-ink-soft)">Каждый день — новая веточка вашей истории 🌿</p>
      </div>
    </footer>
  );
}

// ——— Маркетинговый лендинг (гость) ———

function MarketingLanding() {
  const { gender } = useGender();
  return (
    <div data-gender={gender ?? "neutral"} className="relative min-h-svh w-full overflow-hidden font-sans text-(--hwd-ink)">
      <AmbientBackground />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.45),transparent_58%)]" />
      <LandingHeader />
      <main className="relative z-10">
        <Hero />
        <Features />
        <TreeStory />
        <HowItWorks />
        <Testimonials />
        <FinalCTA />
      </main>
      <LandingFooter />
    </div>
  );
}

// ——— Загрузка ———

function LoadingScreen() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-[linear-gradient(150deg,#eef1fd_0%,#f8f6ff_48%,#fde8f1_100%)]">
      <div className="flex items-center gap-3 text-(--hwd-ink-soft)">
        <span aria-hidden className="size-5 animate-spin rounded-full border-[3px] border-white/40 border-t-violet-500" />
        <span className="text-sm font-bold">Загружаем ваш мир…</span>
      </div>
    </div>
  );
}

// ——— Контент страницы — переключатель гость / мир ———
// Для SEO: на сервере и для гостей сразу рендерим MarketingLanding,
// а для залогиненных показываем лоадер до проверки /auth/me — без флеша лендинга.
function PageContent() {
  const { user, ready } = useAuth();

  if (!ready) {
    // На сервере window нет — отдаём лендинг для индексации.
    // На клиенте, если есть токен, показываем лоадер (иначе гость увидит лендинг сразу).
    if (typeof window !== "undefined") {
      try {
        const hasToken =
          window.localStorage.getItem("heartwood.token") ||
          window.sessionStorage.getItem("heartwood.token");
        if (hasToken) return <LoadingScreen />;
      } catch {
        // storage недоступен — считаем гостем
      }
    }
    return <MarketingLanding />;
  }

  // Залогинен — показываем настоящий мир (тот же, что и раньше на /)
  if (user) {
    return (
      <WorldShell>
        <Greeting />
        <OrbitalStage />
        <RecentHistory />
        <StatsStrip />
      </WorldShell>
    );
  }

  return <MarketingLanding />;
}

// ——— Экспорт страницы ———

export default function RootPage() {
  return (
    <AuthProvider>
      <GenderProvider>
        <MoodProvider>
          <PageContent />
        </MoodProvider>
      </GenderProvider>
    </AuthProvider>
  );
}
