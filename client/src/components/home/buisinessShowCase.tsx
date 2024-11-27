import React from "react";
import { color1, color2, color3 } from "../../global";
import useIsMobile from "../../hooks/useIsMobile";

function BusinessShowcase() {
  const isMobile = useIsMobile();
  return (
    <div id="showcase" className="showcaseBlock">
      <header className="showcaseHeader">
        <h1 style={{ fontSize: isMobile ? "24px" : "36px", color: color2 }}>Simplifying Sourcing and Trade Opportunities in China</h1>
        <p style={{ fontSize: isMobile ? "14px" : "18px" }}>
          Your trusted partner in sourcing, facilitating, and exploring opportunities in China.
        </p>
      </header>

      <section className="servicesSection">
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-around", marginTop: "20px" }}>
          <div className="serviceCard" style={{ width: isMobile ? "80%" : "30%"}}>
            <h3 style={{ color: color1 }}>Client Sourcing</h3>
            <p>Helping you find and connect with the right partners for your business needs.</p>
          </div>
          <div className="serviceCard" style={{ width: isMobile ? "80%" : "30%" }}>
            <h3 style={{ color: color2 }}>Purchase Assistance</h3>
            <p>Providing expert support to ensure smooth transactions and top-quality purchases.</p>
          </div>
          <div className="serviceCard" style={{ width: isMobile ? "80%" : "30%" }}>
            <h3 style={{ color: color3 }}>Facilitation Services</h3>
            <p>Simplifying your journey with logistics, guidance, and local expertise.</p>
          </div>
        </div>
      </section>

      <footer className="showcaseFooter">
        <p>Get in touch today to start your journey with us!</p>
      </footer>
    </div>
  );
}

export default BusinessShowcase;
