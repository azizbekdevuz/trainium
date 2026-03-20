import { redirect } from 'next/navigation';
import { auth } from '../../../../auth';
import { prisma } from '../../../../lib/database/db';
import { hashPassword } from '../../../../lib/auth/password';
import { getDictionary, negotiateLocale } from '../../../../lib/i18n/i18n';

export const runtime = 'nodejs';

/** Bootstrap allowed only when zero ADMIN users exist. Enforced in action. */
async function canBootstrap(): Promise<boolean> {
  const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
  return adminCount === 0;
}

export default async function AdminSignupPage() {
  const session = await auth();
  const lang = await negotiateLocale();
  const dict = await getDictionary(lang);
  if (session?.user && (session.user as any).role === 'ADMIN') {
    redirect('/admin');
  }

  const bootstrapAllowed = await canBootstrap();

  async function doSignup(formData: FormData) {
    'use server';
    const email = String(formData.get('email') || '').trim();
    const name = String(formData.get('name') || '').trim();
    const password = String(formData.get('password') || '');
    if (!email || !password) return;

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return;

    // Bootstrap gate: allow only when zero admins exist. Use transaction for race safety.
    const created = await prisma.$transaction(async (tx) => {
      const adminCount = await tx.user.count({ where: { role: 'ADMIN' } });
      if (adminCount > 0) return null;
      const hashed = await hashPassword(password);
      return tx.user.create({ data: { email, name, password: hashed, role: 'ADMIN' } });
    });
    if (!created) redirect('/admin/auth/signup'); // Bootstrap closed; show closed state

    redirect('/admin/auth/login');
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-slate-950 dark:to-slate-950 dark:bg-ui-base flex items-center justify-center p-4">
      <div className="mx-auto w-full max-w-md px-6 py-10 glass-surface rounded-2xl shadow-xl">
      <h1 className="font-display text-2xl mb-4 text-ui-primary">{dict.admin?.auth?.signup ?? 'Admin Sign up'}</h1>
      {!bootstrapAllowed ? (
        <p className="text-ui-muted dark:text-ui-faint">
          {dict.admin?.auth?.bootstrapClosed ?? 'Admin signup is closed. An admin account already exists.'}
        </p>
      ) : (
        <form action={doSignup} className="space-y-4">
          <div>
            <label className="block text-sm text-ui-muted dark:text-ui-faint mb-1">{dict.admin?.auth?.name ?? 'Name'}</label>
            <input name="name" className="h-11 w-full rounded-xl border px-3" />
          </div>
          <div>
            <label className="block text-sm text-ui-muted dark:text-ui-faint mb-1">{dict.admin?.auth?.email ?? 'Email'}</label>
            <input name="email" type="email" required className="h-11 w-full rounded-xl border px-3" />
          </div>
          <div>
            <label className="block text-sm text-ui-muted dark:text-ui-faint mb-1">{dict.admin?.auth?.password ?? 'Password'}</label>
            <input name="password" type="password" required className="h-11 w-full rounded-xl border px-3" />
          </div>
          <button type="submit" className="h-11 px-6 rounded-xl bg-gray-900 text-white hover:bg-gray-800">{dict.admin?.auth?.create ?? 'Create Admin'}</button>
        </form>
      )}
      </div>
    </div>
  );
}


