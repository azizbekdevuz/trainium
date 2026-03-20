'use client';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useI18n } from '../providers/I18nProvider';

export default function AuthLinks() {
  const { data: session, status } = useSession();
  const { t, lang } = useI18n();

  if (status === 'loading') {
    return <div className="text-sm text-ui-faint">…</div>;
  }

  return session?.user ? (
    <div className="flex flex-col sm:flex-row items-center gap-3 text-sm">
      <Link 
        href={`/${lang}/account`} 
        className="glass-surface w-full rounded-lg border border-[var(--border-default)] px-4 py-2 text-center text-ui-primary transition-colors hover:brightness-[1.02] dark:border-ui-subtle sm:w-auto"
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
        className="glass-surface w-full rounded-lg border border-[var(--border-default)] px-4 py-2 text-center text-ui-primary transition-colors hover:brightness-[1.02] dark:border-ui-subtle sm:w-auto"
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