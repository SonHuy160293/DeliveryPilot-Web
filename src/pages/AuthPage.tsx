import { Link, useLocation } from "react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { AuthForm } from "@/features/auth/AuthForm";
import { SignInForm } from "@/features/auth/components/SignInForm";
import { ROUTES } from "@/lib/routes";

interface AuthPageProps {
  mode: "signIn" | "signUp";
  resolveContinuation?: () => string | undefined;
}

export function AuthPage({ mode, resolveContinuation }: AuthPageProps) {
  const signingIn = mode === "signIn";
  const location = useLocation();
  const locallySignedOut = Boolean(
    (location.state as { localSignOut?: boolean } | null)?.localSignOut,
  );
  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 md:py-16">
      <Card>
        <CardHeader className="space-y-2">
          <h1 className="text-2xl font-semibold">
            {signingIn ? "Sign in" : "Create an account"}
          </h1>
          <CardDescription>
            {signingIn
              ? "Sign in to continue."
              : "Create your account, then sign in to continue."}
          </CardDescription>
          {signingIn && locallySignedOut ? (
            <p role="status" className="text-sm text-muted-foreground">
              Signed out on this device. Server-side sign-out could not be
              confirmed.
            </p>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-6">
          {signingIn ? (
            <SignInForm resolveContinuation={resolveContinuation} />
          ) : (
            <AuthForm />
          )}
          {signingIn ? (
            <p className="text-sm text-muted-foreground">
              Invited to a workspace? Register, sign in, then reopen your
              invitation email.
            </p>
          ) : null}
          <p className="text-sm">
            {signingIn ? "Need an account? " : "Already have an account? "}
            <Link
              to={signingIn ? ROUTES.signUp : ROUTES.signIn}
              className="inline-flex min-h-6 items-center font-medium text-primary underline underline-offset-4"
            >
              {signingIn ? "Register" : "Sign in"}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
