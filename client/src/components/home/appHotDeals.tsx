import React from "react";
import { useTranslation } from "react-i18next";

import image4 from "../../assets/images/china/products/truck.jpg";
import image5 from "../../assets/images/china/products/komatsu.png";
import image6 from "../../assets/images/china/products/mixerTruck.jpg";
import image7 from "../../assets/images/china/products/factoryMachines.jpg";
import image8 from "../../assets/images/china/products/printers.jpg";
import image9 from "../../assets/images/china/products/motoSpareParts.jpeg";

function AppHotDeals() {
  const { t } = useTranslation();

  const exclusiveOpps = [
    { title: t("hotDeals.truck"), image: image4 },
    { title: t("hotDeals.excavator"), image: image5 },
    { title: t("hotDeals.mixerTruck"), image: image6 },
  ];
  const hotPicks = [
    { title: t("hotDeals.manufacturingEquipment"), image: image7 },
    { title: t("hotDeals.printers"), image: image8 },
    { title: t("hotDeals.motorcycleParts"), image: image9 },
  ];

  return (
    <div id="feature" className="featureBlock">
      <div className="container">
        <div className="titleHolder">
          <h2>{t("hotDeals.buyOneGetOne")}</h2>
          <p>{t("hotDeals.exclusiveOpportunities")}</p>
        </div>
        <div className="featureGrid">
          {exclusiveOpps.map((item, index) => (
            <div className="featureCard" key={index}>
              <img alt={item.title} src={item.image} />
              <div className="featureCardMeta">{item.title}</div>
            </div>
          ))}
        </div>
        <div className="videoSection">
          <h2 className="videoTitle">{t("hotDeals.discoverMore")}</h2>
          <div className="videoContainer">
            <iframe
              className="videoFrame"
              src="https://www.youtube.com/embed/5yFjjwqcrhM"
              title={t("hotDeals.exclusiveOpportunitiesVideo")}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
        <div className="titleHolder">
          <h2>{t("hotDeals.hotPicks")}</h2>
          <p>{t("hotDeals.advantages")}</p>
        </div>
        <div className="featureGrid">
          {hotPicks.map((item, index) => (
            <div className="featureCard" key={index}>
              <img alt={item.title} src={item.image} />
              <div className="featureCardMeta">{item.title}</div>
            </div>
          ))}
        </div>
        <div className="videoSection">
          <h2 className="videoTitle">{t("hotDeals.discoverMore")}</h2>
          <div className="videoContainer">
            <iframe
              className="videoFrame"
              src="https://www.youtube.com/embed/cHT-3ph5njg"
              title={t("hotDeals.exclusiveOpportunitiesVideo")}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AppHotDeals;
