import type { AuthIntegration } from "@/lib/api/authIntegration";

type Snapshot =
  | { status: "anonymous"; localSignOut?: boolean }
  | { status: "authenticated"; userId: string; expiresAt: number };
type LoginSession = { accessToken: string; userId: string; expiresAt: number };
let snapshot: Snapshot = { status: "anonymous" };
let accessToken: string | undefined;
let generation = 0;
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();
const emit = () => {
  listeners.forEach((listener) => {
    listener();
  });
};

export const authSession: AuthIntegration & {
  getSnapshot: () => Snapshot;
  subscribe: (listener: () => void) => () => void;
  begin: () => number;
  version: () => number;
  cancel: (attempt: number) => void;
  establish: (session: LoginSession, attempt: number) => boolean;
  clear: (localSignOut?: boolean) => void;
} = {
  getAccessToken: () => {
    if (
      snapshot.status === "authenticated" &&
      Date.now() + 30_000 >= snapshot.expiresAt
    )
      authSession.clear();
    return accessToken;
  },
  getSnapshot: () => snapshot,
  subscribe: (listener) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  begin: () => ++generation,
  version: () => generation,
  cancel: (attempt) => {
    if (generation === attempt) generation++;
  },
  establish: (session, attempt) => {
    if (attempt !== generation || session.expiresAt <= Date.now() + 30_000)
      return false;
    if (timer) clearTimeout(timer);
    accessToken = session.accessToken;
    snapshot = {
      status: "authenticated",
      userId: session.userId,
      expiresAt: session.expiresAt,
    };
    const expire = () => {
      const remaining = session.expiresAt - 30_000 - Date.now();
      if (remaining <= 0) {
        authSession.clear();
        return;
      }
      timer = setTimeout(expire, Math.min(remaining, 2_147_483_647));
    };
    expire();
    emit();
    return true;
  },
  clear: (localSignOut = false) => {
    generation++;
    if (timer) clearTimeout(timer);
    timer = undefined;
    accessToken = undefined;
    snapshot = { status: "anonymous", localSignOut };
    emit();
  },
};
