import { useEffect, useState } from 'react';

const SESSION_KEY = 'myoneopinion_counted_session';

export function useVisitCount() {
  const [visits, setVisits] = useState<number>(13);
  const [isLive, setIsLive] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function syncGlobalVisits() {
      try {
        const hasCountedSession = sessionStorage.getItem(SESSION_KEY);
        const method = hasCountedSession ? 'GET' : 'POST';

        const res = await fetch('/api/visits', {
          method,
          headers: { 'Content-Type': 'application/json' },
        });

        if (res.ok) {
          const data = await res.json();
          if (typeof data.visits === 'number' && isMounted) {
            setVisits(data.visits);
            sessionStorage.setItem(SESSION_KEY, 'true');
            return;
          }
        }

        // Fallback: fetch static public visits.json
        const fallbackRes = await fetch('/visits.json');
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          if (typeof fallbackData.count === 'number' && isMounted) {
            setVisits(fallbackData.count);
          }
        }
      } catch {
        // Keep initial fallback
        setIsLive(false);
      }
    }

    syncGlobalVisits();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    visits,
    formattedVisits: visits.toLocaleString(),
    isLive,
  };
}
