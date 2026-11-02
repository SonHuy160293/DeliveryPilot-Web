import { PageStateGate, usePagePreviewState } from "@/components/PageStateGate";
import { HomeHero } from "@/features/marketing/HomeHero";
import { HomeSections } from "@/features/marketing/HomeSections";

export function HomePage() {
  const state = usePagePreviewState();
  return (
    <PageStateGate state={state} scope="Home page">
      <div className="min-w-0 wrap-anywhere">
        <HomeHero />
        <HomeSections />
      </div>
    </PageStateGate>
  );
}
