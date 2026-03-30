'use client';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useI18n } from '../providers/I18nProvider';

export default function AuthLinks({ compact = false }: { compact?: boolean }) {
  const { data: session, status } = useSession();
  const { t, lang } = useI18n();

  if (status === 'loading') {
    return <div className="text-sm text-ui-faint">…</div>;
  }

  return session?.user ? (
    <div
      className={
        compact
          ? 'flex flex-row items-center gap-1.5 text-xs'
          : 'flex flex-col items-center gap-3 text-sm sm:flex-row'
      }
    >
      <Link
        href={`/${lang}/account`}
        className={
          compact
            ? 'glass-surface rounded-xl border border-[var(--border-default)] px-3 py-2 text-center font-semibold text-ui-primary transition-colors hover:brightness-[1.02] dark:border-ui-subtle'
            : 'glass-surface w-full rounded-lg border border-[var(--border-default)] px-4 py-2 text-center text-ui-primary transition-colors hover:brightness-[1.02] dark:border-ui-subtle sm:w-auto'
        }
      >
        {t('nav.account', 'My Account')}
      </Link>
      <button
        type="button"
        onClick={() => signOut()}
        className={
          compact
            ? 'rounded-xl bg-red-600 px-3 py-2 text-center font-semibold text-white transition-colors hover:bg-red-700'
            : 'w-full rounded-lg bg-red-600 px-4 py-2 text-center text-white transition-colors hover:bg-red-700 sm:w-auto'
        }
      >
        {t('auth.signout', 'Sign out')}
      </button>
    </div>
  ) : (
    <div
      className={
        compact
          ? 'flex flex-row flex-wrap items-center justify-end gap-1.5 text-xs'
          : 'flex flex-col items-center gap-3 text-sm sm:flex-row'
      }
    >
      <Link
        href={`/${lang}/auth/signin`}
        className={
          compact
            ? 'glass-surface rounded-xl border border-[var(--border-default)] px-3 py-2 text-center font-semibold text-ui-primary transition-colors hover:brightness-[1.02] dark:border-ui-subtle'
            : 'glass-surface w-full rounded-lg border border-[var(--border-default)] px-4 py-2 text-center text-ui-primary transition-colors hover:brightness-[1.02] dark:border-ui-subtle sm:w-auto'
        }
      >
        {t('auth.signin', 'Sign in')}
      </Link>
      <Link
        href={`/${lang}/auth/signup`}
        className={
          compact
            ? 'rounded-xl bg-cyan-600 px-3 py-2 text-center font-semibold text-white transition-colors hover:bg-cyan-700'
            : 'w-full rounded-lg bg-cyan-600 px-4 py-2 text-center font-semibold text-white transition-colors hover:bg-cyan-700 sm:w-auto'
        }
      >
        {t('auth.signup', 'Sign up')}
      </Link>
    </div>
  );
}