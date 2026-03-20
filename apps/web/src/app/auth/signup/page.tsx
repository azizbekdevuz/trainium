import { Suspense } from "react";
import AuthForm from "../../../components/auth/AuthForm";
import Link from "next/link";
import { getDictionary, negotiateLocale } from "../../../lib/i18n/i18n";

export default async function SignUpPage() {
  const lang = await negotiateLocale();
  const dict = await getDictionary(lang);
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link
            href={`/${lang}`}
            className="font-display text-3xl font-extrabold tracking-[-0.04em] text-ui-primary transition hover:opacity-85"
          >
            {dict.brand.name}
            <span className="text-brand-dot">.</span>
          </Link>
          <p className="mt-2 text-ui-muted">
            {dict.auth?.signupSubtitle ?? "Create your account to get started"}
          </p>
        </div>

        <div className="glass-elevated rounded-[22px] p-8">
          <Suspense
            fallback={
              <div className="text-center text-ui-muted">Loading...</div>
            }
          >
            <AuthForm mode="signup" />
          </Suspense>
        </div>

        <div className="mt-6 text-center text-sm text-ui-muted">
          {dict.auth?.haveAccount ?? "Already have an account?"}{" "}
          <Link href={`/${lang}/auth/signin`} className="text-accent font-semibold transition hover:opacity-80">
            {dict.auth?.signin ?? "Sign in"}
          </Link>
        </div>
      </div>
    </div>
  );
}
