import { Suspense } from 'react';
import AuthForm from '../../../components/auth/AuthForm';
import Link from 'next/link';
import { getDictionary, negotiateLocale } from '../../../lib/i18n/i18n';

export default async function SignInPage() {
  const lang = await negotiateLocale();
  const dict = await getDictionary(lang);
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-slate-950 dark:to-slate-950 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <Link href={`/${lang}`} className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100 hover:text-cyan-600 transition">
            {dict.brand.name}
          </Link>
          <p className="text-sm sm:text-base text-gray-600 dark:text-slate-400 mt-2">{dict.auth?.signinSubtitle ?? 'Welcome back! Sign in to your account'}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 sm:p-8">
          <Suspense fallback={<div className="text-center">Loading...</div>}>
            <AuthForm mode="signin" />
          </Suspense>
        </div>

        <div className="text-center mt-4 sm:mt-6 text-xs sm:text-sm text-gray-600 dark:text-slate-400">
          {dict.auth?.noAccount ?? "Don't have an account?"}{' '}
          <Link href={`/${lang}/auth/signup`} className="text-cyan-600 hover:text-cyan-700 font-medium">
            {dict.auth?.signup ?? 'Sign up'}
          </Link>
        </div>
      </div>
    </div>
  );
}