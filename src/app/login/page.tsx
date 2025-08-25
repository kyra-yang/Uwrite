'use client';

import { FormEvent, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  // initalize states
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    // sign in user
    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    // handle response(error or success)
    if (res?.error) setErr('Invalid email or password');
    else router.push('/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-yellow-50">
    <main className="w-[400px] bg-white p-18 rounded-md shadow-lg">
      <h1 className="text-5xl font-bold mb-6 text-center text-gray-800">
        Login
      </h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <input 
          className="w-full border p-2 rounded" 
          type="email"
          placeholder="Email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)} 
          required />
        <input 
          className="w-full border p-2 rounded" 
          type="password"     
          placeholder="Password" 
          value={password}   
          onChange={(e) => setPassword(e.target.value)} required />
        <button className="w-full bg-green-600 text-white py-3 rounded-md text-lg hover:bg-blue-700 transition" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
        {err && <p className="text-red-600 text-sm">{err}</p>}
      </form>
      <p className="text-sm mt-4">
        No account? <a className="text-blue-600 underline" href="/register">Register</a>
      </p>
    </main>
  </div>
  );
}
