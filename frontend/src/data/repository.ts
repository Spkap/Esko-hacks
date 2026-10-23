import type { ReviewRepository } from '@/domain/types';
import { createDemoRepository } from './demo-repository';
import { createHttpRepository } from './http-repository';
export const dataMode = process.env.NEXT_PUBLIC_DATA_MODE || 'demo';
export const repository: ReviewRepository =
  dataMode === 'demo' ? createDemoRepository() : createHttpRepository();
