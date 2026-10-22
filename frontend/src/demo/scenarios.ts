/** Only these fixed, reviewed examples can produce seeded findings. */
export const sampleScenarios = [
  {
    id: 'mori-strawberry',
    name: 'MORI Strawberry',
    market: 'Japan',
    category: 'Fruit beverage',
    version: 1,
    description:
      'Find a missing juice statement, compare quantity, and inspect an uncertain measurement.',
    image: '/demo/mori-v1.svg',
    specification: '/demo/sample-specification.html',
  },
  {
    id: 'mori-corrected',
    name: 'MORI Strawberry · corrected V2',
    market: 'Japan',
    category: 'Fruit beverage',
    version: 2,
    description:
      'Recheck the juice statement and quantity. Physical size and placement remain outside this selected scope.',
    image: '/demo/mori-v2.svg',
    specification: '/demo/sample-specification.html',
  },
  {
    id: 'dancingfish-granola',
    name: 'Dancing Fish Berry Crunch',
    market: 'United States',
    category: 'Breakfast cereal',
    version: 1,
    description:
      'Review the organizer’s carton proof against its draft content sheet. Unconfirmed details stay open for review.',
    image: '/demo/dancingfish-preview.png',
    specification: '/demo/dancingfish-reference.html',
  },
] as const;
export const isSampleScenario = (id: string) => sampleScenarios.some((sample) => sample.id === id);
