'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Calendar from '@/components/Calendar';
import type { Booking } from '@/lib/types';

export default function DashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBookings = useCallback(async () => {
    const res = await fetch('/api/bookings');
    if (res.ok) {
      const data = await res.json();
      setBookings(data.bookings ?? []);
    } else {
      setError('Failed to load bookings. Please refresh.');
    }
  }, []);

  useEffect(() => {
    async function init() {
      // Verify session
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) {
        router.replace('/');
        return;
      }
      const { email } = await meRes.json();
      setEmail(email);
      await fetchBookings();
      setLoading(false);
    }
    init();
  }, [router, fetchBookings]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-slate-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-gray-500 text-sm">Loading calendar…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navigation bar */}
      <nav className="bg-slate-800 text-white px-6 py-3 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-slate-900" fill="currentColor">
              <path d="M12 2a1 1 0 0 1 1 1v3a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1zm0 15a1 1 0 0 1 1 1v3a1 1 0 1 1-2 0v-3a1 1 0 0 1 1-1zM4.22 4.22a1 1 0 0 1 1.42 0l2.12 2.12a1 1 0 0 1-1.42 1.42L4.22 5.64a1 1 0 0 1 0-1.42zm12.02 12.02a1 1 0 0 1 1.42 0l2.12 2.12a1 1 0 0 1-1.42 1.42l-2.12-2.12a1 1 0 0 1 0-1.42zM2 12a1 1 0 0 1 1-1h3a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1zm15 0a1 1 0 0 1 1-1h3a1 1 0 1 1 0 2h-3a1 1 0 0 1-1-1zM4.22 19.78a1 1 0 0 1 0-1.42l2.12-2.12a1 1 0 1 1 1.42 1.42L5.64 19.78a1 1 0 0 1-1.42 0zm12.02-12.02a1 1 0 0 1 0-1.42l2.12-2.12a1 1 0 1 1 1.42 1.42l-2.12 2.12a1 1 0 0 1-1.42 0zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-sm leading-tight">Laser Lab Booking</p>
            <p className="text-slate-400 text-xs">University of Warwick</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-slate-300 text-sm hidden sm:block">{email}</span>
          <button
            onClick={handleLogout}
            className="bg-slate-600 hover:bg-slate-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 p-4 sm:p-6">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        <Calendar bookings={bookings} userEmail={email!} onRefresh={fetchBookings} />
      </main>
    </div>
  );
}
