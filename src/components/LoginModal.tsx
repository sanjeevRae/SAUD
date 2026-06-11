'use client';

import { FormEvent, useState } from 'react';
import { Mail, Phone, X } from 'lucide-react';
import { useCustomerAuth } from '@/context/CustomerAuthContext';

export default function LoginModal() {
  const { isLoginOpen, closeLogin, login, authStatus } = useCustomerAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [method, setMethod] = useState<'email' | 'google' | 'phone'>('email');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  if (!isLoginOpen) return null;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void login({ mode, method, name, email, phone, password });
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm" onClick={closeLogin}>
      <form onSubmit={submit} className="w-full max-w-md bg-white p-6 shadow-[0_24px_80px_rgba(0,0,0,0.2)]" onClick={event => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8f1f35]">Account</p><h2 className="mt-2 text-2xl font-semibold">{mode === 'login' ? 'Login' : 'Register'}</h2></div>
          <button type="button" onClick={closeLogin} className="bg-[#f5f5f5] p-2" aria-label="Close login"><X size={18} /></button>
        </div>

        <div className="mt-5 grid grid-cols-2 border border-[#dedede]">
          {(['login','register'] as const).map(item => <button key={item} type="button" onClick={() => setMode(item)} className={`px-4 py-3 text-sm font-semibold capitalize ${mode === item ? 'bg-[#111] text-white' : 'bg-white text-[#111]'}`}>{item}</button>)}
        </div>
        <div className="mt-3 grid grid-cols-3 border border-[#dedede]">
          <button type="button" onClick={() => setMethod('email')} className={`px-3 py-3 text-xs font-semibold ${method === 'email' ? 'bg-[#111] text-white' : 'bg-white'}`}><Mail className="mx-auto mb-1" size={15}/>Email</button>
          <button type="button" onClick={() => setMethod('google')} className={`px-3 py-3 text-xs font-semibold ${method === 'google' ? 'bg-[#111] text-white' : 'bg-white'}`}>G<br/>Google</button>
          <button type="button" onClick={() => setMethod('phone')} className={`px-3 py-3 text-xs font-semibold ${method === 'phone' ? 'bg-[#111] text-white' : 'bg-white'}`}><Phone className="mx-auto mb-1" size={15}/>Phone</button>
        </div>

        {(mode === 'register' || method === 'google') && <input value={name} onChange={event => setName(event.target.value)} placeholder="Full name" className="mt-4 w-full border border-[#dedede] px-4 py-3 text-sm outline-none" />}
        {method !== 'phone' && <input required type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@gmail.com" className="mt-4 w-full border border-[#dedede] px-4 py-3 text-sm outline-none" />}
        {method === 'phone' && <input required type="tel" value={phone} onChange={event => setPhone(event.target.value)} placeholder="+977 98XXXXXXXX" className="mt-4 w-full border border-[#dedede] px-4 py-3 text-sm outline-none" />}
        {method !== 'google' && <input required type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Password" className="mt-4 w-full border border-[#dedede] px-4 py-3 text-sm outline-none" />}

        {authStatus && <p className="mt-3 text-sm text-[#8f1f35]">{authStatus}</p>}
        <button type="submit" className="mt-6 w-full bg-[#111] px-5 py-3 text-sm font-semibold text-white">{mode === 'login' ? 'Login' : 'Create account'}</button>
      </form>
    </div>
  );
}
