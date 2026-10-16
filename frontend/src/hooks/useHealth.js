import { useState, useEffect, useCallback } from 'react';
import { checkBackendHealth } from '../services/api';

export function useHealth() {
  const [health, setHealth] = useState({
    status: 'checking',
    latency: null,
    service: null,
    version: null,
    timestamp: null
  });

  const refreshHealth = useCallback(async () => {
    setHealth(prev => ({ ...prev, status: 'checking' }));
    const res = await checkBackendHealth();
    setHealth(res);
  }, []);

  useEffect(() => {
    refreshHealth();
    const interval = setInterval(refreshHealth, 15000);
    return () => clearInterval(interval);
  }, [refreshHealth]);

  return { health, refreshHealth };
}
