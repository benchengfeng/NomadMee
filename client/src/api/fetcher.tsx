import { useEffect, useState } from 'react';

const useFetcher = (url: string) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch data from the given URL
    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Error fetching data');
        setLoading(false);
        console.error('Error fetching data:', err);
      });
  }, [url]);

  return { data, loading, error };
};

export default useFetcher;
