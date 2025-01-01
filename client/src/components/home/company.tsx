import React from 'react';
import { useTranslation } from 'react-i18next';

const CompanySection: React.FC = () => {

    const { t } = useTranslation(); // Initialize t for translations

  return (
    <section className="company-section">
      <div className="company-container">
        <h2 className="company-name">
          <span className="company-prefix">Welcome to </span>
          <span className="company-main-name">Jin AoBo International Trading Co LTD</span>
        </h2>
        <p className="company-tagline">{t("company.tagline")}</p>
      </div>
    </section>
  );
};

export default CompanySection;
