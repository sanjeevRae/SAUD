'use client';

import { FormEvent, useState } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';
import { useCustomerAuth } from '@/context/CustomerAuthContext';
import { signInWithGooglePopup } from '@/lib/firebaseClient';

export default function LoginModal() {
  const { isLoginOpen, closeLogin, login, authStatus } = useCustomerAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  if (!isLoginOpen) return null;

  const inputClass =
    'h-14 w-full rounded-full border border-[#dedede] bg-white px-7 text-sm font-semibold text-[#111] outline-none ring-0 transition placeholder:text-[#b8b8b8] focus:border-[#111] focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 invalid:border-[#dedede] invalid:shadow-none';

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');

    if (mode === 'register' && !name.trim()) return setFormError('Enter your name.');
    if (!email.trim()) return setFormError('Enter your email.');
    if (!password.trim()) return setFormError('Enter your password.');

    void login({ mode, method: 'email', name, email, password });
  };

  const googleLogin = async () => {
    setFormError('');
    setGoogleLoading(true);
    try {
      const result = await signInWithGooglePopup();
      const googleUser = result.user;
      if (!googleUser.email) {
        setFormError('Google account email missing.');
        return;
      }

      await login({
        mode: 'register',
        method: 'google',
        name: googleUser.displayName || googleUser.email.split('@')[0] || 'Google user',
        email: googleUser.email,
        photo: googleUser.photoURL || '',
        firebaseUid: googleUser.uid,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Google login failed.';
      setFormError(
        message.includes('auth/unauthorized-domain')
          ? `This domain is not allowed for Google login. Add ${window.location.hostname} in Firebase Auth > Settings > Authorized domains.`
          : message,
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-white/85 px-4 py-8 backdrop-blur-sm" onClick={closeLogin}>
      <form
        noValidate
        onSubmit={submit}
        className="relative w-full max-w-[520px] bg-white px-6 py-8 text-[#111] shadow-[0_28px_90px_rgba(0,0,0,0.16)] sm:px-10 sm:py-10"
        onClick={event => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={closeLogin}
          className="absolute right-5 top-5 rounded-full p-2 text-[#111] outline-none transition hover:bg-[#f4f4f4] focus:outline-none focus:ring-0"
          aria-label="Close login"
        >
          <X size={18} />
        </button>

        <h2 className="text-[34px] font-semibold leading-none tracking-[-0.02em]">Welcome!</h2>
        <p className="mt-8 max-w-[410px] text-sm leading-6 text-[#555]">
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setFormError('');
            }}
            className="font-bold text-[#111] underline underline-offset-2 outline-none focus:outline-none"
          >
            Create a free account
          </button>{' '}
          or log in to get started using Saud Leather
        </p>

        {mode === 'register' && (
          <label className="mt-9 block">
            <span className="mb-3 block text-xs font-semibold text-[#3f3f3f]">Name</span>
            <input value={name} onChange={event => setName(event.target.value)} className={inputClass} placeholder="Enter your name" />
          </label>
        )}

        <label className={`${mode === 'register' ? 'mt-5' : 'mt-12'} block`}>
          <span className="mb-3 block text-xs font-semibold text-[#3f3f3f]">Email</span>
          <input type="email" value={email} onChange={event => setEmail(event.target.value)} className={inputClass} placeholder="example@gmail.com" />
        </label>

        <label className="mt-6 block">
          <span className="mb-3 block text-xs font-semibold text-[#3f3f3f]">Password</span>
          <span className="flex h-14 items-center rounded-full border border-[#dedede] bg-white px-7 transition focus-within:border-[#111]">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={event => setPassword(event.target.value)}
              className="min-w-0 flex-1 border-0 bg-transparent text-sm font-semibold tracking-[0.45em] text-[#111] outline-none ring-0 placeholder:tracking-[0.45em] focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 invalid:shadow-none"
              placeholder="••••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(value => !value)}
              className="ml-3 rounded-full p-1 text-[#111] outline-none focus:outline-none focus:ring-0"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </span>
        </label>

        <div className="mt-5 text-right">
          <button type="button" className="text-sm font-bold text-[#111] underline underline-offset-2 outline-none focus:outline-none">
            Forgot password?
          </button>
        </div>

        {(formError || authStatus) && <p className="mt-4 text-sm font-semibold text-[#9b1c33]">{formError || authStatus}</p>}

        <button
          type="submit"
          className="mt-8 h-14 w-full rounded-full bg-[#050505] text-sm font-bold text-white outline-none transition hover:bg-[#222] focus:outline-none focus:ring-0 disabled:opacity-60"
          disabled={authStatus === 'Please wait...'}
        >
          {mode === 'login' ? 'Log in' : 'Sign up'}
        </button>

        <button
          type="button"
          onClick={googleLogin}
          disabled={googleLoading}
          className="mt-8 flex h-14 w-full items-center justify-center gap-3 rounded-full border border-[#dedede] bg-white text-sm font-bold text-[#111] outline-none transition hover:bg-[#f8f8f8] focus:outline-none focus:ring-0 disabled:opacity-60"
        >
          <span className="grid h-6 w-6 place-items-center rounded-full text-lg font-black text-[#4285f4]">G</span>
          {googleLoading ? 'Connecting...' : 'Log in with Google'}
        </button>

        <p className="mt-6 text-center text-sm text-[#666]">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setFormError('');
            }}
            className="font-bold text-[#111] underline underline-offset-2 outline-none focus:outline-none"
          >
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </form>
    </div>
  );
}
