'use client';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useI18n } from '../providers/I18nProvider';

export default function AuthLinks() {
  const { data: session, status } = useSession();
  const { t, lang } = useI18n();

  if (status === 'loading') {
    return <div className="text-sm text-gray-400">…</div>;
  }

  return session?.user ? (
    <div className="flex flex-col sm:flex-row items-center gap-3 text-sm">
      <Link 
        href={`/${lang}/account`} 
        className="w-full sm:w-auto text-center px-4 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors border border-slate-200 dark:border-slate-600"
      >
        {t('nav.account', 'My Account')}
      </Link>
      <button 
        onClick={() => signOut()} 
        className="w-full sm:w-auto text-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
      >
        {t('auth.signout', 'Sign out')}
      </button>
    </div>
  ) : (
    <div className="flex flex-col sm:flex-row items-center gap-3 text-sm">
      <Link 
        href={`/${lang}/auth/signin`} 
        className="w-full sm:w-auto text-center px-4 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors border border-slate-200 dark:border-slate-600"
      >
        {t('auth.signin', 'Sign in')}
      </Link>
      <Link 
        href={`/${lang}/auth/signup`} 
        className="w-full sm:w-auto text-center px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors font-semibold"
      >
        {t('auth.signup', 'Sign up')}
      </Link>
    </div>
  );
}