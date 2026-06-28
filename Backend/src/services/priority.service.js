// Feature 3: Auto Priority scoring.
// Combines severity, traffic, people affected, and proximity to sensitive
// places (schools/hospitals) into a single priority score + level.
// Emergency issues (Feature 12) are always escalated to CRITICAL.

const SEVERITY_WEIGHT = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

/**
 * Computes a numeric priority score and a discrete level.
 *
 * @param {object} signals
 * @param {"LOW"|"MEDIUM"|"HIGH"|"CRITICAL"} signals.severity
 * @param {number} [signals.trafficLevel]   0-5
 * @param {number} [signals.peopleAffected]  raw count
 * @param {boolean} [signals.schoolNearby]
 * @param {boolean} [signals.hospitalNearby]
 * @param {boolean} [signals.isEmergency]
 * @returns {{ score: number, level: "LOW"|"MEDIUM"|"HIGH"|"CRITICAL" }}
 */
export function computePriority({
  severity = "MEDIUM",
  trafficLevel = 0,
  peopleAffected = 0,
  schoolNearby = false,
  hospitalNearby = false,
  isEmergency = false,
} = {}) {
  if (isEmergency) {
    return { score: 100, level: "CRITICAL" };
  }

  const severityWeight = SEVERITY_WEIGHT[severity] ?? 2;

  // Normalize signals to multipliers so no single factor dominates.
  const trafficFactor = 1 + Math.min(trafficLevel, 5) / 5; // 1.0 - 2.0
  const peopleFactor = 1 + Math.min(peopleAffected, 500) / 500; // 1.0 - 2.0
  const schoolFactor = schoolNearby ? 1.25 : 1;
  const hospitalFactor = hospitalNearby ? 1.35 : 1;

  // Base score scaled to ~0-100.
  const raw =
    severityWeight * 6.25 * trafficFactor * peopleFactor * schoolFactor * hospitalFactor;

  const score = Math.round(Math.min(raw, 100) * 100) / 100;

  let level;
  if (score >= 75) level = "CRITICAL";
  else if (score >= 50) level = "HIGH";
  else if (score >= 25) level = "MEDIUM";
  else level = "LOW";

  return { score, level };
}
