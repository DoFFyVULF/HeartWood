/* eslint-disable */
/**
 * Seed демо-пары «Аня и Дима».
 *
 * Запуск:  node prisma/seed.js (после `npm run build` — клиент берётся из dist/)
 *
 * Воспроизводит весь контент, который раньше жил в web/lib/data/*.ts:
 * воспоминания, купоны, цели с вехами и вкладами, события календаря,
 * исторические свидания (для статистики /dates), желания, реакции,
 * сердечки и профили участников.
 *
 * Логин: dima@heartwood.app / heartwood123
 *        anya@heartwood.app / heartwood123
 *
 * Идемпотентно: при повторном запуске пересоздаёт демо-пару заново
 * (удаляет старую по email).
 */
require('dotenv/config');
const bcrypt = require('bcrypt');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('../dist/generated/prisma/client');

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const DAY_MS = 86_400_000;

/** Дата в полдень локальной таймзоны — чтобы сдвиг дней не уводил день назад. */
function at(iso) {
  return new Date(`${iso}T12:00:00`);
}

/** N дней назад от «сегодня». */
function daysAgo(n) {
  return new Date(Date.now() - n * DAY_MS);
}

function pluralRu(n, one, few, many) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
}

async function main() {
  // Пароль для обоих участников.
  const passwordHash = await bcrypt.hash('heartwood123', 12);

  // ── Удаляем старую демо-пару (идемпотентность) ────────────────────────
  const old = await prisma.user.findMany({
    where: { email: { in: ['dima@heartwood.app', 'anya@heartwood.app'] } },
    select: { id: true, coupleId: true },
  });
  for (const u of old) {
    if (u.coupleId) await prisma.couple.delete({ where: { id: u.coupleId } }).catch(() => {});
  }

  // ── Пара и участники ────────────────────────────────────────────────────
  const couple = await prisma.couple.create({
    data: {
      code: 'HW-LOVE',
      coupleName: 'Аня и Дима',
      since: at('2024-02-14'),
      streakDays: 127,
      mutualReactions: 5,
    },
  });

  const dima = await prisma.user.create({
    data: {
      email: 'dima@heartwood.app',
      passwordHash,
      name: 'Дима',
      gender: 'boy',
      role: 'primary',
      mood: 'great',
      emoji: '😎',
      tagline: 'Люблю кофе, гитару и тебя',
      coupleId: couple.id,
      updatedAt: daysAgo(0),
    },
  });

  const anya = await prisma.user.create({
    data: {
      email: 'anya@heartwood.app',
      passwordHash,
      name: 'Аня',
      gender: 'girl',
      role: 'partner',
      mood: 'okay',
      emoji: '💛',
      tagline: 'Закаты, вафли и наши планы',
      coupleId: couple.id,
      updatedAt: daysAgo(0),
    },
  });

  const both = [dima, anya];

  // Карта «ключ вклада → реальный id пользователя» (вклады указывают по dima/anya).
  const idByKey = { dima: dima.id, anya: anya.id };

  // ── Реакции на карточки (liveliness: dima/anya) ────────────────────────
  const reactions = [
    // на карточку Димы — ставит Аня
    { emoji: '💙', count: 12, memberId: dima.id },
    { emoji: '💛', count: 7, memberId: dima.id },
    { emoji: '🎉', count: 3, memberId: dima.id },
    // на карточку Ани — ставит Дима
    { emoji: '💙', count: 8, memberId: anya.id },
    { emoji: '💛', count: 6, memberId: anya.id },
    { emoji: '☕', count: 2, memberId: anya.id },
  ];
  await prisma.reaction.createMany({
    data: reactions.map((r) => ({
      coupleId: couple.id,
      memberId: r.memberId,
      emoji: r.emoji,
      count: r.count,
    })),
  });

  // ── Воспоминания (seedMemories) ─────────────────────────────────────────
  const memories = [
    { title: 'Пикник у реки', emoji: '🧺', date: '2026-07-27', story: 'Вафли, плед и солнце наперегонки. Дима наконец-то научился сворачивать вафли конвертиком, а Аня записала в блокнот «не забыть купить клубники». День пахнет летом.', createdBy: anya.id },
    { title: 'Кино на закате', emoji: '🎬', date: '2026-08-02', story: '«Амели» в летнем кинотеатре под открытым небом. На середине фильма пошёл дождь — мы спрятались под одним пледом и досмотрели до конца, уже не помня, что там было на экране.', createdBy: dima.id },
    { title: 'Кофейня «Ветка»', emoji: '☕', date: '2026-07-19', story: 'Наш постоянный столик у окна. Раф с корицей, один на двоих, и план на море, который мы рисуем на салфетках уже третий раз.', createdBy: anya.id },
    { title: 'Мастер-класс по керамике', emoji: '🎨', date: '2026-07-13', story: 'Две кривоватые чашки — одна выше, другая шире. На дне у обеих я процарапала маленькое сердечко. Они всё ещё стоят у нас на полке.', createdBy: dima.id },
    { title: 'Ночная прогулка', emoji: '🚶', date: '2026-07-05', story: 'Набережная в полночь, фонари ловят звёзды в лужах. Мы дошли до самого конца и обратно — просто чтобы ещё раз пройти мимо нашей скамейки.', createdBy: dima.id },
  ];
  for (let i = 0; i < memories.length; i++) {
    const m = memories[i];
    await prisma.memory.create({
      data: {
        title: m.title,
        emoji: m.emoji,
        date: at(m.date),
        story: m.story,
        coupleId: couple.id,
        createdById: m.createdBy,
        createdAt: daysAgo(i + 2),
      },
    });
  }

  // ── Купоны (seedCoupons) ────────────────────────────────────────────────
  await prisma.coupon.createMany({
    data: [
      { emoji: '💆', title: 'Массаж на диване', description: 'Десять минут покоя от любимых рук. Погасить можно в любой момент.', status: 'active', price: 12, coupleId: couple.id, createdById: dima.id, recipientId: anya.id, createdAt: daysAgo(10) },
      { emoji: '🍳', title: 'Завтрак в кровать', description: 'Любимый завтрак с подачей до полудня. Вафли — по запросу.', status: 'active', price: 15, coupleId: couple.id, createdById: anya.id, recipientId: dima.id, createdAt: daysAgo(8) },
      { emoji: '🎬', title: 'Фильм без споров', description: 'Жанр выбирает владелец купона. Попкорн — за счёт счастливого партнёра.', status: 'redeemed', price: 10, coupleId: couple.id, createdById: anya.id, redeemedById: dima.id, createdAt: daysAgo(20), redeemedAt: at('2026-07-23') },
      { emoji: '☕', title: 'Капучино с собой', description: 'Настоящий капучино с корицей и салфеткой с сердечком.', status: 'redeemed', price: 8, coupleId: couple.id, createdById: dima.id, redeemedById: anya.id, createdAt: daysAgo(18), redeemedAt: at('2026-07-28') },
    ],
  });

  // ── Цели (seedGoals) с вехами и вкладами ───────────────────────────────
  const goals = [
    {
      kind: 'trip', title: 'Копим на море', description: 'Неделя на берегу: закаты, солёный воздух и ни одного будильника.',
      saved: 37200, target: 60000, deadline: 'к августу',
      milestones: [
        { label: 'Виза и билеты', progress: 100 },
        { label: 'Отель у воды', progress: 40 },
        { label: 'Копилка на вечер', progress: 15 },
      ],
      contributions: { dima: 20000, anya: 17200 },
    },
    {
      kind: 'home', title: 'Диван для уютных вечеров', description: 'Совместный кинопросмотр без споров, кто первый — сериал или футбол.',
      saved: 25500, target: 75000, deadline: 'к зиме',
      milestones: [
        { label: 'Присмотрели модель', progress: 100 },
        { label: 'Измерили гостиную', progress: 100 },
        { label: 'Договорились о цвете', progress: 20 },
      ],
      contributions: { dima: 14000, anya: 11500 },
    },
    {
      kind: 'celebration', title: 'Годовщина на закате', description: 'Пикник с пледом, гитара и ровно столько сюрпризов, сколько поместится в корзину.',
      saved: 10500, target: 15000, deadline: 'к 14 февраля',
      milestones: [
        { label: 'Забронировали поляну', progress: 100 },
        { label: 'Плейлист вечера', progress: 70 },
      ],
      contributions: { dima: 4500, anya: 6000 },
    },
  ];
  let goalCreatedDay = 40;
  for (const g of goals) {
    const goal = await prisma.goal.create({
      data: {
        kind: g.kind, title: g.title, description: g.description,
        saved: g.saved, target: g.target, deadline: g.deadline,
        coupleId: couple.id, createdById: dima.id,
        createdAt: daysAgo(goalCreatedDay),
      },
    });
    for (const m of g.milestones) {
      await prisma.goalMilestone.create({ data: { label: m.label, progress: m.progress, goalId: goal.id } });
    }
    // Вклады: по нескольку траншей, чтобы updatedAt выглядел живым.
    let contributionDay = goalCreatedDay - 2;
    for (const [whoId, amount] of Object.entries(g.contributions)) {
      let left = amount;
      while (left > 0) {
        const chunk = Math.min(500, left);
        await prisma.goalContribution.create({
          data: { goalId: goal.id, userId: idByKey[whoId], amount: chunk, at: daysAgo(contributionDay) },
        });
        left -= chunk;
        contributionDay -= 3;
      }
    }
    goalCreatedDay -= 15;
  }

  // ── Желания (seedWishes) ────────────────────────────────────────────────
  const wishes = [
    { title: 'Венеция на двоих', description: 'Гондола, дождь и паста у окна — неделя в самом романтичном городе.', wisherId: anya.id, createdById: anya.id },
    { title: 'Кофемашина с молочной пеной', description: 'Чтобы капучино был как в «Ветке», но дома и на нашей кухне.', wisherId: dima.id, createdById: dima.id },
    { title: 'Полароид для наших приключений', description: 'Каждая поездка — по кадру на холодильник. Через год это целая стена.', wisherId: dima.id, createdById: anya.id },
    { title: 'Акустическая гитара', description: 'Давно хочу научиться играть — и петь тебе по утрам.', wisherId: dima.id, createdById: dima.id, claimerId: anya.id },
    { title: 'Кружка с нашими инициалами', description: 'Самая тёплая кружка на нашей кухне — с первой годовщины.', wisherId: anya.id, createdById: dima.id, fulfilled: true },
  ];
  for (let i = 0; i < wishes.length; i++) {
    const w = wishes[i];
    await prisma.wish.create({
      data: {
        title: w.title, description: w.description,
        wisherId: w.wisherId, createdById: w.createdById,
        claimerId: w.claimerId ?? null, fulfilled: w.fulfilled ?? false,
        coupleId: couple.id, createdAt: daysAgo(4 + i * 3),
      },
    });
  }

  // ── События календаря (seedEvents) ──────────────────────────────────────
  const calendarEvents = [
    { kind: 'date', title: 'Кино на крыше', description: 'Летний кинотеатр под открытым небом — плед, «Амели» и звёзды.', date: '2026-08-15', invitedBy: dima.id },
    { kind: 'date', title: 'Пикник у реки', description: 'Вафли, плед и солнце наперегонки — наша скамейка ждёт.', date: '2026-08-23', invitedBy: anya.id },
    { kind: 'date', title: 'Танцы под дождём', description: 'Секретная поляна и старый плеер Димы — если пойдёт ливень.', date: '2026-09-05', invitedBy: dima.id },
    { kind: 'anniversary', title: 'День, когда мы стали парой', description: '14 февраля — наша история началась с кофейни «Ветка».', date: '2024-02-14', recurring: true, createdBy: dima.id },
    { kind: 'anniversary', title: 'Годовщина первого свидания', description: 'Ровно год после разговоров до утра и первого «давай повторим?».', date: '2023-02-14', recurring: true, createdBy: anya.id },
    { kind: 'milestone', title: 'Первый поцелуй', description: 'На набережной, на полпути от нашей скамейки, под фонарём.', date: '2024-02-28', createdBy: dima.id },
    { kind: 'milestone', title: 'Первое «люблю»', description: 'Сказалось само, когда заваривали чай и никто не смотрел.', date: '2024-04-12', createdBy: anya.id },
    { kind: 'milestone', title: 'Переехали вместе', description: 'Две коробки книг и одна очень большая коробка пледов.', date: '2025-01-18', createdBy: dima.id },
  ];
  for (let i = 0; i < calendarEvents.length; i++) {
    const e = calendarEvents[i];
    await prisma.event.create({
      data: {
        kind: e.kind, title: e.title, description: e.description,
        date: at(e.date), recurring: e.recurring ?? false,
        coupleId: couple.id,
        createdById: e.createdBy ?? e.invitedBy,
        invitedById: e.invitedBy ?? null,
        createdAt: daysAgo(15 + i),
      },
    });
  }

  // ── Исторические свидания (для статистики /dates, зеркало datesData) ──
  // 23 свидания: inviteScore dima 13 / anya 9 / shared 1, 96 часов вместе,
  // bestStreak 8, favoriteSpot «Кофейня „Ветка“», рейтинг ≈ 4,9,
  // topTypes: пикники 6, кофейни 5, кино 4, прогулки 4, мастер-классы 2.
  const dateEvents = [
    { d: '2025-10-05', type: 'picnic', hours: 5, rating: 5, spot: 'Парк «Сокольники»', inv: dima.id },
    { d: '2025-10-18', type: 'coffee', hours: 2, rating: 5, spot: 'Кофейня «Ветка»', inv: anya.id },
    { d: '2025-11-01', type: 'cinema', hours: 3, rating: 5, spot: 'Кинотеатр «Горизонт»', inv: dima.id },
    { d: '2025-11-15', type: 'walk', hours: 3, rating: 4, spot: 'Набережная', inv: anya.id },
    { d: '2025-12-06', type: 'craft', hours: 5, rating: 5, spot: 'Керамическая студия', inv: dima.id },
    { d: '2026-01-10', type: 'nature', hours: 12, rating: 5, spot: 'Лесное озеро', inv: anya.id },
    { d: '2026-01-24', type: 'picnic', hours: 5, rating: 5, spot: 'Парк «Сокольники»', inv: dima.id },
    { d: '2026-02-14', type: 'coffee', hours: 2, rating: 5, spot: 'Кофейня «Ветка»', inv: dima.id },
    { d: '2026-02-28', type: 'cinema', hours: 3, rating: 5, spot: 'Кинотеатр «Горизонт»', inv: anya.id },
    { d: '2026-03-14', type: 'picnic', hours: 5, rating: 5, spot: 'Поляна у реки', inv: dima.id },
    { d: '2026-03-28', type: 'coffee', hours: 2, rating: 5, spot: 'Кофейня «Ветка»', inv: anya.id },
    { d: '2026-04-11', type: 'walk', hours: 3, rating: 5, spot: 'Набережная', inv: dima.id },
    { d: '2026-04-25', type: 'home', hours: 10, rating: 5, spot: 'Домашний ужин', inv: null },
    { d: '2026-05-09', type: 'picnic', hours: 5, rating: 5, spot: 'Парк «Сокольники»', inv: dima.id },
    { d: '2026-05-30', type: 'cinema', hours: 3, rating: 4, spot: 'Кинотеатр «Горизонт»', inv: anya.id },
    { d: '2026-06-13', type: 'coffee', hours: 2, rating: 5, spot: 'Кофейня «Ветка»', inv: dima.id },
    { d: '2026-06-20', type: 'picnic', hours: 5, rating: 5, spot: 'Поляна у реки', inv: anya.id },
    { d: '2026-06-27', type: 'walk', hours: 3, rating: 5, spot: 'Набережная', inv: dima.id },
    { d: '2026-07-05', type: 'walk', hours: 3, rating: 5, spot: 'Набережная', inv: dima.id },
    { d: '2026-07-13', type: 'craft', hours: 5, rating: 5, spot: 'Керамическая студия', inv: anya.id },
    { d: '2026-07-19', type: 'coffee', hours: 2, rating: 5, spot: 'Кофейня «Ветка»', inv: anya.id },
    { d: '2026-07-27', type: 'picnic', hours: 5, rating: 5, spot: 'Поляна у реки', inv: dima.id },
    { d: '2026-08-02', type: 'cinema', hours: 3, rating: 5, spot: 'Летний кинотеатр', inv: dima.id },
  ];
  for (let i = 0; i < dateEvents.length; i++) {
    const e = dateEvents[i];
    await prisma.event.create({
      data: {
        kind: 'date', title: titleForDate(e), description: null,
        date: at(e.d), type: e.type, hours: e.hours, rating: e.rating, spot: e.spot,
        coupleId: couple.id,
        createdById: e.inv ?? dima.id,
        invitedById: e.inv ?? null,
        createdAt: daysAgo(60 + i),
      },
    });
  }

  // ── Сердечки: история транзакций (кошельки выглядят живыми) ────────────
  // Вчерашние daily кладём у обоих, чтобы claim-daily сегодня продолжал серию.
  const txSpecs = [
    // Дима
    { userId: dima.id, reason: 'daily', amount: 10, label: 'Ежедневный вход', day: 1 },
    { userId: dima.id, reason: 'daily', amount: 10, label: 'Ежедневный вход', day: 2 },
    { userId: dima.id, reason: 'memory', amount: 15, label: 'Воспоминание: Кино на закате', day: 3 },
    { userId: dima.id, reason: 'date', amount: 20, label: 'Свидание: Кофейня «Ветка»', day: 4 },
    { userId: dima.id, reason: 'coupon_send', amount: 5, label: 'Купон отправлен', day: 5 },
    { userId: dima.id, reason: 'streak', amount: 25, label: 'Серия дней: 7 подряд', day: 7 },
    { userId: dima.id, reason: 'reaction', amount: 3, label: 'Реакция на карточку', day: 8 },
    { userId: dima.id, reason: 'coupon_redeem', amount: -10, label: 'Выкуп: Фильм без споров', day: 9 },
    // Аня
    { userId: anya.id, reason: 'daily', amount: 10, label: 'Ежедневный вход', day: 1 },
    { userId: anya.id, reason: 'daily', amount: 10, label: 'Ежедневный вход', day: 2 },
    { userId: anya.id, reason: 'memory', amount: 15, label: 'Воспоминание: Пикник у реки', day: 3 },
    { userId: anya.id, reason: 'date', amount: 20, label: 'Свидание: Пикник у реки', day: 4 },
    { userId: anya.id, reason: 'coupon_send', amount: 5, label: 'Купон отправлен', day: 5 },
    { userId: anya.id, reason: 'streak', amount: 25, label: 'Серия дней: 7 подряд', day: 7 },
    { userId: anya.id, reason: 'coupon_redeem', amount: -8, label: 'Выкуп: Капучино с собой', day: 9 },
  ];
  for (const t of txSpecs) {
    await prisma.heartTx.create({
      data: { userId: t.userId, reason: t.reason, amount: t.amount, label: t.label, at: daysAgo(t.day) },
    });
  }

  console.log('Seed готов:');
  console.log('  Пара: Аня и Дима (HW-LOVE), вместе с 2024-02-14, серия 127 дней');
  console.log('  Вход:  dima@heartwood.app / heartwood123');
  console.log('         anya@heartwood.app / heartwood123');
  console.log('  Контент: 5 воспоминаний, 4 купона, 3 цели, 5 желаний, 8 событий календаря,');
  console.log('           23 исторических свидания, реакции и сердечки.');
}

