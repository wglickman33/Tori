import { useEffect, useState } from "react";
import { fetchItems } from "../services/firebaseService.js";

const useFetchItems = (userId) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchedItems = await fetchItems(userId);
        setItems(Object.values(fetchedItems));
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  return { items, loading, error };
};

export default useFetchItems;
