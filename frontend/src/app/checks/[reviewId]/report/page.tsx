import type { Metadata } from 'next';
import { ReviewReport } from '@/components/review-report';
export const metadata: Metadata = { title: 'Review report' };
export default async function ReportPage({ params }: { params: Promise<{ reviewId: string }> }) {
  const { reviewId } = await params;
  return <ReviewReport reviewId={reviewId} />;
}
