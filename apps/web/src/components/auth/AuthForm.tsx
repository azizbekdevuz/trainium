'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import SocialAuthButtons from './SocialAuthButtons';
import { useI18n } from '../providers/I18nProvider';

interface AuthFormData {
  email: string;
  password: string;
  name?: string;
}

interface AuthFormProps {
  mode: 'signin' | 'signup';
}

export default function AuthForm({ mode }: AuthFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const { dict } = useI18n();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthFormData>();

  const onSubmit = async (data: AuthFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      if (mode === 'signup') {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || (dict.auth?.form?.registrationFailed ?? 'Registration failed'));
        }

        const result = await signIn('credentials', {
          email: data.email,
          password: data.password,
          redirect: false,
        });

        if (result?.error) {
          throw new Error(dict.auth?.form?.signinAfterRegistrationFailed ?? 'Sign in failed after registration');
        }

        router.push(callbackUrl);
      } else {
        const result = await signIn('credentials', {
          email: data.email,
          password: data.password,
          redirect: false,
        });

        if (result?.error) {
          throw new Error(dict.auth?.form?.signinFailed ?? 'Invalid email or password');
        }

        router.push(callbackUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : (dict.auth?.form?.genericError ?? 'An error occurred'));
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    'input-field w-full text-sm sm:text-base focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--accent)_35%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]';

  return (
    <div className="space-y-4 sm:space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
        {mode === 'signup' && (
          <div>
            <label htmlFor="name" className="mb-1 block text-xs font-medium text-ui-secondary sm:text-sm">
              {dict.auth?.form?.nameLabel ?? 'Full Name'}
            </label>
            <input
              {...register('name', { required: mode === 'signup' ? (dict.auth?.form?.nameReq ?? 'Name is required') : false })}
              type="text"
              id="name"
              className={inputClass}
              placeholder={dict.auth?.form?.namePh ?? 'Enter your full name'}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>
        )}

        <div>
          <label htmlFor="email" className="mb-1 block text-xs font-medium text-ui-secondary sm:text-sm">
            {dict.auth?.form?.emailLabel ?? 'Email Address'}
          </label>
          <input
            {...register('email', {
              required: dict.auth?.form?.emailReq ?? 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: dict.auth?.form?.emailInvalid ?? 'Invalid email address',
              },
            })}
            type="email"
            id="email"
            className={inputClass}
            placeholder={dict.auth?.form?.emailPh ?? 'Enter your email'}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-xs font-medium text-ui-secondary sm:text-sm">
            {dict.auth?.form?.passwordLabel ?? 'Password'}
          </label>
          <input
            {...register('password', {
              required: dict.auth?.form?.passwordReq ?? 'Password is required',
              minLength: {
                value: 8,
                message: dict.auth?.form?.passwordMin ?? 'Password must be at least 8 characters',
              },
            })}
            type="password"
            id="password"
            className={inputClass}
            placeholder={dict.auth?.form?.passwordPh ?? 'Enter your password'}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>

        {error && (
          <div className="glass-surface rounded-[var(--radius-lg)] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-200">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full rounded-xl py-2.5 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
        >
          {isLoading ? (dict.auth?.form?.loading ?? 'Loading...') : (mode === 'signup' ? (dict.auth?.form?.submitSignup ?? 'Create Account') : (dict.auth?.form?.submitSignin ?? 'Sign In'))}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-ui-default" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-ui-surface text-ui-muted px-2">Or continue with</span>
        </div>
      </div>

      <SocialAuthButtons />
    </div>
  );
}
