import React, { useEffect, useState } from 'react';

const FetcherHook = () => {
  const [data, setData] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch data from the PHP script
    fetch('/server.php') // Assuming the PHP script is at the root directory
      .then((response) => response.json())
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch((error) => {
        setError('Error fetching data');
        setLoading(false);
        console.error('Error fetching data:', error);
      });
  }, []);

  if (loading) {
    return <div>Loading...</div>; // Display a loading state
  }

  if (error) {
    return <div>{error}</div>; // Display error if any
  }

  // Assuming data is an array, render it dynamically
  return (
    <div>
      {data && data.length > 0 ? (
        <ul>
          {data.map((item: any, index: number) => (
            <li key={index}>
              {item.name} - {item.id} - {item.enabled ? 'Enabled' : 'Disabled'}
            </li>
          ))}
        </ul>
      ) : (
        <p>No data available.</p>
      )}
    </div>
  );
};

export default FetcherHook;
