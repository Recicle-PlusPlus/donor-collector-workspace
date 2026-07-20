export type DonationStatus =
  | 'pending'
  | 'accepted'
  | 'awaiting_review'
  | 'completed'
  | 'cancelled';

export type DonationRole = 'donor' | 'collector';

interface DonationReviewState {
  status: DonationStatus;
  completed_at?: string | null;
  donor_reviewed?: boolean | null;
  collector_reviewed?: boolean | null;
}

const SAO_PAULO_TIME_ZONE = 'America/Sao_Paulo';

const saoPauloDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: SAO_PAULO_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export const hasRoleReviewed = (
  donation: DonationReviewState,
  role: DonationRole,
) =>
  role === 'donor'
    ? donation.donor_reviewed === true
    : donation.collector_reviewed === true;

export const getDonationDisplayStatus = (
  donation: DonationReviewState,
  role?: DonationRole,
): DonationStatus => {
  if (
    role &&
    donation.status === 'awaiting_review' &&
    hasRoleReviewed(donation, role)
  ) {
    return 'completed';
  }

  return donation.status;
};

export const shouldRequestReview = (
  donation: DonationReviewState | null | undefined,
  role: DonationRole,
) =>
  Boolean(
    donation?.status === 'awaiting_review' &&
    donation.completed_at &&
    !hasRoleReviewed(donation, role),
  );

export const formatCompletedAt = (completedAt?: string | null) => {
  if (!completedAt) return null;

  const completedDate = new Date(completedAt);
  if (Number.isNaN(completedDate.getTime())) return null;

  const date = new Intl.DateTimeFormat('pt-BR', {
    timeZone: SAO_PAULO_TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(completedDate);
  const time = new Intl.DateTimeFormat('pt-BR', {
    timeZone: SAO_PAULO_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(completedDate);

  return `${date} às ${time}`;
};

export const getSaoPauloWeekKey = (value: string | Date) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const dateParts = saoPauloDateFormatter.formatToParts(date);
  const year = Number(dateParts.find(part => part.type === 'year')?.value);
  const month = Number(dateParts.find(part => part.type === 'month')?.value);
  const day = Number(dateParts.find(part => part.type === 'day')?.value);

  const calendarDate = new Date(Date.UTC(year, month - 1, day));
  const daysSinceMonday = (calendarDate.getUTCDay() + 6) % 7;
  calendarDate.setUTCDate(calendarDate.getUTCDate() - daysSinceMonday);

  return calendarDate.toISOString().slice(0, 10);
};
