import { useEffect, useRef, useState } from "react";
import { LogOut, User, UserRound } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { authSession } from "@/lib/api/authSession";
import { useAuthSession } from "@/lib/api/useAuthSession";
import { clearSessionCache } from "@/lib/query/queryScope";
import { ROUTES } from "@/lib/routes";

const MENU_ITEM_CLASS =
  "min-h-11 w-full justify-start gap-2 text-sm font-medium";

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
        className="size-10 rounded-full border-transparent bg-avatar-4 text-avatar-4-foreground shadow-none transition-colors duration-150 ease-out hover:bg-avatar-4 hover:text-foreground"
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
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
              >
                <User className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  Your account
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {session.status === "authenticated"
                    ? "Signed in on this device"
                    : "Not signed in"}
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              className={MENU_ITEM_CLASS}
              aria-expanded={showDetails}
              onClick={() => {
                setShowDetails((prev) => !prev);
              }}
            >
              <UserRound
                aria-hidden="true"
                className="size-4 text-muted-foreground"
              />
              <span>My Profile</span>
            </Button>

            {showDetails ? (
              <div
                role="region"
                aria-label="My Profile details"
                className="flex flex-col gap-2 rounded-lg border border-border bg-muted p-3 text-xs"
              >
                <p className="font-semibold text-foreground">My Profile</p>
                <p className="break-all text-muted-foreground">
                  <span className="font-medium text-foreground">User ID: </span>
                  {session.status === "authenticated" ? session.userId : "N/A"}
                </p>
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Status: </span>
                  {session.status === "authenticated"
                    ? "Signed in"
                    : "Not signed in"}
                </p>
              </div>
            ) : null}

            <Button asChild variant="ghost" className={MENU_ITEM_CLASS}>
              <Link
                to={ROUTES.portal}
                onClick={() => {
                  setOpen(false);
                }}
              >
                Client portal
              </Link>
            </Button>

            <div className="border-t border-border pt-3">
              <Button
                type="button"
                variant="ghost"
                aria-label="Sign out"
                className={MENU_ITEM_CLASS}
                onClick={signOut}
              >
                <LogOut
                  aria-hidden="true"
                  className="size-4 text-muted-foreground"
                />
                <span>Log out</span>
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
