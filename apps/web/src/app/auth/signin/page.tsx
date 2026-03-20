import { Suspense } from "react";
import AuthForm from "../../../components/auth/AuthForm";
import Link from "next/link";
import { getDictionary, negotiateLocale } from "../../../lib/i18n/i18n";

export default async function SignInPage() {
  const lang = await negotiateLocale();
  const dict = await getDictionary(lang);
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center sm:mb-8">
          <Link
            href={`/${lang}`}
            className="font-display text-2xl font-extrabold tracking-[-0.04em] text-ui-primary transition hover:opacity-85 sm:text-3xl"
          >
            {dict.brand.name}
            <span className="text-brand-dot">.</span>
          </Link>
          <p className="mt-2 text-sm text-ui-muted sm:text-base">
            {dict.auth?.signinSubtitle ?? "Welcome back! Sign in to your account"}
          </p>
        </div>

        <div className="glass-elevated rounded-[22px] p-6 sm:p-8">
          <Suspense
            fallback={
              <div className="text-center text-ui-muted">Loading...</div>
            }
          >
            <AuthForm mode="signin" />
          </Suspense>
        </div>

        <div className="mt-4 text-center text-xs text-ui-muted sm:mt-6 sm:text-sm">
          {dict.auth?.noAccount ?? "Don't have an account?"}{" "}
          <Link href={`/${lang}/auth/signup`} className="text-accent font-semibold transition hover:opacity-80">
            {dict.auth?.signup ?? "Sign up"}
          </Link>
        </div>
      </div>
    </div>
  );
}
