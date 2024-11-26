import { useEffect } from "react";


const GoogleAnalytics = () => {
  useEffect(() => {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX`;
    document.head.appendChild(script);

    script.onload = () => {
      // Initialize the dataLayer
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () {
        window.dataLayer.push(arguments);
      };

      // Convert Date to string and call gtag with correct arguments
      window.gtag("js", new Date().toISOString());  // Use ISO string format
      window.gtag("config", "G-XXXXXXXXXX");
    };
  }, []);

  return null;
};

export default GoogleAnalytics;
