import { redirect } from 'next/navigation';
import { auth, signIn } from '../../../../auth';
import { getDictionary, negotiateLocale } from '../../../../lib/i18n';

export const runtime = 'nodejs';

export default async function AdminLoginPage() {
  const session = await auth();
  const lang = await negotiateLocale();
  const dict = await getDictionary(lang);
  if (session?.user && (session.user as any).role === 'ADMIN') {
    redirect('/admin');
  }

  async function doLogin(formData: FormData) {
    'use server';
    const email = String(formData.get('email') || '');
    const password = String(formData.get('password') || '');
    await signIn('credentials', { redirectTo: '/admin', email, password });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-slate-950 dark:to-slate-950 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="mx-auto w-full max-w-md px-6 py-10 bg-white dark:bg-slate-900 rounded-2xl shadow-xl">
      <h1 className="font-display text-2xl mb-4 text-gray-900 dark:text-slate-100">{dict.admin?.auth?.signin ?? 'Admin Sign in'}</h1>
      <form action={doLogin} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-600 dark:text-slate-300 mb-1">{dict.admin?.auth?.email ?? 'Email'}</label>
          <input name="email" type="email" required className="h-11 w-full rounded-xl border px-3" />
        </div>
        <div>
          <label className="block text-sm text-gray-600 dark:text-slate-300 mb-1">{dict.admin?.auth?.password ?? 'Password'}</label>
          <input name="password" type="password" required className="h-11 w-full rounded-xl border px-3" />
        </div>
        <button type="submit" className="h-11 px-6 rounded-xl bg-gray-900 text-white hover:bg-gray-800">{dict.auth?.signin ?? 'Sign in'}</button>
      </form>
      </div>
    </div>
  );
}


