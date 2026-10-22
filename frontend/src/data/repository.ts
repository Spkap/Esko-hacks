import type { ReviewRepository } from '@/domain/types';
import { createDemoRepository } from './demo-repository';
export const dataMode = process.env.NEXT_PUBLIC_DATA_MODE || 'demo';
const unavailable = async (): Promise<never> => {
  throw new Error(
    dataMode === 'live'
      ? 'Live analysis is not connected. Set NEXT_PUBLIC_DATA_MODE=demo to use the sample workspace.'
      : 'Unknown data mode. Use demo or live.',
  );
};
export const repository: ReviewRepository =
  dataMode === 'demo'
    ? createDemoRepository()
    : {
        listReviews: unavailable,
        getReview: unavailable,
        createReview: unavailable,
        addArtwork: unavailable,
        addReference: unavailable,
        startRun: unavailable,
        getRun: unavailable,
        cancelRun: unavailable,
        getReport: unavailable,
        recordDecision: unavailable,
        reset: unavailable,
      };
