import { useEffect, useState } from 'react';

// const FetcherHook = () => {
//   const [data, setData] = useState<any>([]);
//   console.log('fetching data:', JSON.stringify(data));
  
//   useEffect(() => {
//     // Fetch data from the PHP script
//     fetch('/server.php') // Assuming the PHP script is at the root directory
//       .then((response) => response.json())
//       .then((result) => {
//         setData(result);
//       })
//       .catch((error) => {
//         console.error('Error fetching data:', error);
//       });
//   }, []);

//   return (
//     <div>
//       {/* Render your data here */}
//       {data.map((item:any) => (
//         <div key={item.id}>{item.name}</div>
//       ))}
//     </div>
//   );
// };

// export default FetcherHook;


const FetcherHook = () => {
  const [data, setData] = useState<any>([]);
  console.log('fetching data:', JSON.stringify(data));
  
  useEffect(() => {
    // Fetch data from the PHP script
    fetch('/server.php') // Assuming the PHP script is at the root directory
      .then((response) => response.json())
      .then((result) => {
        setData(result);
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
      });
  }, []);

  return (data);
};

export default FetcherHook;