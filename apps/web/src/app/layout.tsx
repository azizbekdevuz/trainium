import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Inter, Space_Grotesk } from "next/font/google";
import { getDictionary, negotiateLocale } from "../lib/i18n/i18n";
import SessionProviderWrapper from "../components/providers/SessionProviderWrapper";
import { auth } from "../auth";
import InteractiveBackground from "../components/background/InteractiveBackground";
import "./globals.css";
import { ToastContainer } from "../lib/ui/toast";
import { I18nProvider } from "../components/providers/I18nProvider";
import ThemeProvider from "../components/providers/ThemeProvider";
import Footer from "../components/layout/Footer";
import { ResponsiveNavigation } from "../components/nav/ResponsiveNavigation";
import Script from "next/script";

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const space = Space_Grotesk({ subsets: ['latin'], variable: '--font-space' });

export const metadata: Metadata = {
  metadataBase: new URL('https://trainium.shop'),
  title: {
    default: 'Trainium | Premium Fitness Equipment',
    template: '%s | Trainium'
  },
  description: 'Premium fitness equipment for serious training. Treadmills, dumbbells, exercise bikes with fast delivery in Korea.',
  keywords: [
    'trainium', 'fitness equipment', 'fitness', 'gym equipment', 'home gym', 'treadmill', 'dumbbells',
    'exercise bike', 'ellipticals', 'strength equipment', 'cardio equipment',
    '피트니스 장비', '헬스 기구', '홈짐', '러닝머신', '덤벨', '실내 자전거', '피트니스', '헬스'
  ],
  alternates: {
    canonical: 'https://trainium.shop',
    languages: {
      'x-default': 'https://trainium.shop/en',
      'en': 'https://trainium.shop/en',
      'ko': 'https://trainium.shop/ko',
      'uz': 'https://trainium.shop/uz',
    },
  },
  openGraph: {
    type: 'website',
    url: 'https://trainium.shop',
    siteName: 'Trainium',
    title: 'Trainium | Premium Fitness Equipment',
    description: 'High-tech fitness equipment with fast delivery in Korea',
    images: [
      { url: '/images/logo-banner.png', width: 1200, height: 630, alt: 'Trainium' }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trainium | Premium Fitness Equipment',
    description: 'High-tech fitness equipment',
    images: ['/images/logo-banner.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    other: {
      'naver-site-verification': '88cc9b2a952e4659e0905d5a52dd09aff516dcc7'
    }
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const lang = await negotiateLocale();
  const dict = await getDictionary(lang);
  return (
    <html lang={lang} className={`${inter.variable} ${space.variable}`} suppressHydrationWarning>
      <body className="body-grid relative min-h-screen flex flex-col">
        
        {/* 
          1. Theme Script
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var cookieMatch = document.cookie.match(/(?:^|;\\s*)theme=([^;]+)/);
                  var storedTheme = cookieMatch ? decodeURIComponent(cookieMatch[1]) : localStorage.getItem('theme');

                  // default is light unless explicitly "dark"
                  var isDark = storedTheme === 'dark';

                  var root = document.documentElement;
                  if (isDark) {
                    root.classList.add('dark');
                    root.style.colorScheme = 'dark';
                  } else {
                    root.classList.remove('dark');
                    root.style.colorScheme = 'light';
                  }
                } catch (e) {}
              })();
            `
          }}
        />

        {/* 
          2. JSON-LD Schema
        */}
        <Script
            id="schema-website"
            type="application/ld+json"
            strategy="beforeInteractive" // Hoists script to <head>
            dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                    '@context': 'https://schema.org',
                    '@type': 'WebSite',
                    name: 'Trainium',
                    url: 'https://trainium.shop',
                    potentialAction: {
                      '@type': 'SearchAction',
                      target: {
                        '@type': 'EntryPoint',
                        urlTemplate: 'https://trainium.shop/en/products?q={search_term_string}',
                      },
                      'query-input': 'required name=search_term_string',
                    },
                }),
            }}
        />
        <Script
          id="schema-navigation"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'ItemList',
              itemListElement: [
                { '@type': 'SiteNavigationElement', name: 'Shop', url: 'https://trainium.shop/en/products' },
                { '@type': 'SiteNavigationElement', name: 'Deals', url: 'https://trainium.shop/en/special-bargain' },
                { '@type': 'SiteNavigationElement', name: 'About', url: 'https://trainium.shop/en/about' },
                { '@type': 'SiteNavigationElement', name: 'Contact', url: 'https://trainium.shop/en/contact' },
                { '@type': 'SiteNavigationElement', name: 'Track', url: 'https://trainium.shop/en/track' },
              ],
            }),
          }}
        />

        <SessionProviderWrapper initialSession={session}>
          <I18nProvider lang={lang} dict={dict}>
            <ThemeProvider>
              <InteractiveBackground />
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/10 via-transparent to-cyan-600/10 animate-pulse" />
              <header className="site-header inset-x-0 top-0 z-30 border-b glass">
                <ResponsiveNavigation lang={lang} dict={dict} />
              </header>

              <main className="flex-1 relative z-10">
                {children}
              </main>
              <ToastContainer />

              <Footer year={new Date().getFullYear()} brand={dict.brand.name} tagline={dict.footer.tagline} devDict={dict.pages?.about?.dev} />
            </ThemeProvider>
          </I18nProvider>
        </SessionProviderWrapper>
        <Analytics />
      </body>
    </html >
  );
}