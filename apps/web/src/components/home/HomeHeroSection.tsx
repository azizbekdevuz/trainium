import { HeroBento } from "./HeroBento";
import BestSellers from "./BestSellers";

export default async function HomeHeroSection() {
  return (
    <section className="mx-auto max-w-[1380px] px-4 py-5 sm:px-6 sm:py-6">
      <div className="bento-hero gap-2.5">
        <HeroBento />
        <div className="glass-surface flex min-h-[280px] flex-col gap-2.5 rounded-[22px] p-4 lg:min-h-[420px]">
          <BestSellers variant="heroPanel" />
        </div>
      </div>
    </section>
  );
}
