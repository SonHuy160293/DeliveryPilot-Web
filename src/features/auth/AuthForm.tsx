import { Link } from "react-router";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRegistration } from "@/features/auth/model/useRegistration";
import { ROUTES } from "@/lib/routes";

const fields = [
  {
    name: "displayName",
    label: "Display name",
    type: "text",
    autoComplete: "name",
    maxLength: 160,
  },
  {
    name: "email",
    label: "Email",
    type: "email",
    autoComplete: "email",
    maxLength: 320,
  },
  {
    name: "password",
    label: "Password",
    type: "password",
    autoComplete: "new-password",
    maxLength: undefined,
  },
] as const;

export function AuthForm() {
  const { form, submit, message, created, waiting } = useRegistration();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;
  if (created)
    return (
      <div className="space-y-4">
        <Alert role="status">
          <AlertDescription>
            Account created. Sign in to continue. If you were invited to a
            workspace, reopen the original invitation email after signing in to
            review and accept the offer.
          </AlertDescription>
        </Alert>
        <Button asChild className="min-h-11 w-full">
          <Link to={ROUTES.signIn}>Continue to sign in</Link>
        </Button>
      </div>
    );
  return (
    <form
      noValidate
      onSubmit={(event) => {
        void handleSubmit(submit)(event);
      }}
      className="space-y-4"
      aria-busy={isSubmitting}
    >
      {fields.map((field) => (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={`auth-${field.name}`}>{field.label}</Label>
          <Input
            id={`auth-${field.name}`}
            type={field.type}
            autoComplete={field.autoComplete}
            maxLength={field.maxLength}
            required
            disabled={isSubmitting}
            aria-invalid={Boolean(errors[field.name])}
            aria-describedby={
              errors[field.name] ? `auth-${field.name}-error` : undefined
            }
            {...register(field.name)}
          />
          {errors[field.name] ? (
            <p
              id={`auth-${field.name}-error`}
              role="alert"
              className="text-sm text-destructive"
            >
              {errors[field.name]?.message}
            </p>
          ) : null}
        </div>
      ))}
      <p className="text-sm text-muted-foreground">
        After creating your account, sign in. If you have a workspace
        invitation, reopen the original email after signing in.
      </p>
      <Button
        type="submit"
        disabled={isSubmitting || waiting}
        className="min-h-11 w-full"
      >
        {isSubmitting
          ? "Creating account…"
          : waiting
            ? "Wait before trying again"
            : "Create account"}
      </Button>
      {message ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}
    </form>
  );
}
