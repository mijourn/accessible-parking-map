const STALENESS_THRESHOLD_YEARS = 3;

export function computeIsStale(lastConfirmedIso: string): boolean {
  const last = new Date(lastConfirmedIso).getTime();
  const now = Date.now();
  const ageYears = (now - last) / (1000 * 60 * 60 * 24 * 365.25);
  return ageYears > STALENESS_THRESHOLD_YEARS;
}
