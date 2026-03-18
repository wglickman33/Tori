import { useEffect, useState } from "react";
import { fetchFolders } from "../services/api.js";

const POLL_INTERVAL_MS = 3000;

const useFetchFolders = (userId) => {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const poll = async () => {
      try {
        const list = await fetchFolders(userId);
        if (!cancelled) setFolders(Array.isArray(list) ? list : []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [userId]);

  return { folders, loading, error };
};

export default useFetchFolders;
