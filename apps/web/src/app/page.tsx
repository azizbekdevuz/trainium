import ScrollProgress from "../components/home/ScrollProgress";
import { Hero } from "../components/home/Hero";
import { Badges } from "../components/home/Badges";
import Marquee from "../components/home/Marquee";
import { CategoryTiles } from "../components/home/CategoryTiles";
import StickyFeatures from "../components/home/StickyFeatures";
import ParallaxGallery from "../components/home/ParallaxGallery";
import BestSellers from "../components/home/BestSellers";
import { Guarantees } from "../components/home/Guarantees";
import { RecommendedProducts } from "../components/recommendations/RecommendedProducts";
import StatsBand from "../components/home/StatsBand";
import TechPillars from "../components/home/TechPillars";
import SocialProof from "../components/home/SocialProof";
import HomeHeaderActivator from "../components/nav/HomeHeaderActivator";
import HomeHeaderSpacer from "../components/nav/HomeHeaderSpacer";

export const revalidate = 60;

export default async function Home() {
  return (
    <>
      <HomeHeaderActivator />
      <HomeHeaderSpacer />
      <ScrollProgress />
      <Hero />
      <Badges />
      <Marquee />
      <CategoryTiles />
      <StatsBand />
      <StickyFeatures />
      <ParallaxGallery />
      <BestSellers />
      <RecommendedProducts
        context="home"
        initialLimit={5}
        showTitle={true}
      />
      <TechPillars />
      <SocialProof />
      <Guarantees />
    </>
  );
}