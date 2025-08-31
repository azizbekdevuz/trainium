'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
// import { useResponsive } from '../../hooks/useResponsive';
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
  // const { isMobile } = useResponsive();
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

  return (
    <div className="space-y-4 sm:space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
        {mode === 'signup' && (
          <div>
            <label htmlFor="name" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              {dict.auth?.form?.nameLabel ?? 'Full Name'}
            </label>
            <input
              {...register('name', { required: mode === 'signup' ? (dict.auth?.form?.nameReq ?? 'Name is required') : false })}
              type="text"
              id="name"
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              placeholder={dict.auth?.form?.namePh ?? 'Enter your full name'}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
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
            className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            placeholder={dict.auth?.form?.emailPh ?? 'Enter your email'}
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
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
            className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            placeholder={dict.auth?.form?.passwordPh ?? 'Enter your password'}
          />
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-cyan-600 text-white py-2 px-4 rounded-lg hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 text-sm sm:text-base"
        >
          {isLoading ? (dict.auth?.form?.loading ?? 'Loading...') : (mode === 'signup' ? (dict.auth?.form?.submitSignup ?? 'Create Account') : (dict.auth?.form?.submitSignin ?? 'Sign In'))}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with</span>
        </div>
      </div>

      <SocialAuthButtons />
    </div>
  );
}