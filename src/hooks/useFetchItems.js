import { useEffect, useState } from "react";
import { fetchItems } from "../services/firebaseService";

const useFetchItems = (userId, folderId = null) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchedItems = await fetchItems(userId, folderId);
        setItems(fetchedItems);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchData();
  }, [userId, folderId]);

  return { items, loading, error };
};

export default useFetchItems;
