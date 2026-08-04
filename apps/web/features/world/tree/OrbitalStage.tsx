import { TreeStage } from "@/features/world/tree/TreeStage";
import { Satellite } from "@/features/world/tree/Satellite";
import { worldStatus } from "@/lib/data/worldStatus";
import motion from "@/components/motion.module.css";
import styles from "./OrbitalStage.module.css";

export function OrbitalStage() {
  return (
    <section aria-labelledby="world-stage-title">
      <h2 id="world-stage-title" className="sr-only">
        Ваш мир
      </h2>

      {/* Сцена на всю ширину страницы — дерево крупнее, небо и частицы
          заполняют края. */}
      <div className="w-full">
        {/* Садовая сцена — стеклянная карточка в языке страницы, как «Недавняя
            история». TreeStage — клиентский компонент: держит состояние роста
            дерева и рендерит сцену, шкалу прогресса и кнопки теста +/−. */}
        <TreeStage />

        {/* Живые уголки мира — чип-рельса. */}
        <div className="mt-9">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h3 className="text-base font-extrabold text-(--hwd-ink)">
              Ваш мир живёт здесь
            </h3>
            <span className="shrink-0 text-xs font-semibold text-(--hwd-ink-soft) lg:hidden">
              листайте
            </span>
          </div>

          <ul
            className={`${styles.chipRail} -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 lg:mx-0 lg:flex-wrap lg:justify-center lg:overflow-visible lg:px-0 lg:pb-0`}
          >
            {worldStatus.satellites.map((satellite, index) => (
              <li
                key={satellite.key}
                className={`${motion.popIn} flex snap-start`}
                style={{ animationDelay: `${0.1 + index * 0.05}s` }}
              >
                <Satellite data={satellite} variant="chip" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
