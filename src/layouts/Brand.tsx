import { Send } from "lucide-react";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center bg-primary text-brand ${compact ? "size-8 rounded-lg" : "size-10 rounded-xl"}`}
    >
      <Send className={compact ? "size-4" : "size-5"} />
    </span>
  );
}

export function BrandWord() {
  return (
    <span className="font-bold tracking-tight">
      <span className="text-foreground">Delivery</span>
      <span className="text-brand-strong">Pilot</span>
    </span>
  );
}
