'use client';

import { signOut } from 'next-auth/react';

export default function SignOutButton({ className }: { className?: string }) {
  return (
    <button
      className={className ?? 'px-6 py-3 bg-red-400 text-white rounded-lg font-medium hover:bg-red-200 transition-colors duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5'}
      onClick={() => signOut({ callbackUrl: '/login' })}
    >
      Sign out
    </button>
  );
}
