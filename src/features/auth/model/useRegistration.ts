import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerUser } from "@/features/auth/api/registrationApi";
import {
  registrationSchema,
  registrationMessage,
  type RegistrationValues,
} from "@/features/auth/model/registrationForm";
import { ApiError } from "@/lib/api/apiError";
import { authSession } from "@/lib/api/authSession";

export function useRegistration() {
  const form = useForm<RegistrationValues>({
    resolver: zodResolver(registrationSchema),
    mode: "onTouched",
    defaultValues: { displayName: "", email: "", password: "" },
  });
  const [message, setMessage] = useState<string>();
  const [created, setCreated] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const controller = useRef<AbortController | undefined>(undefined);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  useEffect(
    () => () => {
      controller.current?.abort();
      controller.current = undefined;
      if (retryTimer.current) clearTimeout(retryTimer.current);
    },
    [],
  );

  async function submit(values: RegistrationValues) {
    if (
      controller.current ||
      waiting ||
      created ||
      authSession.getSnapshot().status !== "anonymous"
    )
      return;
    const active = new AbortController();
    controller.current = active;
    const generation = authSession.version();
    const current = () =>
      !active.signal.aborted && authSession.version() === generation;
    setMessage(undefined);
    try {
      await registerUser(values, active.signal);
      if (current()) {
        form.reset();
        setCreated(true);
      }
    } catch (error) {
      if (
        !current() ||
        (error instanceof ApiError && error.kind === "cancelled")
      )
        return;
      setMessage(registrationMessage(error));
      if (
        error instanceof ApiError &&
        error.kind === "rate-limit" &&
        error.details.retryAfterMs
      ) {
        setWaiting(true);
        retryTimer.current = setTimeout(
          () => {
            setWaiting(false);
          },
          Math.min(error.details.retryAfterMs, 2_147_483_647),
        );
      }
    } finally {
      if (controller.current === active) controller.current = undefined;
    }
  }
  return { form, submit, message, created, waiting };
}
