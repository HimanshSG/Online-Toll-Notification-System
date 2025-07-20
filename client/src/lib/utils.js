import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges classes using Tailwind Merge and clsx
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number as Indian Rupees with compact notation for large amounts
 */
export function formatCurrency(amount, compact = false) {
  if (compact && amount >= 100000) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      notation: 'compact',
      minimumFractionDigits: 1
    }).format(amount);
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount);
}

/**
 * Calculates distance between two coordinates (latitude/longitude)
 * using the Haversine formula (returns distance in km)
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  if (lat1 === lat2 && lon1 === lon2) return 0;
  
  const R = 6371; // Earth radius in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2)); // Return with 2 decimal places
}

/**
 * Converts degrees to radians
 */
export function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Calculates estimated arrival time in minutes based on distance and average speed
 * Returns formatted string or minutes number based on returnString param
 */
export function calculateArrivalTime(distanceKm, avgSpeedKmh = 60, returnString = true) {
  const timeHours = distanceKm / avgSpeedKmh;
  const timeMinutes = Math.round(timeHours * 60);
  
  if (!returnString) return timeMinutes;
  
  if (timeMinutes <= 0) return 'Arrived';
  if (timeMinutes <= 1) return 'Less than 1 min';
  if (timeMinutes < 60) return `${timeMinutes} mins`;
  
  const hours = Math.floor(timeMinutes / 60);
  const mins = timeMinutes % 60;
  return `${hours}h ${mins > 0 ? `${mins}m` : ''}`.trim();
}

/**
 * Date/Time formatting utilities
 */

/**
 * Formats date into different string formats
 * @param {Date|string} date - Date object or ISO string
 * @param {string} format - One of: 'full', 'date', 'time', 'relative'
 * @returns {string} Formatted date string
 */
export function formatDate(date, format = 'full') {
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid Date';

  const options = {
    full: {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    },
    date: {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    },
    time: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    },
    shortDate: {
      day: 'numeric',
      month: 'short'
    }
  };

  if (format === 'relative') return timeAgo(date);
  return d.toLocaleString('en-IN', options[format] || options.full);
}

/**
 * Returns human-readable time ago (e.g., "5 mins ago")
 * More precise version with thresholds
 */
export function timeAgo(date) {
  const now = new Date();
  const past = new Date(date);
  const seconds = Math.floor((now - past) / 1000);

  const intervals = [
    { unit: 'year', seconds: 31536000 },
    { unit: 'month', seconds: 2592000 },
    { unit: 'week', seconds: 604800 },
    { unit: 'day', seconds: 86400 },
    { unit: 'hour', seconds: 3600 },
    { unit: 'minute', seconds: 60 },
    { unit: 'second', seconds: 1 }
  ];

  for (const { unit, seconds: sec } of intervals) {
    const interval = Math.floor(seconds / sec);
    if (interval >= 1) {
      return interval === 1 ? `1 ${unit} ago` : `${interval} ${unit}s ago`;
    }
  }
  return 'just now';
}

/**
 * Returns initials (first letters) from a full name
 * Handles edge cases better
 */
export function getInitials(name, maxLength = 2) {
  if (!name || typeof name !== 'string') return '';
  
  return name
    .trim()
    .split(/\s+/)
    .filter(part => part.length > 0)
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, maxLength);
}

/**
 * Returns toll plazas that are within a given threshold (in km) of the route
 * More efficient implementation with early termination
 */
export function getTollsOnRoute(tollPlazas, routeCoords, thresholdKm = 5) {
  if (!tollPlazas?.length || !routeCoords?.length || routeCoords.length < 2) {
    return [];
  }

  return tollPlazas.filter(toll => {
    const tollPoint = { lat: toll.latitude, lng: toll.longitude };
    
    for (let i = 0; i < routeCoords.length - 1; i++) {
      const segmentStart = { lng: routeCoords[i][0], lat: routeCoords[i][1] };
      const segmentEnd = { lng: routeCoords[i+1][0], lat: routeCoords[i+1][1] };
      
      if (distanceToSegment(tollPoint, segmentStart, segmentEnd) <= thresholdKm) {
        return true;
      }
    }
    return false;
  });
}

/**
 * Helper function to calculate distance from point to line segment
 */
function distanceToSegment(point, segmentStart, segmentEnd) {
  const d1 = calculateDistance(point.lat, point.lng, segmentStart.lat, segmentStart.lng);
  const d2 = calculateDistance(point.lat, point.lng, segmentEnd.lat, segmentEnd.lng);
  const segmentLength = calculateDistance(segmentStart.lat, segmentStart.lng, segmentEnd.lat, segmentEnd.lng);
  
  // If segment is very short, use simple distance
  if (segmentLength < 0.1) return Math.min(d1, d2);
  
  // Calculate along-track distance
  const alongDistance = (d1**2 - d2**2 + segmentLength**2) / (2 * segmentLength);
  
  // If point projects onto the segment
  if (alongDistance > 0 && alongDistance < segmentLength) {
    return Math.sqrt(d1**2 - alongDistance**2);
  }
  
  return Math.min(d1, d2);
}

/**
 * New utility: Formats duration in minutes to HH:MM format
 */
export function formatDuration(minutes) {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs > 0 ? `${hrs}h ` : ''}${mins > 0 ? `${mins}m` : ''}`.trim() || '0m';
}

/**
 * New utility: Debounce function for limiting rapid API calls
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

/**
 * New utility: Throttle function for limiting function calls
 */
export function throttle(func, limit = 300) {
  let lastFunc;
  let lastRan;
  return function(...args) {
    if (!lastRan) {
      func.apply(this, args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if ((Date.now() - lastRan) >= limit) {
          func.apply(this, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
}