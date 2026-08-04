import { Greeting } from "@/features/world/tree/Greeting";
import { OrbitalStage } from "@/features/world/tree/OrbitalStage";
import { RecentHistory } from "@/features/world/tree/RecentHistory";
import { StatsStrip } from "@/features/world/tree/StatsStrip";

// «Ваш мир» — the home of the living world. The garden stage leads (the tree
// is small today, with reserved canopy above it), the live satellites follow
// as a chip rail, then the recent story and bond stats.
export default function WorldPage() {
  return (
    <>
      <Greeting />
      <OrbitalStage />
      <RecentHistory />
      <StatsStrip />
    </>
  );
}
