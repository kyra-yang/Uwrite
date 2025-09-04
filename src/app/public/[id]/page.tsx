import PageClient from './pageClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  
  return <PageClient projectId={resolvedParams.id} userId={userId} />;
}