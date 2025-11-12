import { Suspense } from 'react';
import AuthForm from '../../../components/auth/AuthForm';
import Link from 'next/link';
import { getDictionary, negotiateLocale } from '../../../lib/i18n/i18n';

export default async function SignUpPage() {
  const lang = await negotiateLocale();
  const dict = await getDictionary(lang);
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-slate-950 dark:to-slate-950 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href={`/${lang}`} className="text-3xl font-bold text-gray-900 dark:text-slate-100 hover:text-cyan-600 transition">
            {dict.brand.name}
          </Link>
          <p className="text-gray-600 dark:text-slate-400 mt-2">{dict.auth?.signupSubtitle ?? 'Create your account to get started'}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8">
          <Suspense fallback={<div className="text-center">Loading...</div>}>
            <AuthForm mode="signup" />
          </Suspense>
        </div>

        <div className="text-center mt-6 text-sm text-gray-600 dark:text-slate-400">
          {dict.auth?.haveAccount ?? 'Already have an account?'}{' '}
          <Link href={`/${lang}/auth/signin`} className="text-cyan-600 hover:text-cyan-700 font-medium">
            {dict.auth?.signin ?? 'Sign in'}
          </Link>
        </div>
      </div>
    </div>
  );
}