import { NextRequest, NextResponse } from 'next/server';
import { getAllowedEmails } from '@/lib/storage';
import { signToken, COOKIE_NAME, COOKIE_MAX_AGE } from '@/lib/session';

export async function POST(req: NextRequest) {
  let email: string;

  try {
    const body = await req.json();
    email = (body.email ?? '').trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }

  let allowedEmails: Set<string>;
  try {
    allowedEmails = getAllowedEmails();
  } catch (err) {
    console.error('[auth/login] Failed to fetch AllowedUsers:', err);
    return NextResponse.json(
      { error: 'Unable to verify access at this time. Please try again shortly.' },
      { status: 503 }
    );
  }

  if (!allowedEmails.has(email)) {
    return NextResponse.json(
      { error: 'Access denied. Your email is not on the approved list. Contact your lab administrator.' },
      { status: 403 }
    );
  }

  const token = await signToken(email);

  const res = NextResponse.json({ ok: true, email });
  res.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });

  return res;
}
