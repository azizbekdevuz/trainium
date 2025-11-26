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
import type { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Trainium – Premium Fitness Equipment',
  description: 'Shop premium fitness equipment: treadmills, dumbbells, exercise bikes. Fast delivery in Korea. 트레이니엄 피트니스 장비.',
  alternates: {
    languages: {
      'en': 'https://trainium.shop/en',
      'ko': 'https://trainium.shop/ko',
      'uz': 'https://trainium.shop/uz',
    },
  },
  openGraph: {
    title: 'Trainium – Premium Fitness Equipment',
    description: 'High-tech fitness equipment with fast delivery in Korea.',
    url: 'https://trainium.shop',
    type: 'website',
  },
};

export default async function Home() {
  return (
    <>
      {/* Organization JSON-LD */}
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Trainium',
            url: 'https://trainium.shop',
            logo: 'https://trainium.shop/images/logo-banner.png',
          }),
        }}
      />
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