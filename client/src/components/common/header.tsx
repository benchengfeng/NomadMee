import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { color1, color4 } from "../../global";
import { Image } from "rebass";
import logonomadmee from "../../assets/images/logonomadmee.png";
import camelsCaravan from "../../assets/images/camelscaravan.png";
import useIsMobile from "../../hooks/useIsMobile";

const AppHeader: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isMobile = useIsMobile();

  // Initialize language state from i18n or localStorage
  const [language, setLanguage] = useState<string>(i18n.language === "fr" ? "FR" : "ENG");

  useEffect(() => {
    // Update language state when i18n language changes
    const storedLang = localStorage.getItem("i18nextLng");
    if (storedLang) {
      setLanguage(storedLang === "fr" ? "FR" : "ENG");
    }
  }, [i18n.language]); // This ensures the state is updated whenever the language changes

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedLanguage = event.target.value;
    setLanguage(selectedLanguage);

    // Change the language in i18n
    i18n.changeLanguage(selectedLanguage === "ENG" ? "en" : "fr");
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
          {t("headerTitle")}
        </div>

        {/* Language Switcher */}
        <div
          style={{
            position: "absolute",
            right: isMobile ? "-10px" : "150px",
            top: isMobile ? "65px" : "5px",
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
            <option value="ENG">🇬🇧 EN</option>
            <option value="FR">🇫🇷 FR</option>
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
            <a href="/">{t("home")}</a>
          </li>
          <li>
            <a href="hotDeals">{t("hotDealsHeader")}</a>
          </li>
          <li>
            <a href="aboutUs">{t("aboutUsHeader")}</a>
          </li>
          <li>
            <a href="contact">{t("contactHeader")}</a>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default AppHeader;
