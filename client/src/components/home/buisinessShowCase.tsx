import React from "react";
import { useTranslation } from "react-i18next";
import { color1, color2, color3 } from "../../global";
import useIsMobile from "../../hooks/useIsMobile";

function BusinessShowcase() {
  const { t } = useTranslation(); // Initialize t for translations
  const isMobile = useIsMobile();

  const scrollToContact = () => {
    const contactSection = document.getElementById("contact");
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  fetch("http://nomdameshop.com/api/status", {  // Updated to your backend endpoint
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })

  return (
    <div id="showcase" className="showcaseBlock">
      <header className="showcaseHeader">
        <h1 style={{ fontSize: isMobile ? "24px" : "36px", color: color2 }}>
          {t("showcase.headerTitle")}
        </h1>
        <p style={{ fontSize: isMobile ? "14px" : "18px" }}>
          {t("showcase.headerSubtitle")}
        </p>
      </header>

      <section className="servicesSection">
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-around",
            marginTop: "20px",
          }}
        >
          <div
            className="serviceCard"
            style={{ width: isMobile ? "80%" : "30%" }}
          >
            <h3 style={{ color: color1 }}>{t("showcase.clientSourcing.title")}</h3>
            <p>{t("showcase.clientSourcing.description")}</p>
          </div>
          <div
            className="serviceCard"
            style={{ width: isMobile ? "80%" : "30%" }}
          >
            <h3 style={{ color: color2 }}>{t("showcase.purchaseAssistance.title")}</h3>
            <p>{t("showcase.purchaseAssistance.description")}</p>
          </div>
          <div
            className="serviceCard"
            style={{ width: isMobile ? "80%" : "30%" }}
          >
            <h3 style={{ color: color3 }}>{t("showcase.facilitationServices.title")}</h3>
            <p>{t("showcase.facilitationServices.description")}</p>
          </div>
        </div>
      </section>

      <footer className="showcaseFooter">
        <button onClick={scrollToContact} className="getInTouchButton">
          {t("showcase.getInTouch")}
        </button>
      </footer>
    </div>
  );
}

export default BusinessShowcase;
