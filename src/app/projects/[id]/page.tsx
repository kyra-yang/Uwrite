import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import ProjectDetailClient from './ProjectDetailClient';

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return (
      <main className="max-w-xl mx-auto p-6 text-center space-y-6">
        <h1 className="text-2xl font-bold">Not signed in</h1>
        <a className="underline text-blue-600" href="/login">Go to Login</a>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Project Details</h1>
      <ProjectDetailClient projectId={params.id} />
    </main>
  );
}
