// Helper functions for storage operations

/**
 * Generates a random 6-digit OTP
 * @returns {string} 6-digit OTP
 */
export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Calculates the distance between two points on Earth using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
}

/**
 * Converts degrees to radians
 * @param {number} deg - Degrees
 * @returns {number} Radians
 */
function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Format currency in Indian Rupee format
 * @param {number} amount - Amount to format
 * @returns {string} Formatted amount
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount);
}

/**
 * Format date in readable format
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date
 */
export function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Calculate approximate arrival time to toll plaza based on distance
 * @param {number} distanceKm - Distance in kilometers
 * @param {number} avgSpeedKmh - Average speed in km/h (default 60)
 * @returns {string} Arrival time in minutes
 */
export function calculateArrivalTime(distanceKm, avgSpeedKmh = 60) {
  const timeHours = distanceKm / avgSpeedKmh;
  const timeMinutes = Math.round(timeHours * 60);
  return timeMinutes <= 1 ? 'Less than 1 min' : `${timeMinutes} mins`;
}
