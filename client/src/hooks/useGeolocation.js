import { useState, useEffect, useCallback } from 'react';
import { useKYCStore } from '../stores/kycStore';

export default function useGeolocation() {
  const [error, setError] = useState(null);
  const { setLocation } = useKYCStore();

  const getPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };
        setLocation(loc);
        console.log('Location captured:', loc);
      },
      (err) => {
        setError(err.message);
        console.error('Geolocation error:', err);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  }, [setLocation]);

  useEffect(() => {
    getPosition();
  }, [getPosition]);

  return { error, retry: getPosition };
}
