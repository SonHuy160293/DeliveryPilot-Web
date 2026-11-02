const formatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
  timeZoneName: "short",
});
export function formatInstant(value: string): string {
  return formatter.format(new Date(value));
}
const numberFormatter = new Intl.NumberFormat("en-US");
export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}
