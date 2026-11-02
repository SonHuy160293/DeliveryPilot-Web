/** Explicit token source; this interface never stores or refreshes tokens. */
export interface AuthIntegration {
  getAccessToken: () => string | undefined;
}

// Public authentication calls do not send an access token.
export const anonymousAuth: AuthIntegration = {
  getAccessToken: () => undefined,
};
