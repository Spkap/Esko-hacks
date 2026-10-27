import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRightIcon as ArrowRight,
  FileImageIcon as FileImage,
  FileTextIcon as FileText,
} from '@phosphor-icons/react/ssr';
import type { ReviewListItem } from '@/domain/types';
import { summarize } from '@/domain/summary';
import { Button } from './ui/button';
import { StatusBadge } from './status-badge';

export function ReviewTable({ reviews }: { reviews: ReviewListItem[] }) {
  return (
    <table className="review-table">
      <caption className="sr-only">
        Packaging reviews with market, artwork version, result, and updated date
      </caption>
      <thead>
        <tr>
          <th scope="col">Product</th>
          <th scope="col">Market</th>
          <th scope="col">Artwork</th>
          <th scope="col">Result</th>
          <th scope="col">Updated</th>
          <th scope="col">
            <span className="sr-only">Open review</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {reviews.map((review) => {
          const isPdf = review.artwork.fileType === 'application/pdf';
          const FileIcon = isPdf ? FileText : FileImage;
          return (
            <tr key={review.id} data-testid="review-row">
              <td>
                <div className="product-cell">
                  <span
                    className={`art-thumb ${isPdf ? 'granola' : ''}`}
                    aria-hidden="true"
                    title={
                      review.productImage
                        ? 'Illustrative product photo. Open the review to inspect the source artwork.'
                        : undefined
                    }
                  >
                    {review.productImage ? (
                      <Image
                        unoptimized
                        src={review.productImage.src}
                        alt={review.productImage.alt}
                        width={56}
                        height={64}
                        sizes="(max-width: 767px) 44px, 56px"
                        className="product-thumbnail"
                      />
                    ) : (
                      <FileIcon weight="duotone" aria-hidden="true" size={20} />
                    )}
                  </span>
                  <div>
                    <Link className="product-name" href={`/checks/${review.id}`}>
                      {review.productName}
                    </Link>
                    <p className="product-subtitle">{review.category}</p>
                  </div>
                </div>
              </td>
              <td>
                <span className="mobile-row-label">Market</span>
                <span className="market-name">{review.market}</span>
              </td>
              <td>
                <span className="mobile-row-label">Artwork</span>
                <span className="version-label">V{review.artwork.version}</span>
              </td>
              <td>
                <span className="mobile-row-label">Result</span>
                <StatusBadge
                  label={
                    review.run.id.startsWith('unrun:')
                      ? 'No analysis yet'
                      : summarize(review.run.status, review.checks).label
                  }
                />
              </td>
              <td>
                <span className="mobile-row-label">Updated</span>
                <time dateTime={review.updatedAt}>
                  {new Date(review.updatedAt).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    timeZone: 'UTC',
                  })}
                </time>
              </td>
              <td>
                <Button asChild variant="outline" size="icon" className="row-open">
                  <Link href={`/checks/${review.id}`} aria-label={`Open ${review.productName}`}>
                    <ArrowRight aria-hidden="true" size={16} />
                  </Link>
                </Button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
