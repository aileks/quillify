import { Badge } from '@/components/ui/badge';
import { READING_STATUS_LABELS, type ReadingStatus } from '@/lib/reading-lifecycle';

const readingStatusClasses = {
  to_read: 'border-status-to-read-foreground/20 bg-status-to-read text-status-to-read-foreground',
  reading: 'border-status-reading-foreground/20 bg-status-reading text-status-reading-foreground',
  paused: 'border-status-paused-foreground/20 bg-status-paused text-status-paused-foreground',
  finished:
    'border-status-finished-foreground/20 bg-status-finished text-status-finished-foreground',
  did_not_finish:
    'border-status-did-not-finish-foreground/20 bg-status-did-not-finish text-status-did-not-finish-foreground',
} satisfies Record<ReadingStatus, string>;

interface ReadingStatusBadgeProps {
  status: ReadingStatus;
}

export function ReadingStatusBadge({ status }: ReadingStatusBadgeProps) {
  return (
    <Badge variant='outline' data-reading-status={status} className={readingStatusClasses[status]}>
      {READING_STATUS_LABELS[status]}
    </Badge>
  );
}
