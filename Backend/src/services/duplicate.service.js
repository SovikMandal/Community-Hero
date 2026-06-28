// Feature 2: Duplicate Detection.
// Finds existing open issues of the same category within a small geographic
// radius, so citizens can support an existing complaint instead of filing a
// new one.
import prisma from "../config/prisma.js";

const EARTH_RADIUS_M = 6371000;
const DEFAULT_RADIUS_M = 100; // consider issues within ~100 meters as duplicates

// Statuses that mean the issue is still active (open for support).
const OPEN_STATUSES = [
  "REPORTED",
  "VERIFIED",
  "ASSIGNED",
  "ENGINEER_VISITED",
  "REPAIR_STARTED",
];

/** Haversine distance between two lat/lng points, in meters. */
export function distanceMeters(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Returns potential duplicate issues near a location.
 *
 * @param {object} params
 * @param {string} params.category
 * @param {number} params.latitude
 * @param {number} params.longitude
 * @param {number} [params.radiusMeters]
 * @returns {Promise<Array<{ issue: object, distance: number }>>}
 */
export async function findDuplicates({
  category,
  latitude,
  longitude,
  radiusMeters = DEFAULT_RADIUS_M,
}) {
  // Rough bounding box prefilter (~degrees per meter) to limit the DB scan.
  const latDelta = radiusMeters / 111000;
  const lngDelta = radiusMeters / (111000 * Math.cos((latitude * Math.PI) / 180) || 1);

  const candidates = await prisma.issue.findMany({
    where: {
      category,
      status: { in: OPEN_STATUSES },
      latitude: { gte: latitude - latDelta, lte: latitude + latDelta },
      longitude: { gte: longitude - lngDelta, lte: longitude + lngDelta },
    },
    include: {
      _count: { select: { supports: true, votes: true } },
      images: { take: 1, select: { url: true } },
    },
  });

  return candidates
    .map((issue) => ({
      issue,
      distance: distanceMeters(latitude, longitude, issue.latitude, issue.longitude),
    }))
    .filter(({ distance }) => distance <= radiusMeters)
    .sort((a, b) => a.distance - b.distance);
}
