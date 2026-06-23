import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Laser Lab Booking | University of Warwick',
  description: 'Book slots on the laboratory laser machine.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
