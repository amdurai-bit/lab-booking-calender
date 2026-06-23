import LoginForm from '@/components/LoginForm';

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 p-4">
      <div className="w-full max-w-md">
        {/* Header card */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-400 mb-4 shadow-lg">
            {/* Laser / beam icon (inline SVG – no dependency) */}
            <svg viewBox="0 0 24 24" className="w-8 h-8 text-slate-900" fill="currentColor">
              <path d="M12 2a1 1 0 0 1 1 1v3a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1zm0 15a1 1 0 0 1 1 1v3a1 1 0 1 1-2 0v-3a1 1 0 0 1 1-1zM4.22 4.22a1 1 0 0 1 1.42 0l2.12 2.12a1 1 0 0 1-1.42 1.42L4.22 5.64a1 1 0 0 1 0-1.42zm12.02 12.02a1 1 0 0 1 1.42 0l2.12 2.12a1 1 0 0 1-1.42 1.42l-2.12-2.12a1 1 0 0 1 0-1.42zM2 12a1 1 0 0 1 1-1h3a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1zm15 0a1 1 0 0 1 1-1h3a1 1 0 1 1 0 2h-3a1 1 0 0 1-1-1zM4.22 19.78a1 1 0 0 1 0-1.42l2.12-2.12a1 1 0 1 1 1.42 1.42L5.64 19.78a1 1 0 0 1-1.42 0zm12.02-12.02a1 1 0 0 1 0-1.42l2.12-2.12a1 1 0 1 1 1.42 1.42l-2.12 2.12a1 1 0 0 1-1.42 0zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Laser Lab Booking</h1>
          <p className="text-slate-400 mt-1 text-sm">University of Warwick · School of Engineering</p>
        </div>

        {/* Login card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Sign in</h2>
          <p className="text-sm text-gray-500 mb-6">
            Enter your University email. Access is granted to approved users only.
          </p>
          <LoginForm />
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          To request access, contact your lab administrator.
        </p>
      </div>
    </main>
  );
}
