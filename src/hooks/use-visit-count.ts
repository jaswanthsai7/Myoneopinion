import { useEffect, useState } from 'react';

const STORAGE_KEY = 'myoneopinion_real_visits';
const SESSION_KEY = 'myoneopinion_session_active';

export function useVisitCount() {
  const [visits, setVisits] = useState<number>(1);
  const [isLive] = useState<boolean>(true);

  useEffect(() => {
    try {
      // Clean up any legacy dummy count data if it exists in localStorage
      localStorage.removeItem('myoneopinion_site_visits');

      // 1. Read real stored visits (starts at 1)
      const stored = localStorage.getItem(STORAGE_KEY);
      let count = stored ? parseInt(stored, 10) : 0;
      if (isNaN(count) || count < 0) {
        count = 0;
      }

      // 2. Track new visit on unique session
      const sessionActive = sessionStorage.getItem(SESSION_KEY);
      if (!sessionActive) {
        count += 1;
        sessionStorage.setItem(SESSION_KEY, 'true');
        localStorage.setItem(STORAGE_KEY, count.toString());
      } else if (count === 0) {
        count = 1;
        localStorage.setItem(STORAGE_KEY, '1');
      }

      setVisits(count);
    } catch {
      setVisits(1);
    }
  }, []);

  return {
    visits,
    formattedVisits: visits.toLocaleString(),
    isLive,
  };
}
