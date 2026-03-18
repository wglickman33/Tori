import { useEffect, useState } from "react";
import { fetchUser } from "../services/api.js";

const useFetchUser = (userId) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }
      try {
        const fetchedUser = await fetchUser(userId);
        setUser(fetchedUser);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  return { user, loading, error };
};

export default useFetchUser;
