import { useState, useEffect } from 'react';

// Custom Hook to check if the window is mobile
function useIsMobile(threshold = 768) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= threshold);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= threshold);
    };

    window.addEventListener('resize', handleResize);
    
    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [threshold]);

  return isMobile;
}

export default useIsMobile;