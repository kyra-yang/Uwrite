import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import SignOutButton from '@/components/SignOutButton';
import Link from 'next/link';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  // if haven't signed in
  if (!session?.user) {
    return (
      <main className="min-h-screen bg-green-100 flex flex-col items-center justify-center p-4 space-y-20">
        <h1 className="text-6xl font-bold">Dashboard</h1>
        <h1 className="text-2xl font-bold mb-2  text-green-600">Have not signed in ~</h1>
        <a className="underline text-blue-600" href="/login">
          Go to Login 
        </a>
        <h1 className="text-2xl font-bold mb-2  text-green-600">No account ?</h1>
        <a className="underline text-blue-600" href="/register">
          Go to register ^^
        </a>
      </main>
    );
  }

  // Success: have logined
  return (
    <div className="min-h-screen bg-green-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-md p-8 flex flex-col mx-auto my-4  border-2 border-green-600" style={{minHeight: '600px'}}>
        <h1 className="text-7xl font-bold text-center mb-10">Dashboard</h1>
        
        <div className="text-center mb-8">
          <p className="text-lg text-gray-700">
            Welcome, <strong>{session.user.name}</strong> ({session.user.email})
          </p>
        </div>

        {/* main buttons */}
        <div className="flex-grow flex items-center justify-center -mt-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-2xl">
            <Link 
              href="/dashboard/projects"
              className="group block"
            >
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg px-8 py-6 text-center hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 group-hover:shadow-lg h-full min-h-[140px] flex flex-col justify-center">
                <h2 className="text-2xl font-semibold text-blue-800 mb-2">GO TO WRITING</h2>
                <p className="text-blue-600 text-lg">write down your ideas!</p>
              </div>
            </Link>

            <Link 
              href="/public"
              className="group block"
            >
              <div className="bg-green-50 border-2 border-green-200 rounded-lg px-8 py-6 text-center hover:bg-green-100 hover:border-green-300 transition-all duration-200 group-hover:shadow-lg h-full min-h-[140px] flex flex-col justify-center"> 
                <h2 className="text-2xl font-semibold text-green-800 mb-2">GO TO BROWSING</h2> 
                <p className="text-green-600 text-lg">go to public channel !</p> 
              </div>
            </Link>
          </div>
        </div>

        {/* signout button */}
        <div className="flex justify-center pt-8">
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
