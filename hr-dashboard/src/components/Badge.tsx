type Status = 'Saved' | 'Applied' | 'Interviewing' | 'Offer' | 'Rejected';

interface BadgeProps {
  status: Status;
  className?: string;
}

export function Badge({ status, className = '' }: BadgeProps) {
  const statusClass = {
    'Saved': 'badge-saved',
    'Applied': 'badge-applied',
    'Interviewing': 'badge-interviewing',
    'Offer': 'badge-offer',
    'Rejected': 'badge-rejected',
  }[status];

  return (
    <span className={`badge ${statusClass} ${className}`}>
      {status}
    </span>
  );
}
