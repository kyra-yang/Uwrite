'use client';

import { signOut } from 'next-auth/react';

export default function SignOutButton({ className }: { className?: string }) {
  return (
    <button
      className={className ?? 'border px-3 py-2 rounded'}
      onClick={() => signOut({ callbackUrl: '/login' })}
    >
      Sign out
    </button>
  );
}
