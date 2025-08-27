import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import SignOutButton from '@/components/SignOutButton';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  // if haven't signed in
  if (!session?.user) {
    return (
      <main className="max-w-xl mx-auto p-6">
        <h1 className="text-xl font-bold mb-2">Not signed in</h1>
        <a className="underline text-blue-600" href="/login">
          Go to Login
        </a>
      </main>
    );
  }

  // Success: have logined
  return (
    <main className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p>
        Welcome, <b>{session.user.name}</b> (<span>{session.user.email}</span>)
      </p>
      <SignOutButton />

      {/* dashBoardClient */}
      <DashboardClient />
    </main>
  );
}
