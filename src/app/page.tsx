export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-6xl font-bold mb-12">
        Welcome to {" "}
        <span className="text-blue-600 text-8xl">uWrite</span>
      </h1>

      <div className="flex flex-col space-y-8 w-40 relative left-[-80px]">
        <a href="/register" className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-yellow-700 transition">Register</a>
        <a href="/login" className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-yellow-700 transition">Login</a>
        <a href="/dashboard" className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-yellow-700 transition">Dashboard</a>
        <a href="/public" className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-yellow-700 transition">Public Channel</a>
      </div>
    </div>
  );
}