<div align="center">

# 🌿 HeartWood

### Живой мир для вашей пары

Свидания, воспоминания, купоны, письма от руки и общее дерево — всё в одном уютном месте. Без ленты и шума. Только вы двое.

[![Next.js](https://img.shields.io/badge/Next.js-16.2.12-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-12.43-FF0088?logo=framer&logoColor=white)](https://www.framer.com/motion/)

[Демо →](#) · [Документация](#) · [Баг-репорт](https://github.com/lukakataev/heartwood/issues)

</div>

---

## ✨ Что это?

**HeartWood** — это не соцсеть и не трекер отношений. Это уютный цифровой сад для двоих, где каждая пара выращивает своё живое дерево: от семечка до сакуры. Дерево растёт за ваши действия — свидания, письма, купоны и общие цели.

---

## 🎯 Возможности

<div align="center">

| Возможность | Описание |
| :--- | :--- |
| 🌳 **Живое дерево** | 6 стадий роста (семечко → сакура). Сезон, время суток и погода живые и меняются от настроения партнёра. |
| 💌 **Письма от руки** | Студия письма: бумага, печать и сургуч. Письма попадают в общую почту. |
| 📅 **Свидания** | Планируйте встречи, отмечайте любимые места и смотрите статистику вместе. |
| 🎫 **Купоны** | Создавайте нежные задания-купоны: «Завтрак в постель» — и дарите половинке. |
| ⭐ **Цели и копилки** | Копите вместе на поездку, дом или праздник. Прогресс и вехи — на виду. |
| 🎁 **Список желаний** | Загадывайте, бронируйте и исполняйте мечты друг друга. |
| 📸 **Воспоминания** | Сохраняйте моменты с фото, историей и датой. Каждый — новая веточка на дереве. |
| 🔥 **Сердечки и серия** | Получайте сердечки за действия, держите огненную серию дней без пропусков. |

</div>

---

## 🛠 Технологический стек

<div align="center">

| Слой | Технологии |
| :--- | :--- |
| **Фреймворк** | [Next.js 16](https://nextjs.org/) (App Router, Turbopack, RSC) |
| **UI** | [React 19](https://react.dev/), Tailwind CSS v4, Framer Motion 12 |
| **Язык** | TypeScript 5 (strict mode) |
| **Шрифты** | Google Fonts — Nunito + Caveat (кириллица) |
| **Архитектура** | Feature-based модули, React Context (auth, gender, mood) |
| **Сборка** | ESLint 9, PostCSS, @tailwindcss/postcss |

</div>

---

## 🚀 Быстрый старт

### Требования

- Node.js 18+
- pnpm / npm / yarn / bun
- API ([HeartWood API](https://github.com/lukakataev/heartwood/tree/main/apps/api)) запущен на `http://localhost:3001`

### Установка

```bash
# Клонируем репозиторий
git clone https://github.com/lukakataev/heartwood.git
cd heartwood/apps/web

# Устанавливаем зависимости
npm install

# Настраиваем переменные окружения
cp .env.example .env.local
# В .env.local укажите адрес вашего API:
# NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Запускаем dev-сервер
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) — вы увидите красивый лендинг.

### Сценарии

```bash
npm run dev      # Разработка (Turbopack)
npm run build    # Продакшен-сборка
npm run start    # Продакшен-сервер
npm run lint     # Линтинг (ESLint 9)
```

---

## 📁 Структура проекта

```
apps/web/
├── app/                          # App Router (Next.js 16)
│   ├── (auth)/                   # Route group — авторизация
│   │   ├── layout.tsx
│   │   ├── login/
│   │   └── register/
│   ├── (world)/                  # Route group — защищённый мир
│   │   ├── layout.tsx
│   │   ├── coupons/
│   │   ├── dates/
│   │   ├── events/
│   │   ├── goals/
│   │   ├── memories/
│   │   ├── profile/
│   │   └── wishlist/
│   ├── globals.css               # Глобальные стили (Tailwind v4)
│   ├── layout.tsx                # Root layout (шрифты, метаданные)
│   └── page.tsx                  # SSR-лендинг + мир (клиентский роутинг)
├── components/
│   ├── layout/                   # Логотип, обёртки
│   ├── ui/                       # Переиспользуемые UI-компоненты
│   ├── AmbientBackground.tsx     # Фоновые частицы / градиенты
│   └── motion.module.css         # Анимации (float, popIn)
├── features/
│   ├── auth/                     # Авторизация: WorldArt, AuthShell, валидация
│   └── world/                    # Функции мира
│       ├── WorldShell.tsx        # Обёртка мира с навигацией
│       ├── tree/                 # Дерево: стадии, сателлиты, история
│       ├── hearts/               # Сердечки, кошелёк, daily-claim
│       ├── memories/             # Воспоминания
│       ├── dates/                # Свидания
│       ├── coupons/              # Купоны
│       ├── goals/                # Цели и вклады
│       ├── events/               # Календарь
│       ├── wishlist/             # Список желаний
│       └── profile/              # Профиль, присутствие, настроение
├── lib/
│   ├── api.ts                    # Fetch-клиент к API (типизированный)
│   ├── api-data.ts               # Моки и сиды для разработки
│   ├── auth.tsx                  # AuthContext, guards (RequireAuth, RedirectIfAuthed)
│   ├── theme.tsx                 # GenderProvider, тема
│   ├── mood.tsx                  # MoodProvider, погода и настроение
│   ├── types.ts                  # Доменные типы (350+ строк)
│   ├── routes.ts                 # Типизированные роуты
│   ├── useResource.ts            # Хук кэширования ресурсов
│   └── utils.ts                  # Утилиты
├── public/                       # Статические ассеты
├── package.json
├── tsconfig.json
├── next.config.ts
├── routes.ts
└── README.md
```

---

## 🎨 Архитектура и паттерны

### Route Groups

Проект использует **route groups** `(auth)` и `(world)` для разделения аутентифицированного и публичного контента без влияния на URL.

### Feature-based модули

Каждая бизнес-область (memories, dates, coupons…) живёт в своей папке `features/<domain>/` и содержит:
- UI-компоненты страницы
- Хуки и логику работы с API
- Локальные типы и утилиты

### Типизированный API-клиент

Единый `lib/api.ts` — типизированный `fetch`-клиент с:
- JWT-авторизацией (`localStorage` / `sessionStorage`)
- Обработкой ошибок (`ApiError` с человеческими сообщениями)
- Кэшированием через `useResource`

### Контексты

- **AuthContext** — пользователь, пара, login/logout, refresh
- **GenderProvider** — тема интерфейса
- **MoodProvider** — погода и атмосфера в мире

---

## 🔐 Переменные окружения

| Переменная | Обязательна | По умолчанию | Описание |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Да | `http://localhost:3001/api` | Базовый URL API HeartWood |

> ⚠️ API должен быть запущен отдельно. См. [документацию API](https://github.com/lukakataev/heartwood/tree/main/apps/api).

---

## 🤝 Вклад в проект

Мы приветствуем пул-реквесты! Пожалуйста:

1. Создайте ветку от `main` — `feature/название` или `fix/название`
2. Убедитесь, что `npm run lint` проходит без ошибок
3. Опишите изменения в PR

---

## 📄 Лицензия

MIT — см. файл [LICENSE](LICENSE)

---

<div align="center">

Сделано с ❤️ для пар, которые хотят расти вместе.

**[HeartWood](https://heartwood.app)** · Каждый день — новая веточка вашей истории 🌿

</div>
