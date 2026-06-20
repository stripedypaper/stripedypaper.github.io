import { useEffect, useState } from 'react';
import { getRouteFromHash } from '../lib/site.js';

export function useRoute() {
  const [route, setRoute] = useState(() =>
    getRouteFromHash(window.location.hash)
  );

  useEffect(() => {
    function handleHashChange() {
      setRoute(getRouteFromHash(window.location.hash));
    }

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  return route;
}
