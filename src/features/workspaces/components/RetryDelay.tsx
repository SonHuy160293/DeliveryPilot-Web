import { formatNumber } from "@/features/workspaces/model/formatters";
import { useEffect, useState } from "react";

export function RetryDelay({ delay }: { delay: number }) {
  const [seconds, setSeconds] = useState(() => Math.ceil(delay / 1000));
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((value) => Math.max(0, value - 1));
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  }, []);
  return (
    <p className="text-sm">
      <span role="status" className="sr-only">
        Please wait before retrying.
      </span>
      <span aria-live="off">
        {seconds
          ? `Wait ${formatNumber(seconds)} seconds before trying again.`
          : "You can deliberately retry now."}
      </span>
    </p>
  );
}
