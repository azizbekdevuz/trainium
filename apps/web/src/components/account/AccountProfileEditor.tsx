'use client';

import { useEffect, useState, useTransition } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useI18n } from '../providers/I18nProvider';
import { Form } from '../ui/forms/Form';
import FileUpload from '../ui/media/FileUpload';

export default function AccountProfileEditor({ initialName, initialImage, initialEmail, onUpdated, onClose }: { initialName: string | null; initialImage: string | null; initialEmail?: string | null; onUpdated: (u: { name: string | null; image: string | null }) => void; onClose: () => void }) {
  const { t, lang } = useI18n();
  const { update: updateSession } = useSession();
  const [name, setName] = useState(initialName ?? '');
  const [image, setImage] = useState(initialImage ?? '');
  const [email, setEmail] = useState<string>(initialEmail ?? '');
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; currentPassword?: string; newPassword?: string }>({});
  const [removing, setRemoving] = useState<boolean>(false);
  const [confirmEmail, setConfirmEmail] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [showDelete, setShowDelete] = useState<boolean>(false);

  const PASSWORD_MIN = 8;
  const isEmailValid = (value: string) => /.+@.+\..+/.test(value);
  const hasPasswordInput = Boolean(currentPassword) || Boolean(newPassword);
  const accountEmail = (initialEmail ?? '').trim();
  const canDelete = !!accountEmail && confirmEmail.trim().toLowerCase() === accountEmail.toLowerCase();

  useEffect(() => {
    if (!copied) return undefined;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);

  function validate(): boolean {
    const next: typeof fieldErrors = {};
    const emailTrim = email.trim();
    const emailChanged = emailTrim !== (initialEmail ?? '');
    if (emailTrim && emailChanged && !isEmailValid(emailTrim)) {
      next.email = t('auth.form.emailInvalid', 'Invalid email address');
    }
    if (hasPasswordInput) {
      if (!currentPassword) next.currentPassword = t('auth.form.passwordReq', 'Password is required');
      if (!newPassword) next.newPassword = t('auth.form.passwordReq', 'Password is required');
      if (newPassword && newPassword.length < PASSWORD_MIN) {
        next.newPassword = t('auth.form.passwordMin', 'Password must be at least 8 characters');
      }
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  const submit = () => {
    setError(null);
    startTransition(async () => {
      if (!validate()) return;
      try {
        // Prepare changed-only payload to avoid unnecessary writes
        const payload: any = {};
        const nameTrim = name.trim();
        if (nameTrim !== (initialName ?? '')) payload.name = nameTrim;
        const emailTrim = email.trim();
        if (emailTrim && emailTrim !== (initialEmail ?? '')) payload.email = emailTrim;
        // Always send image if a non-empty URL is present, so server persists avatar updates reliably
        if (image.trim()) payload.image = image.trim();
        if (hasPasswordInput) {
          if (currentPassword) payload.currentPassword = currentPassword;
          if (newPassword) payload.newPassword = newPassword;
        }

        const res = await fetch('/api/account/profile', {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          setError(t('account.profile.updateFailed', 'Failed to update profile'));
          return;
        }
        const data = await res.json();
        onUpdated({ name: data.user?.name ?? null, image: data.user?.image ?? null });
        await updateSession();
        onClose();
      } catch {
        setError(t('account.profile.updateFailed', 'Failed to update profile'));
      }
    });
  };

  return (
    <Form 
      open={true} 
      onClose={onClose} 
      title={t('account.profile.title', 'Edit profile')}
    >
      <div className="space-y-3">
          <label className="block text-sm text-ui-secondary">
            {t('account.profile.name', 'Name')}
            <input value={name} onChange={e => setName(e.target.value)} className="mt-1 h-10 w-full rounded-xl border px-3" />
          </label>
          <label className="block text-sm text-ui-secondary">
            {t('auth.form.emailLabel', 'Email Address')}
            <input value={email} onChange={e => setEmail(e.target.value)} className={`mt-1 h-10 w-full rounded-xl border px-3 ${fieldErrors.email ? 'border-red-400' : ''}`} placeholder="you@example.com" />
            {fieldErrors.email && <div className="mt-1 text-xs text-red-600">{fieldErrors.email}</div>}
          </label>
          <div className="mt-1">
            <button type="button" onClick={() => setShowPassword(v => !v)} className="text-xs text-cyan-700 hover:text-cyan-800 underline">
              {showPassword ? t('common.cancel', 'Cancel') : t('account.profile.changePassword', 'Change password')}
            </button>
          </div>
          {showPassword && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block text-sm text-ui-secondary">
                {t('account.profile.currentPassword', 'Current password')}
                <input value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} type="password" className={`mt-1 h-10 w-full rounded-xl border px-3 ${fieldErrors.currentPassword ? 'border-red-400' : ''}`} />
                {fieldErrors.currentPassword && <div className="mt-1 text-xs text-red-600">{fieldErrors.currentPassword}</div>}
              </label>
              <label className="block text-sm text-ui-secondary">
                {t('account.profile.newPassword', 'New password (optional)')}
                <input value={newPassword} onChange={e => setNewPassword(e.target.value)} type="password" className={`mt-1 h-10 w-full rounded-xl border px-3 ${fieldErrors.newPassword ? 'border-red-400' : ''}`} />
                {fieldErrors.newPassword && <div className="mt-1 text-xs text-red-600">{fieldErrors.newPassword}</div>}
              </label>
            </div>
          )}
          <div>
            <label className="block text-sm text-ui-secondary mb-1">{t('account.profile.image', 'Avatar URL (optional)')}</label>
            <FileUpload
              key={image || 'empty'}
              name="avatar"
              label={t('account.profile.image', 'Avatar URL (optional)')}
              allowedFormats={[ 'image/jpeg','image/png','image/webp' ]}
              maxSize={5}
              className="dark:text-slate-200"
              uploadTo="/api/account/profile/avatar"
              onUploaded={(url) => { setImage(url); onUpdated({ name: (name.trim() || null), image: url }); updateSession(); }}
              onError={() => setError(t('account.profile.updateFailed', 'Failed to update profile'))}
            />
            {image ? (
              <div className="mt-2 text-xs text-ui-faint dark:text-ui-faint">{image}</div>
            ) : null}
          </div>
        {image && (
          <div className="flex justify-end">
            <button
              type="button"
              disabled={removing}
              onClick={async () => {
                setError(null);
                setRemoving(true);
                try {
                  const res = await fetch('/api/account/profile/avatar', { method: 'DELETE' });
                  if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    throw new Error(data.error || 'Failed');
                  }
                  setImage('');
                  onUpdated({ name: (name.trim() || null), image: null });
                  await updateSession();
                } catch {
                  setError(t('account.profile.updateFailed', 'Failed to update profile'));
                } finally {
                  setRemoving(false);
                }
              }}
              className="mt-2 h-9 px-3 rounded-lg border text-red-700 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              {removing ? t('checkout.processing', 'Processing...') : t('account.profile.removeAvatar', 'Remove avatar')}
            </button>
          </div>
        )}
          {error && <div className="text-sm text-red-600">{error}</div>}
          {/* Delete trigger + confirmation (collapsed by default) */}
          <div className="mt-2">
            {!showDelete && (
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setShowDelete(true)}
                  className="text-xs text-red-600 hover:text-red-700 underline"
                >
                  {t('account.profile.delete', 'Delete account')}
                </button>
              </div>
            )}
          </div>
          {showDelete && (
          <div className="mt-2 rounded-xl border p-3 bg-ui-inset dark:bg-ui-elevated/50 dark:border-ui-subtle">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs text-ui-muted dark:text-ui-faint">
                {t('account.profile.deleteTitle', 'Delete account?')}
              </div>
              {accountEmail && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-ui-muted dark:text-ui-faint select-all">{accountEmail}</span>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(accountEmail);
                        setCopied(true);
                      } catch {
                        // Fallback for older browsers
                        const ta = document.createElement('textarea');
                        ta.value = accountEmail;
                        ta.style.position = 'fixed';
                        ta.style.left = '-1000px';
                        document.body.appendChild(ta);
                        ta.select();
                        try { document.execCommand('copy'); setCopied(true); } catch { /* ignore clipboard errors */ }
                        document.body.removeChild(ta);
                      }
                    }}
                    className="px-2 py-1 rounded-lg border text-xs text-ui-secondary hover:bg-ui-inset transition dark:border-ui-subtle dark:text-slate-200 dark:hover:bg-ui-inset"
                  >
                    {copied ? t('common.copied', 'Copied!') : t('common.copy', 'Copy')}
                  </button>
                </div>
              )}
            </div>
            <div className="mt-2">
              <label className="block text-xs text-ui-muted dark:text-ui-faint mb-1">
                {t('account.profile.deleteConfirm', 'Type your email to confirm:')}
              </label>
              <input
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                placeholder={accountEmail || 'you@example.com'}
                className="h-10 w-full rounded-xl border px-3 glass-surface dark:border-ui-subtle dark:text-slate-100"
              />
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => setShowDelete(false)}
                  className="text-xs text-ui-muted hover:text-ui-secondary underline dark:text-ui-faint"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
              </div>
            </div>
          </div>
          )}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 px-4 py-2 border border-ui-default text-ui-secondary rounded-xl text-sm font-medium hover:bg-ui-inset transition dark:border-ui-subtle dark:text-slate-200 dark:hover:bg-ui-elevated"
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <div className="flex items-center gap-2">
              {showDelete && (
                <button
                  type="button"
                  disabled={!canDelete || removing}
                  onClick={async () => {
                    try {
                      setRemoving(true);
                      const res = await fetch('/api/account/profile', { method: 'DELETE' });
                      if (!res.ok) throw new Error('Failed');
                      await signOut({ callbackUrl: `/${lang}` });
                    } catch {
                      setError(t('account.profile.deletedFailed', 'Failed to delete account'));
                    } finally {
                      setRemoving(false);
                    }
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-xl text-sm font-medium hover:bg-red-50 transition disabled:opacity-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20"
                >
                  {removing ? t('checkout.processing', 'Processing...') : t('account.profile.delete', 'Delete account')}
                </button>
              )}
              <button
                disabled={isPending}
                onClick={submit}
                className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-xl text-sm font-medium hover:bg-cyan-700 transition disabled:opacity-50"
              >
                {t('common.save', 'Save')}
              </button>
            </div>
          </div>
        </div>
    </Form>
  );
}


