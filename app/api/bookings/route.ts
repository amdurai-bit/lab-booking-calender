import { NextRequest, NextResponse } from 'next/server';
import { getBookings, addBooking } from '@/lib/graph';
import { verifyToken, COOKIE_NAME } from '@/lib/session';
import { isBlockedDay } from '@/lib/holidays';
import type { NewBooking } from '@/lib/types';

// ── Auth helper ───────────────────────────────────────────────────────────────

async function getAuthEmail(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload?.email ?? null;
}

// ── GET /api/bookings ─────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const email = await getAuthEmail(req);
  if (!email) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  try {
    const bookings = await getBookings();
    return NextResponse.json({ bookings });
  } catch (err) {
    console.error('[GET /api/bookings]', err);
    return NextResponse.json({ error: 'Failed to fetch bookings.' }, { status: 503 });
  }
}

// ── POST /api/bookings ────────────────────────────────────────────────────────

const VALID_TIMES = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];

export async function POST(req: NextRequest) {
  const userEmail = await getAuthEmail(req);
  if (!userEmail) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  // ── Validate required fields ──────────────────────────────────────────────
  const {
    project_name, weld_combinations, material, weld_count,
    risk_assessment, system_issues, additional_info,
    booking_date, slot_time,
  } = body as Record<string, unknown>;

  const missing = ['project_name', 'weld_combinations', 'material', 'weld_count', 'risk_assessment', 'booking_date', 'slot_time']
    .filter(k => !body[k] && body[k] !== 0);
  if (missing.length) {
    return NextResponse.json({ error: `Missing required fields: ${missing.join(', ')}.` }, { status: 400 });
  }

  if (typeof booking_date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(booking_date)) {
    return NextResponse.json({ error: 'Invalid booking_date format. Expected YYYY-MM-DD.' }, { status: 400 });
  }

  if (!VALID_TIMES.includes(slot_time as string)) {
    return NextResponse.json({ error: `Invalid slot_time. Must be one of: ${VALID_TIMES.join(', ')}.` }, { status: 400 });
  }

  if (isBlockedDay(booking_date)) {
    return NextResponse.json({ error: 'That date is a holiday or closure day.' }, { status: 422 });
  }

  const weldCountNum = Number(weld_count);
  if (!Number.isInteger(weldCountNum) || weldCountNum < 1) {
    return NextResponse.json({ error: 'Weld count must be a positive integer.' }, { status: 400 });
  }

  // ── Check for slot conflict ───────────────────────────────────────────────
  let existing;
  try {
    existing = await getBookings();
  } catch (err) {
    console.error('[POST /api/bookings] getBookings failed:', err);
    return NextResponse.json({ error: 'Unable to verify slot availability.' }, { status: 503 });
  }

  const conflict = existing.find(
    b => b.booking_date === booking_date && b.slot_time === slot_time
  );
  if (conflict) {
    return NextResponse.json(
      { error: 'That slot has just been booked by someone else. Please choose another.' },
      { status: 409 }
    );
  }

  // ── Persist ───────────────────────────────────────────────────────────────
  const newBooking: NewBooking = {
    user_email: userEmail,
    project_name: String(project_name).trim(),
    weld_combinations: String(weld_combinations).trim(),
    material: String(material).trim(),
    weld_count: weldCountNum,
    risk_assessment: String(risk_assessment).trim(),
    system_issues: String(system_issues ?? '').trim(),
    additional_info: String(additional_info ?? '').trim(),
    booking_date: booking_date,
    slot_time: slot_time as string,
  };

  try {
    await addBooking(newBooking);
  } catch (err) {
    console.error('[POST /api/bookings] addBooking failed:', err);
    return NextResponse.json({ error: 'Failed to save booking. Please try again.' }, { status: 503 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
