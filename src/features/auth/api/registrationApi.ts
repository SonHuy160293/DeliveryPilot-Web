import { ApiError } from "@/lib/api/apiError";
import { unwrapApiResponse } from "@/lib/api/apiResponse";
import { isRecord } from "@/lib/api/errorNormalizer";
import { createHttpClient } from "@/lib/api/httpClient";
import { readApiConfig } from "@/lib/api/config";
import { anonymousAuth } from "@/lib/api/authIntegration";
import type { AxiosInstance } from "axios";

/** Source-verified .NET records; see docs/frontend/api-integration.md for authority paths. */
export interface RegisterUserRequest {
  displayName: string | null;
  email: string | null;
  password: string | null;
}
export interface RegisterUserResponse {
  userId: string;
}

const registrationClient = createHttpClient(
  readApiConfig(import.meta.env),
  anonymousAuth,
);

/** Imperative only: credentials never enter Query caches and registration creates no session. */
export async function registerUser(
  input: RegisterUserRequest,
  signal?: AbortSignal,
  client: AxiosInstance = registrationClient,
): Promise<RegisterUserResponse> {
  const response = await client.post<unknown>("api/v1/auth/register", input, {
    signal,
  });
  const data = unwrapApiResponse(response.data);
  if (
    !isRecord(data) ||
    typeof data.userId !== "string" ||
    !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(
      data.userId,
    )
  ) {
    throw new ApiError(
      "protocol",
      "The registration response could not be read.",
    );
  }
  return { userId: data.userId };
}
