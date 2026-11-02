import { useEffect, useRef, useState } from "react";
import { Info, LogOut, User } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { authSession } from "@/lib/api/authSession";
import { useAuthSession } from "@/features/auth/model/useAuthSession";
import { clearSessionCache } from "@/lib/query/queryScope";
import { ROUTES } from "@/lib/routes";

export function UserAccountMenu() {
  const [open, setOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const session = useAuthSession();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  function signOut() {
    setOpen(false);
    void navigate(ROUTES.signIn, {
      replace: true,
      state: { localSignOut: true },
    });
    authSession.clear(true);
    void clearSessionCache(queryClient);
  }

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <Button
        ref={triggerRef}
        type="button"
        variant="outline"
        size="icon"
        aria-label="User account"
        aria-haspopup="dialog"
        aria-expanded={open}
        className="size-10 rounded-full border-border bg-card text-foreground transition-colors duration-150 ease-out hover:bg-accent hover:text-accent-foreground"
        onClick={() => {
          setOpen((prev) => !prev);
        }}
      >
        <User aria-hidden="true" className="size-5" />
      </Button>

      {open ? (
        <div
          role="dialog"
          aria-label="User account details"
          className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-border bg-card p-4 shadow-md z-30"
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 border-b border-border pb-3">
              <span
                aria-hidden="true"
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground"
              >
                <User className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  User Account
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {session.status === "authenticated"
                    ? session.userId
                    : "Not signed in"}
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              className="min-h-11 justify-start gap-2 text-sm font-medium"
              onClick={() => {
                setShowDetails((prev) => !prev);
              }}
            >
              <Info
                aria-hidden="true"
                className="size-4 text-muted-foreground"
              />
              <span>
                {showDetails
                  ? "Hide information details"
                  : "Go to information details"}
              </span>
            </Button>

            {showDetails ? (
              <div
                role="region"
                aria-label="Account information details"
                className="flex flex-col gap-1.5 rounded-lg border border-border bg-muted p-3 text-xs"
              >
                <p className="font-semibold text-foreground">
                  Information details
                </p>
                <p className="break-all text-muted-foreground">
                  <span className="font-medium text-foreground">User ID: </span>
                  {session.status === "authenticated" ? session.userId : "N/A"}
                </p>
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Status: </span>
                  {session.status}
                </p>
              </div>
            ) : null}

            <div className="border-t border-border pt-1">
              <Button
                type="button"
                variant="outline"
                aria-label="Sign out"
                className="min-h-11 w-full justify-center gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={signOut}
              >
                <LogOut aria-hidden="true" className="size-4" />
                <span>Log out</span>
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
