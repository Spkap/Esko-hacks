import type { Metadata } from 'next';
import { isSampleScenario } from '@/demo/scenarios';
import { NewCheck } from '@/components/new-check';
export const metadata: Metadata = { title: 'New packaging check' };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ sample?: string }>;
}) {
  const { sample } = await searchParams;
  const initialSample = sample && isSampleScenario(sample) ? sample : '';
  return <NewCheck key={initialSample} initialSample={initialSample} />;
}
