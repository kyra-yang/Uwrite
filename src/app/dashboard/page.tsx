import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import SignOutButton from '@/components/SignOutButton';
import Link from 'next/link';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  // if haven't signed in
  if (!session?.user) {
    return (
      <main className="max-w-xl mx-auto p-20 text-center space-y-6">
        <h1 className="text-5xl font-bold">Dashboard</h1>
        <h1 className="text-xl font-bold mb-2  text-green-600">Not signed in</h1>
        <a className="underline text-blue-600" href="/login">
          Go to Login
        </a>
      </main>
    );
  }

  // Success: have logined
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-center mb-6">Dashboard</h1>
          
          <div className="text-center mb-8">
            <p className="text-lg text-gray-700">
              Welcome, <strong>{session.user.name}</strong> ({session.user.email})
            </p>
          </div>

          {/* main buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Link
              href="/dashboard/projects"
              className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors shadow-md"
            >
              GO TO WRITING
            </Link>

            <Link 
              href="/public"
              className="group block"
            >
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 text-center hover:bg-green-100 hover:border-green-300 transition-all duration-200 group-hover:shadow-lg">
                <h2 className="text-xl font-semibold text-green-800 mb-2">GO TO BROWSING</h2>
                <p className="text-green-600">browse every pubilc works!</p>
              </div>
            </Link>
          </div>

          {/* signout button */}
          <div className="flex justify-center">
            <SignOutButton />
          </div>
        </div>
      </div>
    </div>
  );
}
