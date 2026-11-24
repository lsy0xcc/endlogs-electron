// Time formatting helpers. Storage is unix seconds; everything shown to
// humans is formatted in the display timezone (the system timezone, ADR-0012).
// dayjs is the single date library for this project.

import dayjs from 'dayjs';

/** "2026-11-23 14:05:33" in the system timezone. */
export function formatDateTime(unixSec: number): string {
  return dayjs.unix(unixSec).format('YYYY-MM-DD HH:mm:ss');
}

/** "2026-11-23" in the system timezone. */
export function formatDate(unixSec: number): string {
  return dayjs.unix(unixSec).format('YYYY-MM-DD');
}

/** "2026-11-23" for a Date object in the system timezone. */
export function formatDateObject(date: Date): string {
  return dayjs(date).format('YYYY-MM-DD');
}

/** "12,345" */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(n);
}

/** "+100" / "-50" */
export function formatSigned(n: number): string {
  return `${n > 0 ? '+' : ''}${formatNumber(n)}`;
}
