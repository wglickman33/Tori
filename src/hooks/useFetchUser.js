import { useEffect, useState } from "react";
import { fetchUser } from "../services/firebaseService.js";

const useFetchUser = (userId) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchedUser = await fetchUser(userId);
        setUser(fetchedUser);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  return { user, loading, error };
};

export default useFetchUser;
