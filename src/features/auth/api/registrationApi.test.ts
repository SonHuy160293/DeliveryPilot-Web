import { http, HttpResponse } from "msw";
import { expect, it } from "vitest";
import { createHttpClient } from "@/lib/api/httpClient";
import { registerUser } from "@/features/auth/api/registrationApi";
import { server } from "@/test/mocks/server";

const client = createHttpClient({
  baseUrl: "https://identity.test.invalid/identity/",
  timeoutMs: 1000,
});
const input = {
  displayName: "Preview",
  email: "preview@example.com",
  password: "not-a-real-credential",
};

it("uses the verified public Identity route, envelope, and DTO without establishing a session", async () => {
  server.use(
    http.post(
      "https://identity.test.invalid/identity/api/v1/auth/register",
      async ({ request }) => {
        expect(await request.json()).toEqual(input);
        return HttpResponse.json(
          {
            success: true,
            data: { userId: "00000000-0000-0000-0000-000000000001" },
            error: null,
          },
          { status: 201 },
        );
      },
    ),
  );
  await expect(registerUser(input, undefined, client)).resolves.toEqual({
    userId: "00000000-0000-0000-0000-000000000001",
  });
  expect(localStorage.length).toBe(0);
});

it.each([
  { success: true, data: { userId: 42 }, error: null },
  {
    success: false,
    data: null,
    error: { code: "Registration.Failed", message: "private detail" },
  },
  { wrong: "shape" },
])("rejects malformed/application-failed success responses", async (body) => {
  server.use(
    http.post(
      "https://identity.test.invalid/identity/api/v1/auth/register",
      () => HttpResponse.json(body),
    ),
  );
  await expect(registerUser(input, undefined, client)).rejects.toMatchObject({
    name: "ApiError",
  });
});
