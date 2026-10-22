import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/app-shell';
export const metadata: Metadata = {
  title: { default: 'Veriforge · Packaging reviews', template: '%s · Veriforge' },
  description:
    'Inspect packaging artwork, compare selected requirements, and review linked evidence. Frontend demo with simulated findings.',
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
