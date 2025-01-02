import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Deal {
  title: string;
  description: string;
}

const AboutUs: React.FC = () => {
  const { t } = useTranslation(); // Initialize t for translations

  const [modalContent, setModalContent] = useState<Deal | null>(null);

  const handleCardClick = (deal: Deal) => {
    setModalContent(deal);
  };

  const deals: Deal[] = [
    {
      title: t("aboutUs.missionTitle"),
      description: t("aboutUs.missionDescription"),
    },
    {
      title: t("aboutUs.companyOverviewTitle"),
      description: t("aboutUs.companyOverviewDescription"),
    },
    {
      title: t("aboutUs.whyChooseUsTitle"),
      description: t("aboutUs.whyChooseUsDescription"),
    },
    {
      title: t("aboutUs.ourValuesTitle"),
      description: t("aboutUs.ourValuesDescription"),
    },
    {
      title: t("aboutUs.futureVisionTitle"),
      description: t("aboutUs.futureVisionDescription"),
    },
  ];

  return (
    <div id="aboutUs" className="aboutUsPage">
      <div className="container">
        <div className="titleHolder">
          <h1>{t("aboutUs.title")}</h1>
          <p>{t("aboutUs.introduction")}</p>
        </div>

        <div className="aboutContent">
          {deals.map((deal, index) => (
            <section key={index} className="dealSection">
              <h2>{deal.title}</h2>
              <p>{deal.description}</p>
              <button onClick={() => handleCardClick(deal)}>
                {t("aboutUs.learnMore")}
              </button>
            </section>
          ))}

          {modalContent && (
            <div className="modal">
              <div className="modalContent">
                <h2>{modalContent.title}</h2>
                <p>{modalContent.description}</p>
                <button onClick={() => setModalContent(null)}>{t("aboutUs.closeModal")}</button>
              </div>
            </div>
          )}
        </div>

        <div className="contactCallToAction">
          <h3>{t("aboutUs.contactCallToActionTitle")}</h3>
          <p>{t("aboutUs.contactCallToActionDescription")}</p>
          <button className="contactButton">{t("aboutUs.contactButtonText")}</button>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
