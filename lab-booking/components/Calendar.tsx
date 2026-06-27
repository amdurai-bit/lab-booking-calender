'use client';

import { useState } from 'react';
import BookingModal from './BookingModal';
import { getDayBlock, isBlockedDay } from '@/lib/holidays';
import type { Booking } from '@/lib/types';

// ── Constants ─────────────────────────────────────────────────────────────────

const TIME_SLOTS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];
const DAY_NAMES  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

// ── Date helpers ──────────────────────────────────────────────────────────────

function getMondayOf(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  const day = copy.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  return copy;
}

function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

function toDateStr(d: Date): string {
  // Use local year/month/day to avoid UTC-offset bugs
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function todayStr(): string {
  return toDateStr(new Date());
}

function isSlotPast(dateStr: string, time: string): boolean {
  const now = new Date();
  const today = todayStr();
  if (dateStr < today) return true;
  if (dateStr === today) {
    const slotHour = parseInt(time, 10);
    return now.getHours() >= slotHour;
  }
  return false;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  bookings: Booking[];
  userEmail: string;
  onRefresh: () => Promise<void>;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Calendar({ bookings, userEmail, onRefresh }: Props) {
  const [monday, setMonday] = useState<Date>(() => getMondayOf(new Date()));
  const [selected, setSelected] = useState<{ date: string; time: string } | null>(null);

  const weekDates = Array.from({ length: 5 }, (_, i) => addDays(monday, i));
  const today = todayStr();

  const prevWeek = () => setMonday(d => addDays(d, -7));
  const nextWeek = () => setMonday(d => addDays(d, 7));
  const goToday  = () => setMonday(getMondayOf(new Date()));

  const bookingMap = new Map(
    bookings.map(b => [`${b.booking_date}|${b.slot_time}`, b])
  );

  // Header week range label
  const rangeLabel = (() => {
    const start = weekDates[0];
    const end   = weekDates[4];
    if (start.getMonth() === end.getMonth()) {
      return `${start.toLocaleDateString('en-GB', { day: 'numeric' })}–${end.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    }
    return `${start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  })();

  return (
    <div>
      {/* ── Week navigation ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <button onClick={prevWeek} className="btn-week-nav" aria-label="Previous week">
            ← Prev
          </button>
          <button onClick={nextWeek} className="btn-week-nav" aria-label="Next week">
            Next →
          </button>
          <button onClick={goToday} className="btn-week-nav text-slate-600" aria-label="Go to today">
            Today
          </button>
        </div>

        <h2 className="text-base font-semibold text-gray-700 order-first sm:order-none w-full sm:w-auto text-center sm:text-left">
          {rangeLabel}
        </h2>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-600">
          {[
            { colour: 'bg-emerald-200', label: 'Available' },
            { colour: 'bg-blue-200',    label: 'My booking' },
            { colour: 'bg-slate-200',   label: 'Booked' },
            { colour: 'bg-red-100',     label: 'Holiday / Closure' },
          ].map(({ colour, label }) => (
            <span key={label} className="flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded-sm ${colour} inline-block border border-black/10`} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Grid ────────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm bg-white">
        <table className="min-w-[640px] w-full border-collapse">

          {/* Column headers */}
          <thead>
            <tr className="bg-slate-800 text-white">
              <th className="w-16 p-3 text-xs font-medium text-slate-400 border-r border-slate-700 text-center">
                Time
              </th>
              {weekDates.map((date, i) => {
                const dateStr  = toDateStr(date);
                const isToday  = dateStr === today;
                const blocked  = isBlockedDay(dateStr);
                return (
                  <th
                    key={i}
                    className={`p-2 text-sm font-medium text-center border-r border-slate-700 last:border-r-0 ${blocked ? 'opacity-50' : ''}`}
                  >
                    <div className="text-xs font-normal text-slate-400">{DAY_NAMES[i]}</div>
                    <div className={`mt-0.5 inline-block rounded px-1.5 py-0.5 text-sm font-semibold
                      ${isToday ? 'bg-amber-400 text-slate-900' : 'text-white'}`}>
                      {date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Slot rows */}
          <tbody>
            {TIME_SLOTS.map((time, ti) => (
              <tr key={time} className="border-t border-gray-100">
                {/* Time label */}
                <td className="p-2 text-xs text-gray-400 font-medium text-center border-r border-gray-200 bg-gray-50 whitespace-nowrap">
                  {time}
                </td>

                {weekDates.map((date, di) => {
                  const dateStr = toDateStr(date);
                  const block   = getDayBlock(dateStr);
                  const booking = bookingMap.get(`${dateStr}|${time}`);
                  const isMe    = booking?.user_email === userEmail;
                  const past    = isSlotPast(dateStr, time);

                  // ── Blocked (holiday / weekend) ──────────────────────
                  if (block) {
                    return (
                      <td key={di} className="p-1 border-r border-gray-100 last:border-r-0">
                        <div className="slot-blocked">
                          {/* Show label only on first time slot to avoid repetition */}
                          {ti === 0 && (
                            <span className="text-[10px] text-red-400 text-center leading-tight px-1">
                              {block.label}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  }

                  // ── Already booked ───────────────────────────────────
                  if (booking) {
                    return (
                      <td key={di} className="p-1 border-r border-gray-100 last:border-r-0">
                        <div
                          className={isMe ? 'slot-mine' : 'slot-others'}
                          title={`${booking.project_name} (${booking.user_email})`}
                        >
                          <span className="text-[11px] font-semibold text-center leading-tight line-clamp-2 px-1 text-gray-700">
                            {booking.project_name}
                          </span>
                          {isMe && (
                            <span className="text-[9px] text-blue-500 mt-0.5">Your booking</span>
                          )}
                        </div>
                      </td>
                    );
                  }

                  // ── Past slot ────────────────────────────────────────
                  if (past) {
                    return (
                      <td key={di} className="p-1 border-r border-gray-100 last:border-r-0">
                        <div className="slot-past" title="Past slot" />
                      </td>
                    );
                  }

                  // ── Available ────────────────────────────────────────
                  return (
                    <td key={di} className="p-1 border-r border-gray-100 last:border-r-0">
                      <button
                        onClick={() => setSelected({ date: dateStr, time })}
                        className="slot-available group"
                        aria-label={`Book ${time} on ${dateStr}`}
                      >
                        <span className="text-xs text-emerald-500 group-hover:text-emerald-700 font-medium">
                          + Book
                        </span>
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Note below grid */}
      <p className="mt-3 text-xs text-gray-400 text-center">
        All times are local (UK). Slots are 1 hour each (09:00–17:00). Click an available slot to book.
      </p>

      {/* ── Booking modal ────────────────────────────────────────────────── */}
      {selected && (
        <BookingModal
          slot={selected}
          userEmail={userEmail}
          onClose={() => setSelected(null)}
          onSuccess={async () => {
            setSelected(null);
            await onRefresh();
          }}
        />
      )}
    </div>
  );
}
