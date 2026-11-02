import { z } from "zod";
import { ApiError } from "@/lib/api/apiError";
import { unwrapApiResponse } from "@/lib/api/apiResponse";
import { createHttpClient } from "@/lib/api/httpClient";
import { readApiConfig } from "@/lib/api/config";
import { anonymousAuth } from "@/lib/api/authIntegration";
import { authSession } from "@/lib/api/authSession";

const schema = z.object({
  userId: z
    .string()
    .regex(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i),
  accessToken: z
    .string()
    .min(1)
    .regex(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/),
  tokenType: z.literal("Bearer"),
  expiresAt: z.iso.datetime({ offset: true }),
});
const loginClient = createHttpClient(
  readApiConfig(import.meta.env),
  anonymousAuth,
  { credentialedLogin: true },
);

/** No mutation/query cache: credentials and the returned token stay out of devtools and caches. */
export async function login(
  input: { email: string; password: string },
  attempt: number,
): Promise<boolean> {
  const response = await loginClient.post<unknown>("api/v1/auth/login", input);
  const parsed = schema.safeParse(unwrapApiResponse(response.data));
  if (!parsed.success)
    throw new ApiError("protocol", "The sign-in response could not be read.");
  const expiresAt = Date.parse(parsed.data.expiresAt);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now() + 30_000) {
    throw new ApiError(
      "protocol",
      "The sign-in response has expired. Please try again.",
    );
  }
  return authSession.establish(
    {
      userId: parsed.data.userId,
      accessToken: parsed.data.accessToken,
      expiresAt,
    },
    attempt,
  );
}
