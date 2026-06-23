import type { Booking, NewBooking } from './types';

const GRAPH = 'https://graph.microsoft.com/v1.0';

// ── Token ─────────────────────────────────────────────────────────────────────

async function getToken(): Promise<string> {
  const res = await fetch(
    `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.AZURE_CLIENT_ID!,
        client_secret: process.env.AZURE_CLIENT_SECRET!,
        scope: 'https://graph.microsoft.com/.default',
      }),
      // Never cache the token fetch – let Graph manage its TTL
      cache: 'no-store',
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Graph token error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

// ── Workbook base URL ─────────────────────────────────────────────────────────

function workbookUrl(): string {
  const driveId = process.env.ONEDRIVE_DRIVE_ID!;
  const fileId = process.env.ONEDRIVE_FILE_ID!;
  return `${GRAPH}/drives/${driveId}/items/${fileId}/workbook`;
}

// ── Graph helper ──────────────────────────────────────────────────────────────

async function graphFetch(path: string, init?: RequestInit) {
  const token = await getToken();
  const res = await fetch(`${workbookUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Graph API error ${res.status} on ${path}: ${text}`);
  }

  return res.json();
}

// ── AllowedUsers ──────────────────────────────────────────────────────────────

export async function getAllowedEmails(): Promise<Set<string>> {
  const data = await graphFetch('/tables/AllowedUsers/rows');
  const emails = new Set<string>();
  for (const row of data.value ?? []) {
    const email = row.values?.[0]?.[0];
    if (typeof email === 'string' && email.trim()) {
      emails.add(email.trim().toLowerCase());
    }
  }
  return emails;
}

// ── Bookings ──────────────────────────────────────────────────────────────────

export async function getBookings(): Promise<Booking[]> {
  const data = await graphFetch('/tables/Bookings/rows');
  return (data.value ?? []).map((row: { values: unknown[][] }) => {
    const [
      id, user_email, project_name, weld_combinations, material,
      weld_count, risk_assessment, system_issues, additional_info,
      booking_date, slot_time,
    ] = row.values[0] as string[];

    return {
      id: String(id ?? ''),
      user_email: String(user_email ?? ''),
      project_name: String(project_name ?? ''),
      weld_combinations: String(weld_combinations ?? ''),
      material: String(material ?? ''),
      weld_count: Number(weld_count ?? 0),
      risk_assessment: String(risk_assessment ?? ''),
      system_issues: String(system_issues ?? ''),
      additional_info: String(additional_info ?? ''),
      booking_date: String(booking_date ?? ''),
      slot_time: String(slot_time ?? ''),
    } satisfies Booking;
  });
}

export async function addBooking(booking: NewBooking): Promise<void> {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  await graphFetch('/tables/Bookings/rows/add', {
    method: 'POST',
    body: JSON.stringify({
      values: [[
        id,
        booking.user_email,
        booking.project_name,
        booking.weld_combinations,
        booking.material,
        booking.weld_count,
        booking.risk_assessment,
        booking.system_issues ?? '',
        booking.additional_info ?? '',
        booking.booking_date,
        booking.slot_time,
      ]],
    }),
  });
}
