"use client";

import RelationshipTree from "@/features/world/tree/RelationshipTree";
import type {
  HangingItem,
  Mood,
  Season,
  TimeOfDay,
  TreeEvent,
} from "@/features/world/tree/config/stages";

// Обёртка над живым деревом. RelationshipTree заполняет высоту родителя целиком
// (height 100%) и масштабирует сцену под неё через xMidYMax meet, поэтому
// «компактный» режим — это просто более низкая сцена, а не обрезка: на мобильном
// дерево целиком (земля + крона) встаёт на стеклянную карточку. Данные мира
// прокидывает родитель (TreeStage) — здесь нейтральные дефолты для автономной работы.
interface WorldTreeProps {
  compact?: boolean;
  level?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
  levelProgress?: number;
  daysTogether?: number;
  season?: Season;
  timeOfDay?: TimeOfDay;
  partnerMood?: Mood;
  streak?: number;
  hangingItems?: HangingItem[];
  lastEvent?: TreeEvent;
  onTreeTap?: () => void;
  onItemOpen?: (item: HangingItem) => void;
  reducedMotion?: boolean;
}

export function WorldTree({
  compact = false,
  level = 0,
  levelProgress = 0,
  daysTogether = 0,
  season = "summer",
  timeOfDay = "day",
  partnerMood = null,
  streak = 0,
  hangingItems = [],
  lastEvent,
  onTreeTap,
  onItemOpen,
  reducedMotion = false,
}: WorldTreeProps) {
  return (
    <div className={compact ? "relative h-[380px] w-full" : "relative h-[520px] w-full lg:h-[620px]"}>
      <RelationshipTree
        level={level}
        levelProgress={levelProgress}
        daysTogether={daysTogether}
        season={season}
        timeOfDay={timeOfDay}
        partnerMood={partnerMood}
        streak={streak}
        hangingItems={hangingItems}
        lastEvent={lastEvent}
        onTreeTap={onTreeTap}
        onItemOpen={onItemOpen}
        reducedMotion={reducedMotion}
      />
    </div>
  );
}
