import { useEffect, useState } from "react";
import { fetchItems } from "../services/api.js";

const useFetchItems = (userId) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }
      try {
        const fetchedItems = await fetchItems(userId);
        setItems(Array.isArray(fetchedItems) ? fetchedItems : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  return { items, loading, error };
};

export default useFetchItems;
