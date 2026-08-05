// Доменные типы фронта — общий контракт с API (apps/api).
// Единый источник правды для страниц, хуков и fetch-клиента.
// Seed-констант здесь нет: данные приходят с сервера.

export type Gender = "boy" | "girl";
export type CoupleRole = "primary" | "partner";

// ─── Auth ────────────────────────────────────────────────────────────────

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  gender: Gender | null;
  mood: string | null;
  emoji: string | null;
  tagline: string | null;
  photo: string | null;
  role: CoupleRole;
}

export interface PublicCouple {
  id: string;
  code: string;
  coupleName: string;
  since: string;
  members: PublicUser[];
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  gender?: Gender | null;
  /** Код пары второй половинки — вступаем в существующую пару. */
  coupleCode?: string;
}

export interface AuthResult {
  token: string;
  user: PublicUser;
  couple: PublicCouple;
  /** Присутствует, только если зарегистрирована НОВАЯ пара. */
  coupleCode?: string;
}

export interface UpdateMeInput {
  name?: string;
  emoji?: string;
  tagline?: string;
  mood?: string;
  photo?: string;
}

// ─── Пара (профиль, шапка) ───────────────────────────────────────────────

export type PresenceState = "online" | "recent" | "away" | "expected";

export interface MemberView {
  id: string;
  name: string;
  gender: Gender | null;
  emoji: string | null;
  tagline: string | null;
  role: string;
  mood: string | null;
  presence: { state: PresenceState; label: string };
  reactions: Array<{ emoji: string; count: number }>;
}

export interface CoupleProfile {
  couple: {
    id: string;
    code: string;
    coupleName: string;
    since: string;
    sinceLabel: string;
    streakDays: number;
    primaryId: string;
    mutualReactions: number;
    members: MemberView[];
  };
  me: { id: string; name: string; role: string };
}

// ─── Сердечки ────────────────────────────────────────────────────────────

export type HeartReason =
  | "daily"
  | "memory"
  | "date"
  | "coupon_send"
  | "reaction"
  | "streak"
  | "coupon_redeem";

export interface HeartTx {
  id: string;
  reason: HeartReason;
  amount: number;
  label: string;
  ts: number;
}

export interface HeartWallet {
  balance: number;
  history: HeartTx[];
  canClaimDaily: boolean;
}

// ─── Воспоминания ────────────────────────────────────────────────────────

export interface MemoryView {
  id: string;
  title: string;
  emoji: string;
  /** ISO-дата (YYYY-MM-DD). */
  date: string;
  story: string | null;
  createdAt: number;
}

export interface CreateMemoryInput {
  title: string;
  emoji: string;
  date: string;
  story?: string;
}

// ─── Купоны ──────────────────────────────────────────────────────────────

export interface MemberRef {
  id: string;
  name: string;
  /** Аватар участника — эмодзи (может отсутствовать, пока не выбран). */
  emoji?: string | null;
}

export type CouponStatus = "draft" | "active" | "redeemed";

export interface CouponView {
  id: string;
  emoji: string;
  title: string;
  description: string;
  status: CouponStatus;
  price: number;
  createdAt: string;
  redeemedAt: string | null;
  createdBy: MemberRef | null;
  recipient: MemberRef | null;
  redeemedBy: MemberRef | null;
}

export interface CreateCouponInput {
  emoji: string;
  title: string;
  description: string;
  price: number;
}

// ─── Цели ────────────────────────────────────────────────────────────────

export type GoalKind = "trip" | "home" | "celebration";

export interface MilestoneView {
  label: string;
  progress: number;
}

export interface ContributionView {
  userId: string;
  name: string;
  amount: number;
}

export interface GoalView {
  id: string;
  kind: GoalKind;
  title: string;
  description: string;
  saved: number;
  target: number;
  /** 0–100. */
  progress: number;
  deadline: string;
  updatedAt: string | null;
  milestones: MilestoneView[];
  contributions: ContributionView[];
}

export interface GoalsResponse {
  goals: GoalView[];
  totalSaved: number;
  totalRemaining: number;
}

