// Keep-alive self-ping.
//
// Free-tier hosts (e.g. Render) suspend a service after ~15 min with no inbound
// HTTP traffic. This job periodically pings the service's own *public* URL so
// that real inbound traffic is generated, keeping the instance awake.
//
// Caveat: a self-ping can only *prevent* idling while the process is running —
// it cannot wake an instance that has already been suspended. For that, use an
// external monitor (UptimeRobot / cron-job.org) pointed at `/keepalive`.
//
// Controlled by env:
//   KEEPALIVE_ENABLED   "true" | "false"  (default: on in production)
//   KEEPALIVE_URL       full URL to ping  (default: RENDER_EXTERNAL_URL + /keepalive)
//   KEEPALIVE_INTERVAL_MS  ping interval   (default: 300000 = 5 min)
import { env } from "../config/env.js";

const FIVE_MINUTES = 5 * 60 * 1000;

function resolveTarget() {
  if (process.env.KEEPALIVE_URL) return process.env.KEEPALIVE_URL;

  // Render injects the public URL automatically.
  const base = process.env.RENDER_EXTERNAL_URL;
  if (base) return `${base.replace(/\/+$/, "")}/keepalive`;

  return null;
}

export function startKeepAlive() {
  const enabled =
    process.env.KEEPALIVE_ENABLED
      ? process.env.KEEPALIVE_ENABLED === "true"
      : env.nodeEnv === "production";

  if (!enabled) return;

  const target = resolveTarget();
  if (!target) {
    console.warn(
      "[keepalive] No ping URL resolved (set KEEPALIVE_URL or RENDER_EXTERNAL_URL). Skipping."
    );
    return;
  }

  const interval = Number(process.env.KEEPALIVE_INTERVAL_MS) || FIVE_MINUTES;

  console.log(`[keepalive] Self-ping enabled → ${target} every ${interval / 1000}s`);

  const timer = setInterval(async () => {
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(target, { signal: controller.signal });
      clearTimeout(t);
      if (!res.ok) {
        console.warn(`[keepalive] Ping returned ${res.status}`);
      }
    } catch (err) {
      console.warn(`[keepalive] Ping failed: ${err.message}`);
    }
  }, interval);

  // Don't let the timer keep the process alive during shutdown.
  timer.unref();
  return timer;
}
