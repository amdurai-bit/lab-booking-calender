export interface Booking {
  id: string;
  user_email: string;
  project_name: string;
  weld_combinations: string;
  material: string;
  weld_count: number;
  risk_assessment: string;
  system_issues: string;
  additional_info: string;
  booking_date: string; // YYYY-MM-DD
  slot_time: string;    // HH:MM  e.g. "09:00"
}

export type NewBooking = Omit<Booking, 'id'>;
