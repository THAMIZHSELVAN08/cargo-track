/**
 * Geofencing Utility
 * Contains helper functions for GPS-based geofence validation
 */

/**
 * Calculate the Haversine distance between two GPS coordinates (in meters)
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lng1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lng2 - Longitude of point 2
 * @returns {number} Distance in meters
 */
const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Check if a coordinate is within a circular geofence
 * @param {number} lat - Target latitude
 * @param {number} lng - Target longitude
 * @param {object} fence - { centerLat, centerLng, radiusMeters }
 * @returns {{ inside: boolean, distance: number }}
 */
const isInsideCircularGeofence = (lat, lng, fence) => {
  const distance = haversineDistance(lat, lng, fence.centerLat, fence.centerLng);
  return {
    inside: distance <= fence.radiusMeters,
    distance: Math.round(distance),
  };
};

/**
 * Check if a point is inside a polygon using Ray Casting algorithm.
 *
 * Numerically hardened:
 * - Skips degenerate horizontal edges (yj === yi within epsilon) to avoid
 *   division by zero and false positives on boundary vertices.
 * - Uses strict inequality so points that sit exactly on a polygon boundary
 *   return a deterministic `false` (treated as outside) rather than flipping
 *   unpredictably.
 *
 * @param {{ lat: number, lng: number }} point - Target coordinates
 * @param {Array<{lat, lng}>} polygon - Array of polygon vertices (min 3)
 * @returns {boolean}
 */
const isInsideGeofence = (point, polygon) => {
  if (!polygon || polygon.length < 3) return false;

  const EPSILON = 1e-10; // Minimum edge-length before treating as degenerate
  const { lat, lng } = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lat, yi = polygon[i].lng;
    const xj = polygon[j].lat, yj = polygon[j].lng;

    // Skip horizontal edges: yj === yi → division by zero risk
    if (Math.abs(yj - yi) < EPSILON) continue;

    const intersect =
      ((yi > lng) !== (yj > lng)) &&
      (lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi);

    if (intersect) inside = !inside;
  }
  return inside;
};

/**
 * Get the default geofence from environment variables
 * @returns {{ centerLat, centerLng, radiusMeters }}
 */
const getDefaultGeofence = () => ({
  centerLat: parseFloat(process.env.DEFAULT_GEOFENCE_LAT || "12.9716"),
  centerLng: parseFloat(process.env.DEFAULT_GEOFENCE_LNG || "77.5946"),
  radiusMeters: parseInt(process.env.DEFAULT_GEOFENCE_RADIUS || "5000"),
});

module.exports = {
  haversineDistance,
  isInsideCircularGeofence,
  isInsideGeofence,
  getDefaultGeofence,
};
