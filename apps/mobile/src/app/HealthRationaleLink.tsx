import { useEffect } from 'react';
import { PrivacyPolicyScreen } from '../terms/PrivacyPolicyScreen';
import { useApp } from './useApp';
import { useNavigator } from './useNavigator';

/**
 * Health Connect's link to why the app asks for its permissions (MM-731):
 * sent here by it, the app opens on its privacy policy, whether the app was
 * started by the link or brought back to the front by it.
 */
export function HealthRationaleLink() {
  const { services } = useApp();
  const navigator = useNavigator();
  useEffect(() => {
    let live = true;
    const look = () => {
      if (document.visibilityState !== 'visible') return;
      void services.healthRationale.requested().then((requested) => {
        if (live && requested) navigator.push(() => <PrivacyPolicyScreen />);
      });
    };
    look();
    document.addEventListener('visibilitychange', look);
    return () => {
      live = false;
      document.removeEventListener('visibilitychange', look);
    };
  }, [services, navigator]);
  return null;
}
