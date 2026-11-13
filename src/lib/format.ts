const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const instantFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
const countFormatter = new Intl.NumberFormat("en-US");
const personDaysFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const notRecorded = "Not recorded";
function calendarText(formatter: Intl.DateTimeFormat, value: string): string {
  return formatter.format(new Date(value)).replace(/\bSept\b/gu, "Sep");
}

/** Date-only records retain their UTC calendar date in every local time zone. */
export function formatDate(value: string | null): string {
  return value === null ? notRecorded : calendarText(dateFormatter, value);
}

/** Instants are presented in the viewer's local time, to minute precision. */
export function formatInstant(value: string | null): string {
  return value === null ? notRecorded : calendarText(instantFormatter, value);
}

export function formatMoney(
  value: number | null,
  currency: string | null,
): string {
  if (value === null || currency === null) return notRecorded;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    currencyDisplay: "code",
  }).format(value);
}

export function formatPersonDays(value: number | null): string {
  return value === null
    ? notRecorded
    : `${personDaysFormatter.format(value)} person-days`;
}

export function formatCount(value: number | null): string {
  return value === null ? notRecorded : countFormatter.format(value);
}

export { formatCount as formatNumber };

/** Presents an API lifecycle code as a readable label ("pending" → "Pending"). */
export function formatStatus(value: string | null): string {
  if (value === null) return notRecorded;
  const words = value.replace(/[_-]+/g, " ").trim();
  return words.charAt(0).toLocaleUpperCase() + words.slice(1);
}
