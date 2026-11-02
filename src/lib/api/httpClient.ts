import axios, { type AxiosInstance } from "axios";
import { ApiError } from "@/lib/api/apiError";
import { anonymousAuth, type AuthIntegration } from "@/lib/api/authIntegration";
import { readApiConfig, type ApiConfig } from "@/lib/api/config";
import { normalizeApiError } from "@/lib/api/errorNormalizer";
import { authSession } from "@/lib/api/authSession";

function resolveBase(value: string | undefined): URL | undefined {
  if (!value) return undefined;
  const base = new URL(value, window.location.origin);
  if (
    !["http:", "https:"].includes(base.protocol) ||
    base.username ||
    base.password ||
    base.search ||
    base.hash
  ) {
    throw new ApiError(
      "configuration",
      "Configure an HTTP(S) API base URL without credentials, query, or fragment.",
    );
  }
  if (!base.pathname.endsWith("/")) base.pathname += "/";
  return base;
}

/** Only relative endpoint paths inside the configured API boundary are allowed. */
export function createHttpClient(
  config: ApiConfig,
  auth: AuthIntegration = anonymousAuth,
  options: {
    credentialedLogin?: boolean;
    invalidateSessionOn401?: boolean;
  } = {},
): AxiosInstance {
  let base: URL | undefined;
  try {
    base = resolveBase(config.baseUrl);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("configuration", "Configure a valid API base URL.");
  }
  const client = axios.create({
    baseURL: base?.href,
    timeout: config.timeoutMs,
    adapter: "fetch",
    withCredentials: false,
    fetchOptions: { redirect: "error" },
    headers: { Accept: "application/json" },
    responseType: "json",
    transitional: { silentJSONParsing: false },
  });
  const requestGenerations = new WeakMap<object, number>();
  client.interceptors.request.use((request) => {
    if (!base)
      throw new ApiError(
        "configuration",
        "Configure VITE_API_BASE_URL before making API requests.",
      );
    const path = request.url ?? "";
    if (
      !path ||
      /^(?:[a-z][a-z\d+.-]*:|\/)/i.test(path) ||
      /[\\#]|%2f|%5c/i.test(path)
    ) {
      throw new ApiError(
        "configuration",
        "API endpoints must be relative paths inside the configured base URL.",
      );
    }
    const destination = new URL(path, base);
    if (
      destination.origin !== base.origin ||
      !destination.pathname.startsWith(base.pathname) ||
      request.baseURL !== base.href ||
      request.withCredentials !== false ||
      request.auth
    ) {
      throw new ApiError(
        "configuration",
        "The request would leave the configured API or credential boundary.",
      );
    }
    request.headers.delete("Authorization");
    if (
      options.credentialedLogin &&
      request.method?.toLowerCase() === "post" &&
      path === "api/v1/auth/login"
    ) {
      request.withCredentials = true;
    }
    request.fetchOptions = { ...request.fetchOptions, redirect: "error" };
    const token = auth.getAccessToken();
    if (token) {
      request.headers.set("Authorization", `Bearer ${token}`);
      if (options.invalidateSessionOn401)
        requestGenerations.set(request, authSession.version());
    }
    return request;
  });
  client.interceptors.response.use(
    (response) => {
      if (response.status === 204) response.data = undefined;
      return response;
    },
    (error: unknown) => {
      if (
        options.invalidateSessionOn401 &&
        axios.isAxiosError(error) &&
        error.response?.status === 401
      ) {
        const current = auth.getAccessToken();
        if (
          current &&
          error.config &&
          requestGenerations.get(error.config) === authSession.version() &&
          error.config.headers.get("Authorization") === `Bearer ${current}`
        )
          authSession.clear();
      }
      return Promise.reject(normalizeApiError(error));
    },
  );
  return client;
}

export const httpClient = createHttpClient(
  readApiConfig(import.meta.env),
  authSession,
  { invalidateSessionOn401: true },
);
