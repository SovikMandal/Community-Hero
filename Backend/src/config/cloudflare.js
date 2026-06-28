// Cloudflare Workers AI client configuration.
// Uses the REST API — no SDK dependency needed.
import { env } from "./env.js";

export const isCloudflareConfigured = Boolean(
  env.cloudflare?.accountId && env.cloudflare?.apiToken
);

const CF_BASE = () =>
  `https://api.cloudflare.com/client/v4/accounts/${env.cloudflare.accountId}/ai/run`;

/**
 * Run a Cloudflare Workers AI model via REST.
 * @param {string} model  e.g. "@cf/meta/llama-3.3-70b-instruct-fp8-fast"
 * @param {object} body   JSON payload
 * @returns {Promise<object>}
 */
export async function cfRun(model, body) {
  const res = await fetch(`${CF_BASE()}/${model}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.cloudflare.apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cloudflare AI error ${res.status}: ${text}`);
  }

  const json = await res.json();
  return json.result;
}

/**
 * Run a Cloudflare Workers AI model with raw binary body (for images/audio).
 * @param {string} model
 * @param {Buffer} buffer
 * @returns {Promise<object>}
 */
export async function cfRunBinary(model, buffer) {
  const res = await fetch(`${CF_BASE()}/${model}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.cloudflare.apiToken}`,
      "Content-Type": "application/octet-stream",
    },
    body: buffer,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cloudflare AI error ${res.status}: ${text}`);
  }

  const json = await res.json();
  return json.result;
}

export default { cfRun, cfRunBinary, isCloudflareConfigured };
