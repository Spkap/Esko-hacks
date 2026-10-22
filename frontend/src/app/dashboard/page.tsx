import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Dashboard } from '@/components/dashboard';
import { LoadingState } from '@/components/data-state';
export const metadata: Metadata = { title: 'Packaging reviews' };
export default function DashboardPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <Dashboard />
    </Suspense>
  );
}
