import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function requireUser() {
  // if is the test environment, return a mock user
  if (process.env.NODE_ENV === 'test') {
    return { id: 'test-user-id', email: 'test@example.com', name: 'Test User' };
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error('UNAUTHENTICATED');
  }
  return session.user as { id: string; email: string | null; name: string | null };
}
