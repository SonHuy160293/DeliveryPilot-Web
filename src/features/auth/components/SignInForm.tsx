import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/features/auth/api/loginApi";
import { ApiError } from "@/lib/api/apiError";
import { authSession } from "@/lib/api/authSession";
import { clearSessionCache } from "@/lib/query/queryScope";
import { ROUTES, isWorkspaceOverviewPath } from "@/lib/routes";

const schema = z.object({
  email: z
    .string()
    .min(1, "Enter your email address.")
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});
type Values = z.infer<typeof schema>;
function safeDestination(
  state: unknown,
  continuationDestination?: string,
): string {
  if (
    typeof state !== "object" ||
    state === null ||
    !("from" in state) ||
    typeof state.from !== "string"
  )
    return ROUTES.workspaces;
  return state.from === ROUTES.workspaces ||
    isWorkspaceOverviewPath(state.from) ||
    (state.from === ROUTES.joinWorkspace &&
      continuationDestination === ROUTES.joinWorkspace)
    ? state.from
    : ROUTES.workspaces;
}
function safeMessage(error: unknown): string {
  if (!(error instanceof ApiError))
    return "Could not sign in. Please try again.";
  if (error.kind === "unauthenticated")
    return "Email or password is incorrect.";
  if (error.kind === "rate-limit")
    return "Too many attempts. Wait before trying again.";
  if (
    error.kind === "network" ||
    error.kind === "timeout" ||
    error.kind === "server"
  )
    return "Sign-in is temporarily unavailable. Please try again.";
  if (error.kind === "configuration")
    return "Sign-in is not configured. Contact your administrator.";
  return "Could not sign in. Please try again.";
}
export function SignInForm({
  resolveContinuation,
}: {
  resolveContinuation?: () => string | undefined;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: { email: "", password: "" },
  });
  const [message, setMessage] = useState<string>();
  const submitting = useRef(false);
  const pendingAttempt = useRef<number | undefined>(undefined);
  useEffect(
    () => () => {
      if (
        pendingAttempt.current !== undefined &&
        authSession.getSnapshot().status !== "authenticated"
      )
        authSession.cancel(pendingAttempt.current);
    },
    [],
  );
  const client = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  async function submit(values: Values) {
    if (submitting.current) return;
    submitting.current = true;
    setMessage(undefined);
    const attempt = authSession.begin();
    pendingAttempt.current = attempt;
    try {
      await clearSessionCache(client);
      if (await login(values, attempt))
        void navigate(
          safeDestination(location.state, resolveContinuation?.()),
          { replace: true },
        );
    } catch (error) {
      setMessage(safeMessage(error));
    } finally {
      submitting.current = false;
      pendingAttempt.current = undefined;
    }
  }
  return (
    <form
      noValidate
      onSubmit={(event) => {
        void handleSubmit(submit)(event);
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="signin-email">Email</Label>
        <Input
          id="signin-email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "signin-email-error" : undefined}
          {...register("email")}
        />
        {errors.email ? (
          <p
            id="signin-email-error"
            role="alert"
            className="text-sm text-destructive"
          >
            {errors.email.message}
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="signin-password">Password</Label>
        <Input
          id="signin-password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={Boolean(errors.password)}
          aria-describedby={
            errors.password ? "signin-password-error" : undefined
          }
          {...register("password")}
        />
        {errors.password ? (
          <p
            id="signin-password-error"
            role="alert"
            className="text-sm text-destructive"
          >
            {errors.password.message}
          </p>
        ) : null}
      </div>
      <Button type="submit" disabled={isSubmitting} className="min-h-11 w-full">
        {isSubmitting ? "Signing in…" : "Sign in"}
      </Button>
      {message ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}
    </form>
  );
}
