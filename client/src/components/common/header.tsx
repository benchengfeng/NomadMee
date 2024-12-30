import React, { useState } from "react";
import { color1, color4 } from "../../global";
import { Image } from "rebass";
import logonomadmee from "../../assets/images/logonomadmee.png";
import camelsCaravan from "../../assets/images/camelscaravan.png";
import useIsMobile from "../../hooks/useIsMobile";

function AppHeader() {
  const isMobile = useIsMobile();
  const [language, setLanguage] = useState("ENG");

  const handleLanguageChange = (event: any) => {
    setLanguage(event.target.value);
  };

  return (
    <div className="container-fluid">
      {/* Main Header */}
      <div className="header">
        {/* Extreme Left Logo */}
        <div style={{ flex: "0 0 auto" }}>
          <Image
            src={logonomadmee}
            sx={{
              maxWidth: "100%",
              width: isMobile ? "6rem" : "7rem",
            }}
            alt="NomadMee Logo"
          />
        </div>

        {/* Center Text */}
        <div
          style={{
            flex: "1 1 auto",
            textAlign: "center",
            color: color4,
            fontSize: isMobile ? "1rem" : "1.5rem",
            fontWeight: "bold",
            whiteSpace: "normal",
            overflow: "hidden",
          }}
        >
          Bridging Trade Across Continents
        </div>

        {/* Language Switcher */}
        <div
          style={{
            position: isMobile ? "absolute" : "relative",
            right: "0",
            bottom: "0",
            flex: "0 0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            marginRight: "1rem",
            cursor: "pointer",
            color: color1,
          }}
        >
          <select
            value={language}
            onChange={handleLanguageChange}
            style={{
              fontSize: isMobile ? "0.9rem" : "1rem",
              fontWeight: "bold",
              padding: "0.5rem",
              border: "1px solid",
              borderRadius: "4px",
              backgroundColor: "#f0f0f0",
              boxShadow: "0px 2px 5px rgba(0,0,0,0.2)",
              cursor: "pointer",
            }}
          >
            <option value="ENG">🇬🇧 English</option>
            <option value="FR">🇫🇷 Français</option>
          </select>
        </div>

        {/* Extreme Right Image */}
        <div style={{ flex: "0 0 auto" }}>
          <Image
            src={camelsCaravan}
            sx={{
              maxWidth: "100%",
              width: isMobile ? "10rem" : "11rem",
            }}
            alt="Camels Caravan"
          />
        </div>
      </div>

      {/* Sticky Navigation Bar */}
      <div className="stickyMenu">
        <ul className="menuItems">
          <li>
            <a href="/">Home</a>
          </li>
          <li>
            <a href="hotDeals">Hot Deals</a>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default AppHeader;
