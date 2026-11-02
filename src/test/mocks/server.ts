import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

// Test process only. No service worker or fictional endpoints are shipped to browsers.
export const server = setupServer(
  http.get("*/identity/api/v1/me/organizations", () =>
    HttpResponse.json({
      success: true,
      data: { items: [], nextCursor: null },
      error: null,
    }),
  ),
  http.get("*/identity/api/v1/me/ownership-nominations", () =>
    HttpResponse.json({
      success: true,
      data: { items: [], nextCursor: null },
      error: null,
    }),
  ),
);
