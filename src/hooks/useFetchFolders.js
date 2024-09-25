import { useEffect, useState } from "react";
import { fetchFolders } from "../services/firebaseService.js";

const useFetchFolders = (userId) => {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchedFolders = await fetchFolders(userId);
        setFolders(fetchedFolders);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  return { folders, loading, error };
};

export default useFetchFolders;
