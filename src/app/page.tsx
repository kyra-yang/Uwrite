export default function HomePage() {
  return (
    <div className="min-h-screen bg-[url('/homePage.jpg')] bg-cover bg-center brightness-90 flex flex-col items-center justify-center text-center">
      <h1 className="text-7xl font-bold mb-12">
        Welcome to {" "}
        <span className="text-blue-600 text-8xl">uWrite</span>
      </h1>

      <div className="flex flex-col space-y-8 w-40 relative left-[-50px]">
        <a href="/register"  
          className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-yellow-700 transition border-3 border-white">Register</a>
        <a href="/login" 
          className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-yellow-700 transition border-3 border-white">Login</a>
        <a href="/dashboard" 
          className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-yellow-700 transition border-3 border-white">Dashboard</a>
        <a href="/public" 
          className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-yellow-700 transition border-3 border-white">Public Channel</a>
      </div>
    </div>
  );
}