import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppRouter } from "@/app/router";
import { QueryProvider } from "@/app/providers/QueryProvider";
import { SessionCacheObserver } from "@/features/auth/model/SessionCacheObserver";
import "@/index.css";
import {
  captureInvitationFragment,
  createInvitationFlow,
} from "@/features/workspaces/recipient/invitationFlow";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Missing Vite root element.");
}

const initialInvitation = createInvitationFlow(captureInvitationFragment());
createRoot(rootElement).render(
  <StrictMode>
    <QueryProvider>
      <SessionCacheObserver />
      <AppRouter initialInvitation={initialInvitation} />
    </QueryProvider>
  </StrictMode>,
);
