import type { Metadata } from 'next';
import { NewCheck } from '@/components/new-check';
export const metadata: Metadata = { title: 'New packaging check' };
export default function Page() {
  return <NewCheck />;
}
