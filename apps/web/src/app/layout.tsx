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