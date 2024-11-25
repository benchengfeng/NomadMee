import React from "react";
import { color1, color2, color3, color4, color5 } from "../../global";
import useIsMobile from "../../hooks/useIsMobile";

function BusinessShowcase() {
  const isMobile = useIsMobile();
  return (
    <div id="showcase" className="showcaseBlock" style={{ backgroundColor: color1, color: color5 }}>
      <header className="showcaseHeader" style={{ padding: "20px", textAlign: "center", borderBottom: `2px solid ${color3}` }}>
        <h1 style={{ fontSize: isMobile ? "24px" : "36px", color: color2 }}>Simplifying Sourcing and Trade Opportunities in China</h1>
        <p style={{ fontSize: isMobile ? "14px" : "18px" }}>
          Your trusted partner in sourcing, facilitating, and exploring opportunities in China.
        </p>
      </header>

      <section className="servicesSection" style={{ padding: "20px", textAlign: "center" }}>
        <h2 style={{ color: color1 }}>Our Services</h2>
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-around", marginTop: "20px" }}>
          <div className="serviceCard" style={{ width: isMobile ? "80%" : "30%", padding: "10px", border: `1px solid ${color4}`, margin: "10px", borderRadius: "10px" }}>
            <h3 style={{ color: color1 }}>Client Sourcing</h3>
            <p>Helping you find and connect with the right partners for your business needs.</p>
          </div>
          <div className="serviceCard" style={{ width: isMobile ? "80%" : "30%", padding: "10px", border: `1px solid ${color4}`, margin: "10px", borderRadius: "10px" }}>
            <h3 style={{ color: color2 }}>Purchase Assistance</h3>
            <p>Providing expert support to ensure smooth transactions and top-quality purchases.</p>
          </div>
          <div className="serviceCard" style={{ width: isMobile ? "80%" : "30%", padding: "10px", border: `1px solid ${color4}`, margin: "10px", borderRadius: "10px" }}>
            <h3 style={{ color: color3 }}>Facilitation Services</h3>
            <p>Simplifying your journey with logistics, guidance, and local expertise.</p>
          </div>
        </div>
      </section>

      <footer className="showcaseFooter" style={{ padding: "10px", textAlign: "center", backgroundColor: color3, color: color1 }}>
        <p>Get in touch today to start your journey with us!</p>
      </footer>
    </div>
  );
}

export default BusinessShowcase;