function titleForDate(e) {
  // Заголовки совпадают с history в старом datesData.
  const map = {
    '2025-10-05': 'Пикник в «Сокольниках»',
    '2025-10-18': 'Кофейня «Ветка»',
    '2025-11-01': 'Кино «Горизонт»',
    '2025-11-15': 'Прогулка по набережной',
    '2025-12-06': 'Мастер-класс по керамике',
    '2026-01-10': 'Лесное озеро',
    '2026-01-24': 'Зимний пикник',
    '2026-02-14': 'День Святого Валентина',
    '2026-02-28': 'Кино «Горизонт»',
    '2026-03-14': 'Пикник у реки',
    '2026-03-28': 'Кофейня «Ветка»',
    '2026-04-11': 'Прогулка по набережной',
    '2026-04-25': 'Домашний ужин',
    '2026-05-09': 'Пикник в «Сокольниках»',
    '2026-05-30': 'Кино «Горизонт»',
    '2026-06-13': 'Кофейня «Ветка»',
    '2026-06-20': 'Пикник у реки',
    '2026-06-27': 'Прогулка по набережной',
    '2026-07-05': 'Ночная прогулка',
    '2026-07-13': 'Мастер-класс по керамике',
    '2026-07-19': 'Кофейня «Ветка»',
    '2026-07-27': 'Пикник у реки с вафлями',
    '2026-08-02': 'Кино на закате · «Амели»',
  };
  return map[e.d];
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error('Seed упал:', err);
    await prisma.$disconnect();
    process.exit(1);
  });
