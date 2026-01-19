import Link from 'next/link';

export default function LoginPage() {
  return (
    <main className="min-h-screen grid place-items-center bg-gray-50">
      <div className="w-full max-w-sm p-6 border rounded-lg bg-white">
        <h1 className="text-xl font-semibold">Login</h1>
        <form className="mt-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-600">Email</label>
            <input className="mt-1 w-full border rounded-md px-3 py-2" type="email" required />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Password</label>
            <input className="mt-1 w-full border rounded-md px-3 py-2" type="password" required />
          </div>
          <button className="w-full py-2 rounded-md bg-brand-600 text-white" type="submit">Sign in</button>
        </form>
        <p className="mt-4 text-sm text-center text-gray-600">
          Don&apos;t have an account? <Link className="text-brand-600" href="#">Sign up</Link>
        </p>
      </div>
    </main>
  );
}
