import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_POS } from '../lib/config';

/**
 * status: 'loading' | 'granted' | 'denied' | 'unsupported'
 * pos is null only while loading; afterwards it is the GPS fix or the default location.
 */
export function useGeolocation() {
  const [state, setState] = useState({ status: 'loading', pos: null });

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setState({ status: 'unsupported', pos: DEFAULT_POS });
      return;
    }
    setState((s) => ({ ...s, status: 'loading' }));
    navigator.geolocation.getCurrentPosition(
      (p) => setState({ status: 'granted', pos: { lat: p.coords.latitude, lng: p.coords.longitude } }),
      () => setState({ status: 'denied', pos: DEFAULT_POS }),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  useEffect(() => {
    locate();
  }, [locate]);

  return { ...state, retry: locate };
}
