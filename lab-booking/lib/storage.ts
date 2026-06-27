/**
 * Local JSON file storage — zero config, works immediately.
 * Files live in  lab-booking/data/
 *   allowed-users.json  →  ["email@example.com", ...]
 *   bookings.json       →  [{ id, user_email, ... }, ...]
 *
 * To migrate to OneDrive/Excel later, swap this module for graph.ts
 * and update the three import lines in the API routes.
 */

import fs from 'fs';
import path from 'path';
import type { Booking, NewBooking } from './types';

const DATA_DIR      = path.join(process.cwd(), 'data');
const USERS_FILE    = path.join(DATA_DIR, 'allowed-users.json');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');

// ── helpers ───────────────────────────────────────────────────────────────────

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function read<T>(filePath: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
  } catch {
    return fallback;
  }
}

function write(filePath: string, data: unknown) {
  ensureDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// ── AllowedUsers ──────────────────────────────────────────────────────────────

export function getAllowedEmails(): Set<string> {
  const list = read<string[]>(USERS_FILE, []);
  return new Set(list.map(e => e.trim().toLowerCase()));
}

// ── Bookings ──────────────────────────────────────────────────────────────────

export function getBookings(): Booking[] {
  return read<Booking[]>(BOOKINGS_FILE, []);
}

export function addBooking(booking: NewBooking): Booking {
  const bookings = getBookings();
  const newEntry: Booking = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ...booking,
  };
  write(BOOKINGS_FILE, [...bookings, newEntry]);
  return newEntry;
}
