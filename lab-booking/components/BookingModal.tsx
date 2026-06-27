'use client';

import { useState, FormEvent } from 'react';

interface Props {
  slot: { date: string; time: string };
  userEmail: string;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

interface FormState {
  project_name: string;
  weld_combinations: string;
  material: string;
  weld_count: string;
  risk_assessment: string;
  system_issues: string;
  additional_info: string;
}

const EMPTY_FORM: FormState = {
  project_name: '',
  weld_combinations: '',
  material: '',
  weld_count: '',
  risk_assessment: '',
  system_issues: '',
  additional_info: '',
};

export default function BookingModal({ slot, userEmail, onClose, onSuccess }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          weld_count: parseInt(form.weld_count, 10),
          booking_date: slot.date,
          slot_time: slot.time,
        }),
      });

      if (res.ok) {
        await onSuccess();
      } else {
        const data = await res.json();
        setError(data.error ?? 'Failed to create booking. Please try again.');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Format slot header display
  const displayDate = new Date(`${slot.date}T12:00:00`).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const endHour = String(parseInt(slot.time, 10) + 1).padStart(2, '0');
  const timeRange = `${slot.time} – ${endHour}:00`;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-800 text-white px-6 py-4 rounded-t-2xl flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold">New Booking</h2>
            <p className="text-slate-300 text-sm mt-0.5">{displayDate}</p>
            <p className="text-amber-300 text-sm font-medium">{timeRange}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white mt-0.5 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Booking user tag */}
        <div className="px-6 pt-4 pb-0">
          <p className="text-xs text-gray-500">
            Booking as <span className="font-medium text-gray-700">{userEmail}</span>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Required text inputs */}
          {[
            { label: 'Project Name', key: 'project_name', placeholder: 'e.g. Titanium weld study' },
            { label: 'Weld Combinations', key: 'weld_combinations', placeholder: 'e.g. SS316L – Ti6Al4V lap joint' },
            { label: 'Material', key: 'material', placeholder: 'e.g. Stainless steel, 1 mm sheet' },
            { label: 'Risk Assessment Number', key: 'risk_assessment', placeholder: 'e.g. RA-2024-007' },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className="form-label">
                {label} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder={placeholder}
                value={form[key as keyof FormState]}
                onChange={set(key as keyof FormState)}
                className="form-input"
              />
            </div>
          ))}

          {/* Weld count – number */}
          <div>
            <label className="form-label">
              Approximate Number of Welds <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min={1}
              placeholder="e.g. 12"
              value={form.weld_count}
              onChange={set('weld_count')}
              className="form-input"
            />
          </div>

          {/* Optional textareas */}
          {[
            { label: 'Any issues in the system? (Optional)', key: 'system_issues', placeholder: 'Describe any known issues or concerns with the laser machine…' },
            { label: 'Any other useful information? (Optional)', key: 'additional_info', placeholder: 'Additional notes, special requirements, safety considerations…' },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className="form-label">{label}</label>
              <textarea
                rows={2}
                placeholder={placeholder}
                value={form[key as keyof FormState]}
                onChange={set(key as keyof FormState)}
                className="form-input resize-none"
              />
            </div>
          ))}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
        </form>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="booking-form"
            disabled={submitting}
            onClick={handleSubmit}
            className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving…
              </span>
            ) : (
              'Confirm Booking'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
