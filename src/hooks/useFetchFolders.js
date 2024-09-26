import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../services/firebaseConfig.js";

const useFetchFolders = (userId) => {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;

    const folderRef = ref(database, `users/${userId}/folders`);

    const unsubscribe = onValue(
      folderRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const fetchedFolders = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }));
          setFolders(fetchedFolders);
        } else {
          setFolders([]);
        }
        setLoading(false);
      },
      (error) => {
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return { folders, loading, error };
};

export default useFetchFolders;
