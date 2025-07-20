import { useState, useEffect, useRef } from 'react';
import { calculateDistance } from '../lib/utils';

/**
 * Custom hook for handling geolocation
 * @param {Object} options - Geolocation options
 * @returns {Object} Location utilities
 */
export function useLocation(options = {}) {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const watchIdRef = useRef(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError(new Error('Geolocation is not supported by your browser'));
      setLoading(false);
      return;
    }

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        });
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 27000, ...options }
    );

    // Watch user location
    const id = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        });
      },
      (err) => {
        setError(err);
      },
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 27000, ...options }
    );

    watchIdRef.current = id;

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []); // <-- ✅ dependency empty, not [options]

  const getDistanceTo = (targetLat, targetLon) => {
    if (!location) return null;
    return calculateDistance(location.latitude, location.longitude, targetLat, targetLon);
  };

  const refreshLocation = () => {
    if (!navigator.geolocation) {
      setError(new Error('Geolocation not supported'));
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        });
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 27000 }
    );
  };

  return {
    location,
    error,
    loading,
    getDistanceTo,
    refreshLocation
  };
}

export default useLocation;
