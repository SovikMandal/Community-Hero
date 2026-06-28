// Google Sign-In via the OAuth 2.0 authorization-code flow.
//
// Flow: we send the browser to Google's consent screen ("Choose an account to
// continue to <app>"). Google redirects back to our callback with a one-time
// `code`, which we exchange (server-side, using the client secret) for tokens.
// We verify the returned ID token and trust its claims (email, name, sub).
import { OAuth2Client } from "google-auth-library";
import { env } from "./env.js";

// A single OAuth2 client configured with our credentials + redirect URI.
export const googleClient = new OAuth2Client({
  clientId: env.googleClientId,
  clientSecret: env.googleClientSecret,
  redirectUri: env.googleRedirectUri,
});

// OpenID Connect scopes: identify the user, no Google API access requested.
const GOOGLE_SCOPES = ["openid", "email", "profile"];

/** True when the OAuth 2.0 flow is fully configured (id + secret present). */
export function isGoogleAuthEnabled() {
  return Boolean(env.googleClientId && env.googleClientSecret);
}

/**
 * Builds the Google consent-screen URL to redirect the user to.
 * `prompt: "select_account"` forces the account chooser every time.
 * `state` is an anti-CSRF nonce echoed back to our callback.
 */
export function getGoogleAuthUrl(state) {
  return googleClient.generateAuthUrl({
    access_type: "online",
    scope: GOOGLE_SCOPES,
    prompt: "select_account",
    include_granted_scopes: true,
    state,
  });
}

/**
 * Exchanges the authorization `code` for tokens and returns the verified
 * ID-token payload. Throws if the code is invalid or the token can't be verified.
 */
export async function getGoogleProfile(code) {
  const { tokens } = await googleClient.getToken(code);
  if (!tokens.id_token) {
    throw new Error("Google did not return an id_token");
  }
  const ticket = await googleClient.verifyIdToken({
    idToken: tokens.id_token,
    audience: env.googleClientId,
  });
  return ticket.getPayload();
}
