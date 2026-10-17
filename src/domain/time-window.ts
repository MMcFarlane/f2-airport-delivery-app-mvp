const MINUTE_MS = 60_000;

export const BOARDING_LEAD_MINUTES = 30;
export const DELIVER_BY_LEAD_MINUTES = 10;

export type TimeWindow = {
  departureAt: Date;
  boardingAt: Date;
  deliverBy: Date;
};

export function addMinutes(instant: Date, minutes: number): Date {
  return new Date(instant.getTime() + minutes * MINUTE_MS);
}

export function timeWindow(departureAt: Date): TimeWindow {
  const boardingAt = addMinutes(departureAt, -BOARDING_LEAD_MINUTES);
  const deliverBy = addMinutes(boardingAt, -DELIVER_BY_LEAD_MINUTES);
  return { departureAt, boardingAt, deliverBy };
}

export function itemFits(now: Date, prepMinutes: number, deliverBy: Date): boolean {
  return addMinutes(now, prepMinutes).getTime() <= deliverBy.getTime();
}

export function longestPrepMinutes(prepMinutes: readonly number[]): number {
  return prepMinutes.reduce((longest, minutes) => Math.max(longest, minutes), 0);
}

export function cartArrival(now: Date, prepMinutes: readonly number[]): Date {
  return addMinutes(now, longestPrepMinutes(prepMinutes));
}

export function spareMinutes(boardingAt: Date, arrivalAt: Date): number {
  return Math.round((boardingAt.getTime() - arrivalAt.getTime()) / MINUTE_MS);
}
