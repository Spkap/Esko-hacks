import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ReviewWorkspace } from '@/components/review-workspace';
import { LoadingState } from '@/components/data-state';
export const metadata: Metadata = { title: 'Artwork review' };
export default async function ReviewPage({ params }: { params: Promise<{ reviewId: string }> }) {
  const { reviewId } = await params;
  return (
    <Suspense fallback={<LoadingState label="Loading artwork review" />}>
      <ReviewWorkspace reviewId={reviewId} />
    </Suspense>
  );
}