export interface CreateGoalInput {
  kind: GoalKind;
  title: string;
  target: number;
}

// ─── Календарь ───────────────────────────────────────────────────────────

export type EventKind = "date" | "anniversary" | "milestone";

export interface EventView {
  id: string;
  kind: EventKind;
  title: string;
  description: string | null;
  /** ISO-дата (YYYY-MM-DD). */
  date: string;
  recurring: boolean;
  invitedBy: MemberRef | null;
  createdBy: MemberRef | null;
}

export interface CreateEventInput {
  kind: EventKind;
  title: string;
  date: string;
  description?: string;
}

// ─── Список желаний ──────────────────────────────────────────────────────

export interface WishView {
  id: string;
  title: string;
  description: string | null;
  fulfilled: boolean;
  wisher: MemberRef;
  claimer: MemberRef | null;
  createdBy: MemberRef | null;
}

export interface CreateWishInput {
  title: string;
  description?: string;
  /** Кто загадал — id участника. */
  wisherId: string;
}

// ─── Письма ───────────────────────────────────────────────────────────────

export interface LetterView {
  id: string;
  message: string;
  ps: string | null;
  paper: string;
  seal: string;
  stamp: string;
  /** Прочитано получателем. */
  read: boolean;
  /** true, если письмо пришло МНЕ (получатель — текущий пользователь). */
  incoming: boolean;
  sender: MemberRef;
  recipient: MemberRef;
  createdAt: string;
}

export interface CreateLetterInput {
  message: string;
  ps?: string;
  paper: string;
  seal: string;
  stamp: string;
}

// ─── Агрегат главной (/world) ────────────────────────────────────────────

export type WorldIcon =
  | "memory"
  | "mood"
  | "date"
  | "surprise"
  | "goal"
  | "coupon"
  | "flame"
  | "heart"
  | "photo";

export interface Satellite {
  key: string;
  icon: WorldIcon;
  label: string;
  status: string;
  path?: string;
  urgent?: boolean;
  badge?: string;
  progress?: number;
}

// ─── Общее дерево пары (часть /world) ────────────────────────────────────

/** Вид дерева по уровню; null на стадии 0 (семечко). */
export type TreeSpecies = "oak" | "birch" | "willow" | "pine" | "sakura";
export type Season = "spring" | "summer" | "autumn" | "winter";
export type TimeOfDay = "dawn" | "day" | "dusk" | "night";
export type TreeMood = "clear" | "rain" | "storm" | "rainbow" | "moonlight";

export interface TreeState {
  /** Есть ли вторая половинка (в паре два участника). */
  hasPartner: boolean;
  /** 0..5 — стадия роста, 0 — семечко, 5 — сакура (вершина). */
  level: number;
  /** 0..1 — прогресс внутри стадии. */
  levelProgress: number;
  /** Вид дерева; null на стадии 0 (семечко). */
  species: TreeSpecies | null;
  /** «Дуб», «Берёза»…, на стадии 0 — «Семечко». */
  speciesLabel: string;
  speciesEmoji: string;
  season: Season;
  timeOfDay: TimeOfDay;
  /** Настроение погоды — производное от настроения второй половинки. */
  mood: TreeMood;
  nextSpeciesLabel: string | null;
  /** Сколько поинтов до следующей стадии. */
  pointsToNext: number;
}

export interface WorldView {
  couple: string;
  streak: number;
  tree: TreeState;
  greeting: string;
  satellites: Satellite[];
  history: Array<{ icon: WorldIcon; text: string; time: string }>;
  stats: Array<{ icon: WorldIcon; value: string; label: string }>;
}

// ─── Агрегат свиданий (/dates) ───────────────────────────────────────────

export interface DatesView {
  couple: string;
  total: number;
  inviteScore: Record<string, number>;
  hoursTogether: number;
  bestStreak: number;
  favoriteSpot: string | null;
  averageRating: string;
  topTypes: Array<{ emoji: string; label: string; count: number }>;
  history: Array<{ emoji: string; text: string; who: string | null; when: string }>;
}
