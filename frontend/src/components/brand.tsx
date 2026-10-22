import Link from 'next/link';

/** One wordmark for the public site and review workspace. */
export function Brand({
  href = '/dashboard',
  label = 'Wavelength dashboard',
}: {
  href?: string;
  label?: string;
}) {
  return (
    <Link href={href} className="brand" aria-label={label}>
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 28 28" width="26" height="26" fill="none">
          <path
            d="M3 15c2.75 0 2.75-7 5.5-7s2.75 12 5.5 12 2.75-12 5.5-12 2.75 7 5.5 7"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="brand-wordmark">Wavelength</span>
    </Link>
  );
}
