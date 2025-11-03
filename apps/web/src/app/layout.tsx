import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { getDictionary, negotiateLocale } from "../lib/i18n";
import SessionProviderWrapper from "../components/providers/SessionProviderWrapper";
import { auth } from "../auth";
import InteractiveBackground from "../components/background/InteractiveBackground";
import "./globals.css";
import { ToastContainer } from "../lib/toast";
import { I18nProvider } from "../components/providers/I18nProvider";
import ThemeProvider from "../components/providers/ThemeProvider";
import Footer from "../components/layout/Footer";
import { ResponsiveNavigation } from "../components/nav/ResponsiveNavigation";

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const space = Space_Grotesk({ subsets: ['latin'], variable: '--font-space' });

export const metadata: Metadata = {
  title: "Trainium",
  description: "High-tech fitness equipments",
};


export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const lang = await negotiateLocale();
  const dict = await getDictionary(lang);
  return (
    <html lang={lang} className={`${inter.variable} ${space.variable}`} suppressHydrationWarning>
      <body className="body-grid relative min-h-screen flex flex-col">
        <script
          dangerouslySetInnerHTML={{
            __html: `!function(){try{var m=document.cookie.match(/(?:^|; )theme=([^;]+)/);var t=m?decodeURIComponent(m[1]):localStorage.getItem('theme');var d=t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches);var c=document.documentElement.classList;c[d?'add':'remove']('dark')}catch(e){}}();`
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
      </body>
    </html >
  );
}